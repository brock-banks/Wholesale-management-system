import NotificationBell from '@/Components/NotificationBell';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { PageProps } from '@/types';

interface NavItem {
    label: string;
    href: string;
    routeName: string;
    icon: ReactNode;
    permission?: string;
}

const icons = {
    dashboard: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
    ),
    locations: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 21s-7-7.5-7-13a7 7 0 1 1 14 0c0 5.5-7 13-7 13z" /><circle cx="12" cy="8" r="2.5" />
        </svg>
    ),
    categories: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 7h7l2 3h9v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        </svg>
    ),
    products: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" /><path d="m3 8 9 5 9-5" /><path d="M12 13v8" />
        </svg>
    ),
    customers: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    bills: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="14" y2="17" />
        </svg>
    ),
    payments: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="6" width="20" height="13" rx="2" /><line x1="2" y1="11" x2="22" y2="11" />
            <line x1="6" y1="15" x2="10" y2="15" />
        </svg>
    ),
    users: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" /><path d="M4 22a8 8 0 0 1 16 0" />
        </svg>
    ),
    logout: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
};

const nav: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', routeName: 'dashboard', icon: icons.dashboard },
    { label: 'Locations', href: '/admin/locations', routeName: 'admin.locations', icon: icons.locations, permission: 'locations.manage' },
    { label: 'Categories', href: '/admin/categories', routeName: 'admin.categories', icon: icons.categories, permission: 'categories.manage' },
    { label: 'Products', href: '/admin/products', routeName: 'admin.products', icon: icons.products, permission: 'products.view' },
    { label: 'Stock', href: '/admin/stock', routeName: 'admin.stock', icon: icons.products, permission: 'products.manage' },
    { label: 'Customers', href: '/admin/customers', routeName: 'admin.customers', icon: icons.customers, permission: 'customers.view' },
    { label: 'Orders', href: '/admin/orders', routeName: 'admin.orders', icon: icons.bills, permission: 'orders.view' },
    { label: 'Bills', href: '/admin/bills', routeName: 'admin.bills', icon: icons.bills, permission: 'bills.view' },
    { label: 'Payments', href: '/admin/payments', routeName: 'admin.payments', icon: icons.payments, permission: 'payments.view' },
    { label: 'Returns', href: '/admin/returns', routeName: 'admin.returns', icon: icons.bills, permission: 'returns.view' },
    { label: 'Suppliers', href: '/admin/suppliers', routeName: 'admin.suppliers', icon: icons.customers, permission: 'suppliers.view' },
    { label: 'Purchase orders', href: '/admin/purchases', routeName: 'admin.purchases', icon: icons.bills, permission: 'purchases.view' },
    { label: 'Supplier payments', href: '/admin/supplier-payments', routeName: 'admin.supplier_payments', icon: icons.payments, permission: 'supplier_payments.view' },
    { label: 'Reports', href: '/admin/reports', routeName: 'admin.reports', icon: icons.dashboard, permission: 'reports.view' },
    { label: 'Users', href: '/admin/users', routeName: 'admin.users', icon: icons.users, permission: 'users.manage' },
    { label: 'Settings', href: '/admin/settings', routeName: 'admin.settings', icon: icons.locations, permission: 'settings.manage' },
];

export default function AdminLayout({
    title,
    actions,
    children,
}: PropsWithChildren<{ title: string; actions?: ReactNode }>) {
    const { auth, flash } = usePage<PageProps>().props;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const userPermissions = auth.user?.permissions ?? [];
    const visibleNav = nav.filter((item) => ! item.permission || userPermissions.includes(item.permission));
    const [showFlash, setShowFlash] = useState(true);

    useEffect(() => {
        setShowFlash(true);
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setShowFlash(false), 4000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    return (
        <div className="min-h-screen bg-ink-50 flex">
            <aside className="w-60 bg-white border-r border-ink-200 flex flex-col">
                <div className="h-14 px-5 flex items-center border-b border-ink-200">
                    <div className="w-7 h-7 rounded bg-primary-700 flex items-center justify-center text-white text-sm font-medium">W</div>
                    <span className="ml-2 text-md font-medium text-ink-900">Wholesale</span>
                </div>
                <nav className="flex-1 py-3 px-2">
                    {visibleNav.map((item) => {
                        const active = currentPath === item.href || currentPath.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 rounded text-sm mb-1 transition-colors ${
                                    active
                                        ? 'bg-primary-50 text-primary-800 font-medium'
                                        : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                                }`}
                            >
                                <span className={active ? 'text-primary-700' : 'text-ink-400'}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t border-ink-200 p-3">
                    <div className="px-3 py-2">
                        <div className="text-sm text-ink-900 font-medium truncate">{auth.user?.name}</div>
                        <div className="text-xs text-ink-500 truncate">{auth.user?.email}</div>
                    </div>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900 rounded"
                    >
                        {icons.logout} Sign out
                    </Link>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-14 bg-white border-b border-ink-200 px-6 flex items-center justify-between">
                    <h1 className="text-lg font-medium text-ink-900">{title}</h1>
                    <div className="flex items-center gap-2">
                        {actions}
                        <NotificationBell />
                    </div>
                </header>

                {showFlash && (flash?.success || flash?.error) && (
                    <div className="px-6 pt-4">
                        <div
                            className={`rounded px-4 py-3 text-sm ${
                                flash.success
                                    ? 'bg-success-bg text-success-text'
                                    : 'bg-danger-bg text-danger-text'
                            }`}
                        >
                            {flash.success || flash.error}
                        </div>
                    </div>
                )}

                <main className="flex-1 p-6 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
