import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, Link } from '@inertiajs/react';
import { Order } from '@/types';

const STATUS_BADGE: Record<string, string> = {
    pending: 'badge-pending',
    reviewing: 'badge-reviewing',
    confirmed: 'badge-confirmed',
    on_hold: 'badge-on-hold',
    invoiced: 'badge-invoiced',
    cancelled: 'badge-cancelled',
};

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending review',
    reviewing: 'Reviewing',
    confirmed: 'Confirmed',
    on_hold: 'On hold',
    invoiced: 'Invoiced',
    cancelled: 'Cancelled',
};

const fmt = (n: number) =>
    n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PortalOrderShow({ order }: { order: Order }) {
    const items = order.items ?? [];
    const estimate = items.reduce(
        (s, i) => s + parseFloat(i.unit_price) * (i.confirmed_qty ?? i.requested_qty),
        0,
    );
    const confirmed = order.status === 'confirmed' || order.status === 'invoiced';

    return (
        <CustomerLayout title={order.order_number}>
            <Head title={order.order_number} />

            <div className="bg-white border border-ink-200 rounded-lg p-5 mb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xl font-medium text-ink-900">{order.order_number}</p>
                        <p className="text-sm text-ink-500 mt-1 money">{order.order_date}</p>
                    </div>
                    <span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                </div>
                {order.admin_notes && (
                    <div className="mt-4 bg-ink-50 rounded p-3 text-sm">
                        <p className="text-ink-500 text-xs mb-1">Note from admin</p>
                        <p className="text-ink-700">{order.admin_notes}</p>
                    </div>
                )}
                {order.bill && (
                    <div className="mt-4 bg-success-bg rounded p-3 text-sm">
                        <p className="text-success-text">
                            Bill generated:{' '}
                            <span className="ref">{order.bill.invoice_number}</span>
                        </p>
                    </div>
                )}
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Item</th>
                            <th className="text-right font-medium px-4 py-3">Unit price</th>
                            <th className="text-right font-medium px-4 py-3">Requested</th>
                            {confirmed && <th className="text-right font-medium px-4 py-3">Confirmed</th>}
                            <th className="text-right font-medium px-4 py-3">Estimate</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((i) => {
                            const qty = i.confirmed_qty ?? i.requested_qty;
                            const lineTotal = parseFloat(i.unit_price) * qty;
                            const removed = confirmed && (i.confirmed_qty ?? 0) === 0;
                            return (
                                <tr key={i.id} className={`border-t border-ink-200 ${removed ? 'opacity-50' : ''}`}>
                                    <td className="px-4 py-3">
                                        <div className="text-ink-900">{i.product_name}</div>
                                        <div className="text-xs text-ink-500 ref">{i.product_sku}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right money text-ink-700">{i.unit_price}</td>
                                    <td className="px-4 py-3 text-right money text-ink-700">{i.requested_qty}</td>
                                    {confirmed && (
                                        <td className={`px-4 py-3 text-right money ${removed ? 'text-danger' : 'text-ink-900'}`}>
                                            {i.confirmed_qty ?? 0}
                                        </td>
                                    )}
                                    <td className="px-4 py-3 text-right money font-medium text-ink-900">{fmt(lineTotal)}</td>
                                </tr>
                            );
                        })}
                        <tr className="border-t-2 border-ink-300 bg-ink-50">
                            <td colSpan={confirmed ? 4 : 3} className="px-4 py-3 text-right text-ink-900 font-medium">
                                Estimated total
                            </td>
                            <td className="px-4 py-3 text-right money font-medium text-ink-900">{fmt(estimate)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-ink-500 mt-3">
                Final amount may differ if admin adjusts quantities or applies discount before billing.
            </p>
        </CustomerLayout>
    );
}
