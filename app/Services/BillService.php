<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Customer;
use App\Models\LedgerEntry;
use App\Models\Location;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BillService
{
    public function create(array $data, ?int $userId = null): Bill
    {
        return DB::transaction(function () use ($data, $userId) {
            $customer = Customer::lockForUpdate()->findOrFail($data['customer_id']);
            $location = Location::findOrFail($data['location_id']);

            $items = collect($data['items'] ?? []);
            if ($items->isEmpty()) {
                throw ValidationException::withMessages(['items' => 'Add at least one item.']);
            }

            $subtotal = 0;
            $taxTotal = 0;
            $linesPrepared = [];

            foreach ($items->values() as $i => $row) {
                $product = Product::findOrFail($row['product_id']);
                $qty = (int) $row['quantity'];
                if ($qty <= 0) {
                    throw ValidationException::withMessages(["items.$i.quantity" => 'Quantity must be at least 1.']);
                }

                $stock = ProductStock::where('product_id', $product->id)
                    ->where('location_id', $location->id)
                    ->lockForUpdate()
                    ->first();
                $onHand = $stock ? (int) $stock->quantity : 0;
                if ($onHand < $qty) {
                    throw ValidationException::withMessages([
                        "items.$i.quantity" => "Only $onHand available at {$location->name} for {$product->name}.",
                    ]);
                }

                $unitPrice = (float) ($row['unit_price'] ?? $product->wholesale_price);
                $lineDiscount = (float) ($row['discount_amount'] ?? 0);
                $taxRate = (float) ($row['tax_rate'] ?? $product->tax_rate);

                $gross = $unitPrice * $qty;
                $afterDiscount = max(0, $gross - $lineDiscount);
                $lineTax = round($afterDiscount * $taxRate / 100, 2);
                $lineTotal = round($afterDiscount + $lineTax, 2);

                $subtotal += $afterDiscount;
                $taxTotal += $lineTax;

                $linesPrepared[] = [
                    'product' => $product,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'unit_price' => $unitPrice,
                    'quantity' => $qty,
                    'discount_amount' => $lineDiscount,
                    'tax_rate' => $taxRate,
                    'line_total' => $lineTotal,
                    'sort_order' => $i,
                ];
            }

            $billDiscount = (float) ($data['discount_amount'] ?? 0);
            $grandTotal = round(max(0, $subtotal - $billDiscount + $taxTotal), 2);

            $salesRepId = $data['sales_rep_id'] ?? $customer->sales_rep_id;
            $commissionRate = 0.0;
            $commissionAmount = 0.0;
            if ($salesRepId) {
                $rep = \App\Models\User::find($salesRepId);
                if ($rep) {
                    $commissionRate = (float) $rep->commission_rate;
                    $base = max(0, $subtotal - $billDiscount);
                    $commissionAmount = round($base * $commissionRate / 100, 2);
                }
            }

            $bill = Bill::create([
                'invoice_number' => Bill::nextInvoiceNumber(),
                'customer_id' => $customer->id,
                'location_id' => $location->id,
                'sales_rep_id' => $salesRepId,
                'bill_date' => $data['bill_date'] ?? now()->toDateString(),
                'posted_at' => now(),
                'subtotal' => round($subtotal, 2),
                'discount_amount' => $billDiscount,
                'tax_total' => round($taxTotal, 2),
                'grand_total' => $grandTotal,
                'paid_amount' => 0,
                'commission_rate' => $commissionRate,
                'commission_amount' => $commissionAmount,
                'status' => Bill::STATUS_POSTED,
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);

            foreach ($linesPrepared as $line) {
                $product = $line['product'];
                BillItem::create([
                    'bill_id' => $bill->id,
                    'product_id' => $product->id,
                    'product_name' => $line['product_name'],
                    'product_sku' => $line['product_sku'],
                    'unit_price' => $line['unit_price'],
                    'quantity' => $line['quantity'],
                    'discount_amount' => $line['discount_amount'],
                    'tax_rate' => $line['tax_rate'],
                    'line_total' => $line['line_total'],
                    'sort_order' => $line['sort_order'],
                ]);

                ProductStock::where('product_id', $product->id)
                    ->where('location_id', $location->id)
                    ->decrement('quantity', $line['quantity']);

                StockMovement::create([
                    'product_id' => $product->id,
                    'location_id' => $location->id,
                    'type' => StockMovement::TYPE_SALE,
                    'quantity' => -$line['quantity'],
                    'reference_type' => Bill::class,
                    'reference_id' => $bill->id,
                    'notes' => "Sale via {$bill->invoice_number}",
                    'created_by' => $userId,
                ]);
            }

            $this->writeLedger(
                customer: $customer,
                date: $bill->bill_date,
                type: LedgerEntry::TYPE_BILL,
                debit: $grandTotal,
                credit: 0,
                reference: $bill,
                description: "Invoice {$bill->invoice_number}",
                userId: $userId,
            );

            $totalPaid = 0;
            foreach (($data['payments'] ?? []) as $pay) {
                $amt = (float) ($pay['amount'] ?? 0);
                if ($amt <= 0) continue;
                $payment = $this->recordPayment($customer, $pay, $userId);
                PaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'bill_id' => $bill->id,
                    'amount' => min($amt, $grandTotal - $totalPaid),
                ]);
                $totalPaid += $amt;

                $this->writeLedger(
                    customer: $customer,
                    date: $payment->payment_date,
                    type: LedgerEntry::TYPE_PAYMENT,
                    debit: 0,
                    credit: $amt,
                    reference: $payment,
                    description: "Payment {$payment->payment_number} via {$payment->method}",
                    userId: $userId,
                );
            }

            $bill->update(['paid_amount' => round(min($totalPaid, $grandTotal), 2)]);

            return $bill->fresh(['items', 'customer', 'location']);
        });
    }

    public function cancel(Bill $bill, ?int $userId = null): Bill
    {
        return DB::transaction(function () use ($bill, $userId) {
            if ($bill->status === Bill::STATUS_CANCELLED) {
                return $bill;
            }

            $customer = Customer::lockForUpdate()->findOrFail($bill->customer_id);

            foreach ($bill->items as $item) {
                ProductStock::firstOrCreate(
                    ['product_id' => $item->product_id, 'location_id' => $bill->location_id],
                    ['quantity' => 0],
                )->increment('quantity', $item->quantity);

                StockMovement::create([
                    'product_id' => $item->product_id,
                    'location_id' => $bill->location_id,
                    'type' => StockMovement::TYPE_RETURN,
                    'quantity' => $item->quantity,
                    'reference_type' => Bill::class,
                    'reference_id' => $bill->id,
                    'notes' => "Cancellation of {$bill->invoice_number}",
                    'created_by' => $userId,
                ]);
            }

            $this->writeLedger(
                customer: $customer,
                date: now()->toDateString(),
                type: LedgerEntry::TYPE_CANCELLATION,
                debit: 0,
                credit: (float) $bill->grand_total,
                reference: $bill,
                description: "Cancelled invoice {$bill->invoice_number}",
                userId: $userId,
            );

            $bill->allocations()->each(function (PaymentAllocation $alloc) use ($customer, $userId) {
                $payment = $alloc->payment;
                $this->writeLedger(
                    customer: $customer,
                    date: now()->toDateString(),
                    type: LedgerEntry::TYPE_ADJUSTMENT,
                    debit: (float) $alloc->amount,
                    credit: 0,
                    reference: $payment,
                    description: "Reversed allocation of {$payment->payment_number}",
                    userId: $userId,
                );
                $alloc->delete();
            });

            $bill->update(['status' => Bill::STATUS_CANCELLED]);

            return $bill->fresh();
        });
    }

    public function recordPayment(Customer $customer, array $data, ?int $userId = null): Payment
    {
        return Payment::create([
            'payment_number' => Payment::nextPaymentNumber(),
            'customer_id' => $customer->id,
            'payment_date' => $data['payment_date'] ?? now()->toDateString(),
            'amount' => $data['amount'],
            'method' => $data['method'],
            'reference' => $data['reference'] ?? null,
            'bank_name' => $data['bank_name'] ?? null,
            'check_number' => $data['check_number'] ?? null,
            'check_date' => $data['check_date'] ?? null,
            'check_status' => $data['method'] === Payment::METHOD_CHECK ? Payment::CHECK_PENDING : null,
            'due_date' => $data['due_date'] ?? null,
            'status' => Payment::STATUS_ACTIVE,
            'notes' => $data['notes'] ?? null,
            'created_by' => $userId,
        ]);
    }

    public function cancelPayment(Payment $payment, ?string $reason = null, ?int $userId = null): Payment
    {
        return DB::transaction(function () use ($payment, $reason, $userId) {
            if ($payment->status === Payment::STATUS_CANCELLED) {
                return $payment;
            }

            $customer = Customer::lockForUpdate()->findOrFail($payment->customer_id);

            foreach ($payment->allocations as $alloc) {
                $bill = Bill::lockForUpdate()->find($alloc->bill_id);
                if ($bill) {
                    $bill->decrement('paid_amount', (float) $alloc->amount);
                }
                $alloc->delete();
            }

            $this->writeLedger(
                customer: $customer,
                date: now()->toDateString(),
                type: LedgerEntry::TYPE_ADJUSTMENT,
                debit: (float) $payment->amount,
                credit: 0,
                reference: $payment,
                description: "Cancelled payment {$payment->payment_number}".($reason ? ' · '.$reason : ''),
                userId: $userId,
            );

            $payment->update([
                'status' => Payment::STATUS_CANCELLED,
                'notes' => trim(($payment->notes ? $payment->notes."\n" : '').'Cancelled: '.($reason ?: 'no reason given')),
            ]);

            return $payment->fresh();
        });
    }

    public function recordStandalonePayment(array $data, ?int $userId = null): Payment
    {
        return DB::transaction(function () use ($data, $userId) {
            $customer = Customer::lockForUpdate()->findOrFail($data['customer_id']);
            $payment = $this->recordPayment($customer, $data, $userId);

            $remaining = (float) $payment->amount;
            $bills = Bill::where('customer_id', $customer->id)
                ->where('status', Bill::STATUS_POSTED)
                ->whereColumn('paid_amount', '<', 'grand_total')
                ->orderBy('bill_date')
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            foreach ($bills as $bill) {
                if ($remaining <= 0) break;
                $due = (float) $bill->grand_total - (float) $bill->paid_amount;
                if ($due <= 0) continue;
                $applied = min($remaining, $due);
                PaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'bill_id' => $bill->id,
                    'amount' => round($applied, 2),
                ]);
                $bill->increment('paid_amount', round($applied, 2));
                $remaining -= $applied;
            }

            $this->writeLedger(
                customer: $customer,
                date: $payment->payment_date,
                type: LedgerEntry::TYPE_PAYMENT,
                debit: 0,
                credit: (float) $payment->amount,
                reference: $payment,
                description: "Payment {$payment->payment_number} via {$payment->method}",
                userId: $userId,
            );

            return $payment->fresh(['allocations']);
        });
    }

    private function writeLedger(
        Customer $customer,
        $date,
        string $type,
        float $debit,
        float $credit,
        $reference,
        ?string $description,
        ?int $userId,
    ): LedgerEntry {
        $last = LedgerEntry::where('customer_id', $customer->id)
            ->orderByDesc('id')
            ->lockForUpdate()
            ->first();
        $running = (float) ($last->running_balance ?? 0) + $debit - $credit;

        $entry = LedgerEntry::create([
            'customer_id' => $customer->id,
            'entry_date' => $date,
            'type' => $type,
            'reference_type' => $reference ? $reference::class : null,
            'reference_id' => $reference?->id,
            'debit' => $debit,
            'credit' => $credit,
            'running_balance' => round($running, 2),
            'description' => $description,
            'created_by' => $userId,
        ]);

        $customer->update(['current_balance' => round($running, 2)]);

        return $entry;
    }
}
