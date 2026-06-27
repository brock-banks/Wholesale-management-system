import RepLayout from '@/Layouts/RepLayout';
import { Head, Link } from '@inertiajs/react';
import { useMoney } from '@/hooks/useMoney';

interface Stats {
    my_customers: number;
    orders_open: number;
    sales_today: number;
    sales_month: number;
    commission_month: number;
}

interface RecentOrder {
    id: number;
    order_number: string;
    order_date: string;
    status: string;
    customer?: { id: number; code: string; name: string };
}

interface Props {
    rep: { id: number; name: string; commission_rate: number };
    stats: Stats;
    recent_orders: RecentOrder[];
}

const STATUS_BADGE: Record<string, string> = {
    pending: 'badge-pending',
    reviewing: 'badge-reviewing',
    confirmed: 'badge-confirmed',
    on_hold: 'badge-on-hold',
    invoiced: 'badge-invoiced',
    cancelled: 'badge-cancelled',
};

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending',
    reviewing: 'Reviewing',
    confirmed: 'Confirmed',
    on_hold: 'On hold',
    invoiced: 'Invoiced',
    cancelled: 'Cancelled',
};

export default function RepHome({ rep, stats, recent_orders }: Props) {
    const { format: fmt } = useMoney();

    return (
        <RepLayout title="Home">
            <Head title="Home" />

            <div className="mb-4">
                <p className="text-sm text-ink-500">Welcome back,</p>
                <p className="text-lg font-medium text-ink-900">{rep.name}</p>
                <p className="text-xs text-ink-500 mt-0.5">Commission rate: {rep.commission_rate.toFixed(2)}%</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <Tile label="My customers" value={String(stats.my_customers)} />
                <Tile label="Open orders" value={String(stats.orders_open)} />
                <Tile label="Sales today" value={fmt(stats.sales_today)} />
                <Tile label="Sales this month" value={fmt(stats.sales_month)} />
            </div>

            <div className="bg-primary-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-primary-800">Commission earned this month</p>
                <p className="text-2xl font-medium text-primary-800 mt-1 money">{fmt(stats.commission_month)}</p>
                <Link href={route('rep.commissions')} className="text-xs text-primary-800 underline mt-2 inline-block">
                    View earnings detail →
                </Link>
            </div>

            <div className="flex gap-2 mb-4">
                <Link
                    href={route('rep.orders.create')}
                    className="flex-1 bg-primary-700 hover:bg-primary-800 text-white px-4 py-3 rounded text-sm font-medium text-center"
                >
                    Take new order
                </Link>
                <Link
                    href={route('rep.customers.index')}
                    className="flex-1 bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-3 rounded text-sm font-medium text-center"
                >
                    My customers
                </Link>
            </div>

            <div className="bg-white border border-ink-200 rounded-lg p-4">
                <h2 className="text-sm font-medium text-ink-900 mb-3">Recent orders</h2>
                {recent_orders.length === 0 ? (
                    <p className="text-sm text-ink-500 text-center py-6">No orders yet — take one!</p>
                ) : (
                    <div className="space-y-2">
                        {recent_orders.map((o) => (
                            <Link
                                key={o.id}
                                href={route('rep.orders.show', o.id)}
                                className="flex items-center justify-between bg-ink-50 hover:bg-ink-100 rounded px-3 py-2"
                            >
                                <div>
                                    <p className="ref text-sm text-primary-700">{o.order_number}</p>
                                    <p className="text-xs text-ink-600">{o.customer?.name} · {o.order_date}</p>
                                </div>
                                <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </RepLayout>
    );
}

function Tile({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white border border-ink-200 rounded p-3">
            <p className="text-xs text-ink-500">{label}</p>
            <p className="text-lg font-medium mt-0.5 money text-ink-900">{value}</p>
        </div>
    );
}
