import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Paginated, PurchaseOrder } from '@/types';

const STATUS_BADGE: Record<string, string> = {
    pending: 'badge-pending',
    partial: 'badge-partial',
    received: 'badge-paid',
    cancelled: 'badge-cancelled',
};
const STATUS_LABEL: Record<string, string> = {
    pending: 'Pending',
    partial: 'Partial',
    received: 'Received',
    cancelled: 'Cancelled',
};

export default function PurchasesIndex({ pos, suppliers, filters }: { pos: Paginated<PurchaseOrder>; suppliers: { id: number; code: string; name: string }[]; filters: { status: string | null; supplier_id: number | null } }) {
    const [status, setStatus] = useState(filters.status ?? '');
    const [supplierId, setSupplierId] = useState<number | ''>(filters.supplier_id ?? '');

    const apply = (next: { status?: string; supplier_id?: number | '' }) =>
        router.get(route('admin.purchases.index'), {
            status: (next.status ?? status) || undefined,
            supplier_id: (next.supplier_id ?? supplierId) || undefined,
        }, { preserveState: true, replace: true });

    return (
        <AdminLayout
            title="Purchase orders"
            actions={
                <Link href={route('admin.purchases.create')} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium">
                    New PO
                </Link>
            }
        >
            <Head title="Purchase orders" />

            <div className="flex gap-3 mb-4">
                <select value={supplierId} onChange={(e) => { const v = e.target.value ? Number(e.target.value) : ''; setSupplierId(v); apply({ supplier_id: v }); }} className="input flex-1">
                    <option value="">All suppliers</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
                </select>
                <select value={status} onChange={(e) => { setStatus(e.target.value); apply({ status: e.target.value }); }} className="input w-48">
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">PO</th>
                            <th className="text-left font-medium px-4 py-3">Date</th>
                            <th className="text-left font-medium px-4 py-3">Supplier</th>
                            <th className="text-right font-medium px-4 py-3">Total</th>
                            <th className="text-right font-medium px-4 py-3">Paid</th>
                            <th className="font-medium px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pos.data.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-500">No purchase orders.</td></tr>
                        )}
                        {pos.data.map((p) => (
                            <tr key={p.id} className="border-t border-ink-200 hover:bg-ink-50">
                                <td className="px-4 py-3"><Link href={route('admin.purchases.show', p.id)} className="ref hover:underline">{p.po_number}</Link></td>
                                <td className="px-4 py-3 text-ink-600 money">{p.po_date}</td>
                                <td className="px-4 py-3 text-ink-900">
                                    <span className="ref text-ink-500 mr-1">{p.supplier?.code}</span>{p.supplier?.name}
                                </td>
                                <td className="px-4 py-3 text-right money text-ink-900">{p.total}</td>
                                <td className="px-4 py-3 text-right money-pos">{p.paid_amount}</td>
                                <td className="px-4 py-3 text-center"><span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
