<?php

namespace App\Services;

use App\Models\PurchaseOrder;
use App\Models\Supplier;
use App\Models\SupplierLedgerEntry;
use App\Models\SupplierPayment;
use App\Models\SupplierPaymentAllocation;
use Illuminate\Support\Facades\DB;

class SupplierPaymentService
{
    public function record(array $data, ?int $userId = null): SupplierPayment
    {
        return DB::transaction(function () use ($data, $userId) {
            $supplier = Supplier::lockForUpdate()->findOrFail($data['supplier_id']);

            $payment = SupplierPayment::create([
                'payment_number' => SupplierPayment::nextNumber(),
                'supplier_id' => $supplier->id,
                'payment_date' => $data['payment_date'] ?? now()->toDateString(),
                'amount' => $data['amount'],
                'method' => $data['method'],
                'reference' => $data['reference'] ?? null,
                'bank_name' => $data['bank_name'] ?? null,
                'check_number' => $data['check_number'] ?? null,
                'check_date' => $data['check_date'] ?? null,
                'check_status' => $data['method'] === SupplierPayment::METHOD_CHECK ? SupplierPayment::CHECK_PENDING : null,
                'status' => SupplierPayment::STATUS_ACTIVE,
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);

            $remaining = (float) $payment->amount;
            $pos = PurchaseOrder::where('supplier_id', $supplier->id)
                ->whereIn('status', [PurchaseOrder::STATUS_PENDING, 'partial', PurchaseOrder::STATUS_RECEIVED])
                ->whereColumn('paid_amount', '<', 'total')
                ->orderBy('po_date')
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            foreach ($pos as $po) {
                if ($remaining <= 0) break;
                $due = (float) $po->total - (float) $po->paid_amount;
                if ($due <= 0) continue;
                $applied = min($remaining, $due);
                SupplierPaymentAllocation::create([
                    'supplier_payment_id' => $payment->id,
                    'po_id' => $po->id,
                    'amount' => round($applied, 2),
                ]);
                $po->increment('paid_amount', round($applied, 2));
                $remaining -= $applied;
            }

            $this->writeLedger($supplier, $payment->payment_date, SupplierLedgerEntry::TYPE_PAYMENT, 0, (float) $payment->amount, $payment, "Payment {$payment->payment_number} via {$payment->method}", $userId);

            return $payment->fresh(['allocations']);
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
