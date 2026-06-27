<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $po->po_number }}</title>
    <style>
        @page { margin: 24px 28px; }
        body { font-family: DejaVu Sans, sans-serif; color: #1E293B; font-size: 11px; line-height: 1.5; }
        h1 { color: #0F172A; font-weight: 500; margin: 0; }
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
            @if (!empty($business['address']))<p class="muted small">{{ $business['address'] }}</p>@endif
            @if (!empty($business['phone']))<p class="muted small">{{ $business['phone'] }}</p>@endif
            @if (!empty($business['tax_id']))<p class="muted small mono">Tax ID: {{ $business['tax_id'] }}</p>@endif
        </div>
        <div class="col-r">
            <h1 style="font-size: 18px;">PURCHASE ORDER</h1>
            <p class="mono" style="font-size: 13px; margin-top: 4px;">{{ $po->po_number }}</p>
            <p class="mono muted">{{ $po->po_date->format('d M Y') }}</p>
            @if ($po->expected_date)
                <p class="muted small">Expected: {{ $po->expected_date->format('d M Y') }}</p>
            @endif
        </div>
    </div>

    <div class="clearfix">
        <div class="col-l">
            <div class="panel">
                <p class="small muted">Supplier</p>
                <p style="font-weight: 500;">
                    <span class="mono muted">{{ $po->supplier->code }}</span> &middot; {{ $po->supplier->name }}
                </p>
                @if ($po->supplier->phone)<p class="small muted mono">{{ $po->supplier->phone }}</p>@endif
                @if ($po->supplier->address)<p class="small muted">{{ $po->supplier->address }}</p>@endif
            </div>
        </div>
        <div class="col-r">
            <div class="panel" style="text-align: left;">
                <p class="small muted">Deliver to</p>
                <p style="font-weight: 500;">{{ $po->location->name }}</p>
                <p class="small muted mono">{{ $po->location->code }}</p>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th class="right" style="width: 12%;">Unit cost</th>
                <th class="right" style="width: 10%;">Qty</th>
                <th class="right" style="width: 14%;">Line total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($po->items as $it)
                <tr>
                    <td>{{ $it->product_name }}<br><span class="muted mono small">{{ $it->product_sku }}</span></td>
                    <td class="right mono">{{ number_format($it->unit_cost, 2) }}</td>
                    <td class="right mono">{{ $it->ordered_qty }}</td>
                    <td class="right mono" style="font-weight: 500;">{{ number_format($it->line_total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td class="muted">Subtotal</td><td class="right mono">{{ number_format($po->subtotal, 2) }}</td></tr>
        @if ((float)$po->freight > 0)<tr><td class="muted">Freight</td><td class="right mono">{{ number_format($po->freight, 2) }}</td></tr>@endif
        @if ((float)$po->other_charges > 0)<tr><td class="muted">Other</td><td class="right mono">{{ number_format($po->other_charges, 2) }}</td></tr>@endif
        <tr class="grand"><td>Grand total</td><td class="right mono">{{ number_format($po->total, 2) }}</td></tr>
    </table>

    <div style="clear: both;"></div>

    @if ($po->notes)
        <div class="panel" style="margin-top: 20px;">
            <p class="small muted">Notes</p>
            <p>{{ $po->notes }}</p>
        </div>
    @endif

    <div class="footer">
        <p class="mono">Generated {{ now()->format('d M Y H:i') }} &middot; {{ $business['name'] }}</p>
    </div>
</body>
</html>
