export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    roles: string[];
    permissions: string[];
}

export interface Flash {
    success?: string | null;
    error?: string | null;
}

export interface AppSettings {
    business_name: string;
    currency_code: string;
    default_tax_rate: number;
    invoice_prefix: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User | null;
    };
    flash: Flash;
    settings?: AppSettings;
};

export interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export interface Location {
    id: number;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
    is_active: boolean;
    is_default: boolean;
}

export interface Category {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    sort_order: number;
    is_active: boolean;
    parent?: Category | null;
    children?: Category[];
}

export interface ProductPhoto {
    id: number;
    path: string;
    url: string;
    sort_order: number;
}

export interface ProductStock {
    id: number;
    location_id: number;
    quantity: number;
    reserved: number;
    location?: Location;
}

export interface Supplier {
    id: number;
    code: string;
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    opening_balance: string;
    current_balance: string;
    is_active: boolean;
    notes: string | null;
}

export interface PurchaseOrder {
    id: number;
    po_number: string;
    supplier_id: number;
    location_id: number;
    po_date: string;
    expected_date: string | null;
    subtotal: string;
    freight: string;
    other_charges: string;
    total: string;
    paid_amount: string;
    status: 'pending' | 'partial' | 'received' | 'cancelled';
    notes: string | null;
    supplier?: { id: number; code: string; name: string };
    location?: { id: number; code: string; name: string };
    items?: PurchaseOrderItem[];
    receipts?: GoodsReceipt[];
    allocations?: { id: number; amount: string; payment?: SupplierPayment }[];
}

export interface PurchaseOrderItem {
    id: number;
    po_id: number;
    product_id: number;
    product_name: string;
    product_sku: string;
    unit_cost: string;
    ordered_qty: number;
    received_qty: number;
    line_total: string;
    sort_order: number;
}

export interface GoodsReceipt {
    id: number;
    grn_number: string;
    po_id: number;
    receipt_date: string;
    total: string;
    notes: string | null;
    items?: { id: number; product_name: string; product_sku: string; received_qty: number; unit_cost: string; line_total: string }[];
}

export interface SupplierPayment {
    id: number;
    payment_number: string;
    supplier_id: number;
    payment_date: string;
    amount: string;
    method: 'cash' | 'card' | 'check' | 'bank';
    reference: string | null;
    bank_name: string | null;
    check_number: string | null;
    check_date: string | null;
    check_status: 'pending' | 'cleared' | 'bounced' | null;
    status: 'active' | 'cancelled';
    notes: string | null;
    supplier?: { id: number; code: string; name: string };
    allocations?: { id: number; amount: string; purchase_order?: { id: number; po_number: string; total: string } }[];
}

export interface Customer {
    id: number;
    code: string;
    name: string;
    phone: string | null;
    address: string | null;
    email: string | null;
    user_id: number | null;
    opening_balance: string;
    current_balance: string;
    credit_limit: string;
    is_active: boolean;
    notes: string | null;
    user?: { id: number; email: string } | null;
}

export interface BillItem {
    id: number;
    product_id: number;
    product_name: string;
    product_sku: string;
    unit_price: string;
    quantity: number;
    discount_amount: string;
    tax_rate: string;
    line_total: string;
    sort_order: number;
}

export interface Payment {
    id: number;
    payment_number: string;
    customer_id: number;
    payment_date: string;
    amount: string;
    method: 'cash' | 'card' | 'check' | 'bank' | 'debit';
    reference: string | null;
    bank_name: string | null;
    check_number: string | null;
    check_date: string | null;
    check_status: 'pending' | 'cleared' | 'bounced' | null;
    due_date: string | null;
    status: 'active' | 'cancelled';
    notes: string | null;
    customer?: { id: number; code: string; name: string };
    allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
    id: number;
    payment_id: number;
    bill_id: number;
    amount: string;
    payment?: Payment;
    bill?: Bill;
}

export interface Bill {
    id: number;
    invoice_number: string;
    customer_id: number;
    location_id: number;
    bill_date: string;
    posted_at: string | null;
    subtotal: string;
    discount_amount: string;
    tax_total: string;
    grand_total: string;
    paid_amount: string;
    status: 'draft' | 'posted' | 'cancelled';
    notes: string | null;
    customer?: { id: number; code: string; name: string; phone?: string | null; address?: string | null; current_balance?: string; credit_limit?: string };
    location?: { id: number; code: string; name: string };
    items?: BillItem[];
    allocations?: PaymentAllocation[];
}

export interface OrderItem {
    id: number;
    order_id: number;
    product_id: number;
    product_name: string;
    product_sku: string;
    unit_price: string;
    requested_qty: number;
    confirmed_qty: number | null;
    notes: string | null;
    sort_order: number;
}

export interface Order {
    id: number;
    order_number: string;
    customer_id: number;
    location_id: number | null;
    order_date: string;
    submitted_at: string | null;
    actioned_at: string | null;
    status: 'draft' | 'pending' | 'reviewing' | 'confirmed' | 'on_hold' | 'invoiced' | 'cancelled';
    admin_notes: string | null;
    customer_notes: string | null;
    linked_bill_id: number | null;
    customer?: { id: number; code: string; name: string; phone?: string | null; address?: string | null; current_balance?: string; credit_limit?: string };
    location?: { id: number; code: string; name: string } | null;
    items?: OrderItem[];
    bill?: { id: number; invoice_number: string } | null;
}

export interface Product {
    id: number;
    sku: string;
    barcode: string | null;
    category_id: number | null;
    name: string;
    description: string | null;
    unit: string;
    pack_size: number;
    cost_price: string;
    wholesale_price: string;
    retail_price: string;
    tax_rate: string;
    reorder_level: number;
    is_active: boolean;
    category?: Category | null;
    photos?: ProductPhoto[];
    stocks?: ProductStock[];
    total_stock?: number;
}
