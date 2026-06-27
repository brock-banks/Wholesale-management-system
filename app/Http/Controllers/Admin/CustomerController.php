<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\LedgerEntry;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = Customer::query()
            ->with('user:id,email')
            ->when($request->string('search')->trim()->value(), function ($q, $term) {
                $q->where(function ($w) use ($term) {
                    $w->where('name', 'like', "%{$term}%")
                        ->orWhere('code', 'like', "%{$term}%")
                        ->orWhere('phone', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%");
                });
            })
            ->when($request->string('status')->value(), function ($q, $status) {
                $q->where('is_active', $status === 'active');
            })
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Customers/Index', [
            'customers' => $customers,
            'filters' => [
                'search' => $request->string('search')->value(),
                'status' => $request->string('status')->value() ?: null,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Customers/Form', [
            'customer' => null,
            'next_code' => Customer::nextCode(),
            'sales_reps' => User::role('sales_rep')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $customer = DB::transaction(function () use ($data, $request) {
            $customer = Customer::create([
                'code' => $data['code'],
                'name' => $data['name'],
                'phone' => $data['phone'],
                'address' => $data['address'],
                'email' => $data['email'],
                'sales_rep_id' => $data['sales_rep_id'] ?? null,
                'opening_balance' => $data['opening_balance'],
                'current_balance' => $data['opening_balance'],
                'credit_limit' => $data['credit_limit'],
                'is_active' => $data['is_active'] ?? true,
                'notes' => $data['notes'],
            ]);

            $opening = (float) $data['opening_balance'];
            if (abs($opening) > 0.001) {
                LedgerEntry::create([
                    'customer_id' => $customer->id,
                    'entry_date' => now()->toDateString(),
                    'type' => LedgerEntry::TYPE_OPENING,
                    'debit' => $opening > 0 ? $opening : 0,
                    'credit' => $opening < 0 ? -$opening : 0,
                    'running_balance' => $opening,
                    'description' => 'Opening balance',
                    'created_by' => $request->user()->id,
                ]);
            }

            if (! empty($data['create_login']) && $data['email'] && $data['password']) {
                $this->provisionLogin($customer, $data['email'], $data['password']);
            }

            return $customer;
        });

        return redirect()
            ->route('admin.customers.edit', $customer->id)
            ->with('success', 'Customer created.');
    }

    public function show(Customer $customer): Response
    {
        $customer->load('user:id,email');

        $bills = \App\Models\Bill::where('customer_id', $customer->id)
            ->orderByDesc('bill_date')->orderByDesc('id')
            ->limit(15)
            ->get(['id', 'invoice_number', 'bill_date', 'grand_total', 'paid_amount', 'status']);

        $payments = \App\Models\Payment::where('customer_id', $customer->id)
            ->orderByDesc('payment_date')->orderByDesc('id')
            ->limit(15)
            ->get(['id', 'payment_number', 'payment_date', 'amount', 'method', 'status']);

        $orders = \App\Models\Order::where('customer_id', $customer->id)
            ->orderByDesc('order_date')->orderByDesc('id')
            ->limit(10)
            ->get(['id', 'order_number', 'order_date', 'status']);

        $recentLedger = LedgerEntry::where('customer_id', $customer->id)
            ->orderByDesc('entry_date')->orderByDesc('id')
            ->limit(10)
            ->get(['id', 'entry_date', 'type', 'debit', 'credit', 'running_balance', 'description']);

        $billsAggregate = \App\Models\Bill::where('customer_id', $customer->id)
            ->where('status', 'posted')
            ->selectRaw('count(*) as count, coalesce(sum(grand_total),0) as total_sales, coalesce(sum(paid_amount),0) as total_paid')
            ->first();

        return Inertia::render('Admin/Customers/Show', [
            'customer' => $customer,
            'bills' => $bills,
            'payments' => $payments,
            'orders' => $orders,
            'recent_ledger' => $recentLedger,
            'totals' => [
                'bills_count' => (int) $billsAggregate->count,
                'total_sales' => round((float) $billsAggregate->total_sales, 2),
                'total_paid' => round((float) $billsAggregate->total_paid, 2),
                'outstanding' => round((float) $customer->current_balance, 2),
            ],
        ]);
    }

    public function edit(Customer $customer): Response
    {
        $customer->load('user:id,email');

        return Inertia::render('Admin/Customers/Form', [
            'customer' => $customer,
            'next_code' => null,
            'sales_reps' => User::role('sales_rep')->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $data = $this->validated($request, $customer->id);

        DB::transaction(function () use ($customer, $data) {
            $oldOpening = (float) $customer->opening_balance;
            $newOpening = (float) $data['opening_balance'];

            $customer->update([
                'code' => $data['code'],
                'name' => $data['name'],
                'phone' => $data['phone'],
                'address' => $data['address'],
                'email' => $data['email'],
                'sales_rep_id' => $data['sales_rep_id'] ?? null,
                'opening_balance' => $newOpening,
                'current_balance' => $customer->current_balance + ($newOpening - $oldOpening),
                'credit_limit' => $data['credit_limit'],
                'is_active' => $data['is_active'] ?? true,
                'notes' => $data['notes'],
            ]);

            if (! empty($data['create_login']) && $data['email']) {
                if (! $customer->user_id) {
                    if (empty($data['password'])) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'password' => 'Password is required to enable login.',
                        ]);
                    }
                    $this->provisionLogin($customer, $data['email'], $data['password']);
                } else {
                    $update = ['email' => $data['email'], 'name' => $data['name']];
                    if (! empty($data['password'])) {
                        $update['password'] = Hash::make($data['password']);
                    }
                    $customer->user->update($update);
                }
            }
        });

        return redirect()
            ->route('admin.customers.edit', $customer->id)
            ->with('success', 'Customer updated.');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $customer->delete();

        return redirect()->route('admin.customers.index')->with('success', 'Customer deleted.');
    }

    private function provisionLogin(Customer $customer, string $email, string $password): void
    {
        $user = User::create([
            'name' => $customer->name,
            'email' => $email,
            'password' => Hash::make($password),
        ]);
        $user->assignRole('customer');
        $customer->update(['user_id' => $user->id, 'email' => $email]);
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $customer = $ignoreId ? Customer::find($ignoreId) : null;
        $excludeUserId = $customer?->user_id;

        return $request->validate([
            'code' => ['required', 'string', 'max:16', Rule::unique('customers', 'code')->ignore($ignoreId)],
            'name' => ['required', 'string', 'max:160'],
            'phone' => ['nullable', 'string', 'max:32'],
            'address' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:160', Rule::unique('customers', 'email')->ignore($ignoreId)],
            'sales_rep_id' => ['nullable', 'integer', 'exists:users,id'],
            'opening_balance' => ['required', 'numeric'],
            'credit_limit' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'create_login' => ['boolean'],
            'password' => ['nullable', 'string', 'min:8', 'max:64'],
        ]);
    }
}
