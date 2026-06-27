import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useMemo } from 'react';
import { PageProps, Product } from '@/types';
import { useConfirm } from '@/hooks/useConfirm';

interface Props {
    product: Product | null;
    categories: { id: number; name: string }[];
    locations: { id: number; code: string; name: string }[];
}

interface StockRow {
    location_id: number;
    quantity: number;
}

export default function ProductForm({ product, categories, locations }: Props) {
    const isEdit = !!product;
    const { settings } = usePage<PageProps<{ settings?: { default_tax_rate?: number } }>>().props;
    const defaultTaxRate = settings?.default_tax_rate ?? 0;

    const initialStocks = useMemo<StockRow[]>(() => {
        const existing = new Map((product?.stocks ?? []).map((s) => [s.location_id, s.quantity]));
        return locations.map((l) => ({
            location_id: l.id,
            quantity: existing.get(l.id) ?? 0,
        }));
    }, [locations, product]);

    const { data, setData, post, processing, errors, progress } = useForm<{
        sku: string;
        barcode: string;
        category_id: string | number;
        name: string;
        description: string;
        unit: string;
        pack_size: number;
        cost_price: string;
        wholesale_price: string;
        retail_price: string;
        tax_rate: string;
        reorder_level: number;
        is_active: boolean;
        stocks: StockRow[];
        photos: File[];
        _method?: string;
    }>({
        sku: product?.sku ?? '',
        barcode: product?.barcode ?? '',
        category_id: product?.category_id ?? '',
        name: product?.name ?? '',
        description: product?.description ?? '',
        unit: product?.unit ?? 'pcs',
        pack_size: product?.pack_size ?? 1,
        cost_price: product?.cost_price ?? '0.00',
        wholesale_price: product?.wholesale_price ?? '0.00',
        retail_price: product?.retail_price ?? '0.00',
        tax_rate: product?.tax_rate ?? defaultTaxRate.toFixed(2),
        reorder_level: product?.reorder_level ?? 0,
        is_active: product?.is_active ?? true,
        stocks: initialStocks,
        photos: [],
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            setData('_method', 'put');
            post(route('admin.products.update', product!.id), { forceFormData: true });
        } else {
            post(route('admin.products.store'), { forceFormData: true });
        }
    };

    const setStockQty = (locationId: number, qty: number) => {
        setData(
            'stocks',
            data.stocks.map((s) => (s.location_id === locationId ? { ...s, quantity: qty } : s)),
        );
    };

    const { confirm, dialog } = useConfirm();
    const deletePhoto = (photoId: number) => {
        confirm({
            title: 'Delete photo?',
            message: 'The photo will be removed from this product.',
            confirmLabel: 'Delete',
            onConfirm: () =>
                router.delete(route('admin.products.photos.destroy', photoId), {
                    preserveScroll: true,
                }),
        });
    };

    return (
        <AdminLayout title={isEdit ? `Edit product — ${product!.name}` : 'New product'}>
            <Head title={isEdit ? 'Edit product' : 'New product'} />
            {dialog}

            <form onSubmit={submit} className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <Section title="Basics">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="SKU" error={errors.sku}>
                                <input
                                    type="text"
                                    value={data.sku}
                                    onChange={(e) => setData('sku', e.target.value.toUpperCase())}
                                    className="input-mono input"
                                    maxLength={64}
                                    autoFocus
                                />
                            </Field>
                            <Field label="Barcode" error={errors.barcode}>
                                <input
                                    type="text"
                                    value={data.barcode}
                                    onChange={(e) => setData('barcode', e.target.value)}
                                    className="input-mono input"
                                />
                            </Field>
                        </div>

                        <div className="mt-4">
                            <Field label="Name" error={errors.name}>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="input"
                                />
                            </Field>
                        </div>

                        <div className="mt-4">
                            <Field label="Description" error={errors.description}>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="input h-auto py-2"
                                />
                            </Field>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-4">
                            <Field label="Category" error={errors.category_id}>
                                <select
                                    value={data.category_id}
                                    onChange={(e) => setData('category_id', e.target.value ? Number(e.target.value) : '')}
                                    className="input"
                                >
                                    <option value="">— No category —</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Unit" error={errors.unit} helper="pcs, ctn, box…">
                                <input
                                    type="text"
                                    value={data.unit}
                                    onChange={(e) => setData('unit', e.target.value)}
                                    className="input"
                                    maxLength={16}
                                />
                            </Field>
                            <Field label="Pack size" error={errors.pack_size} helper="pieces per pack">
                                <input
                                    type="number"
                                    min={1}
                                    value={data.pack_size}
                                    onChange={(e) => setData('pack_size', Number(e.target.value))}
                                    className="input money text-right"
                                />
                            </Field>
                        </div>
                    </Section>

                    <Section title="Pricing">
                        <div className="grid grid-cols-4 gap-4">
                            <Field label="Cost" error={errors.cost_price}>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.cost_price}
                                    onChange={(e) => setData('cost_price', e.target.value)}
                                    className="input money text-right"
                                />
                            </Field>
                            <Field label="Wholesale" error={errors.wholesale_price}>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.wholesale_price}
                                    onChange={(e) => setData('wholesale_price', e.target.value)}
                                    className="input money text-right"
                                />
                            </Field>
                            <Field label="Retail" error={errors.retail_price} helper="future use">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.retail_price}
                                    onChange={(e) => setData('retail_price', e.target.value)}
                                    className="input money text-right"
                                />
                            </Field>
                            <Field label="Tax %" error={errors.tax_rate}>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={data.tax_rate}
                                    onChange={(e) => setData('tax_rate', e.target.value)}
                                    className="input money text-right"
                                />
                            </Field>
                        </div>
                    </Section>

                    <Section title="Stock per location">
                        <div className="grid gap-3">
                            {locations.length === 0 && (
                                <p className="text-sm text-ink-500">
                                    No locations exist yet.{' '}
                                    <Link href={route('admin.locations.create')} className="text-primary-700 hover:underline">
                                        Create one first
                                    </Link>
                                    .
                                </p>
                            )}
                            {locations.map((l) => {
                                const row = data.stocks.find((s) => s.location_id === l.id);
                                return (
                                    <div key={l.id} className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="text-sm text-ink-900">{l.name}</div>
                                            <div className="text-xs text-ink-500 ref">{l.code}</div>
                                        </div>
                                        <input
                                            type="number"
                                            min={0}
                                            value={row?.quantity ?? 0}
                                            onChange={(e) => setStockQty(l.id, Number(e.target.value))}
                                            className="input money text-right w-32"
                                        />
                                    </div>
                                );
                            })}
                            <div>
                                <Field label="Reorder level" error={errors.reorder_level} helper="below this triggers low-stock badge">
                                    <input
                                        type="number"
                                        min={0}
                                        value={data.reorder_level}
                                        onChange={(e) => setData('reorder_level', Number(e.target.value))}
                                        className="input money text-right w-32"
                                    />
                                </Field>
                            </div>
                        </div>
                    </Section>
                </div>

                <div className="space-y-6">
                    <Section title="Photos">
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {(product?.photos ?? []).map((ph) => (
                                <div key={ph.id} className="relative group">
                                    <img src={ph.url} alt="" className="w-full aspect-square object-cover rounded border border-ink-200" />
                                    <button
                                        type="button"
                                        onClick={() => deletePhoto(ph.id)}
                                        className="absolute top-1 right-1 bg-white border border-ink-200 rounded text-danger text-xs px-2 py-0.5 opacity-0 group-hover:opacity-100"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setData('photos', Array.from(e.target.files ?? []))}
                            className="text-xs"
                        />
                        {data.photos.length > 0 && (
                            <p className="text-xs text-ink-500 mt-2">{data.photos.length} new photo(s) selected.</p>
                        )}
                        {progress && (
                            <p className="text-xs text-primary-700 mt-2">Uploading… {progress.percentage}%</p>
                        )}
                        {errors['photos.0'] && <p className="text-xs text-danger mt-2">{errors['photos.0']}</p>}
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
                            {isEdit ? 'Save changes' : 'Create product'}
                        </button>
                        <Link href={route('admin.products.index')} className="text-ink-600 hover:text-ink-900 px-3 py-2 text-sm">
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
