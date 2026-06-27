import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, Link } from '@inertiajs/react';
import { Order, Paginated } from '@/types';

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

export default function PortalOrdersIndex({ orders }: { orders: Paginated<Order> }) {
    return (
        <CustomerLayout title="My orders">
            <Head title="My orders" />

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Order</th>
                            <th className="text-left font-medium px-4 py-3">Date</th>
                            <th className="text-left font-medium px-4 py-3">Items</th>
                            <th className="font-medium px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.data.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-ink-500">
                                    No orders yet.{' '}
                                    <Link href={route('portal.catalog')} className="text-primary-700 hover:underline">
                                        Browse catalog
                                    </Link>
                                    .
                                </td>
                            </tr>
                        )}
                        {orders.data.map((o) => (
                            <tr key={o.id} className="border-t border-ink-200 hover:bg-ink-50">
                                <td className="px-4 py-3">
                                    <Link href={route('portal.orders.show', o.id)} className="ref hover:underline">
                                        {o.order_number}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-ink-600 money">{o.order_date}</td>
                                <td className="px-4 py-3 text-ink-600">{o.items?.length ?? '—'}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CustomerLayout>
    );
}
