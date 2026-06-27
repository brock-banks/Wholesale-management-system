import RepLayout from '@/Layouts/RepLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { useMoney } from '@/hooks/useMoney';

interface BillRow {
    id: number;
    invoice_number: string;
    bill_date: string;
    subtotal: string;
    discount_amount: string;
    grand_total: string;
    commission_rate: string;
    commission_amount: string;
    customer?: { id: number; code: string; name: string };
}

interface Totals {
    count: number;
    gross_sales: number;
    commission_base: number;
    commission_total: number;
}

interface Props {
    rep: { name: string; commission_rate: number };
    filters: { from: string; to: string };
    bills: BillRow[];
    totals: Totals;
}

export default function RepCommissions({ rep, filters, bills, totals }: Props) {
    const { format: fmt } = useMoney();
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const apply = () => router.get(route('rep.commissions'), { from, to }, { preserveState: true });

    return (
        <RepLayout title="My earnings">
            <Head title="Earnings" />

            <div className="bg-primary-50 rounded-lg p-4 mb-3">
                <p className="text-xs text-primary-800">Commission earned</p>
                <p className="text-2xl font-medium text-primary-800 mt-1 money">{fmt(totals.commission_total)}</p>
                <p className="text-xs text-primary-700 mt-1">
                    {totals.count} {totals.count === 1 ? 'invoice' : 'invoices'} · rate {rep.commission_rate.toFixed(2)}%
                </p>
            </div>

            <div className="bg-white border border-ink-200 rounded-lg p-3 mb-3">
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <label className="text-xs text-ink-700">
                        From
                        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input w-full mt-0.5" />
                    </label>
                    <label className="text-xs text-ink-700">
                        To
                        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input w-full mt-0.5" />
                    </label>
                </div>
                <button onClick={apply} className="w-full bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium">
                    Apply
                </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
                <Tile label="Gross sales" value={fmt(totals.gross_sales)} />
                <Tile label="Commission base" value={fmt(totals.commission_base)} />
            </div>

            <div className="bg-white border border-ink-200 rounded-lg p-3">
                <h2 className="text-sm font-medium text-ink-900 mb-2">Invoices</h2>
                {bills.length === 0 ? (
                    <p className="text-xs text-ink-500 text-center py-6">No invoices in this period.</p>
                ) : (
                    <div className="space-y-2">
                        {bills.map((b) => (
                            <div key={b.id} className="bg-ink-50 rounded p-2 text-sm">
                                <div className="flex items-start justify-between mb-1">
                                    <div>
                                        <p className="ref text-xs text-primary-700">{b.invoice_number}</p>
                                        <p className="text-xs text-ink-600">{b.customer?.name}</p>
                                        <p className="text-xs text-ink-500 mono">{b.bill_date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-ink-500">Bill</p>
                                        <p className="text-sm money font-medium text-ink-900">{fmt(b.grand_total, { withCurrency: false })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-1.5 border-t border-ink-100 text-xs">
                                    <span className="text-ink-500">Commission {parseFloat(b.commission_rate).toFixed(2)}%</span>
                                    <span className="text-success font-medium money">{fmt(b.commission_amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </RepLayout>
    );
}

function Tile({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-white border border-ink-200 rounded p-3">
            <p className="text-xs text-ink-500">{label}</p>
            <p className="text-md font-medium mt-0.5 money text-ink-900">{value}</p>
        </div>
    );
}
