<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    public function index(Request $request): Response
    {
        $movements = StockMovement::query()
            ->with(['product:id,sku,name', 'location:id,code,name', 'user:id,name'])
            ->when($request->string('product')->trim()->value(), function ($q, $term) {
                $q->whereHas('product', fn ($p) => $p->where('name', 'like', "%{$term}%")->orWhere('sku', 'like', "%{$term}%"));
            })
            ->when($request->string('type')->value(), fn ($q, $t) => $q->where('type', $t))
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/Stock/Index', [
            'movements' => $movements,
            'products' => Product::orderBy('name')->get(['id', 'sku', 'name']),
            'locations' => Location::where('is_active', true)->orderBy('name')->get(['id', 'code', 'name']),
            'filters' => [
                'product' => $request->string('product')->value(),
                'type' => $request->string('type')->value() ?: null,
            ],
        ]);
    }

    public function storeIn(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'location_id' => ['required', 'integer', 'exists:locations,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($data, $request) {
            ProductStock::firstOrCreate(
                ['product_id' => $data['product_id'], 'location_id' => $data['location_id']],
                ['quantity' => 0],
            )->increment('quantity', $data['quantity']);

            StockMovement::create([
                'product_id' => $data['product_id'],
                'location_id' => $data['location_id'],
                'type' => StockMovement::TYPE_STOCK_IN,
                'quantity' => $data['quantity'],
                'notes' => $data['notes'] ?: 'Manual stock-in',
                'created_by' => $request->user()->id,
            ]);
        });

        return back()->with('success', 'Stock added.');
    }

    public function storeTransfer(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'from_location_id' => ['required', 'integer', 'exists:locations,id', 'different:to_location_id'],
            'to_location_id' => ['required', 'integer', 'exists:locations,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($data, $request) {
            $source = ProductStock::where('product_id', $data['product_id'])
                ->where('location_id', $data['from_location_id'])
                ->lockForUpdate()
                ->first();
            if (! $source || $source->quantity < $data['quantity']) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'quantity' => 'Source location does not have enough stock.',
                ]);
            }
            $source->decrement('quantity', $data['quantity']);

            ProductStock::firstOrCreate(
                ['product_id' => $data['product_id'], 'location_id' => $data['to_location_id']],
                ['quantity' => 0],
            )->increment('quantity', $data['quantity']);

            $note = $data['notes'] ?: 'Transfer between locations';

            StockMovement::create([
                'product_id' => $data['product_id'],
                'location_id' => $data['from_location_id'],
                'type' => StockMovement::TYPE_TRANSFER_OUT,
                'quantity' => -$data['quantity'],
                'notes' => $note,
                'created_by' => $request->user()->id,
            ]);

            StockMovement::create([
                'product_id' => $data['product_id'],
                'location_id' => $data['to_location_id'],
                'type' => StockMovement::TYPE_TRANSFER_IN,
                'quantity' => $data['quantity'],
                'notes' => $note,
                'created_by' => $request->user()->id,
            ]);
        });

        return back()->with('success', 'Stock transferred.');
    }

    public function storeAdjustment(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'location_id' => ['required', 'integer', 'exists:locations,id'],
            'quantity' => ['required', 'integer', 'not_in:0'],
            'reason' => ['required', 'string', 'in:damaged,loss,count_correction,other'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($data, $request) {
            $stock = ProductStock::firstOrCreate(
                ['product_id' => $data['product_id'], 'location_id' => $data['location_id']],
                ['quantity' => 0],
            );
            $stock->lockForUpdate();
            $newQty = $stock->quantity + $data['quantity'];
            if ($newQty < 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'quantity' => 'Adjustment would result in negative stock.',
                ]);
            }
            $stock->update(['quantity' => $newQty]);

            $reasonLabel = [
                'damaged' => 'Damaged',
                'loss' => 'Loss/theft',
                'count_correction' => 'Count correction',
                'other' => 'Other',
            ][$data['reason']];

            StockMovement::create([
                'product_id' => $data['product_id'],
                'location_id' => $data['location_id'],
                'type' => StockMovement::TYPE_ADJUSTMENT,
                'quantity' => $data['quantity'],
                'notes' => $reasonLabel.($data['notes'] ? ' · '.$data['notes'] : ''),
                'created_by' => $request->user()->id,
            ]);
        });

        return back()->with('success', 'Stock adjustment recorded.');
    }
}
