import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Customer } from '@/types';

interface Props {
    customer: (Customer & { sales_rep_id?: number | null }) | null;
    next_code: string | null;
    sales_reps: { id: number; name: string }[];
}

export default function CustomerForm({ customer, next_code, sales_reps }: Props) {
    const isEdit = !!customer;
    const hasLogin = !!customer?.user_id;

    const { data, setData, post, put, processing, errors } = useForm({
        code: customer?.code ?? next_code ?? '',
        name: customer?.name ?? '',
        phone: customer?.phone ?? '',
        address: customer?.address ?? '',
        email: customer?.email ?? '',
        sales_rep_id: (customer?.sales_rep_id ?? '') as number | '',
        opening_balance: customer?.opening_balance ?? '0.00',
        credit_limit: customer?.credit_limit ?? '0.00',
        is_active: customer?.is_active ?? true,
        notes: customer?.notes ?? '',
        create_login: hasLogin,
        password: '',
    });

    const [showPwd, setShowPwd] = useState(false);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.customers.update', customer!.id));
        } else {
            post(route('admin.customers.store'));
        }
    };

    return (
        <AdminLayout
            title={isEdit ? `Edit customer — ${customer!.name}` : 'New customer'}
            actions={
                isEdit ? (
                    <Link
                        href={route('admin.customers.statement', customer!.id)}
                        className="bg-primary-50 hover:bg-primary-100 text-primary-800 px-4 py-2 rounded text-sm font-medium"
                    >
                        View statement
                    </Link>
                ) : undefined
            }
        >
            <Head title={isEdit ? 'Edit customer' : 'New customer'} />

            <form onSubmit={submit} className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <Section title="Basics">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Code" error={errors.code} helper="Auto-generated. You can override.">
                                <input
                                    type="text"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                    className="input-mono input"
                                />
                            </Field>
                            <Field label="Name" error={errors.name}>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="input"
                                    autoFocus
                                />
                            </Field>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <Field label="Phone" error={errors.phone}>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className="input"
                                />
                            </Field>
                            <Field label="Email" error={errors.email} helper="Required for customer login.">
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="input"
                                />
                            </Field>
                        </div>

                        <div className="mt-4">
                            <Field label="Address" error={errors.address}>
                                <input
                                    type="text"
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    className="input"
                                />
                            </Field>
                        </div>

                        <div className="mt-4">
                            <Field label="Notes" error={errors.notes}>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                    className="input h-auto py-2"
                                />
                            </Field>
                        </div>
                        <div className="mt-4">
                            <Field label="Assigned sales rep" error={errors.sales_rep_id} helper="Bills for this customer will count toward this rep's commission.">
                                <select
                                    value={data.sales_rep_id}
                                    onChange={(e) => setData('sales_rep_id', e.target.value ? Number(e.target.value) : '')}
                                    className="input"
                                >
                                    <option value="">— None —</option>
                                    {sales_reps.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </Section>

                    <Section title="Financials">
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Opening balance"
                                error={errors.opening_balance}
                                helper="What the customer owed when first added. Positive = customer owes you."
                            >
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.opening_balance}
                                    onChange={(e) => setData('opening_balance', e.target.value)}
                                    className="input money text-right"
                                />
                            </Field>
                            <Field
                                label="Credit limit"
                                error={errors.credit_limit}
                                helper="Maximum allowed balance. 0 means no limit."
                            >
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.credit_limit}
                                    onChange={(e) => setData('credit_limit', e.target.value)}
                                    className="input money text-right"
                                />
                            </Field>
                        </div>
                        {isEdit && (
                            <div className="mt-4 bg-ink-50 rounded p-3 text-sm">
                                <span className="text-ink-500">Current balance:</span>{' '}
                                <span
                                    className={`money font-medium ${
                                        parseFloat(customer!.current_balance) > 0
                                            ? 'text-danger'
                                            : parseFloat(customer!.current_balance) < 0
                                              ? 'text-success'
                                              : 'text-ink-700'
                                    }`}
                                >
                                    {customer!.current_balance}
                                </span>
                            </div>
                        )}
                    </Section>
                </div>

                <div className="space-y-6">
                    <Section title="Customer login">
                        <label className="flex items-center gap-2 text-sm text-ink-700">
                            <input
                                type="checkbox"
                                checked={data.create_login}
                                onChange={(e) => setData('create_login', e.target.checked)}
                                className="rounded border-ink-300 text-primary-700 focus:ring-primary-500"
                            />
                            Allow this customer to log in
                        </label>

                        {data.create_login && (
                            <div className="mt-4 space-y-3">
                                {!data.email && (
                                    <p className="text-xs text-warning">Set an email above first.</p>
                                )}
                                <Field
                                    label={hasLogin ? 'New password' : 'Password'}
                                    error={errors.password}
                                    helper={hasLogin ? 'Leave blank to keep existing.' : 'Minimum 8 characters.'}
                                >
                                    <div className="relative">
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="input pr-16"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPwd((v) => !v)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-500 hover:text-ink-900 px-2"
                                        >
                                            {showPwd ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
                                </Field>
                                {hasLogin && (
                                    <p className="text-xs text-ink-500">
                                        Login enabled as <span className="ref">{customer?.user?.email}</span>
                                    </p>
                                )}
                            </div>
                        )}
                    </Section>

                    <Section title="Status">
                        <label className="flex items-center gap-2 text-sm text-ink-700">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="rounded border-ink-300 text-primary-700 focus:ring-primary-500"
                            />
                            Active
                        </label>
                    </Section>

                    <div className="bg-white border border-ink-200 rounded-lg p-4 flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 flex-1"
                        >
                            {isEdit ? 'Save changes' : 'Create customer'}
                        </button>
                        <Link href={route('admin.customers.index')} className="text-ink-600 hover:text-ink-900 px-3 py-2 text-sm">
                            Cancel
                        </Link>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-ink-200 rounded-lg">
            <div className="px-5 py-3 border-b border-ink-200">
                <h2 className="text-md font-medium text-ink-900">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function Field({
    label,
    children,
    error,
    helper,
}: {
    label: string;
    children: React.ReactNode;
    error?: string;
    helper?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">{label}</label>
            {children}
            {helper && !error && <p className="text-xs text-ink-500 mt-1">{helper}</p>}
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
}
