<?php

namespace App\Services;

use App\Models\Bill;
use App\Models\Customer;
use App\Models\LedgerEntry;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\ReturnItem;
use App\Models\ReturnRecord;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReturnService
{
    public function create(array $data, ?int $userId = null): ReturnRecord
    {
        return DB::transaction(function () use ($data, $userId) {
            $customer = Customer::lockForUpdate()->findOrFail($data['customer_id']);
            $location = Location::findOrFail($data['location_id']);
            $bill = ! empty($data['bill_id']) ? Bill::find($data['bill_id']) : null;

            $items = collect($data['items'] ?? []);
            if ($items->isEmpty()) {
                throw ValidationException::withMessages(['items' => 'Add at least one item.']);
            }

            $subtotal = 0;
            $prepared = [];

            foreach ($items->values() as $i => $row) {
                $product = Product::findOrFail($row['product_id']);
                $qty = (int) $row['quantity'];
                if ($qty <= 0) {
                    throw ValidationException::withMessages(["items.$i.quantity" => 'Quantity must be at least 1.']);
                }
                $unitPrice = (float) $row['unit_price'];
                $lineTotal = round($unitPrice * $qty, 2);
                $subtotal += $lineTotal;
                $prepared[] = compact('product', 'unitPrice', 'qty', 'lineTotal');
            }

            $return = ReturnRecord::create([
                'return_number' => ReturnRecord::nextNumber(),
                'customer_id' => $customer->id,
                'location_id' => $location->id,
                'bill_id' => $bill?->id,
                'return_date' => $data['return_date'] ?? now()->toDateString(),
                'subtotal' => round($subtotal, 2),
                'total' => round($subtotal, 2),
                'reason' => $data['reason'] ?? null,
                'status' => ReturnRecord::STATUS_ACTIVE,
                'created_by' => $userId,
            ]);

            foreach ($prepared as $row) {
                ReturnItem::create([
                    'return_id' => $return->id,
                    'product_id' => $row['product']->id,
                    'product_name' => $row['product']->name,
                    'product_sku' => $row['product']->sku,
                    'unit_price' => $row['unitPrice'],
                    'quantity' => $row['qty'],
                    'line_total' => $row['lineTotal'],
                ]);

                ProductStock::firstOrCreate(
                    ['product_id' => $row['product']->id, 'location_id' => $location->id],
                    ['quantity' => 0],
                )->increment('quantity', $row['qty']);

                StockMovement::create([
                    'product_id' => $row['product']->id,
                    'location_id' => $location->id,
                    'type' => StockMovement::TYPE_RETURN,
                    'quantity' => $row['qty'],
                    'reference_type' => ReturnRecord::class,
                    'reference_id' => $return->id,
                    'notes' => "Return via {$return->return_number}",
                    'created_by' => $userId,
                ]);
            }

            $this->writeLedger(
                $customer,
                $return->return_date,
                LedgerEntry::TYPE_RETURN,
                0,
                (float) $return->total,
                $return,
                "Return {$return->return_number}".($bill ? " against {$bill->invoice_number}" : ''),
                $userId,
            );

            return $return->fresh(['items']);
        });
    }

    private function writeLedger(Customer $customer, $date, string $type, float $debit, float $credit, $reference, ?string $description, ?int $userId): LedgerEntry
    {
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
