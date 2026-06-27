<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $bill->invoice_number }}</title>
    <style>
        @page { margin: 24px 28px; }
        body { font-family: DejaVu Sans, sans-serif; color: #1E293B; font-size: 11px; line-height: 1.5; }
        h1, h2, h3 { color: #0F172A; font-weight: 500; margin: 0; }
        .mono { font-family: DejaVu Sans Mono, monospace; }
        .right { text-align: right; }
        .muted { color: #64748B; }
        .small { font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-weight: 500; color: #64748B; font-size: 10px; padding: 6px 8px; border-bottom: 1px solid #CBD5E1; }
        td { padding: 6px 8px; border-bottom: 1px solid #E2E8F0; }
        .header { border-bottom: 2px solid #3F5A78; padding-bottom: 10px; margin-bottom: 14px; }
        .h-brand { color: #3F5A78; font-size: 22px; font-weight: 500; }
        .panel { background: #F8FAFC; padding: 10px 12px; margin-bottom: 12px; }
        .totals { margin-top: 14px; width: 280px; float: right; }
        .totals tr td { border-bottom: 0; padding: 3px 0; }
        .totals .grand td { border-top: 1px solid #CBD5E1; padding-top: 8px; font-weight: 500; font-size: 13px; color: #0F172A; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 500; }
        .badge-paid { background: #ECFDF5; color: #065F46; }
        .badge-partial { background: #FFFBEB; color: #92400E; }
        .badge-unpaid { background: #FEF2F2; color: #991B1B; }
        .badge-cancelled { background: #F1F5F9; color: #475569; }
        .clearfix:after { content: ''; display: block; clear: both; }
        .col-l { width: 60%; float: left; }
        .col-r { width: 38%; float: right; text-align: right; }
        .footer { margin-top: 30px; padding-top: 8px; border-top: 1px solid #E2E8F0; color: #64748B; font-size: 10px; }
    </style>
</head>
<body>
    <div class="header clearfix">
        <div class="col-l">
            @if (!empty($business['logo']))
                <img src="{{ $business['logo'] }}" alt="" style="max-height: 50px; max-width: 180px; margin-bottom: 6px;">
            @endif
            <p class="h-brand">{{ $business['name'] }}</p>
            @if (!empty($business['address']))
                <p class="muted small">{{ $business['address'] }}</p>
            @endif
            @if (!empty($business['phone']))
                <p class="muted small">{{ $business['phone'] }}</p>
            @endif
            @if (!empty($business['tax_id']))
                <p class="muted small mono">Tax ID: {{ $business['tax_id'] }}</p>
            @endif
        </div>
        <div class="col-r">
            <h1 style="font-size: 18px;">INVOICE</h1>
            <p class="mono" style="font-size: 13px; margin-top: 4px;">{{ $bill->invoice_number }}</p>
            <p class="mono muted">{{ $bill->bill_date->format('d M Y') }}</p>
            <p style="margin-top: 4px;">
                @php $due = (float)$bill->grand_total - (float)$bill->paid_amount; @endphp
                @if ($bill->status === 'cancelled')
                    <span class="badge badge-cancelled">Cancelled</span>
                @elseif ($due <= 0.01)
                    <span class="badge badge-paid">Paid</span>
                @elseif ((float)$bill->paid_amount > 0)
                    <span class="badge badge-partial">Partial</span>
                @else
                    <span class="badge badge-unpaid">Unpaid</span>
                @endif
            </p>
        </div>
    </div>

    <div class="clearfix">
        <div class="col-l">
            <div class="panel">
                <p class="small muted">Bill to</p>
                <p style="font-weight: 500;">
                    <span class="mono muted">{{ $bill->customer->code }}</span> &middot; {{ $bill->customer->name }}
                </p>
                @if ($bill->customer->phone)
                    <p class="small muted mono">{{ $bill->customer->phone }}</p>
                @endif
                @if ($bill->customer->address)
                    <p class="small muted">{{ $bill->customer->address }}</p>
                @endif
            </div>
        </div>
        <div class="col-r">
            <div class="panel" style="text-align: left;">
                <p class="small muted">Location</p>
                <p style="font-weight: 500;">{{ $bill->location->name }}</p>
                <p class="small muted mono">{{ $bill->location->code }}</p>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th class="right" style="width: 12%;">Unit price</th>
                <th class="right" style="width: 10%;">Qty</th>
                <th class="right" style="width: 12%;">Disc.</th>
                <th class="right" style="width: 14%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($bill->items as $it)
                <tr>
                    <td>
                        {{ $it->product_name }}
                        <br>
                        <span class="muted mono small">{{ $it->product_sku }}</span>
                    </td>
                    <td class="right mono">{{ number_format($it->unit_price, 2) }}</td>
                    <td class="right mono">{{ $it->quantity }}</td>
                    <td class="right mono muted">
                        {{ (float)$it->discount_amount > 0 ? number_format($it->discount_amount, 2) : '—' }}
                    </td>
                    <td class="right mono" style="font-weight: 500;">{{ number_format($it->line_total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @php $cur = $business['currency'] ?? ''; @endphp
    <table class="totals">
        <tr>
            <td class="muted">Subtotal</td>
            <td class="right mono">{{ number_format($bill->subtotal, 2) }}</td>
        </tr>
        @if ((float)$bill->discount_amount > 0)
            <tr>
                <td class="muted">Discount</td>
                <td class="right mono">- {{ number_format($bill->discount_amount, 2) }}</td>
            </tr>
        @endif
        @if ((float)$bill->tax_total > 0)
            <tr>
                <td class="muted">Tax</td>
                <td class="right mono">{{ number_format($bill->tax_total, 2) }}</td>
            </tr>
        @endif
        <tr class="grand">
            <td>Grand total ({{ $cur }})</td>
            <td class="right mono">{{ number_format($bill->grand_total, 2) }}</td>
        </tr>
        <tr>
            <td class="muted">Paid</td>
            <td class="right mono" style="color: #047857;">{{ number_format($bill->paid_amount, 2) }}</td>
        </tr>
        @if ($due > 0)
            <tr>
                <td style="font-weight: 500;">Balance due</td>
                <td class="right mono" style="font-weight: 500; color: #B91C1C;">{{ number_format($due, 2) }}</td>
            </tr>
        @endif
    </table>

    <div style="clear: both;"></div>

    @if ($bill->notes)
        <div class="panel" style="margin-top: 20px;">
            <p class="small muted">Notes</p>
            <p>{{ $bill->notes }}</p>
        </div>
    @endif

    <div class="footer">
        <p class="mono">Generated {{ now()->format('d M Y H:i') }} &middot; {{ $business['name'] }}</p>
    </div>
</body>
</html>
