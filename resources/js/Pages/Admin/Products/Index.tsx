import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ChangeEvent, useState } from 'react';
import { Category, Paginated, Product } from '@/types';
import { useConfirm } from '@/hooks/useConfirm';

interface Props {
    products: Paginated<Product>;
    categories: { id: number; name: string }[];
    filters: { search: string | null; category_id: number | null };
}

export default function ProductsIndex({ products, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [categoryId, setCategoryId] = useState<number | ''>(filters.category_id ?? '');

    const applyFilters = (next: { search?: string; category_id?: number | '' }) => {
        router.get(
            route('admin.products.index'),
            {
                search: next.search ?? search,
                category_id: (next.category_id ?? categoryId) || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const { confirm, dialog } = useConfirm();
    const handleDelete = (p: Product) => {
        confirm({
            title: 'Delete product?',
            message: <>This will remove <b>{p.name}</b>. Existing bill items referencing this product will keep their historical data.</>,
            confirmLabel: 'Delete',
            onConfirm: () => router.delete(route('admin.products.destroy', p.id)),
        });
    };

    const onSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const onSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') applyFilters({ search });
    };

    const stockBadge = (p: Product) => {
        const qty = p.total_stock ?? 0;
        if (qty <= 0) return <span className="badge badge-out-of-stock">Out of stock</span>;
        if (qty <= p.reorder_level) return <span className="badge badge-low-stock">Low stock</span>;
        return <span className="badge badge-in-stock">In stock</span>;
    };

    return (
        <AdminLayout
            title="Products"
            actions={
                <Link
                    href={route('admin.products.create')}
                    className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded text-sm font-medium"
                >
                    New product
                </Link>
            }
        >
            <Head title="Products" />
            {dialog}

            <div className="flex gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search name, SKU, barcode…"
                    value={search}
                    onChange={onSearchChange}
                    onKeyDown={onSearchSubmit}
                    className="input flex-1"
                />
                <select
                    value={categoryId}
                    onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : '';
                        setCategoryId(v);
                        applyFilters({ category_id: v });
                    }}
                    className="input w-56"
                >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="bg-white border border-ink-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-ink-50 text-ink-500 text-xs">
                        <tr>
                            <th className="text-left font-medium px-4 py-3">Product</th>
                            <th className="text-left font-medium px-4 py-3">SKU</th>
                            <th className="text-left font-medium px-4 py-3">Category</th>
                            <th className="text-right font-medium px-4 py-3">Wholesale</th>
                            <th className="text-right font-medium px-4 py-3">Stock</th>
                            <th className="font-medium px-4 py-3">Status</th>
                            <th className="font-medium px-4 py-3 w-32"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.data.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-ink-500">
                                    No products match these filters.
                                </td>
                            </tr>
                        )}
                        {products.data.map((p) => (
                            <tr key={p.id} className="border-t border-ink-200">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {p.photos && p.photos[0] ? (
                                            <img
                                                src={p.photos[0].url}
                                                alt=""
                                                className="w-9 h-9 object-cover rounded border border-ink-200"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded bg-ink-100 flex items-center justify-center text-ink-400 text-xs">—</div>
                                        )}
                                        <div>
                                            <div className="text-ink-900">{p.name}</div>
                                            <div className="text-xs text-ink-500">
                                                {p.unit} · pack of {p.pack_size}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 ref">{p.sku}</td>
                                <td className="px-4 py-3 text-ink-600">{p.category?.name || '—'}</td>
                                <td className="px-4 py-3 text-right money text-ink-900">{p.wholesale_price}</td>
                                <td className="px-4 py-3 text-right money">{p.total_stock ?? 0}</td>
                                <td className="px-4 py-3 text-center">{stockBadge(p)}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={route('admin.products.edit', p.id)}
                                        className="text-primary-700 hover:underline mr-3"
                                    >
                                        Edit
                                    </Link>
                                    <button onClick={() => handleDelete(p)} className="text-danger hover:underline">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {products.last_page > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-ink-500">
                    <div>
                        Showing {products.from}–{products.to} of {products.total}
                    </div>
                    <div className="flex gap-1">
                        {products.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? ''}
                                className={`px-3 py-1.5 rounded ${
                                    link.active
                                        ? 'bg-primary-700 text-white'
                                        : link.url
                                          ? 'border border-ink-200 hover:bg-ink-50'
                                          : 'text-ink-400'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
