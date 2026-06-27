<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Bill extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_POSTED = 'posted';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'invoice_number', 'customer_id', 'location_id', 'sales_rep_id', 'bill_date', 'posted_at',
        'subtotal', 'discount_amount', 'tax_total', 'grand_total', 'paid_amount',
        'commission_rate', 'commission_amount',
        'status', 'notes', 'created_by',
    ];

    protected $casts = [
        'bill_date' => 'date',
        'posted_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'commission_amount' => 'decimal:2',
    ];

    public function salesRep(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_rep_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(BillItem::class)->orderBy('sort_order');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    public function ledgerEntries(): MorphMany
    {
        return $this->morphMany(LedgerEntry::class, 'reference');
    }

    public function balanceDue(): float
    {
        return (float) $this->grand_total - (float) $this->paid_amount;
    }

    public function paymentStatus(): string
    {
        $due = $this->balanceDue();
        if ($due <= 0.0001) return 'paid';
        if ((float) $this->paid_amount > 0) return 'partial';
        return 'unpaid';
    }

    public static function nextInvoiceNumber(): string
    {
        return DB::transaction(function () {
            $year = (int) date('Y');
            $configured = \App\Support\BusinessSettings::invoicePrefix();
            $prefix = "{$configured}-{$year}-";
            $last = static::withTrashed()
                ->where('invoice_number', 'like', $prefix.'%')
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();
            $n = $last ? ((int) substr($last->invoice_number, strlen($prefix))) + 1 : 1;
            return $prefix.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
        });
    }
}
