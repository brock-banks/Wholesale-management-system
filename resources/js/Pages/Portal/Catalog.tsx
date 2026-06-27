import CustomerLayout from '@/Layouts/CustomerLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ChangeEvent, useState } from 'react';
import { Paginated, Product } from '@/types';

interface Props {
    products: Paginated<Product>;
    categories: { id: number; name: string }[];
    filters: { search: string | null; category_id: number | null };
}

export default function Catalog({ products, categories, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [categoryId, setCategoryId] = useState<number | ''>(filters.category_id ?? '');

    const apply = (next: { search?: string; category_id?: number | '' }) =>
        router.get(
            route('portal.catalog'),
            {
                search: next.search ?? search,
                category_id: (next.category_id ?? categoryId) || undefined,
            },
            { preserveState: true, replace: true },
        );

    const addToCart = (productId: number) => {
        router.post(route('portal.cart.add'), { product_id: productId, quantity: 1 }, { preserveScroll: true });
    };

    return (
        <CustomerLayout title="Catalog">
            <Head title="Catalog" />

            <div className="flex gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search products…"
                    value={search}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && apply({ search })}
                    className="input flex-1"
                />
                <select
                    value={categoryId}
                    onChange={(e) => {
                        const v = e.target.value ? Number(e.target.value) : '';
                        setCategoryId(v);
                        apply({ category_id: v });
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

            <div className="grid grid-cols-4 gap-3">
                {products.data.length === 0 && (
                    <p className="col-span-4 text-center text-ink-500 py-12">No products match.</p>
                )}
                {products.data.map((p) => (
                    <div key={p.id} className="bg-white border border-ink-200 rounded-lg p-3 flex flex-col">
                        <div className="aspect-square bg-ink-100 rounded mb-2 overflow-hidden flex items-center justify-center">
                            {p.photos && p.photos[0] ? (
                                <img src={p.photos[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-ink-400 text-xs">No image</span>
                            )}
                        </div>
                        <p className="text-sm text-ink-900 line-clamp-2 min-h-[2.6em]">{p.name}</p>
                        <p className="text-xs text-ink-500 ref mt-0.5">{p.sku}</p>
                        <p className="text-xs text-ink-500 mt-0.5">{p.category?.name}</p>
                        <p className="text-base font-medium money text-ink-900 mt-1.5">{p.wholesale_price}</p>
                        <button
                            onClick={() => addToCart(p.id)}
                            className="mt-2 bg-primary-700 hover:bg-primary-800 text-white px-3 py-1.5 rounded text-sm font-medium"
                        >
                            Add to cart
                        </button>
                    </div>
                ))}
            </div>

            {products.last_page > 1 && (
                <div className="flex justify-center gap-1 mt-6">
                    {products.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? ''}
                            className={`px-3 py-1.5 rounded text-sm ${
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
            )}
        </CustomerLayout>
    );
}
