import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useMoney } from '@/hooks/useMoney';

interface RepRow {
    id: number;
    name: string;
    email: string;
    commission_rate: number;
    bills_count: number;
    gross_sales: number;
    commission_total: number;
}

interface Props {
    filters: { from: string; to: string };
    reps: RepRow[];
    totals: { gross_sales: number; commission_total: number };
}

export default function AdminCommissionsReport({ filters, reps, totals }: Props) {
    const { format: fmt } = useMoney();
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const apply = () => router.get(route('admin.reports.commissions'), { from, to }, { preserveState: true });

    return (
        <AdminLayout title="Commissions report">
            <Head title="Commissions" />

            <div className="bg-white border border-ink-200 rounded-lg p-4 mb-4 flex items-end gap-3">
                <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1.5">From</label>
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input w-44" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1.5">To</label>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input w-44" />
                </div>
                <button onClick={apply} className="bg-primary-700 hover:bg-primary-800 text-white px-4 h-[38px] rounded text-sm font-medium">
                    Apply
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
                <Tile label="Total gross sales" value={fmt(totals.gross_sales)} />
                <Tile label="Total commission payable" value={fmt(totals.commission_total)} tone="success" />
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Sales rep</th>
                            <th className="text-left font-medium px-4 py-3">Email</th>
                            <th className="text-right font-medium px-4 py-3">Rate</th>
                            <th className="text-right font-medium px-4 py-3">Bills</th>
                            <th className="text-right font-medium px-4 py-3">Gross sales</th>
                            <th className="text-right font-medium px-4 py-3">Commission</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reps.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-500">No sales reps configured.</td></tr>
                        )}
                        {reps.map((r) => (
                            <tr key={r.id} className="border-t border-ink-200">
                                <td className="px-4 py-3 text-ink-900 font-medium">{r.name}</td>
                                <td className="px-4 py-3 text-ink-600 ref">{r.email}</td>
                                <td className="px-4 py-3 text-right money text-ink-700">{r.commission_rate.toFixed(2)}%</td>
                                <td className="px-4 py-3 text-right money">{r.bills_count}</td>
                                <td className="px-4 py-3 text-right money">{fmt(r.gross_sales, { withCurrency: false })}</td>
                                <td className="px-4 py-3 text-right money font-medium text-success">{fmt(r.commission_total, { withCurrency: false })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'success' }) {
    const color = tone === 'success' ? 'text-success' : 'text-ink-900';
    return (
        <div className="bg-ink-100 rounded p-4">
            <p className="text-xs text-ink-500">{label}</p>
            <p className={`text-xl font-medium mt-1.5 money ${color}`}>{value}</p>
        </div>
    );
}
