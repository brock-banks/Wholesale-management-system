import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useMoney } from '@/hooks/useMoney';

interface Stats {
    today_sales: number;
    receivables: number;
    open_orders: number;
    low_stock: number;
}

export default function Dashboard({ stats }: { stats: Stats }) {
    const { auth } = usePage<PageProps>().props;
    const isAdmin = auth.user?.roles?.includes('admin');
    const { format: fmt } = useMoney();

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="grid grid-cols-4 gap-3 mb-6">
                <Tile label="Today's sales" value={fmt(stats.today_sales)} tone="ink" />
                <Tile label="Total receivables" value={fmt(stats.receivables)} tone="danger" />
                <Tile label="Open orders" value={String(stats.open_orders)} tone="ink" />
                <Tile label="Low / out of stock" value={String(stats.low_stock)} tone="warning" />
            </div>

            {isAdmin && (
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white border border-ink-200 rounded-lg p-6">
                        <h2 className="text-md font-medium text-ink-900 mb-3">Quick actions</h2>
                        <div className="flex flex-wrap gap-2">
                            <Link href={route('admin.bills.create')} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium">New bill (POS)</Link>
                            <Link href={route('admin.payments.create')} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">Record payment</Link>
                            <Link href={route('admin.returns.create')} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">Record return</Link>
                            <Link href={route('admin.products.create')} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">Add product</Link>
                            <Link href={route('admin.customers.create')} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">Add customer</Link>
                        </div>
                    </div>
                    <div className="bg-white border border-ink-200 rounded-lg p-6">
                        <h2 className="text-md font-medium text-ink-900 mb-3">Reports & system</h2>
                        <div className="flex flex-wrap gap-2">
                            <Link href={route('admin.reports')} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">View reports</Link>
                            <Link href={route('admin.orders.index')} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">Order queue</Link>
                            <Link href={route('admin.audit')} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">Audit log</Link>
                            <Link href={route('admin.backups')} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">Backups</Link>
                            <Link href={route('admin.settings.edit')} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">Settings</Link>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: 'ink' | 'danger' | 'warning' }) {
    const colorClass = tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-warning' : 'text-ink-900';
    return (
        <div className="bg-ink-100 rounded p-4">
            <p className="text-xs text-ink-500">{label}</p>
            <p className={`text-xl font-medium mt-1.5 money ${colorClass}`}>{value}</p>
        </div>
    );
}
