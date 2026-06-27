import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Reference { type: 'po' | 'payment'; id: number; label: string }
interface LedgerRow { id: number; entry_date: string; type: string; debit: number; credit: number; running_balance: number; description: string | null; reference: Reference | null }
interface SupplierSummary { id: number; code: string; name: string; phone: string | null; address: string | null; opening_balance: string; current_balance: string }

interface Props {
    supplier: SupplierSummary;
    filters: { from: string; to: string };
    opening_balance: number;
    closing_balance: number;
    period_debit: number;
    period_credit: number;
    entries: LedgerRow[];
}

const TYPE_LABEL: Record<string, string> = { opening: 'Opening', po: 'PO', receipt: 'Receipt', payment: 'Payment', adjustment: 'Adjustment' };
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const refHref = (ref: Reference) => ref.type === 'po' ? route('admin.purchases.show', ref.id) : route('admin.supplier_payments.show', ref.id);

export default function SupplierStatement({ supplier, filters, opening_balance, closing_balance, period_debit, period_credit, entries }: Props) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const apply = () => router.get(route('admin.suppliers.statement', supplier.id), { from, to }, { preserveState: true });

    const closingTone = closing_balance > 0 ? 'text-danger' : closing_balance < 0 ? 'text-success' : 'text-ink-700';

    return (
        <AdminLayout
            title={`Supplier statement — ${supplier.name}`}
            actions={
                <div className="flex gap-2">
                    <Link href={route('admin.suppliers.edit', supplier.id)} className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium">Edit</Link>
                    <a href={`${route('admin.suppliers.statement.pdf', supplier.id)}?from=${from}&to=${to}`} target="_blank" className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium">PDF</a>
                </div>
            }
        >
            <Head title={`Supplier statement — ${supplier.name}`} />

            <div className="grid grid-cols-4 gap-3 mb-6">
                <Tile label="Opening" value={opening_balance} />
                <Tile label="Period debit (POs)" value={period_debit} tone="danger" />
                <Tile label="Period credit (paid)" value={period_credit} tone="success" />
                <Tile label="Closing (we owe)" value={closing_balance} tone="auto" emphasis />
            </div>

            <div className="bg-white border border-ink-200 rounded-lg p-4 mb-4 flex flex-wrap items-end gap-3">
                <div><label className="block text-xs font-medium text-ink-700 mb-1.5">From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input w-44" /></div>
                <div><label className="block text-xs font-medium text-ink-700 mb-1.5">To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input w-44" /></div>
                <button onClick={apply} className="bg-primary-700 hover:bg-primary-800 text-white px-4 h-[38px] rounded text-sm font-medium">Apply</button>
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3 w-28">Date</th>
                            <th className="text-left font-medium px-4 py-3 w-32">Type</th>
                            <th className="text-left font-medium px-4 py-3">Reference / Notes</th>
                            <th className="text-right font-medium px-4 py-3 w-32">Debit</th>
                            <th className="text-right font-medium px-4 py-3 w-32">Credit</th>
                            <th className="text-right font-medium px-4 py-3 w-32">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-t border-ink-200 bg-ink-50">
                            <td className="px-4 py-3 money text-ink-600">{from}</td>
                            <td className="px-4 py-3 text-ink-600 italic">Opening</td>
                            <td className="px-4 py-3 text-ink-500">Balance brought forward</td>
                            <td className="px-4 py-3 text-right money-muted">—</td>
                            <td className="px-4 py-3 text-right money-muted">—</td>
                            <td className="px-4 py-3 text-right money font-medium text-ink-700">{fmt(opening_balance)}</td>
                        </tr>
                        {entries.length === 0 && (
                            <tr className="border-t border-ink-200"><td colSpan={6} className="px-4 py-10 text-center text-ink-500">No transactions in this range.</td></tr>
                        )}
                        {entries.map((e, idx) => (
                            <tr key={e.id} className={`border-t border-ink-200 ${idx % 2 === 1 ? 'bg-ink-50' : ''}`}>
                                <td className="px-4 py-3 money text-ink-700">{e.entry_date}</td>
                                <td className="px-4 py-3 text-ink-700">{TYPE_LABEL[e.type] ?? e.type}</td>
                                <td className="px-4 py-3 text-ink-700">
                                    {e.reference ? <Link href={refHref(e.reference)} className="ref hover:underline">{e.reference.label}</Link> : <span className="text-ink-500">{e.description ?? '—'}</span>}
                                </td>
                                <td className="px-4 py-3 text-right money">{e.debit > 0 ? fmt(e.debit) : <span className="money-muted">—</span>}</td>
                                <td className="px-4 py-3 text-right">{e.credit > 0 ? <span className="money-pos">{fmt(e.credit)}</span> : <span className="money-muted">—</span>}</td>
                                <td className="px-4 py-3 text-right money font-medium text-ink-900">{fmt(e.running_balance)}</td>
                            </tr>
                        ))}
                        <tr className="border-t-2 border-ink-300 bg-ink-50">
                            <td className="px-4 py-3 money text-ink-600">{to}</td>
                            <td className="px-4 py-3 text-ink-900 font-medium">Closing</td>
                            <td className="px-4 py-3 text-ink-500">Balance carried forward</td>
                            <td className="px-4 py-3 text-right money font-medium">{fmt(period_debit)}</td>
                            <td className="px-4 py-3 text-right money font-medium money-pos">{fmt(period_credit)}</td>
                            <td className={`px-4 py-3 text-right money font-medium ${closingTone}`}>{fmt(closing_balance)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-ink-500 mt-3">Positive balance = you owe the supplier. Negative = supplier owes you (advance paid).</p>
        </AdminLayout>
    );
}

function Tile({ label, value, tone = 'ink', emphasis = false }: { label: string; value: number; tone?: 'ink' | 'danger' | 'success' | 'auto'; emphasis?: boolean }) {
    const resolved = tone === 'auto' ? (value > 0 ? 'text-danger' : value < 0 ? 'text-success' : 'text-ink-900') : tone === 'danger' ? 'text-danger' : tone === 'success' ? 'text-success' : 'text-ink-900';
    return (
        <div className={`rounded p-4 ${emphasis ? 'bg-primary-50' : 'bg-ink-100'}`}>
            <p className="text-xs text-ink-500">{label}</p>
            <p className={`text-xl font-medium mt-1.5 money ${resolved}`}>{value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
    );
}
