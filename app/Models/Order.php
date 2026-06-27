<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PENDING = 'pending';
    public const STATUS_REVIEWING = 'reviewing';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_ON_HOLD = 'on_hold';
    public const STATUS_INVOICED = 'invoiced';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'order_number', 'customer_id', 'sales_rep_id', 'location_id', 'order_date',
        'submitted_at', 'actioned_at', 'status',
        'admin_notes', 'customer_notes', 'linked_bill_id',
    ];

    public function salesRep(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sales_rep_id');
    }

    protected $casts = [
        'order_date' => 'date',
        'submitted_at' => 'datetime',
        'actioned_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bill::class, 'linked_bill_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class)->orderBy('sort_order');
    }

    public function isOpen(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PENDING, self::STATUS_REVIEWING, self::STATUS_ON_HOLD]);
    }

    public function isEditableByCustomer(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function totalEstimate(): float
    {
        return (float) $this->items->sum(fn (OrderItem $i) => (float) $i->unit_price * ($i->confirmed_qty ?? $i->requested_qty));
    }

    public static function nextOrderNumber(): string
    {
        return DB::transaction(function () {
            $last = static::withTrashed()
                ->where('order_number', 'like', 'ORD-%')
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();
            $n = $last ? ((int) substr($last->order_number, 4)) + 1 : 1;
            return 'ORD-'.str_pad((string) $n, 4, '0', STR_PAD_LEFT);
        });
    }
}
