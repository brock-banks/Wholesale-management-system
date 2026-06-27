<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class GoodsReceipt extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'grn_number', 'po_id', 'supplier_id', 'location_id',
        'receipt_date', 'total', 'notes', 'created_by',
    ];

    protected $casts = [
        'receipt_date' => 'date',
        'total' => 'decimal:2',
    ];

    public function purchaseOrder(): BelongsTo { return $this->belongsTo(PurchaseOrder::class, 'po_id'); }
    public function supplier(): BelongsTo { return $this->belongsTo(Supplier::class); }
    public function location(): BelongsTo { return $this->belongsTo(Location::class); }
    public function items(): HasMany { return $this->hasMany(GoodsReceiptItem::class, 'grn_id'); }

    public static function nextNumber(): string
    {
        return DB::transaction(function () {
            $last = static::withTrashed()
                ->where('grn_number', 'like', 'GRN-%')
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();
            $n = $last ? ((int) substr($last->grn_number, 4)) + 1 : 1;
            return 'GRN-'.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
        });
    }
}
