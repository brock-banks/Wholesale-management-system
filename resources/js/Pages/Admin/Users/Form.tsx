import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface UserData {
    id: number;
    name: string;
    email: string;
    role: string | null;
    commission_rate?: number;
    phone?: string | null;
}

const ROLE_DESC: Record<string, string> = {
    admin: 'Full access to everything.',
    staff: 'POS billing, payments, returns, customer & order management. No product / settings access.',
    accounts: 'Read-only on bills + customers, can record payments, view reports + audit. No billing.',
    sales_rep: 'Mobile order-taking for assigned customers. Earns commission on posted bills.',
};

export default function UserForm({ user, roles }: { user: UserData | null; roles: string[] }) {
    const isEdit = !!user;
    const { data, setData, post, patch, processing, errors } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        password: '',
        role: user?.role ?? 'staff',
        commission_rate: user?.commission_rate ?? 0,
    });
    const [showPwd, setShowPwd] = useState(false);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) patch(route('admin.users.update', user!.id));
        else post(route('admin.users.store'));
    };

    return (
        <AdminLayout title={isEdit ? `Edit user — ${user!.name}` : 'New user'}>
            <Head title={isEdit ? 'Edit user' : 'New user'} />

            <form onSubmit={submit} className="bg-white border border-ink-200 rounded-lg p-6 max-w-xl">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="Name" error={errors.name}>
                        <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="input" autoFocus />
                    </Field>
                    <Field label="Email" error={errors.email}>
                        <input type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} className="input" />
                    </Field>
                </div>

                <Field
                    label={isEdit ? 'New password' : 'Password'}
                    error={errors.password}
                    helper={isEdit ? 'Leave blank to keep existing.' : 'Minimum 8 characters.'}
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

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <Field label="Role" error={errors.role}>
                        <select value={data.role} onChange={(e) => setData('role', e.target.value)} className="input">
                            {roles.map((r) => (
                                <option key={r} value={r}>{r.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                            ))}
                        </select>
                    </Field>
                    <Field label="Phone" error={errors.phone}>
                        <input value={data.phone} onChange={(e) => setData('phone', e.target.value)} className="input mono" placeholder="0300 1234567" />
                    </Field>
                </div>
                <p className="text-xs text-ink-500 mt-2">{ROLE_DESC[data.role]}</p>

                {data.role === 'sales_rep' && (
                    <div className="mt-4">
                        <Field label="Commission rate %" error={errors.commission_rate} helper="Applied to invoice subtotal (after line discount, before tax).">
                            <input
                                type="number"
                                step="0.01"
                                min={0}
                                max={100}
                                value={data.commission_rate}
                                onChange={(e) => setData('commission_rate', parseFloat(e.target.value) || 0)}
                                className="input money text-right w-40"
                            />
                        </Field>
                    </div>
                )}

                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-ink-200">
                    <button type="submit" disabled={processing} className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50">
                        {isEdit ? 'Save changes' : 'Create user'}
                    </button>
                    <Link href={route('admin.users.index')} className="text-ink-600 hover:text-ink-900 px-3 py-2 text-sm">Cancel</Link>
                </div>
            </form>
        </AdminLayout>
    );
}

function Field({ label, children, error, helper }: { label: string; children: React.ReactNode; error?: string; helper?: string }) {
    return (
        <div>
            <label className="block text-xs font-medium text-ink-700 mb-1.5">{label}</label>
            {children}
            {helper && !error && <p className="text-xs text-ink-500 mt-1">{helper}</p>}
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
}
