import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Category } from '@/types';

interface Props {
    category: Category | null;
    parents: { id: number; name: string }[];
}

export default function CategoryForm({ category, parents }: Props) {
    const isEdit = !!category;
    const { data, setData, post, put, processing, errors } = useForm({
        parent_id: category?.parent_id ?? '',
        name: category?.name ?? '',
        slug: category?.slug ?? '',
        sort_order: category?.sort_order ?? 0,
        is_active: category?.is_active ?? true,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(route('admin.categories.update', category!.id));
        } else {
            post(route('admin.categories.store'));
        }
    };

    return (
        <AdminLayout title={isEdit ? `Edit category — ${category!.name}` : 'New category'}>
            <Head title={isEdit ? 'Edit category' : 'New category'} />

            <form onSubmit={submit} className="bg-white border border-ink-200 rounded-lg p-6 max-w-2xl">
                <Field label="Name" error={errors.name}>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="input"
                        autoFocus
                    />
                </Field>

                <div className="mt-4 grid grid-cols-2 gap-4">
                    <Field label="Slug" error={errors.slug} helper="Leave empty to auto-generate.">
                        <input
                            type="text"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            className="input"
                        />
                    </Field>
                    <Field label="Sort order" error={errors.sort_order}>
                        <input
                            type="number"
                            value={data.sort_order}
                            onChange={(e) => setData('sort_order', Number(e.target.value))}
                            className="input"
                        />
                    </Field>
                </div>

                <div className="mt-4">
                    <Field label="Parent category" error={errors.parent_id} helper="Leave empty for a top-level category.">
                        <select
                            value={data.parent_id ?? ''}
                            onChange={(e) => setData('parent_id', e.target.value ? Number(e.target.value) : '')}
                            className="input"
                        >
                            <option value="">— Top level —</option>
                            {parents.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                </div>

                <div className="mt-6">
                    <label className="flex items-center gap-2 text-sm text-ink-700">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="rounded border-ink-300 text-primary-700 focus:ring-primary-500"
                        />
                        Active
                    </label>
                </div>

                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-ink-200">
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                    >
                        {isEdit ? 'Save changes' : 'Create category'}
                    </button>
                    <Link href={route('admin.categories.index')} className="text-ink-600 hover:text-ink-900 px-3 py-2 text-sm">
                        Cancel
                    </Link>
                </div>
            </form>
        </AdminLayout>
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
