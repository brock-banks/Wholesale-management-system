<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierLedgerEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $suppliers = Supplier::query()
            ->when($request->string('search')->trim()->value(), function ($q, $term) {
                $q->where(function ($w) use ($term) {
                    $w->where('name', 'like', "%{$term}%")
                        ->orWhere('code', 'like', "%{$term}%")
                        ->orWhere('phone', 'like', "%{$term}%");
                });
            })
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => ['search' => $request->string('search')->value()],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Suppliers/Form', [
            'supplier' => null,
            'next_code' => Supplier::nextCode(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $supplier = DB::transaction(function () use ($data, $request) {
            $supplier = Supplier::create([
                'code' => $data['code'],
                'name' => $data['name'],
                'contact_name' => $data['contact_name'],
                'phone' => $data['phone'],
                'email' => $data['email'],
                'address' => $data['address'],
                'opening_balance' => $data['opening_balance'],
                'current_balance' => $data['opening_balance'],
                'is_active' => $data['is_active'] ?? true,
                'notes' => $data['notes'],
            ]);

            $opening = (float) $data['opening_balance'];
            if (abs($opening) > 0.001) {
                SupplierLedgerEntry::create([
                    'supplier_id' => $supplier->id,
                    'entry_date' => now()->toDateString(),
                    'type' => SupplierLedgerEntry::TYPE_OPENING,
                    'debit' => $opening > 0 ? $opening : 0,
                    'credit' => $opening < 0 ? -$opening : 0,
                    'running_balance' => $opening,
                    'description' => 'Opening balance',
                    'created_by' => $request->user()->id,
                ]);
            }
            return $supplier;
        });

        return redirect()->route('admin.suppliers.edit', $supplier->id)->with('success', 'Supplier created.');
    }

    public function edit(Supplier $supplier): Response
    {
        return Inertia::render('Admin/Suppliers/Form', [
            'supplier' => $supplier,
            'next_code' => null,
        ]);
    }

    public function update(Request $request, Supplier $supplier): RedirectResponse
    {
        $data = $this->validated($request, $supplier->id);

        $oldOpening = (float) $supplier->opening_balance;
        $newOpening = (float) $data['opening_balance'];
        $supplier->update([
            'code' => $data['code'],
            'name' => $data['name'],
            'contact_name' => $data['contact_name'],
            'phone' => $data['phone'],
            'email' => $data['email'],
            'address' => $data['address'],
            'opening_balance' => $newOpening,
            'current_balance' => $supplier->current_balance + ($newOpening - $oldOpening),
            'is_active' => $data['is_active'] ?? true,
            'notes' => $data['notes'],
        ]);

        return redirect()->route('admin.suppliers.edit', $supplier->id)->with('success', 'Supplier updated.');
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        $supplier->delete();
        return redirect()->route('admin.suppliers.index')->with('success', 'Supplier deleted.');
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'code' => ['required', 'string', 'max:16', Rule::unique('suppliers', 'code')->ignore($ignoreId)],
            'name' => ['required', 'string', 'max:160'],
            'contact_name' => ['nullable', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:160'],
            'address' => ['nullable', 'string', 'max:255'],
            'opening_balance' => ['required', 'numeric'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
    }
}
