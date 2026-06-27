<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierLedgerEntry;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class SupplierStatementController extends Controller
{
    public function show(Request $request, Supplier $supplier): Response
    {
        [$from, $to] = $this->dateRange($request);
        $data = $this->buildStatement($supplier, $from, $to);

        return Inertia::render('Admin/Suppliers/Statement', [
            'supplier' => $supplier->only(['id', 'code', 'name', 'phone', 'address', 'opening_balance', 'current_balance']),
            'filters' => ['from' => $from, 'to' => $to],
            ...$data,
        ]);
    }

    public function pdf(Request $request, Supplier $supplier): HttpResponse
    {
        [$from, $to] = $this->dateRange($request);
        $data = $this->buildStatement($supplier, $from, $to);

        $pdf = Pdf::loadView('pdf.supplier_statement', [
            'supplier' => $supplier,
            'filters' => ['from' => $from, 'to' => $to],
            'opening' => $data['opening_balance'],
            'closing' => $data['closing_balance'],
            'totalDebit' => $data['period_debit'],
            'totalCredit' => $data['period_credit'],
            'entries' => $data['entries'],
            'business' => \App\Support\BusinessSettings::forPdf(),
        ])->setPaper('A4');

        return $pdf->stream("supplier-statement-{$supplier->code}-{$from}-to-{$to}.pdf");
    }

    private function dateRange(Request $request): array
    {
        return [
            $request->string('from')->value() ?: now()->startOfMonth()->subMonths(2)->toDateString(),
            $request->string('to')->value() ?: now()->toDateString(),
        ];
    }

    private function buildStatement(Supplier $supplier, string $from, string $to): array
    {
        $openingBalance = (float) (SupplierLedgerEntry::query()
            ->where('supplier_id', $supplier->id)
            ->where('entry_date', '<', $from)
            ->orderByDesc('id')
            ->value('running_balance') ?? 0);

        $entries = SupplierLedgerEntry::query()
            ->where('supplier_id', $supplier->id)
            ->whereBetween('entry_date', [$from, $to])
            ->orderBy('entry_date')->orderBy('id')
            ->get(['id', 'entry_date', 'type', 'reference_type', 'reference_id', 'debit', 'credit', 'running_balance', 'description'])
            ->map(function (SupplierLedgerEntry $e) {
                $ref = null;
                if ($e->reference_type && $e->reference_id) {
                    $model = $e->reference_type::find($e->reference_id);
                    if ($model) {
                        $ref = match ($e->reference_type) {
                            \App\Models\PurchaseOrder::class => ['type' => 'po', 'id' => $model->id, 'label' => $model->po_number],
                            \App\Models\SupplierPayment::class => ['type' => 'payment', 'id' => $model->id, 'label' => $model->payment_number],
                            default => null,
                        };
                    }
                }
                return [
                    'id' => $e->id,
                    'entry_date' => $e->entry_date->toDateString(),
                    'type' => $e->type,
                    'debit' => (float) $e->debit,
                    'credit' => (float) $e->credit,
                    'running_balance' => (float) $e->running_balance,
                    'description' => $e->description,
                    'reference' => $ref,
                ];
            });

        $periodDebit = (float) $entries->sum('debit');
        $periodCredit = (float) $entries->sum('credit');
        $closingBalance = $openingBalance + $periodDebit - $periodCredit;

        return [
            'opening_balance' => round($openingBalance, 2),
            'closing_balance' => round($closingBalance, 2),
            'period_debit' => round($periodDebit, 2),
            'period_credit' => round($periodCredit, 2),
            'entries' => $entries->values(),
        ];
    }
}
