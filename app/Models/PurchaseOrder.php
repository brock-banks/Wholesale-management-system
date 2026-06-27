<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_PENDING = 'pending';
    public const STATUS_PARTIAL = 'partial';
    public const STATUS_RECEIVED = 'received';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'po_number', 'supplier_id', 'location_id', 'po_date', 'expected_date',
        'subtotal', 'freight', 'other_charges', 'total', 'paid_amount',
        'status', 'notes', 'created_by',
    ];

    protected $casts = [
        'po_date' => 'date',
        'expected_date' => 'date',
        'subtotal' => 'decimal:2',
        'freight' => 'decimal:2',
        'other_charges' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function location(): BelongsTo { return $this->belongsTo(Location::class); }
    public function items(): HasMany { return $this->hasMany(PurchaseOrderItem::class, 'po_id')->orderBy('sort_order'); }
    public function receipts(): HasMany { return $this->hasMany(GoodsReceipt::class, 'po_id'); }
    public function allocations(): HasMany { return $this->hasMany(SupplierPaymentAllocation::class, 'po_id'); }

    public function balanceDue(): float
    {
        return (float) $this->total - (float) $this->paid_amount;
    }

    public static function nextNumber(): string
    {
        return DB::transaction(function () {
            $last = static::withTrashed()
                ->where('po_number', 'like', 'PO-%')
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();
            $n = $last ? ((int) substr($last->po_number, 3)) + 1 : 1;
            return 'PO-'.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
        });
    }
}
