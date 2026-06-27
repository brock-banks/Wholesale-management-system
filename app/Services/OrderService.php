<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(private readonly NotificationService $notify) {}

    public function ensureCart(Customer $customer): Order
    {
        $cart = $customer->cart();
        if ($cart) return $cart;

        return Order::create([
            'order_number' => Order::nextOrderNumber(),
            'customer_id' => $customer->id,
            'order_date' => now()->toDateString(),
            'status' => Order::STATUS_DRAFT,
        ]);
    }

    public function addToCart(Customer $customer, Product $product, int $qty = 1): OrderItem
    {
        $cart = $this->ensureCart($customer);

        $item = OrderItem::firstOrNew([
            'order_id' => $cart->id,
            'product_id' => $product->id,
        ]);

        $item->fill([
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'unit_price' => $product->wholesale_price,
            'requested_qty' => ($item->requested_qty ?? 0) + $qty,
            'sort_order' => $item->sort_order ?? $cart->items()->max('sort_order') + 1,
        ]);
        $item->save();

        return $item;
    }

    public function updateCartLine(OrderItem $item, int $qty): OrderItem
    {
        if ($qty <= 0) {
            $item->delete();
            return $item;
        }
        $item->update(['requested_qty' => $qty]);
        return $item;
    }

    public function removeCartLine(OrderItem $item): void
    {
        $item->delete();
    }

    public function submitCart(Customer $customer, ?string $notes = null): Order
    {
        return DB::transaction(function () use ($customer, $notes) {
            $cart = $customer->cart();
            if (! $cart || $cart->items()->count() === 0) {
                throw ValidationException::withMessages(['cart' => 'Your cart is empty.']);
            }

            $cart->update([
                'status' => Order::STATUS_PENDING,
                'submitted_at' => now(),
                'customer_notes' => $notes,
            ]);

            $this->notify->notifyAdmins(
                type: 'order.pending',
                title: "New order from {$customer->name}",
                message: "{$cart->order_number} · {$cart->items()->count()} items",
                link: "/admin/orders/{$cart->id}",
            );

            return $cart->fresh(['items']);
        });
    }

    public function review(Order $order): Order
    {
        if ($order->status === Order::STATUS_PENDING) {
            $order->update(['status' => Order::STATUS_REVIEWING]);
        }
        return $order;
    }

    public function modifyAndConfirm(Order $order, array $confirmedQuantities, ?string $adminNotes, ?int $locationId, ?int $userId): Order
    {
        return DB::transaction(function () use ($order, $confirmedQuantities, $adminNotes, $locationId, $userId) {
            $itemsById = $order->items->keyBy('id');
            $anyConfirmed = false;

            foreach ($confirmedQuantities as $itemId => $qty) {
                $item = $itemsById->get($itemId);
                if (! $item) continue;
                $qty = max(0, (int) $qty);
                $item->update(['confirmed_qty' => $qty]);
                if ($qty > 0) $anyConfirmed = true;
            }

            if (! $anyConfirmed) {
                throw ValidationException::withMessages(['items' => 'Confirm at least one item, or cancel the order.']);
            }

            $order->update([
                'status' => Order::STATUS_CONFIRMED,
                'admin_notes' => $adminNotes,
                'location_id' => $locationId,
                'actioned_at' => now(),
            ]);

            $this->notify->notifyCustomer(
                customer: $order->customer,
                type: 'order.confirmed',
                title: "Order {$order->order_number} confirmed",
                message: 'Admin has reviewed and confirmed your order.',
                link: "/portal/orders/{$order->id}",
            );

            return $order->fresh(['items', 'customer']);
        });
    }

    public function holdOrder(Order $order, ?string $reason, ?int $userId): Order
    {
        $order->update([
            'status' => Order::STATUS_ON_HOLD,
            'admin_notes' => $reason,
            'actioned_at' => now(),
        ]);

        $this->notify->notifyCustomer(
            customer: $order->customer,
            type: 'order.on_hold',
            title: "Order {$order->order_number} on hold",
            message: $reason ?: 'Admin will get back to you shortly.',
            link: "/portal/orders/{$order->id}",
        );

        return $order;
    }

    public function cancelOrder(Order $order, ?string $reason, ?int $userId): Order
    {
        $order->update([
            'status' => Order::STATUS_CANCELLED,
            'admin_notes' => $reason,
            'actioned_at' => now(),
        ]);

        $this->notify->notifyCustomer(
            customer: $order->customer,
            type: 'order.cancelled',
            title: "Order {$order->order_number} cancelled",
            message: $reason,
            link: "/portal/orders/{$order->id}",
        );

        return $order;
    }

    public function markInvoiced(Order $order, int $billId): void
    {
        $order->update([
            'status' => Order::STATUS_INVOICED,
            'linked_bill_id' => $billId,
            'actioned_at' => now(),
        ]);

        $this->notify->notifyCustomer(
            customer: $order->customer,
            type: 'order.invoiced',
            title: "Order {$order->order_number} invoiced",
            message: 'A bill has been generated for your order.',
            link: "/portal/orders/{$order->id}",
        );
    }
}
