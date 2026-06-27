<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $payment->payment_number }}</title>
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
        .clearfix:after { content: ''; display: block; clear: both; }
        .col-l { width: 60%; float: left; }
        .col-r { width: 38%; float: right; text-align: right; }
        .big-amount { font-size: 28px; font-weight: 500; color: #047857; text-align: center; padding: 20px; background: #ECFDF5; border-radius: 6px; margin: 16px 0; }
        .footer { margin-top: 30px; padding-top: 8px; border-top: 1px solid #E2E8F0; color: #64748B; font-size: 10px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 500; background: #FEF2F2; color: #991B1B; }
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
        </div>
        <div class="col-r">
            <h1 style="font-size: 18px;">PAYMENT RECEIPT</h1>
            <p class="mono" style="font-size: 13px; margin-top: 4px;">{{ $payment->payment_number }}</p>
            <p class="mono muted">{{ $payment->payment_date->format('d M Y') }}</p>
            @if ($payment->status === 'cancelled')
                <p style="margin-top: 4px;"><span class="badge">Cancelled</span></p>
            @endif
        </div>
    </div>

    <div class="clearfix">
        <div class="col-l">
            <div class="panel">
                <p class="small muted">Received from</p>
                <p style="font-weight: 500;">
                    <span class="mono muted">{{ $payment->customer->code }}</span> &middot; {{ $payment->customer->name }}
                </p>
                @if ($payment->customer->phone)<p class="small muted mono">{{ $payment->customer->phone }}</p>@endif
                @if ($payment->customer->address)<p class="small muted">{{ $payment->customer->address }}</p>@endif
            </div>
        </div>
        <div class="col-r">
            <div class="panel" style="text-align: left;">
                <p class="small muted">Method</p>
                <p style="font-weight: 500; text-transform: capitalize;">{{ $payment->method }}</p>
                @if ($payment->reference)
                    <p class="small muted mono">Ref: {{ $payment->reference }}</p>
                @endif
                @if ($payment->check_number)
                    <p class="small muted mono">Check #{{ $payment->check_number }}{{ $payment->bank_name ? ' · '.$payment->bank_name : '' }}</p>
                @endif
            </div>
        </div>
    </div>

    <div class="big-amount mono">
        {{ $business['currency'] ?? '' }} {{ number_format($payment->amount, 2) }}
    </div>

    @if ($payment->allocations && $payment->allocations->count() > 0)
        <p class="small muted" style="margin-bottom: 4px;">Applied to invoices</p>
        <table>
            <thead>
                <tr>
                    <th>Invoice</th>
                    <th class="right" style="width: 20%;">Bill total</th>
                    <th class="right" style="width: 20%;">Applied</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($payment->allocations as $a)
                    <tr>
                        <td class="mono">{{ $a->bill->invoice_number ?? '—' }}</td>
                        <td class="right mono muted">{{ number_format($a->bill->grand_total ?? 0, 2) }}</td>
                        <td class="right mono" style="font-weight: 500; color: #047857;">{{ number_format($a->amount, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p class="small muted" style="text-align: center; padding: 12px;">Held as customer credit (not allocated to a specific invoice).</p>
    @endif

    @if ($payment->notes)
        <div class="panel" style="margin-top: 16px;">
            <p class="small muted">Notes</p>
            <p>{{ $payment->notes }}</p>
        </div>
    @endif

    <div class="footer">
        <p class="mono">Generated {{ now()->format('d M Y H:i') }} &middot; {{ $business['name'] }}</p>
    </div>
</body>
</html>
