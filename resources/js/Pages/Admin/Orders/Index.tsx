import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
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

interface Props {
    orders: Paginated<Order>;
    customers: { id: number; code: string; name: string }[];
    filters: { status: string | null; customer_id: number | null };
}

export default function AdminOrdersIndex({ orders, customers, filters }: Props) {
    const [status, setStatus] = useState(filters.status ?? '');
    const [customerId, setCustomerId] = useState<number | ''>(filters.customer_id ?? '');

    const apply = (next: { status?: string; customer_id?: number | '' }) =>
        router.get(
            route('admin.orders.index'),
            {
                status: (next.status ?? status) || undefined,
                customer_id: (next.customer_id ?? customerId) || undefined,
            },
            { preserveState: true, replace: true },
        );

    return (
        <AdminLayout title="Orders">
            <Head title="Orders" />

            <div className="flex gap-3 mb-4">
                <select
                    value={customerId}
                    onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : '';
                        setCustomerId(v);
                        apply({ customer_id: v });
                    }}
                    className="input flex-1"
                >
                    <option value="">All customers</option>
                    {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.code} · {c.name}
                        </option>
                    ))}
                </select>
                <select
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value);
                        apply({ status: e.target.value });
                    }}
                    className="input w-48"
                >
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="on_hold">On hold</option>
                    <option value="invoiced">Invoiced</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Order</th>
                            <th className="text-left font-medium px-4 py-3">Date</th>
                            <th className="text-left font-medium px-4 py-3">Customer</th>
                            <th className="font-medium px-4 py-3">Status</th>
                            <th className="text-left font-medium px-4 py-3">Bill</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.data.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-12 text-center text-ink-500">No orders.</td>
                            </tr>
                        )}
                        {orders.data.map((o) => (
                            <tr key={o.id} className="border-t border-ink-200 hover:bg-ink-50">
                                <td className="px-4 py-3">
                                    <Link href={route('admin.orders.show', o.id)} className="ref hover:underline">
                                        {o.order_number}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-ink-600 money">{o.order_date}</td>
                                <td className="px-4 py-3 text-ink-900">
                                    <span className="ref text-ink-500 mr-1">{o.customer?.code}</span>
                                    {o.customer?.name}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`badge ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                                </td>
                                <td className="px-4 py-3 ref">
                                    {o.bill ? (
                                        <Link href={route('admin.bills.show', o.bill.id)} className="hover:underline">
                                            {o.bill.invoice_number}
                                        </Link>
                                    ) : (
                                        <span className="text-ink-400">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
