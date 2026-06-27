<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductPhoto;
use App\Models\ProductStock;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $q = Product::query()
            ->with(['category:id,name', 'stocks', 'photos'])
            ->when($request->string('search')->trim()->value(), function ($query, $term) {
                $query->where(function ($q) use ($term) {
                    $q->where('name', 'like', "%{$term}%")
                        ->orWhere('sku', 'like', "%{$term}%")
                        ->orWhere('barcode', 'like', "%{$term}%");
                });
            })
            ->when($request->integer('category_id'), fn ($query, $id) => $query->where('category_id', $id))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        $q->getCollection()->transform(function (Product $p) {
            $p->total_stock = (int) $p->stocks->sum('quantity');
            return $p;
        });

        return Inertia::render('Admin/Products/Index', [
            'products' => $q,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $request->string('search')->value(),
                'category_id' => $request->integer('category_id') ?: null,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Products/Form', [
            'product' => null,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'locations' => Location::orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $product = DB::transaction(function () use ($data, $request) {
            $product = Product::create(collect($data)->except(['stocks', 'photos'])->all());

            foreach ($data['stocks'] ?? [] as $row) {
                $qty = (int) ($row['quantity'] ?? 0);
                ProductStock::create([
                    'product_id' => $product->id,
                    'location_id' => $row['location_id'],
                    'quantity' => $qty,
                ]);
                if ($qty !== 0) {
                    StockMovement::create([
                        'product_id' => $product->id,
                        'location_id' => $row['location_id'],
                        'type' => StockMovement::TYPE_STOCK_IN,
                        'quantity' => $qty,
                        'notes' => 'Initial stock on product create',
                        'created_by' => $request->user()->id,
                    ]);
                }
            }

            $this->savePhotos($product, $request);

            return $product;
        });

        return redirect()
            ->route('admin.products.edit', $product->id)
            ->with('success', 'Product created.');
    }

    public function edit(Product $product): Response
    {
        $product->load(['stocks.location', 'photos']);

        return Inertia::render('Admin/Products/Form', [
            'product' => $product,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'locations' => Location::orderBy('name')->get(['id', 'code', 'name']),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $data = $this->validated($request, $product->id);

        DB::transaction(function () use ($product, $data, $request) {
            $product->update(collect($data)->except(['stocks', 'photos'])->all());

            foreach ($data['stocks'] ?? [] as $row) {
                $existing = ProductStock::firstOrCreate(
                    ['product_id' => $product->id, 'location_id' => $row['location_id']],
                    ['quantity' => 0],
                );
                $newQty = (int) ($row['quantity'] ?? 0);
                $diff = $newQty - $existing->quantity;
                if ($diff !== 0) {
                    $existing->update(['quantity' => $newQty]);
                    StockMovement::create([
                        'product_id' => $product->id,
                        'location_id' => $row['location_id'],
                        'type' => StockMovement::TYPE_ADJUSTMENT,
                        'quantity' => $diff,
                        'notes' => 'Stock adjustment from product edit',
                        'created_by' => $request->user()->id,
                    ]);
                }
            }

            $this->savePhotos($product, $request);
        });

        return redirect()
            ->route('admin.products.edit', $product->id)
            ->with('success', 'Product updated.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('admin.products.index')->with('success', 'Product deleted.');
    }

    public function deletePhoto(ProductPhoto $photo): RedirectResponse
    {
        Storage::disk('public')->delete($photo->path);
        $photo->delete();

        return back()->with('success', 'Photo removed.');
    }

    private function savePhotos(Product $product, Request $request): void
    {
        if (! $request->hasFile('photos')) {
            return;
        }
        $nextOrder = (int) $product->photos()->max('sort_order') + 1;
        foreach ($request->file('photos') as $file) {
            $path = $file->store("products/{$product->id}", 'public');
            ProductPhoto::create([
                'product_id' => $product->id,
                'path' => $path,
                'sort_order' => $nextOrder++,
            ]);
        }
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'sku' => ['required', 'string', 'max:64', 'unique:products,sku' . ($ignoreId ? ",$ignoreId" : '')],
            'barcode' => ['nullable', 'string', 'max:64'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:2000'],
            'unit' => ['required', 'string', 'max:16'],
            'pack_size' => ['required', 'integer', 'min:1'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'wholesale_price' => ['required', 'numeric', 'min:0'],
            'retail_price' => ['required', 'numeric', 'min:0'],
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'reorder_level' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'stocks' => ['array'],
            'stocks.*.location_id' => ['required', 'integer', 'exists:locations,id'],
            'stocks.*.quantity' => ['required', 'integer', 'min:0'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['image', 'max:5120'],
        ]);
    }
}
