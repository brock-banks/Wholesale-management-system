import RepLayout from '@/Layouts/RepLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Paginated } from '@/types';

interface OrderRow {
    id: number;
    order_number: string;
    order_date: string;
    status: string;
    customer?: { id: number; code: string; name: string };
}

interface Props {
    orders: Paginated<OrderRow>;
    filters: { status: string | null };
}

const STATUS_BADGE: Record<string, string> = {
    pending: 'badge-pending', reviewing: 'badge-reviewing', confirmed: 'badge-confirmed',
    on_hold: 'badge-on-hold', invoiced: 'badge-invoiced', cancelled: 'badge-cancelled',
};

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending', reviewing: 'Reviewing', confirmed: 'Confirmed',
    on_hold: 'On hold', invoiced: 'Invoiced', cancelled: 'Cancelled',
};

export default function RepOrdersIndex({ orders, filters }: Props) {
    return (
        <RepLayout title="My orders">
            <Head title="Orders" />

            <select
                value={filters.status ?? ''}
                onChange={(e) =>
                    router.get(route('rep.orders.index'), { status: e.target.value || undefined }, { preserveState: true })
                }
                className="input w-full mb-3"
            >
                <option value="">All statuses</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                ))}
            </select>

            {orders.data.length === 0 ? (
                <div className="bg-white border border-ink-200 rounded-lg p-8 text-center">
                    <p className="text-sm text-ink-500">No orders yet.</p>
                    <Link href={route('rep.orders.create')} className="inline-block mt-3 text-xs text-primary-700 hover:underline">
                        Take your first order →
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {orders.data.map((o) => (
                        <Link
                            key={o.id}
                            href={route('rep.orders.show', o.id)}
                            className="block bg-white border border-ink-200 hover:border-primary-300 rounded-lg p-3"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="ref text-sm text-primary-700">{o.order_number}</p>
                                    <p className="text-sm text-ink-900 mt-0.5">{o.customer?.name}</p>
                                    <p className="text-xs text-ink-500 mono">{o.order_date}</p>
                                </div>
                                <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {orders.last_page > 1 && (
                <div className="flex justify-center mt-4 gap-1">
                    {orders.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? ''}
                            className={`px-3 py-1.5 rounded text-xs ${
                                link.active ? 'bg-primary-700 text-white' : link.url ? 'border border-ink-200' : 'text-ink-400'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </RepLayout>
    );
}
