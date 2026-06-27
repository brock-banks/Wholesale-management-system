import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Order } from '@/types';
import { useConfirm } from '@/hooks/useConfirm';

interface LocationOpt {
    id: number;
    code: string;
    name: string;
    is_default: boolean;
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

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminOrderShow({ order, locations }: { order: Order; locations: LocationOpt[] }) {
    const items = order.items ?? [];
    const isOpen = ['pending', 'reviewing', 'on_hold'].includes(order.status);
    const isConfirmed = order.status === 'confirmed';
    const defaultLocation = order.location_id ?? locations.find((l) => l.is_default)?.id ?? locations[0]?.id ?? 0;

    const initialConfirmed: Record<number, number> = {};
    items.forEach((i) => {
        initialConfirmed[i.id] = i.confirmed_qty ?? i.requested_qty;
    });

    const { data, setData, post, processing, errors } = useForm({
        location_id: defaultLocation,
        admin_notes: order.admin_notes ?? '',
        confirmed: initialConfirmed as Record<number, number>,
    });

    const [holdNotes, setHoldNotes] = useState('');
    const [cancelNotes, setCancelNotes] = useState('');
    const { confirm, dialog } = useConfirm();

    const setQty = (itemId: number, qty: number) => {
        setData('confirmed', { ...data.confirmed, [itemId]: Math.max(0, qty) });
    };

    const submitConfirm = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.orders.confirm', order.id));
    };

    const hold = () => {
        confirm({
            title: 'Place this order on hold?',
            message: 'The customer will be notified that you need more time to fulfill this order.',
            confirmLabel: 'Place on hold',
            tone: 'primary',
            onConfirm: () => router.post(route('admin.orders.hold', order.id), { admin_notes: holdNotes }),
        });
    };

    const cancel = () => {
        confirm({
            title: 'Cancel this order?',
            message: 'The customer will be notified. This cannot be undone.',
            confirmLabel: 'Cancel order',
            onConfirm: () => router.post(route('admin.orders.cancel', order.id), { admin_notes: cancelNotes }),
        });
    };

    const estimateConfirmed = items.reduce((s, i) => s + parseFloat(i.unit_price) * (data.confirmed[i.id] ?? 0), 0);

