import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

interface CustomerOpt {
    id: number;
    code: string;
    name: string;
    phone: string | null;
    current_balance: string;
    credit_limit: string;
}
interface LocationOpt {
    id: number;
    code: string;
    name: string;
    is_default: boolean;
}
interface ProductOpt {
    id: number;
    sku: string;
    name: string;
    unit: string;
    pack_size: number;
    wholesale_price: string;
    tax_rate: string;
    available: number;
}
interface LineItem {
    product_id: number;
    product_name: string;
    product_sku: string;
    unit: string;
    available: number;
    unit_price: number;
    quantity: number;
    discount_amount: number;
    tax_rate: number;
}
interface PaymentRow {
    method: 'cash' | 'card' | 'check' | 'bank' | 'debit';
    amount: number;
    reference: string;
    bank_name: string;
    check_number: string;
    check_date: string;
    due_date: string;
    notes: string;
}

const METHOD_LABEL: Record<PaymentRow['method'], string> = {
    cash: 'Cash',
    card: 'Card',
    check: 'Check',
    bank: 'Bank',
    debit: 'On account',
};

interface FromOrder {
    id: number;
    order_number: string;
    customer_id: number;
    items: LineItem[];
    notes: string | null;
}

interface FromBill {
    id: number;
    invoice_number: string;
    customer_id: number;
    items: LineItem[];
    notes: string | null;
}

