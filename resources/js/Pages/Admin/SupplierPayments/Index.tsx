import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Paginated, SupplierPayment } from '@/types';

const METHOD_LABEL: Record<string, string> = { cash: 'Cash', card: 'Card', check: 'Check', bank: 'Bank' };

export default function SupplierPaymentsIndex({ payments, filters }: { payments: Paginated<SupplierPayment>; filters: { method: string | null } }) {
    const [method, setMethod] = useState(filters.method ?? '');

    const apply = (m: string) => router.get(route('admin.supplier_payments.index'), { method: m || undefined }, { preserveState: true, replace: true });

    const checkBadge = (p: SupplierPayment) => {
        if (p.method !== 'check') return null;
        if (p.check_status === 'cleared') return <span className="badge badge-check-cleared">Cleared</span>;
        if (p.check_status === 'bounced') return <span className="badge badge-check-bounced">Bounced</span>;
        return <span className="badge badge-check-pending">Pending</span>;
    };

    return (
        <AdminLayout
            title="Supplier payments"
            actions={
                <Link href={route('admin.supplier_payments.create')} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium">
                    Record payment
                </Link>
            }
        >
            <Head title="Supplier payments" />
            <div className="mb-4">
                <select value={method} onChange={(e) => { setMethod(e.target.value); apply(e.target.value); }} className="input w-48">
                    <option value="">All methods</option>
                    {Object.entries(METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </div>
            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Receipt</th>
                            <th className="text-left font-medium px-4 py-3">Date</th>
                            <th className="text-left font-medium px-4 py-3">Supplier</th>
                            <th className="text-left font-medium px-4 py-3">Method</th>
                            <th className="text-right font-medium px-4 py-3">Amount</th>
                            <th className="font-medium px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.data.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-500">No supplier payments yet.</td></tr>
                        )}
                        {payments.data.map((p) => (
                            <tr key={p.id} className="border-t border-ink-200 hover:bg-ink-50">
                                <td className="px-4 py-3"><Link href={route('admin.supplier_payments.show', p.id)} className="ref hover:underline">{p.payment_number}</Link></td>
                                <td className="px-4 py-3 text-ink-600 money">{p.payment_date}</td>
                                <td className="px-4 py-3 text-ink-900">
                                    <span className="ref text-ink-500 mr-1">{p.supplier?.code}</span>{p.supplier?.name}
                                </td>
                                <td className="px-4 py-3 text-ink-700">{METHOD_LABEL[p.method]}</td>
                                <td className="px-4 py-3 text-right money-pos">{p.amount}</td>
                                <td className="px-4 py-3 text-center">{checkBadge(p) ?? <span className="badge badge-paid">Active</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
