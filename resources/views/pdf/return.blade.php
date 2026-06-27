<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $return->return_number }}</title>
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
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 500; background: #FFFBEB; color: #92400E; }
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
            <h1 style="font-size: 18px;">CREDIT NOTE / RETURN</h1>
            <p class="mono" style="font-size: 13px; margin-top: 4px;">{{ $return->return_number }}</p>
            <p class="mono muted">{{ $return->return_date->format('d M Y') }}</p>
            @if ($return->bill)
                <p class="small muted">Against invoice <span class="mono">{{ $return->bill->invoice_number }}</span></p>
            @endif
        </div>
    </div>

    <div class="clearfix">
        <div class="col-l">
            <div class="panel">
                <p class="small muted">Customer</p>
                <p style="font-weight: 500;">
                    <span class="mono muted">{{ $return->customer->code }}</span> &middot; {{ $return->customer->name }}
                </p>
                @if ($return->customer->phone)<p class="small muted mono">{{ $return->customer->phone }}</p>@endif
                @if ($return->customer->address)<p class="small muted">{{ $return->customer->address }}</p>@endif
            </div>
        </div>
        <div class="col-r">
            <div class="panel" style="text-align: left;">
                <p class="small muted">Returned at</p>
                <p style="font-weight: 500;">{{ $return->location->name }}</p>
                <p class="small muted mono">{{ $return->location->code }}</p>
            </div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th class="right" style="width: 14%;">Unit price</th>
                <th class="right" style="width: 10%;">Qty</th>
                <th class="right" style="width: 16%;">Line total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($return->items as $it)
                <tr>
                    <td>{{ $it->product_name }}<br><span class="muted mono small">{{ $it->product_sku }}</span></td>
                    <td class="right mono">{{ number_format($it->unit_price, 2) }}</td>
                    <td class="right mono">{{ $it->quantity }}</td>
                    <td class="right mono" style="font-weight: 500;">{{ number_format($it->line_total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr class="grand">
            <td>Credit total ({{ $business['currency'] ?? '' }})</td>
            <td class="right mono">{{ number_format($return->total, 2) }}</td>
        </tr>
    </table>

    <div style="clear: both;"></div>

    @if ($return->reason)
        <div class="panel" style="margin-top: 20px;">
            <p class="small muted">Reason</p>
            <p>{{ $return->reason }}</p>
        </div>
    @endif

    <p class="small muted" style="margin-top: 14px;">
        This credit has been applied against the customer's ledger as a credit entry.
    </p>

    <div class="footer">
        <p class="mono">Generated {{ now()->format('d M Y H:i') }} &middot; {{ $business['name'] }}</p>
    </div>
</body>
</html>
