<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public const INTERNAL_ROLES = ['admin', 'staff', 'accounts', 'sales_rep'];

    public function index(): Response
    {
        $users = User::query()
            ->whereHas('roles', fn ($q) => $q->whereIn('name', self::INTERNAL_ROLES))
            ->with('roles:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'commission_rate', 'created_at']);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->roles->pluck('name')->first(),
                'commission_rate' => (float) $u->commission_rate,
                'created_at' => $u->created_at?->toDateTimeString(),
            ]),
        ]);
    }

    public function activity(Request $request, User $user): Response
    {
        $bills = \App\Models\Bill::where('created_by', $user->id)
            ->with('customer:id,code,name')
            ->orderByDesc('id')->limit(20)
            ->get(['id', 'invoice_number', 'customer_id', 'bill_date', 'grand_total', 'status', 'created_at']);

        $payments = \App\Models\Payment::where('created_by', $user->id)
            ->with('customer:id,code,name')
            ->orderByDesc('id')->limit(20)
            ->get(['id', 'payment_number', 'customer_id', 'payment_date', 'amount', 'method', 'status', 'created_at']);

        $stockMoves = \App\Models\StockMovement::where('created_by', $user->id)
            ->with('product:id,sku,name', 'location:id,code,name')
            ->orderByDesc('id')->limit(20)
            ->get(['id', 'product_id', 'location_id', 'type', 'quantity', 'notes', 'created_at']);

        $supplierPayments = \App\Models\SupplierPayment::where('created_by', $user->id)
            ->with('supplier:id,code,name')
            ->orderByDesc('id')->limit(20)
            ->get(['id', 'payment_number', 'supplier_id', 'payment_date', 'amount', 'method', 'created_at']);

        $roleName = $user->roles->pluck('name')->first();

        $stats = [];
        if ($roleName === 'sales_rep') {
            $stats['customers_assigned'] = (int) \App\Models\Customer::where('sales_rep_id', $user->id)->count();
            $stats['orders_taken'] = (int) \App\Models\Order::where('sales_rep_id', $user->id)->count();
            $stats['commission_total'] = round((float) \App\Models\Bill::where('sales_rep_id', $user->id)
                ->where('status', 'posted')
                ->sum('commission_amount'), 2);
        }

        return Inertia::render('Admin/Users/Activity', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $roleName,
                'commission_rate' => (float) $user->commission_rate,
                'phone' => $user->phone,
                'created_at' => $user->created_at?->toDateTimeString(),
            ],
            'bills' => $bills,
            'payments' => $payments,
            'stock_movements' => $stockMoves,
            'supplier_payments' => $supplierPayments,
            'stats' => $stats,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Users/Form', [
            'user' => null,
            'roles' => self::INTERNAL_ROLES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'email' => ['required', 'email', 'max:160', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(self::INTERNAL_ROLES)],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'phone' => ['nullable', 'string', 'max:32'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'commission_rate' => $data['role'] === 'sales_rep' ? ($data['commission_rate'] ?? 0) : 0,
            'phone' => $data['phone'] ?? null,
        ]);
        $user->syncRoles([$data['role']]);

        return redirect()->route('admin.users.index')->with('success', "User {$user->name} created.");
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Admin/Users/Form', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->roles->pluck('name')->first(),
                'commission_rate' => (float) $user->commission_rate,
                'phone' => $user->phone,
            ],
            'roles' => self::INTERNAL_ROLES,
        ]);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'email' => ['required', 'email', 'max:160', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', Rule::in(self::INTERNAL_ROLES)],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'phone' => ['nullable', 'string', 'max:32'],
        ]);

        $update = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'commission_rate' => $data['role'] === 'sales_rep' ? ($data['commission_rate'] ?? 0) : 0,
        ];
        if (! empty($data['password'])) {
            $update['password'] = Hash::make($data['password']);
        }
        $user->update($update);
        $user->syncRoles([$data['role']]);

        return redirect()->route('admin.users.index')->with('success', "User {$user->name} updated.");
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', "You can't delete yourself.");
        }
        if ($user->customer) {
            return back()->with('error', 'This account is linked to a customer. Manage from Customers.');
        }
        $user->delete();

        return back()->with('success', 'User deleted.');
    }

    public function permissions(): Response
    {
        $roles = Role::with('permissions:id,name')
            ->whereIn('name', self::INTERNAL_ROLES)
            ->get();

        $rolePermissions = [];
        foreach ($roles as $r) {
            $rolePermissions[$r->name] = $r->permissions->pluck('name')->all();
        }

        return Inertia::render('Admin/Users/Permissions', [
            'permissions' => PermissionSeeder::PERMISSIONS,
            'roles' => self::INTERNAL_ROLES,
            'matrix' => $rolePermissions,
        ]);
    }
}
