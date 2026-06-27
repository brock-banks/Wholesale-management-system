<?php

use App\Http\Controllers\Admin\BillController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\LocationController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\ReturnController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\PurchaseOrderController;
use App\Http\Controllers\Admin\StatementController;
use App\Http\Controllers\Admin\CommissionController;
use App\Http\Controllers\Admin\StockController;
use App\Http\Controllers\Rep\RepCommissionController;
use App\Http\Controllers\Rep\RepCustomerController;
use App\Http\Controllers\Rep\RepHomeController;
use App\Http\Controllers\Rep\RepOrderController;
use App\Http\Controllers\Admin\SupplierController;
use App\Http\Controllers\Admin\SupplierPaymentController;
use App\Http\Controllers\Admin\SupplierStatementController;
use App\Http\Controllers\Admin\SystemController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Portal\CartController;
use App\Http\Controllers\Portal\CatalogController;
use App\Http\Controllers\Portal\PortalHomeController;
use App\Http\Controllers\Portal\PortalOrderController;
use App\Http\Controllers\Portal\PortalStatementController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (Auth::check()) {
        $u = Auth::user();
        if ($u->hasRole('customer') && ! $u->hasAnyRole(['admin', 'staff', 'accounts'])) {
            return redirect('/portal');
        }
        if ($u->hasRole('sales_rep') && ! $u->hasAnyRole(['admin', 'staff', 'accounts'])) {
            return redirect('/rep');
        }
        return redirect('/dashboard');
    }
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    $user = Auth::user();
    if ($user && $user->hasRole('customer') && ! $user->hasAnyRole(['admin', 'staff', 'accounts'])) {
        return redirect('/portal');
    }
    if ($user && $user->hasRole('sales_rep') && ! $user->hasAnyRole(['admin', 'staff', 'accounts'])) {
        return redirect('/rep');
    }

    return Inertia::render('Dashboard', [
        'stats' => [
            'today_sales' => round((float) \App\Models\Bill::where('status', 'posted')
                ->whereDate('bill_date', today())
                ->sum('grand_total'), 2),
            'receivables' => round((float) \App\Models\Customer::sum('current_balance'), 2),
            'open_orders' => \App\Models\Order::whereIn('status', ['pending', 'reviewing', 'confirmed', 'on_hold'])->count(),
            'low_stock' => \App\Models\Product::where('is_active', true)
                ->withSum('stocks as total_stock', 'quantity')
                ->get()
                ->filter(fn ($p) => (int) $p->total_stock <= (int) $p->reorder_level)
                ->count(),
        ],
    ]);
})->middleware(['auth'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.readAll');
});

