import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { Paginated } from '@/types';

interface ReturnRow {
    id: number;
    return_number: string;
    return_date: string;
    total: string;
    reason: string | null;
    customer?: { id: number; code: string; name: string };
    bill?: { id: number; invoice_number: string } | null;
}

export default function ReturnsIndex({ returns }: { returns: Paginated<ReturnRow> }) {
    return (
        <AdminLayout
            title="Returns"
            actions={
                <Link
                    href={route('admin.returns.create')}
                    className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    New return
                </Link>
            }
        >
            <Head title="Returns" />
            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Return</th>
                            <th className="text-left font-medium px-4 py-3">Date</th>
                            <th className="text-left font-medium px-4 py-3">Customer</th>
                            <th className="text-left font-medium px-4 py-3">Bill</th>
                            <th className="text-right font-medium px-4 py-3">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {returns.data.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-12 text-center text-ink-500">No returns yet.</td></tr>
                        )}
                        {returns.data.map((r) => (
                            <tr key={r.id} className="border-t border-ink-200 hover:bg-ink-50">
                                <td className="px-4 py-3">
                                    <Link href={route('admin.returns.show', r.id)} className="ref hover:underline">{r.return_number}</Link>
                                </td>
                                <td className="px-4 py-3 text-ink-600 money">{r.return_date}</td>
                                <td className="px-4 py-3 text-ink-900">
                                    <span className="ref text-ink-500 mr-1">{r.customer?.code}</span>{r.customer?.name}
                                </td>
                                <td className="px-4 py-3 ref">{r.bill ? r.bill.invoice_number : <span className="text-ink-400">—</span>}</td>
                                <td className="px-4 py-3 text-right money-pos">{r.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
