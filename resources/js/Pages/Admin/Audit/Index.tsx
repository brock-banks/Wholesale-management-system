import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';

interface StockRow {
    id: number; type: string; quantity: number; notes: string | null;
    product?: { id: number; sku: string; name: string };
    location?: { id: number; code: string; name: string };
    user?: { id: number; name: string };
    created_at: string;
    reference_type: string | null;
    reference_id: number | null;
}
interface LedgerRow {
    id: number; entry_date: string; type: string; debit: string; credit: string; running_balance: string;
    description: string | null;
    customer?: { id: number; code: string; name: string };
    user?: { id: number; name: string };
    reference_type: string | null;
    reference_id: number | null;
}
interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number | null; to: number | null; total: number; last_page: number;
}

const STOCK_LABEL: Record<string, string> = {
    stock_in: 'Stock in', sale: 'Sale', return: 'Return', adjustment: 'Adjustment', reservation: 'Reservation', release: 'Release',
};
const LEDGER_LABEL: Record<string, string> = {
    opening: 'Opening', bill: 'Bill', payment: 'Payment', return: 'Return', adjustment: 'Adjustment', cancellation: 'Cancellation',
};

export default function AuditIndex({ tab, rows }: { tab: 'stock' | 'ledger'; rows: Paginated<StockRow> | Paginated<LedgerRow> }) {
    const switchTab = (t: 'stock' | 'ledger') =>
        router.get(route('admin.audit'), { tab: t }, { preserveState: true });

    return (
        <AdminLayout title="Audit log">
            <Head title="Audit log" />
            <div className="flex gap-1 mb-4">
                <button onClick={() => switchTab('stock')} className={`px-4 py-2 text-sm rounded ${tab === 'stock' ? 'bg-primary-700 text-white' : 'bg-white border border-ink-200 text-ink-700'}`}>
                    Stock movements
                </button>
                <button onClick={() => switchTab('ledger')} className={`px-4 py-2 text-sm rounded ${tab === 'ledger' ? 'bg-primary-700 text-white' : 'bg-white border border-ink-200 text-ink-700'}`}>
                    Ledger entries
                </button>
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                {tab === 'stock' ? (
                    <table className="w-full text-sm">
                        <thead className="bg-ink-50 text-ink-500 text-xs">
                            <tr>
                                <th className="text-left font-medium px-4 py-3">When</th>
                                <th className="text-left font-medium px-4 py-3">Type</th>
                                <th className="text-left font-medium px-4 py-3">Product</th>
                                <th className="text-left font-medium px-4 py-3">Location</th>
                                <th className="text-right font-medium px-4 py-3">Qty</th>
                                <th className="text-left font-medium px-4 py-3">By</th>
                                <th className="text-left font-medium px-4 py-3">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(rows as Paginated<StockRow>).data.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-500">No stock movements.</td></tr>
                            )}
                            {(rows as Paginated<StockRow>).data.map((r) => (
                                <tr key={r.id} className="border-t border-ink-200">
                                    <td className="px-4 py-3 text-ink-600 money text-xs">{r.created_at}</td>
                                    <td className="px-4 py-3 text-ink-700">{STOCK_LABEL[r.type] ?? r.type}</td>
                                    <td className="px-4 py-3 text-ink-900">{r.product?.name}<div className="text-xs text-ink-500 ref">{r.product?.sku}</div></td>
                                    <td className="px-4 py-3 text-ink-600 ref">{r.location?.code}</td>
                                    <td className={`px-4 py-3 text-right money font-medium ${r.quantity < 0 ? 'text-danger' : 'text-success'}`}>{r.quantity > 0 ? '+' : ''}{r.quantity}</td>
                                    <td className="px-4 py-3 text-ink-600 text-xs">{r.user?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-ink-500 text-xs">{r.notes ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-ink-50 text-ink-500 text-xs">
                            <tr>
                                <th className="text-left font-medium px-4 py-3">Date</th>
                                <th className="text-left font-medium px-4 py-3">Type</th>
                                <th className="text-left font-medium px-4 py-3">Customer</th>
                                <th className="text-right font-medium px-4 py-3">Debit</th>
                                <th className="text-right font-medium px-4 py-3">Credit</th>
                                <th className="text-right font-medium px-4 py-3">Balance</th>
                                <th className="text-left font-medium px-4 py-3">Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(rows as Paginated<LedgerRow>).data.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-500">No ledger entries.</td></tr>
                            )}
                            {(rows as Paginated<LedgerRow>).data.map((r) => (
                                <tr key={r.id} className="border-t border-ink-200">
                                    <td className="px-4 py-3 text-ink-600 money">{r.entry_date}</td>
                                    <td className="px-4 py-3 text-ink-700">{LEDGER_LABEL[r.type] ?? r.type}</td>
                                    <td className="px-4 py-3 text-ink-900">
                                        <Link href={route('admin.customers.statement', r.customer?.id ?? 0)} className="hover:underline">
                                            <span className="ref text-ink-500 mr-1">{r.customer?.code}</span>{r.customer?.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-right money">
                                        {parseFloat(r.debit) > 0 ? r.debit : <span className="money-muted">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {parseFloat(r.credit) > 0 ? <span className="money-pos">{r.credit}</span> : <span className="money-muted">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right money font-medium text-ink-900">{r.running_balance}</td>
                                    <td className="px-4 py-3 text-ink-500 text-xs">{r.description ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {rows.last_page > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-ink-500">
                    <div>Showing {rows.from}–{rows.to} of {rows.total}</div>
                    <div className="flex gap-1">
                        {rows.links.map((link, i) => (
                            <Link key={i} href={link.url ?? ''}
                                className={`px-3 py-1.5 rounded ${link.active ? 'bg-primary-700 text-white' : link.url ? 'border border-ink-200 hover:bg-ink-50' : 'text-ink-400'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