Route::middleware(['auth', 'role:admin|staff|accounts'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::resource('locations', LocationController::class)
            ->except('show')
            ->middleware('permission:locations.manage');
        Route::resource('categories', CategoryController::class)
            ->except('show')
            ->middleware('permission:categories.manage');

        Route::middleware('permission:products.view')->group(function () {
            Route::get('products', [ProductController::class, 'index'])->name('products.index');
        });
        Route::middleware('permission:products.manage')->group(function () {
            Route::get('products/create', [ProductController::class, 'create'])->name('products.create');
            Route::post('products', [ProductController::class, 'store'])->name('products.store');
            Route::get('products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
            Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
            Route::patch('products/{product}', [ProductController::class, 'update']);
            Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
            Route::delete('products/photos/{photo}', [ProductController::class, 'deletePhoto'])->name('products.photos.destroy');
        });

        Route::middleware('permission:customers.view')->group(function () {
            Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
            Route::get('customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
            Route::get('customers/{customer}/statement', [StatementController::class, 'show'])->name('customers.statement');
            Route::get('customers/{customer}/statement/pdf', [StatementController::class, 'pdf'])->name('customers.statement.pdf');
        });
        Route::middleware('permission:customers.manage')->group(function () {
            Route::get('customers/create', [CustomerController::class, 'create'])->name('customers.create');
            Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
            Route::get('customers/{customer}/edit', [CustomerController::class, 'edit'])->name('customers.edit');
            Route::put('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
            Route::patch('customers/{customer}', [CustomerController::class, 'update']);
            Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');
        });

        Route::middleware('permission:bills.view')->group(function () {
            Route::get('bills', [BillController::class, 'index'])->name('bills.index');
            Route::get('bills/{bill}', [BillController::class, 'show'])->name('bills.show');
            Route::get('bills/{bill}/pdf', [BillController::class, 'pdf'])->name('bills.pdf');
        });
        Route::middleware('permission:bills.create')->group(function () {
            Route::get('bills/create', [BillController::class, 'create'])->name('bills.create');
            Route::post('bills', [BillController::class, 'store'])->name('bills.store');
        });
        Route::middleware('permission:bills.cancel')->group(function () {
            Route::delete('bills/{bill}', [BillController::class, 'destroy'])->name('bills.destroy');
        });

        Route::middleware('permission:payments.view')->group(function () {
            Route::get('payments', [PaymentController::class, 'index'])->name('payments.index');
            Route::get('payments/{payment}', [PaymentController::class, 'show'])->name('payments.show');
            Route::get('payments/{payment}/pdf', [PaymentController::class, 'pdf'])->name('payments.pdf');
        });
        Route::middleware('permission:payments.record')->group(function () {
            Route::get('payments/create', [PaymentController::class, 'create'])->name('payments.create');
            Route::post('payments', [PaymentController::class, 'store'])->name('payments.store');
            Route::delete('payments/{payment}', [PaymentController::class, 'cancel'])->name('payments.cancel');
        });

        Route::middleware('permission:returns.view')->group(function () {
            Route::get('returns', [ReturnController::class, 'index'])->name('returns.index');
            Route::get('returns/{return}', [ReturnController::class, 'show'])->name('returns.show');
            Route::get('returns/{return}/pdf', [ReturnController::class, 'pdf'])->name('returns.pdf');
        });
        Route::middleware('permission:returns.record')->group(function () {
            Route::get('returns/create', [ReturnController::class, 'create'])->name('returns.create');
            Route::post('returns', [ReturnController::class, 'store'])->name('returns.store');
        });

        Route::middleware('permission:orders.view')->group(function () {
            Route::get('orders', [AdminOrderController::class, 'index'])->name('orders.index');
            Route::get('orders/{order}', [AdminOrderController::class, 'show'])->name('orders.show');
        });
        Route::middleware('permission:orders.action')->group(function () {
            Route::post('orders/{order}/confirm', [AdminOrderController::class, 'confirm'])->name('orders.confirm');
            Route::post('orders/{order}/hold', [AdminOrderController::class, 'hold'])->name('orders.hold');
            Route::post('orders/{order}/cancel', [AdminOrderController::class, 'cancel'])->name('orders.cancel');
        });

        Route::get('reports', [ReportController::class, 'index'])
            ->middleware('permission:reports.view')->name('reports');
        Route::get('reports/commissions', [CommissionController::class, 'index'])
            ->middleware('permission:commissions.manage')->name('reports.commissions');
        Route::middleware('permission:settings.manage')->group(function () {
            Route::get('settings', [SettingsController::class, 'edit'])->name('settings.edit');
            Route::patch('settings', [SettingsController::class, 'update'])->name('settings.update');
        });
        Route::get('audit', [SystemController::class, 'audit'])
            ->middleware('permission:audit.view')->name('audit');
        Route::middleware('permission:backups.manage')->group(function () {
            Route::get('backups', [SystemController::class, 'backups'])->name('backups');
            Route::post('backups', [SystemController::class, 'createBackup'])->name('backups.create');
            Route::get('backups/{file}/download', [SystemController::class, 'downloadBackup'])->name('backups.download');
        });

        Route::middleware('permission:users.manage')->group(function () {
            Route::get('users', [UserController::class, 'index'])->name('users.index');
            Route::get('users/create', [UserController::class, 'create'])->name('users.create');
            Route::post('users', [UserController::class, 'store'])->name('users.store');
            Route::get('users/{user}/activity', [UserController::class, 'activity'])->name('users.activity');
            Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
            Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update');
            Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
            Route::get('permissions', [UserController::class, 'permissions'])->name('permissions');
        });

        Route::middleware('permission:suppliers.view')->group(function () {
            Route::get('suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
            Route::get('suppliers/{supplier}/statement', [SupplierStatementController::class, 'show'])->name('suppliers.statement');
            Route::get('suppliers/{supplier}/statement/pdf', [SupplierStatementController::class, 'pdf'])->name('suppliers.statement.pdf');
        });
        Route::middleware('permission:suppliers.manage')->group(function () {
            Route::get('suppliers/create', [SupplierController::class, 'create'])->name('suppliers.create');
            Route::post('suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
            Route::get('suppliers/{supplier}/edit', [SupplierController::class, 'edit'])->name('suppliers.edit');
            Route::patch('suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
            Route::delete('suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');
        });

        Route::middleware('permission:purchases.view')->group(function () {
            Route::get('purchases', [PurchaseOrderController::class, 'index'])->name('purchases.index');
            Route::get('purchases/{purchase}', [PurchaseOrderController::class, 'show'])->name('purchases.show');
            Route::get('purchases/{purchase}/pdf', [PurchaseOrderController::class, 'pdf'])->name('purchases.pdf');
        });
        Route::middleware('permission:purchases.create')->group(function () {
            Route::get('purchases/create', [PurchaseOrderController::class, 'create'])->name('purchases.create');
            Route::post('purchases', [PurchaseOrderController::class, 'store'])->name('purchases.store');
        });
        Route::middleware('permission:purchases.receive')->group(function () {
            Route::post('purchases/{purchase}/receive', [PurchaseOrderController::class, 'receive'])->name('purchases.receive');
        });

        Route::middleware('permission:products.manage')->group(function () {
            Route::get('stock', [StockController::class, 'index'])->name('stock.index');
            Route::post('stock/in', [StockController::class, 'storeIn'])->name('stock.in');
            Route::post('stock/transfer', [StockController::class, 'storeTransfer'])->name('stock.transfer');
            Route::post('stock/adjust', [StockController::class, 'storeAdjustment'])->name('stock.adjust');
        });

        Route::middleware('permission:supplier_payments.view')->group(function () {
            Route::get('supplier-payments', [SupplierPaymentController::class, 'index'])->name('supplier_payments.index');
            Route::get('supplier-payments/{supplier_payment}', [SupplierPaymentController::class, 'show'])->name('supplier_payments.show');
        });
        Route::middleware('permission:supplier_payments.record')->group(function () {
            Route::get('supplier-payments/create', [SupplierPaymentController::class, 'create'])->name('supplier_payments.create');
            Route::post('supplier-payments', [SupplierPaymentController::class, 'store'])->name('supplier_payments.store');
        });
    });

Route::middleware(['auth', 'role:sales_rep|admin'])
    ->prefix('rep')
    ->name('rep.')
    ->group(function () {
        Route::get('/', [RepHomeController::class, 'index'])->name('home');
        Route::get('/customers', [RepCustomerController::class, 'index'])->name('customers.index');
        Route::get('/customers/{customer}', [RepCustomerController::class, 'show'])->name('customers.show');
        Route::get('/orders', [RepOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/create', [RepOrderController::class, 'create'])->name('orders.create');
        Route::post('/orders', [RepOrderController::class, 'store'])->name('orders.store');
        Route::get('/orders/{order}', [RepOrderController::class, 'show'])->name('orders.show');
        Route::get('/commissions', [RepCommissionController::class, 'index'])->name('commissions');
    });

Route::middleware(['auth', 'role:customer'])
    ->prefix('portal')
    ->name('portal.')
    ->group(function () {
        Route::get('/', [PortalHomeController::class, 'index'])->name('home');
        Route::get('/catalog', [CatalogController::class, 'index'])->name('catalog');
        Route::get('/cart', [CartController::class, 'index'])->name('cart');
        Route::post('/cart/add', [CartController::class, 'add'])->name('cart.add');
        Route::patch('/cart/items/{item}', [CartController::class, 'update'])->name('cart.update');
        Route::delete('/cart/items/{item}', [CartController::class, 'remove'])->name('cart.remove');
        Route::post('/cart/submit', [CartController::class, 'submit'])->name('cart.submit');
        Route::get('/orders', [PortalOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}', [PortalOrderController::class, 'show'])->name('orders.show');
        Route::get('/statement', [PortalStatementController::class, 'show'])->name('statement');
        Route::get('/statement/pdf', [PortalStatementController::class, 'pdf'])->name('statement.pdf');
    });

require __DIR__.'/auth.php';
