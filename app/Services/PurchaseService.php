<?php

namespace App\Services;

use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\Location;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\SupplierLedgerEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseService
{
    public function createPO(array $data, ?int $userId = null): PurchaseOrder
    {
        return DB::transaction(function () use ($data, $userId) {
            $supplier = Supplier::lockForUpdate()->findOrFail($data['supplier_id']);
            $location = Location::findOrFail($data['location_id']);

            $items = collect($data['items'] ?? []);
            if ($items->isEmpty()) {
                throw ValidationException::withMessages(['items' => 'Add at least one item.']);
            }

            $subtotal = 0;
            $prepared = [];
            foreach ($items->values() as $i => $row) {
                $product = Product::findOrFail($row['product_id']);
                $qty = (int) $row['ordered_qty'];
                if ($qty <= 0) {
                    throw ValidationException::withMessages(["items.$i.ordered_qty" => 'Quantity must be at least 1.']);
                }
                $unitCost = (float) ($row['unit_cost'] ?? $product->cost_price);
                $lineTotal = round($unitCost * $qty, 2);
                $subtotal += $lineTotal;
                $prepared[] = [
                    'product' => $product, 'unit_cost' => $unitCost,
                    'ordered_qty' => $qty, 'line_total' => $lineTotal, 'sort_order' => $i,
                ];
            }

            $freight = (float) ($data['freight'] ?? 0);
            $other = (float) ($data['other_charges'] ?? 0);
            $total = round($subtotal + $freight + $other, 2);

            $po = PurchaseOrder::create([
                'po_number' => PurchaseOrder::nextNumber(),
                'supplier_id' => $supplier->id,
                'location_id' => $location->id,
                'po_date' => $data['po_date'] ?? now()->toDateString(),
                'expected_date' => $data['expected_date'] ?? null,
                'subtotal' => round($subtotal, 2),
                'freight' => $freight,
                'other_charges' => $other,
                'total' => $total,
                'paid_amount' => 0,
                'status' => PurchaseOrder::STATUS_PENDING,
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);

            foreach ($prepared as $row) {
                PurchaseOrderItem::create([
                    'po_id' => $po->id,
                    'product_id' => $row['product']->id,
                    'product_name' => $row['product']->name,
                    'product_sku' => $row['product']->sku,
                    'unit_cost' => $row['unit_cost'],
                    'ordered_qty' => $row['ordered_qty'],
                    'received_qty' => 0,
                    'line_total' => $row['line_total'],
                    'sort_order' => $row['sort_order'],
                ]);
            }

            $this->writeLedger($supplier, $po->po_date, SupplierLedgerEntry::TYPE_PO, $total, 0, $po, "PO {$po->po_number}", $userId);

            return $po->fresh(['items', 'supplier', 'location']);
        });
    }

    public function receive(PurchaseOrder $po, array $rows, ?string $notes, ?int $userId): GoodsReceipt
    {
        return DB::transaction(function () use ($po, $rows, $notes, $userId) {
            if (in_array($po->status, [PurchaseOrder::STATUS_RECEIVED, PurchaseOrder::STATUS_CANCELLED])) {
                throw ValidationException::withMessages(['status' => 'This PO cannot accept more receipts.']);
            }

            $totalReceived = 0;
            $grn = GoodsReceipt::create([
                'grn_number' => GoodsReceipt::nextNumber(),
                'po_id' => $po->id,
                'supplier_id' => $po->supplier_id,
                'location_id' => $po->location_id,
                'receipt_date' => $rows['_receipt_date'] ?? now()->toDateString(),
                'total' => 0,
                'notes' => $notes,
                'created_by' => $userId,
            ]);

            foreach ($rows as $key => $row) {
                if ($key === '_receipt_date') continue;
                $itemId = $row['po_item_id'] ?? null;
                $qty = (int) ($row['received_qty'] ?? 0);
                if (! $itemId || $qty <= 0) continue;

                $poItem = PurchaseOrderItem::where('po_id', $po->id)->findOrFail($itemId);
                $remaining = $poItem->remainingQty();
                if ($qty > $remaining) {
                    throw ValidationException::withMessages([
                        "items.$itemId" => "Only $remaining left to receive for {$poItem->product_name}.",
                    ]);
                }

                $unitCost = (float) ($row['unit_cost'] ?? $poItem->unit_cost);
                $lineTotal = round($unitCost * $qty, 2);
                $totalReceived += $lineTotal;

                GoodsReceiptItem::create([
                    'grn_id' => $grn->id,
                    'po_item_id' => $poItem->id,
                    'product_id' => $poItem->product_id,
                    'product_name' => $poItem->product_name,
                    'product_sku' => $poItem->product_sku,
                    'received_qty' => $qty,
                    'unit_cost' => $unitCost,
                    'line_total' => $lineTotal,
                ]);

                $poItem->increment('received_qty', $qty);

                ProductStock::firstOrCreate(
                    ['product_id' => $poItem->product_id, 'location_id' => $po->location_id],
                    ['quantity' => 0],
                )->increment('quantity', $qty);

                StockMovement::create([
                    'product_id' => $poItem->product_id,
                    'location_id' => $po->location_id,
                    'type' => StockMovement::TYPE_STOCK_IN,
                    'quantity' => $qty,
                    'reference_type' => GoodsReceipt::class,
                    'reference_id' => $grn->id,
                    'notes' => "Received via {$grn->grn_number}",
                    'created_by' => $userId,
                ]);

                Product::where('id', $poItem->product_id)->update(['cost_price' => $unitCost]);
            }

            $grn->update(['total' => round($totalReceived, 2)]);

            $allReceived = $po->items()->get()->every(fn ($i) => $i->received_qty >= $i->ordered_qty);
            $anyReceived = $po->items()->get()->contains(fn ($i) => $i->received_qty > 0);
            $po->update([
                'status' => $allReceived ? PurchaseOrder::STATUS_RECEIVED : ($anyReceived ? PurchaseOrder::STATUS_PARTIAL : PurchaseOrder::STATUS_PENDING),
            ]);

            return $grn->fresh(['items']);
        });
    }

    private function writeLedger(Supplier $supplier, $date, string $type, float $debit, float $credit, $reference, ?string $description, ?int $userId): SupplierLedgerEntry
    {
        $last = SupplierLedgerEntry::where('supplier_id', $supplier->id)
            ->orderByDesc('id')
            ->lockForUpdate()
            ->first();
        $running = (float) ($last->running_balance ?? 0) + $debit - $credit;

        $entry = SupplierLedgerEntry::create([
            'supplier_id' => $supplier->id,
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

        $supplier->update(['current_balance' => round($running, 2)]);

        return $entry;
    }
}