export default function BillsCreate({
    customers,
    locations,
    products,
    selected_location_id,
    from_order,
    from_bill,
}: {
    customers: CustomerOpt[];
    locations: LocationOpt[];
    products: ProductOpt[];
    selected_location_id: number | null;
    from_order: FromOrder | null;
    from_bill: FromBill | null;
}) {
    const today = new Date().toISOString().slice(0, 10);
    const seed = from_order ?? from_bill;

    const { data, setData, post, processing, errors } = useForm({
        customer_id: (seed?.customer_id ?? '') as number | '',
        location_id: selected_location_id ?? (locations[0]?.id || 0),
        bill_date: today,
        discount_amount: 0,
        notes: seed?.notes ?? '',
        from_order_id: (from_order?.id ?? '') as number | '',
        items: (seed?.items ?? []) as LineItem[],
        payments: [] as PaymentRow[],
    });

    const [productSearch, setProductSearch] = useState('');

    const customer = customers.find((c) => c.id === data.customer_id) || null;

    const filteredProducts = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        if (!q) return products.slice(0, 20);
        return products
            .filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.sku.toLowerCase().includes(q),
            )
            .slice(0, 20);
    }, [productSearch, products]);

    const lineSubtotal = (l: LineItem) =>
        Math.max(0, l.unit_price * l.quantity - l.discount_amount);
    const lineTax = (l: LineItem) => Math.round((lineSubtotal(l) * l.tax_rate) / 100 * 100) / 100;
    const lineTotal = (l: LineItem) => lineSubtotal(l) + lineTax(l);

    const subtotal = data.items.reduce((s, l) => s + lineSubtotal(l), 0);
    const taxTotal = data.items.reduce((s, l) => s + lineTax(l), 0);
    const grandTotal = Math.max(0, subtotal - (Number(data.discount_amount) || 0) + taxTotal);
    const paidAmount = data.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const balanceDue = Math.max(0, grandTotal - paidAmount);

    const newBalance =
        customer ? parseFloat(customer.current_balance) + balanceDue : 0;
    const limit = customer ? parseFloat(customer.credit_limit) : 0;
    const overLimit = customer && limit > 0 && newBalance > limit;

    const addProduct = (p: ProductOpt) => {
        const idx = data.items.findIndex((l) => l.product_id === p.id);
        if (idx >= 0) {
            updateLine(idx, 'quantity', data.items[idx].quantity + 1);
            return;
        }
        setData('items', [
            ...data.items,
            {
                product_id: p.id,
                product_name: p.name,
                product_sku: p.sku,
                unit: p.unit,
                available: p.available,
                unit_price: parseFloat(p.wholesale_price),
                quantity: 1,
                discount_amount: 0,
                tax_rate: parseFloat(p.tax_rate),
            },
        ]);
    };

    const updateLine = (idx: number, key: keyof LineItem, value: number) => {
        setData(
            'items',
            data.items.map((l, i) => (i === idx ? { ...l, [key]: value } : l)),
        );
    };

    const removeLine = (idx: number) => {
        setData('items', data.items.filter((_, i) => i !== idx));
    };

    const addPayment = (method: PaymentRow['method']) => {
        setData('payments', [
            ...data.payments,
            {
                method,
                amount: balanceDue || grandTotal,
                reference: '',
                bank_name: '',
                check_number: '',
                check_date: today,
                due_date: '',
                notes: '',
            },
        ]);
    };

    const updatePayment = (idx: number, key: keyof PaymentRow, value: string | number) => {
        setData(
            'payments',
            data.payments.map((p, i) => (i === idx ? { ...p, [key]: value } : p)),
        );
    };

    const removePayment = (idx: number) => {
        setData('payments', data.payments.filter((_, i) => i !== idx));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.bills.store'));
    };

    const fmt = (n: number) =>
        n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <AdminLayout title={from_order ? `New bill from ${from_order.order_number}` : from_bill ? `Duplicate of ${from_bill.invoice_number}` : 'New bill (POS)'}>
            <Head title="New bill" />

            <form onSubmit={submit} className="grid grid-cols-3 gap-6">
                {/* LEFT 2/3 — customer + products + items */}
                <div className="col-span-2 space-y-4">
                    {from_bill && (
                        <div className="bg-primary-50 text-primary-800 rounded p-3 text-sm">
                            Pre-filled from invoice <span className="ref">{from_bill.invoice_number}</span>. Adjust line items and prices, then post a new invoice. The original bill is not modified — cancel it manually if needed.
                        </div>
                    )}
                    {from_order && (
                        <div className="bg-success-bg text-success-text rounded p-3 text-sm">
                            Pre-filled from confirmed order{' '}
                            <span className="ref">{from_order.order_number}</span>. Adjust as needed.
                        </div>
                    )}
                    <Section title="Customer & location">
                        <div className="grid grid-cols-3 gap-4">
                            <Field label="Customer" error={errors.customer_id}>
                                <select
                                    value={data.customer_id}
                                    onChange={(e) =>
                                        setData('customer_id', e.target.value ? Number(e.target.value) : '')
                                    }
                                    className="input"
                                >
                                    <option value="">— Select customer —</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.code} · {c.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Location" error={errors.location_id}>
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
                            </Field>
                            <Field label="Date" error={errors.bill_date}>
                                <input
                                    type="date"
                                    value={data.bill_date}
                                    onChange={(e) => setData('bill_date', e.target.value)}
                                    className="input"
                                />
                            </Field>
                        </div>
                        {customer && (
                            <div className="mt-3 bg-ink-50 rounded p-3 text-sm flex flex-wrap gap-x-6 gap-y-1">
                                <span>
                                    <span className="text-ink-500">Current balance:</span>{' '}
                                    <span className={`money ${parseFloat(customer.current_balance) > 0 ? 'text-danger' : 'text-ink-700'}`}>
                                        {customer.current_balance}
                                    </span>
                                </span>
                                <span>
                                    <span className="text-ink-500">Credit limit:</span>{' '}
                                    <span className="money text-ink-700">
                                        {parseFloat(customer.credit_limit) > 0 ? customer.credit_limit : '—'}
                                    </span>
                                </span>
                                {overLimit && (
                                    <span className="badge badge-overdue">Will exceed credit limit</span>
                                )}
                            </div>
                        )}
                    </Section>

                    <Section title="Add products">
                        <input
                            type="text"
                            placeholder="Search by name or SKU…"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="input mb-3"
                        />
                        <div className="grid grid-cols-2 gap-2 max-h-72 overflow-auto pr-1">
                            {filteredProducts.length === 0 && (
                                <p className="text-sm text-ink-500 col-span-2 py-4 text-center">No products match.</p>
                            )}
                            {filteredProducts.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => addProduct(p)}
                                    disabled={p.available <= 0}
                                    className="text-left bg-white border border-ink-200 rounded p-2 hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="text-sm text-ink-900 truncate">{p.name}</div>
                                    <div className="text-xs text-ink-500 flex items-center justify-between mt-0.5">
                                        <span className="ref">{p.sku}</span>
                                        <span className="money">
                                            {p.wholesale_price} · stock {p.available}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </Section>

                    <Section title={`Line items (${data.items.length})`}>
                        {data.items.length === 0 ? (
                            <p className="text-sm text-ink-500 py-4 text-center">Pick a product above to start.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="text-ink-500 text-xs">
                                    <tr className="border-b border-ink-200">
                                        <th className="text-left font-medium pb-2">Item</th>
                                        <th className="text-right font-medium pb-2 w-24">Unit price</th>
                                        <th className="text-right font-medium pb-2 w-20">Qty</th>
                                        <th className="text-right font-medium pb-2 w-24">Disc.</th>
                                        <th className="text-right font-medium pb-2 w-28">Total</th>
                                        <th className="w-8"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map((l, idx) => (
                                        <tr key={l.product_id} className="border-b border-ink-100">
                                            <td className="py-2">
                                                <div className="text-ink-900">{l.product_name}</div>
                                                <div className="text-xs text-ink-500 ref">
                                                    {l.product_sku} · stock {l.available}
                                                </div>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={l.unit_price}
                                                    onChange={(e) => updateLine(idx, 'unit_price', Number(e.target.value))}
                                                    className="input money text-right h-8"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={l.available}
                                                    value={l.quantity}
                                                    onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value))}
                                                    className="input money text-right h-8"
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min={0}
                                                    value={l.discount_amount}
                                                    onChange={(e) => updateLine(idx, 'discount_amount', Number(e.target.value))}
                                                    className="input money text-right h-8"
                                                />
                                            </td>
                                            <td className="text-right money font-medium pl-2">{fmt(lineTotal(l))}</td>
                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(idx)}
                                                    className="text-ink-400 hover:text-danger"
                                                    title="Remove"
                                                >
                                                    ×
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Section>
                </div>

                {/* RIGHT 1/3 — totals + payments + save */}
                <div className="space-y-4">
                    <Section title="Totals">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="text-ink-500 py-1">Subtotal</td>
                                    <td className="text-right money py-1">{fmt(subtotal)}</td>
                                </tr>
                                <tr>
                                    <td className="text-ink-500 py-1">Discount</td>
                                    <td className="py-1">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            value={data.discount_amount}
                                            onChange={(e) => setData('discount_amount', Number(e.target.value))}
                                            className="input money text-right h-8 w-full"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="text-ink-500 py-1">Tax</td>
                                    <td className="text-right money py-1">{fmt(taxTotal)}</td>
                                </tr>
                                <tr className="border-t border-ink-200">
                                    <td className="text-ink-900 font-medium pt-2">Grand total</td>
                                    <td className="text-right money font-medium pt-2 text-base">{fmt(grandTotal)}</td>
                                </tr>
                                <tr>
                                    <td className="text-ink-500 py-1">Paid</td>
                                    <td className="text-right money-pos py-1">{fmt(paidAmount)}</td>
                                </tr>
                                <tr>
                                    <td className="text-ink-900 font-medium py-1">Balance due</td>
                                    <td className={`text-right money font-medium py-1 ${balanceDue > 0 ? 'text-danger' : 'text-success'}`}>
                                        {fmt(balanceDue)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </Section>

                    <Section title="Payments">
                        <div className="space-y-3">
                            {data.payments.map((p, idx) => (
                                <div key={idx} className="bg-ink-50 rounded p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-ink-700">{METHOD_LABEL[p.method]}</span>
                                        <button type="button" onClick={() => removePayment(idx)} className="text-xs text-ink-400 hover:text-danger">
                                            Remove
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={p.amount}
                                        onChange={(e) => updatePayment(idx, 'amount', Number(e.target.value))}
                                        className="input money text-right h-8"
                                        placeholder="Amount"
                                    />
                                    {p.method === 'check' && (
                                        <>
                                            <input
                                                type="text"
                                                value={p.check_number}
                                                onChange={(e) => updatePayment(idx, 'check_number', e.target.value)}
                                                className="input h-8"
                                                placeholder="Check #"
                                            />
                                            <input
                                                type="text"
                                                value={p.bank_name}
                                                onChange={(e) => updatePayment(idx, 'bank_name', e.target.value)}
                                                className="input h-8"
                                                placeholder="Bank name"
                                            />
                                            <input
                                                type="date"
                                                value={p.check_date}
                                                onChange={(e) => updatePayment(idx, 'check_date', e.target.value)}
                                                className="input h-8"
                                            />
                                        </>
                                    )}
                                    {(p.method === 'card' || p.method === 'bank') && (
                                        <input
                                            type="text"
                                            value={p.reference}
                                            onChange={(e) => updatePayment(idx, 'reference', e.target.value)}
                                            className="input h-8"
                                            placeholder="Transaction reference"
                                        />
                                    )}
                                    {p.method === 'debit' && (
                                        <input
                                            type="date"
                                            value={p.due_date}
                                            onChange={(e) => updatePayment(idx, 'due_date', e.target.value)}
                                            className="input h-8"
                                            placeholder="Due date"
                                        />
                                    )}
                                </div>
                            ))}
                            <div className="flex flex-wrap gap-1">
                                {(['cash', 'card', 'check', 'bank', 'debit'] as const).map((m) => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => addPayment(m)}
                                        className="bg-primary-50 hover:bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-1.5 rounded"
                                    >
                                        + {METHOD_LABEL[m]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Section>

                    <Section title="Notes">
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={2}
                            className="input h-auto py-2"
                            placeholder="Optional notes for this bill"
                        />
                    </Section>

                    <button
                        type="submit"
                        disabled={processing || data.items.length === 0 || !data.customer_id}
                        className="w-full bg-primary-700 hover:bg-primary-800 text-white px-4 py-3 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Saving…' : `Post bill — ${fmt(grandTotal)}`}
                    </button>

                    {Object.keys(errors).length > 0 && (
                        <div className="bg-danger-bg text-danger-text rounded p-3 text-xs">
                            {Object.entries(errors).map(([k, v]) => (
                                <div key={k}>
                                    <span className="ref">{k}</span>: {v as string}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </form>
        </AdminLayout>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-ink-200 rounded-lg">
            <div className="px-4 py-2.5 border-b border-ink-200">
                <h2 className="text-sm font-medium text-ink-900">{title}</h2>
            </div>
            <div className="p-4">{children}</div>
        </div>
    );
}

function Field({
    label,
    children,
    error,
}: {
    label: string;
    children: React.ReactNode;
    error?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">{label}</label>
            {children}
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
}
