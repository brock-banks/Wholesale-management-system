import RepLayout from '@/Layouts/RepLayout';
import { Head, Link } from '@inertiajs/react';
import { Order } from '@/types';
import { useMoney } from '@/hooks/useMoney';

const STATUS_BADGE: Record<string, string> = {
    pending: 'badge-pending', reviewing: 'badge-reviewing', confirmed: 'badge-confirmed',
    on_hold: 'badge-on-hold', invoiced: 'badge-invoiced', cancelled: 'badge-cancelled',
};

const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending', reviewing: 'Reviewing', confirmed: 'Confirmed',
    on_hold: 'On hold', invoiced: 'Invoiced', cancelled: 'Cancelled',
};

export default function RepOrderShow({ order }: { order: Order }) {
    const { format: fmt } = useMoney();
    const items = order.items ?? [];
    const total = items.reduce((s, i) => s + parseFloat(i.unit_price) * (i.confirmed_qty ?? i.requested_qty), 0);

    return (
        <RepLayout title={order.order_number}>
            <Head title={order.order_number} />

            <div className="bg-white border border-ink-200 rounded-lg p-4 mb-3">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <p className="ref text-sm text-primary-700">{order.order_number}</p>
                        <p className="text-xs text-ink-500 mono mt-0.5">{order.order_date}</p>
                    </div>
                    <span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                </div>
                <div className="border-t border-ink-100 pt-2 text-sm">
                    <p className="text-ink-900">{order.customer?.name}</p>
                    <p className="ref text-xs">{order.customer?.code}</p>
                </div>
                {order.admin_notes && (
                    <div className="mt-3 p-2 bg-ink-50 rounded text-xs">
                        <p className="text-ink-500 mb-0.5">Admin note</p>
                        <p className="text-ink-700">{order.admin_notes}</p>
                    </div>
                )}
                {order.bill && (
                    <div className="mt-3 p-2 bg-success-bg rounded text-xs">
                        <p className="text-success-text">Invoiced: <span className="ref">{order.bill.invoice_number}</span></p>
                    </div>
                )}
            </div>

            <div className="bg-white border border-ink-200 rounded-lg p-4 mb-3">
                <h2 className="text-sm font-medium text-ink-900 mb-2">Items</h2>
                <div className="space-y-1.5">
                    {items.map((i) => {
                        const qty = i.confirmed_qty ?? i.requested_qty;
                        const lineTotal = parseFloat(i.unit_price) * qty;
                        return (
                            <div key={i.id} className="flex items-start justify-between bg-ink-50 rounded px-3 py-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-ink-900 truncate">{i.product_name}</p>
                                    <p className="text-xs text-ink-500">
                                        <span className="ref">{i.product_sku}</span>
                                        {i.confirmed_qty != null && i.confirmed_qty !== i.requested_qty && (
                                            <span className="ml-2">requested {i.requested_qty}, confirmed {i.confirmed_qty}</span>
                                        )}
                                    </p>
                                </div>
                                <div className="text-right ml-2">
                                    <p className="text-xs text-ink-500">{qty} × <span className="money">{fmt(i.unit_price, { withCurrency: false })}</span></p>
                                    <p className="text-sm money font-medium text-ink-900">{fmt(lineTotal, { withCurrency: false })}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div className="flex items-center justify-between pt-2 border-t border-ink-100">
                        <p className="text-sm font-medium text-ink-900">Total</p>
                        <p className="money text-lg font-medium text-ink-900">{fmt(total)}</p>
                    </div>
                </div>
            </div>

            <Link
                href={route('rep.orders.index')}
                className="block w-full text-center text-xs text-ink-500 underline py-2"
            >
                ← Back to orders
            </Link>
        </RepLayout>
    );
}