    return (
        <AdminLayout
            title={`${order.order_number} — ${order.customer?.name}`}
            actions={
                isConfirmed && !order.bill ? (
                    <Link
                        href={`${route('admin.bills.create')}?from_order=${order.id}`}
                        className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                        Generate bill
                    </Link>
                ) : order.bill ? (
                    <Link
                        href={route('admin.bills.show', order.bill.id)}
                        className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium"
                    >
                        View bill {order.bill.invoice_number}
                    </Link>
                ) : undefined
            }
        >
            <Head title={order.order_number} />
            {dialog}

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                    <div className="bg-white border border-ink-200 rounded-lg p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xl font-medium text-ink-900">{order.order_number}</p>
                                <p className="text-sm text-ink-500 mt-1 money">{order.order_date}</p>
                            </div>
                            <span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                        </div>
                        <div className="border-t border-ink-200 mt-4 pt-3 text-sm">
                            <p className="text-ink-500 mb-1">Customer</p>
                            <p className="text-ink-900">
                                <span className="ref text-ink-500 mr-1">{order.customer?.code}</span>
                                {order.customer?.name}
                            </p>
                            {order.customer?.phone && <p className="text-ink-600 money mt-0.5">{order.customer.phone}</p>}
                        </div>
                        {order.customer_notes && (
                            <div className="border-t border-ink-200 mt-3 pt-3 text-sm">
                                <p className="text-ink-500 mb-1">Customer notes</p>
                                <p className="text-ink-700">{order.customer_notes}</p>
                            </div>
                        )}
                        {order.admin_notes && (
                            <div className="border-t border-ink-200 mt-3 pt-3 text-sm">
                                <p className="text-ink-500 mb-1">Admin notes</p>
                                <p className="text-ink-700">{order.admin_notes}</p>
                            </div>
                        )}
                    </div>

                    <form onSubmit={submitConfirm} className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-ink-200 flex items-center justify-between">
                            <h2 className="text-sm font-medium text-ink-900">Items</h2>
                            {isOpen && <span className="text-xs text-ink-500">Set confirmed qty = 0 to remove an item.</span>}
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-ink-50 text-ink-500 text-xs">
                                <tr>
                                    <th className="text-left font-medium px-3 py-2">Item</th>
                                    <th className="text-right font-medium px-3 py-2">Unit price</th>
                                    <th className="text-right font-medium px-3 py-2">Requested</th>
                                    <th className="text-right font-medium px-3 py-2 w-28">Confirmed</th>
                                    <th className="text-right font-medium px-3 py-2">Estimate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((i) => (
                                    <tr key={i.id} className="border-t border-ink-200">
                                        <td className="px-3 py-2">
                                            <div className="text-ink-900">{i.product_name}</div>
                                            <div className="text-xs text-ink-500 ref">{i.product_sku}</div>
                                        </td>
                                        <td className="px-3 py-2 text-right money text-ink-700">{i.unit_price}</td>
                                        <td className="px-3 py-2 text-right money text-ink-900">{i.requested_qty}</td>
                                        <td className="px-3 py-2">
                                            {isOpen ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={data.confirmed[i.id] ?? 0}
                                                    onChange={(e) => setQty(i.id, Number(e.target.value))}
                                                    className="input money text-right h-8 w-full"
                                                />
                                            ) : (
                                                <div className="text-right money text-ink-900">{i.confirmed_qty ?? '—'}</div>
                                            )}
                                        </td>
                                        <td className="px-3 py-2 text-right money font-medium text-ink-900">
                                            {fmt(parseFloat(i.unit_price) * (isOpen ? (data.confirmed[i.id] ?? 0) : (i.confirmed_qty ?? i.requested_qty)))}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="border-t-2 border-ink-300 bg-ink-50">
                                    <td colSpan={4} className="px-3 py-3 text-right text-ink-900 font-medium">Estimated total</td>
                                    <td className="px-3 py-3 text-right money font-medium text-ink-900">
                                        {fmt(isOpen ? estimateConfirmed : items.reduce((s, i) => s + parseFloat(i.unit_price) * (i.confirmed_qty ?? i.requested_qty), 0))}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {isOpen && (
                            <div className="p-4 border-t border-ink-200 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-ink-700 mb-1.5">Confirm at location</label>
                                        <select
                                            value={data.location_id}
                                            onChange={(e) => setData('location_id', Number(e.target.value))}
                                            className="input"
                                        >
                                            {locations.map((l) => (
                                                <option key={l.id} value={l.id}>
                                                    {l.code} · {l.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-ink-700 mb-1.5">Notes</label>
                                    <textarea
                                        value={data.admin_notes}
                                        onChange={(e) => setData('admin_notes', e.target.value)}
                                        rows={2}
                                        className="input h-auto py-2"
                                        placeholder="Optional"
                                    />
                                </div>
                                {(errors as Record<string, string>).items && (
                                    <p className="text-xs text-danger">{(errors as Record<string, string>).items}</p>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                                    >
                                        Confirm order
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                <div className="space-y-4">
                    {isOpen && (
                        <>
                            <div className="bg-white border border-ink-200 rounded-lg p-4">
                                <h2 className="text-sm font-medium text-ink-900 mb-3">Put on hold</h2>
                                <textarea
                                    value={holdNotes}
                                    onChange={(e) => setHoldNotes(e.target.value)}
                                    rows={2}
                                    className="input h-auto py-2 w-full mb-2"
                                    placeholder="Reason (optional)"
                                />
                                <button
                                    onClick={hold}
                                    className="w-full bg-warning-bg hover:bg-amber-100 text-warning-text px-4 py-2 rounded text-sm font-medium"
                                >
                                    Hold order
                                </button>
                            </div>

                            <div className="bg-white border border-ink-200 rounded-lg p-4">
                                <h2 className="text-sm font-medium text-ink-900 mb-3">Cancel</h2>
                                <textarea
                                    value={cancelNotes}
                                    onChange={(e) => setCancelNotes(e.target.value)}
                                    rows={2}
                                    className="input h-auto py-2 w-full mb-2"
                                    placeholder="Reason (optional)"
                                />
                                <button
                                    onClick={cancel}
                                    className="w-full bg-danger-bg hover:bg-red-100 text-danger-text px-4 py-2 rounded text-sm font-medium"
                                >
                                    Cancel order
                                </button>
                            </div>
                        </>
                    )}

                    {!isOpen && (
                        <div className="bg-white border border-ink-200 rounded-lg p-4 text-sm">
                            <p className="text-ink-500 mb-2">Order is closed.</p>
                            <p className="text-ink-700">Actioned: <span className="money">{order.actioned_at ?? '—'}</span></p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
