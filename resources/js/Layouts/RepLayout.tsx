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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    customers: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 22a8 8 0 0 1 16 0" />
        </svg>
    ),
    new: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    orders: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    commission: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
        </svg>
    ),
    logout: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
};

const NAV: NavItem[] = [
    { label: 'Home', href: '/rep', icon: icons.home },
    { label: 'Customers', href: '/rep/customers', icon: icons.customers },
    { label: 'New order', href: '/rep/orders/create', icon: icons.new },
    { label: 'Orders', href: '/rep/orders', icon: icons.orders },
    { label: 'Earnings', href: '/rep/commissions', icon: icons.commission },
];

export default function RepLayout({
    title,
    actions,
    children,
}: PropsWithChildren<{ title: string; actions?: ReactNode }>) {
    const { auth, flash } = usePage<PageProps>().props;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="min-h-screen bg-ink-50 flex flex-col">
            <header className="bg-white border-b border-ink-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-primary-700 flex items-center justify-center text-white text-sm font-medium">R</div>
                        <h1 className="text-md font-medium text-ink-900">{title}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        {actions}
                        <NotificationBell />
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="p-2 text-ink-500 hover:text-ink-900"
                            title="Sign out"
                        >
                            {icons.logout}
                        </Link>
                    </div>
                </div>
                <div className="max-w-2xl mx-auto px-2 text-xs text-ink-500 pb-1">
                    Signed in as <span className="text-ink-700 font-medium">{auth.user?.name}</span>
                </div>
            </header>

            {(flash?.success || flash?.error) && (
                <div className="max-w-2xl mx-auto w-full px-4 pt-4">
                    <div className={`rounded px-3 py-2 text-sm ${flash.success ? 'bg-success-bg text-success-text' : 'bg-danger-bg text-danger-text'}`}>
                        {flash.success || flash.error}
                    </div>
                </div>
            )}

            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-24">{children}</main>

            <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-ink-200 z-20">
                <div className="max-w-2xl mx-auto grid grid-cols-5">
                    {NAV.map((item) => {
                        const active =
                            item.href === '/rep'
                                ? currentPath === '/rep'
                                : currentPath === item.href || currentPath.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                                    active ? 'text-primary-700' : 'text-ink-500 hover:text-ink-900'
                                }`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
