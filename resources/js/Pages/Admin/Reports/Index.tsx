import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    filters: { from: string; to: string };
    summary: { sales_total: number; bills_count: number; payments_total: number; receivables_total: number; open_orders: number };
    sales_by_day: { date: string; total: number; count: number }[];
    aging: { current: number; '1_30': number; '31_60': number; '61_90': number; '90_plus': number };
    top_customers: { id: number; code: string; name: string; total: number; bills_count: number }[];
    top_products: { product_id: number; name: string; sku: string; qty: number; revenue: number }[];
    collection_today: { method: string; total: number; count: number }[];
    stock_alerts: { id: number; sku: string; name: string; unit: string; stock: number; reorder_level: number }[];
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const METHOD_LABEL: Record<string, string> = { cash: 'Cash', card: 'Card', check: 'Check', bank: 'Bank', debit: 'On account' };

export default function Reports({ filters, summary, sales_by_day, aging, top_customers, top_products, collection_today, stock_alerts }: Props) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const apply = () => router.get(route('admin.reports'), { from, to }, { preserveState: true });

    const maxSales = Math.max(0, ...sales_by_day.map((d) => d.total));
    const agingTotal = aging.current + aging['1_30'] + aging['31_60'] + aging['61_90'] + aging['90_plus'];

    return (
        <AdminLayout title="Reports">
            <Head title="Reports" />

            <div className="bg-white border border-ink-200 rounded-lg p-4 mb-4 flex flex-wrap items-end gap-3">
                <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1.5">From</label>
                    <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input w-44" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1.5">To</label>
                    <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input w-44" />
                </div>
                <button onClick={apply} className="bg-primary-700 hover:bg-primary-800 text-white px-4 h-[38px] rounded text-sm font-medium">Apply</button>
                <Link
                    href={route('admin.reports.commissions')}
                    className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 h-[38px] rounded text-sm font-medium inline-flex items-center"
                >
                    Commissions report →
                </Link>
            </div>

            <div className="grid grid-cols-5 gap-3 mb-6">
                <Tile label="Sales (period)" value={fmt(summary.sales_total)} tone="ink" />
                <Tile label="Bills" value={String(summary.bills_count)} tone="ink" />
                <Tile label="Payments (period)" value={fmt(summary.payments_total)} tone="success" />
                <Tile label="Total receivables" value={fmt(summary.receivables_total)} tone="danger" />
                <Tile label="Open orders" value={String(summary.open_orders)} tone="ink" />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
                <Section title="Sales by day">
                    {sales_by_day.length === 0 ? (
                        <p className="text-sm text-ink-500 py-4">No sales in this period.</p>
                    ) : (
                        <div className="space-y-1">
                            {sales_by_day.map((d) => (
                                <div key={d.date} className="flex items-center gap-3 text-sm">
                                    <span className="w-24 text-ink-600 money text-xs">{d.date}</span>
                                    <div className="flex-1 bg-ink-100 rounded h-5 relative">
                                        <div className="bg-primary-700 h-5 rounded" style={{ width: `${maxSales > 0 ? (d.total / maxSales) * 100 : 0}%` }} />
                                    </div>
                                    <span className="w-24 text-right money font-medium text-ink-900">{fmt(d.total)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                <Section title="Receivables aging">
                    <table className="w-full text-sm">
                        <tbody>
                            {[
                                ['Current', aging.current, 'bg-success'],
                                ['1–30 days', aging['1_30'], 'bg-primary-500'],
                                ['31–60 days', aging['31_60'], 'bg-warning'],
                                ['61–90 days', aging['61_90'], 'bg-warning'],
                                ['90+ days', aging['90_plus'], 'bg-danger'],
                            ].map(([label, value, color]) => {
                                const pct = agingTotal > 0 ? ((value as number) / agingTotal) * 100 : 0;
                                return (
                                    <tr key={label as string}>
                                        <td className="py-1.5 text-ink-700 w-28">{label}</td>
                                        <td className="py-1.5">
                                            <div className="bg-ink-100 rounded h-4 relative">
                                                <div className={`${color} h-4 rounded`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </td>
                                        <td className="py-1.5 text-right money w-28 pl-3">{fmt(value as number)}</td>
                                    </tr>
                                );
                            })}
                            <tr className="border-t border-ink-200">
                                <td colSpan={2} className="pt-2 text-ink-900 font-medium">Total</td>
                                <td className="pt-2 text-right money font-medium text-danger">{fmt(agingTotal)}</td>
                            </tr>
                        </tbody>
                    </table>
                </Section>

                <Section title="Top customers (by sales)">
                    {top_customers.length === 0 ? (
                        <p className="text-sm text-ink-500 py-4">No data.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <tbody>
                                {top_customers.map((c) => (
                                    <tr key={c.id} className="border-b border-ink-100 last:border-0">
                                        <td className="py-2"><span className="ref text-ink-500 mr-1">{c.code}</span><Link href={route('admin.customers.statement', c.id)} className="text-ink-900 hover:underline">{c.name}</Link></td>
                                        <td className="py-2 text-right text-xs text-ink-500">{c.bills_count} bills</td>
                                        <td className="py-2 text-right money font-medium pl-3">{fmt(c.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Section>

                <Section title="Top products (by quantity)">
                    {top_products.length === 0 ? (
                        <p className="text-sm text-ink-500 py-4">No data.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <tbody>
                                {top_products.map((p) => (
                                    <tr key={p.product_id} className="border-b border-ink-100 last:border-0">
                                        <td className="py-2">
                                            <div className="text-ink-900">{p.name}</div>
                                            <div className="text-xs text-ink-500 ref">{p.sku}</div>
                                        </td>
                                        <td className="py-2 text-right money">{p.qty}</td>
                                        <td className="py-2 text-right money font-medium pl-3">{fmt(p.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Section>

                <Section title="Today's collection by method">
                    {collection_today.length === 0 ? (
                        <p className="text-sm text-ink-500 py-4">No payments today.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <tbody>
                                {collection_today.map((c) => (
                                    <tr key={c.method} className="border-b border-ink-100 last:border-0">
                                        <td className="py-2 text-ink-700">{METHOD_LABEL[c.method] ?? c.method}</td>
                                        <td className="py-2 text-right text-xs text-ink-500">{c.count} payments</td>
                                        <td className="py-2 text-right money-pos font-medium pl-3">{fmt(c.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Section>

                <Section title="Stock alerts (low / out)">
                    {stock_alerts.length === 0 ? (
                        <p className="text-sm text-ink-500 py-4">All stocked above reorder levels.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <tbody>
                                {stock_alerts.map((s) => (
                                    <tr key={s.id} className="border-b border-ink-100 last:border-0">
                                        <td className="py-2">
                                            <div className="text-ink-900">{s.name}</div>
                                            <div className="text-xs text-ink-500 ref">{s.sku}</div>
                                        </td>
                                        <td className="py-2 text-right money text-ink-500 text-xs">≥{s.reorder_level}</td>
                                        <td className={`py-2 text-right money font-medium pl-3 ${s.stock <= 0 ? 'text-danger' : 'text-warning'}`}>
                                            {s.stock} {s.unit}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Section>
            </div>
        </AdminLayout>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-ink-200 rounded-lg">
            <div className="px-4 py-2.5 border-b border-ink-200"><h2 className="text-sm font-medium text-ink-900">{title}</h2></div>
            <div className="p-4">{children}</div>
        </div>
    );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: 'ink' | 'danger' | 'success' }) {
    const color = tone === 'danger' ? 'text-danger' : tone === 'success' ? 'text-success' : 'text-ink-900';
    return (
        <div className="bg-ink-100 rounded p-4">
            <p className="text-xs text-ink-500">{label}</p>
            <p className={`text-lg font-medium mt-1.5 money ${color}`}>{value}</p>
        </div>
    );
}
