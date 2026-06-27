import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Category } from '@/types';
import { useConfirm } from '@/hooks/useConfirm';

interface Row {
    id: number;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    parent?: { id: number; name: string } | null;
}

export default function CategoriesIndex({ categories }: { categories: Row[] }) {
    const { confirm, dialog } = useConfirm();
    const handleDelete = (c: Row) => {
        confirm({
            title: 'Delete category?',
            message: <>This will remove <b>{c.name}</b>. Products in this category will become uncategorized.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('admin.categories.destroy', c.id)),
        });
    };

    return (
        <AdminLayout
            title="Categories"
            actions={
                <Link
                    href={route('admin.categories.create')}
                    className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    New category
                </Link>
            }
        >
            <Head title="Categories" />
            {dialog}

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Name</th>
                            <th className="text-left font-medium px-4 py-3">Slug</th>
                            <th className="text-left font-medium px-4 py-3">Parent</th>
                            <th className="text-right font-medium px-4 py-3">Sort</th>
                            <th className="font-medium px-4 py-3">Status</th>
                            <th className="font-medium px-4 py-3 w-32"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-ink-500">
                                    No categories yet.{' '}
                                    <Link href={route('admin.categories.create')} className="text-primary-700 hover:underline">
                                        Add the first one
                                    </Link>
                                    .
                                </td>
                            </tr>
                        )}
                        {categories.map((c) => (
                            <tr key={c.id} className="border-t border-ink-200">
                                <td className="px-4 py-3 text-ink-900">{c.name}</td>
                                <td className="px-4 py-3 text-ink-600 ref">{c.slug}</td>
                                <td className="px-4 py-3 text-ink-600">{c.parent?.name || '—'}</td>
                                <td className="px-4 py-3 text-right money">{c.sort_order}</td>
                                <td className="px-4 py-3 text-center">
                                    {c.is_active ? (
                                        <span className="badge badge-paid">Active</span>
                                    ) : (
                                        <span className="badge badge-draft">Inactive</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={route('admin.categories.edit', c.id)}
                                        className="text-primary-700 hover:underline mr-3"
                                    >
                                        Edit
                                    </Link>
                                    <button onClick={() => handleDelete(c)} className="text-danger hover:underline">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
