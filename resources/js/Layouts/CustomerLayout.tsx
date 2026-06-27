import NotificationBell from '@/Components/NotificationBell';
import { PageProps } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

interface NavItem {
    label: string;
    href: string;
    icon: ReactNode;
}

const icons = {
    home: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    catalog: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    cart: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
        </svg>
    ),
    orders: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    statement: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
        </svg>
    ),
    logout: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
};

export default function CustomerLayout({
    title,
    actions,
    children,
}: PropsWithChildren<{ title: string; actions?: ReactNode }>) {
    const page = usePage<PageProps & { cart_count: number }>().props;
    const { auth, flash, cart_count } = page;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const nav: NavItem[] = [
        { label: 'Home', href: '/portal', icon: icons.home },
        { label: 'Catalog', href: '/portal/catalog', icon: icons.catalog },
        { label: 'Cart', href: '/portal/cart', icon: icons.cart },
        { label: 'My orders', href: '/portal/orders', icon: icons.orders },
        { label: 'Statement', href: '/portal/statement', icon: icons.statement },
    ];

    return (
        <div className="min-h-screen bg-ink-50 flex">
            <aside className="w-60 bg-white border-r border-ink-200 flex flex-col">
                <div className="h-14 px-5 flex items-center border-b border-ink-200">
                    <div className="w-7 h-7 rounded bg-primary-700 flex items-center justify-center text-white text-sm font-medium">W</div>
                    <span className="ml-2 text-md font-medium text-ink-900">Portal</span>
                </div>
                <nav className="flex-1 py-3 px-2">
                    {nav.map((item) => {
                        const active =
                            item.href === '/portal'
                                ? currentPath === '/portal'
                                : currentPath === item.href || currentPath.startsWith(item.href + '/');
                        const isCart = item.href === '/portal/cart';
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
                                <span className="flex-1">{item.label}</span>
                                {isCart && cart_count > 0 && (
                                    <span className="bg-primary-700 text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                        {cart_count}
                                    </span>
                                )}
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

                {(flash?.success || flash?.error) && (
                    <div className="px-6 pt-4">
                        <div
                            className={`rounded px-4 py-3 text-sm ${
                                flash.success ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'
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
