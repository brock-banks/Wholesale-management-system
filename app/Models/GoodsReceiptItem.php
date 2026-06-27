<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsReceiptItem extends Model
{
    protected $fillable = [
        'grn_id', 'po_item_id', 'product_id', 'product_name', 'product_sku',
        'received_qty', 'unit_cost', 'line_total',
    ];

    protected $casts = [
        'received_qty' => 'integer',
        'unit_cost' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function goodsReceipt(): BelongsTo { return $this->belongsTo(GoodsReceipt::class, 'grn_id'); }
    public function poItem(): BelongsTo { return $this->belongsTo(PurchaseOrderItem::class, 'po_item_id'); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
}
