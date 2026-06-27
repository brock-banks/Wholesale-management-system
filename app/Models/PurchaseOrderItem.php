<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'po_id', 'product_id', 'product_name', 'product_sku',
        'unit_cost', 'ordered_qty', 'received_qty', 'line_total', 'sort_order',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'ordered_qty' => 'integer',
        'received_qty' => 'integer',
        'line_total' => 'decimal:2',
    ];

    public function purchaseOrder(): BelongsTo { return $this->belongsTo(PurchaseOrder::class, 'po_id'); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }

    public function remainingQty(): int
    {
        return max(0, (int) $this->ordered_qty - (int) $this->received_qty);
    }
}
