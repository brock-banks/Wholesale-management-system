<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Supplier statement — {{ $supplier->name }}</title>
    <style>
        @page { margin: 24px 28px; }
        body { font-family: DejaVu Sans, sans-serif; color: #1E293B; font-size: 11px; line-height: 1.5; }
        h1 { color: #0F172A; font-weight: 500; margin: 0; }
        .mono { font-family: DejaVu Sans Mono, monospace; }
        .right { text-align: right; }
        .muted { color: #64748B; }
        .small { font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; font-weight: 500; color: #64748B; font-size: 10px; padding: 6px 8px; background: #F8FAFC; border-bottom: 1px solid #CBD5E1; }
        td { padding: 5px 8px; border-bottom: 1px solid #E2E8F0; }
        .header { border-bottom: 2px solid #3F5A78; padding-bottom: 10px; margin-bottom: 14px; }
        .h-brand { color: #3F5A78; font-size: 22px; font-weight: 500; }
        .panel { background: #F8FAFC; padding: 10px 12px; margin-bottom: 12px; }
        .tiles { width: 100%; margin: 12px 0 14px; }
        .tiles td { background: #F1F5F9; padding: 8px 10px; border: 0; vertical-align: top; }
        .tiles .tile-label { color: #64748B; font-size: 10px; }
        .tiles .tile-value { font-size: 14px; font-weight: 500; color: #0F172A; }
        .clearfix:after { content: ''; display: block; clear: both; }
        .col-l { width: 60%; float: left; }
        .col-r { width: 38%; float: right; text-align: right; }
        .row-opening { background: #F8FAFC; font-style: italic; color: #64748B; }
        .row-closing { background: #F8FAFC; border-top: 2px solid #CBD5E1; font-weight: 500; color: #0F172A; }
        .pos { color: #047857; }
        .neg { color: #B91C1C; }
        .footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #E2E8F0; color: #64748B; font-size: 9px; }
    </style>
</head>
<body>
    <div class="header clearfix">
        <div class="col-l">
            @if (!empty($business['logo']))
                <img src="{{ $business['logo'] }}" alt="" style="max-height: 50px; max-width: 180px; margin-bottom: 6px;">
            @endif
            <p class="h-brand">{{ $business['name'] }}</p>
            <p class="muted small">Supplier statement</p>
            @if (!empty($business['address']))<p class="muted small">{{ $business['address'] }}</p>@endif
            @if (!empty($business['phone']))<p class="muted small">{{ $business['phone'] }}</p>@endif
            @if (!empty($business['tax_id']))<p class="muted small mono">Tax ID: {{ $business['tax_id'] }}</p>@endif
        </div>
        <div class="col-r">
            <h1 style="font-size: 18px;">STATEMENT</h1>
            <p class="mono muted" style="margin-top: 4px;">
                {{ \Carbon\Carbon::parse($filters['from'])->format('d M Y') }}
                &mdash;
                {{ \Carbon\Carbon::parse($filters['to'])->format('d M Y') }}
            </p>
        </div>
    </div>

    <div class="panel">
        <p class="small muted">Supplier</p>
        <p style="font-weight: 500;">
            <span class="mono muted">{{ $supplier->code }}</span> &middot; {{ $supplier->name }}
        </p>
        @if ($supplier->phone)<p class="small muted mono">{{ $supplier->phone }}</p>@endif
        @if ($supplier->address)<p class="small muted">{{ $supplier->address }}</p>@endif
    </div>

    <table class="tiles">
        <tr>
            <td><p class="tile-label">Opening</p><p class="tile-value mono">{{ number_format($opening, 2) }}</p></td>
            <td><p class="tile-label">Period debit (POs)</p><p class="tile-value mono neg">{{ number_format($totalDebit, 2) }}</p></td>
            <td><p class="tile-label">Period credit (paid)</p><p class="tile-value mono pos">{{ number_format($totalCredit, 2) }}</p></td>
            <td><p class="tile-label">Closing (we owe)</p><p class="tile-value mono {{ $closing > 0 ? 'neg' : ($closing < 0 ? 'pos' : '') }}">{{ number_format($closing, 2) }}</p></td>
        </tr>
    </table>

    <table>
        <thead>
            <tr>
                <th style="width: 14%;">Date</th>
                <th style="width: 14%;">Type</th>
                <th>Reference / Notes</th>
                <th class="right" style="width: 12%;">Debit</th>
                <th class="right" style="width: 12%;">Credit</th>
                <th class="right" style="width: 13%;">Balance</th>
            </tr>
        </thead>
        <tbody>
            <tr class="row-opening">
                <td class="mono">{{ $filters['from'] }}</td>
                <td>Opening</td>
                <td>Balance brought forward</td>
                <td class="right muted">—</td>
                <td class="right muted">—</td>
                <td class="right mono" style="font-weight: 500; color: #1E293B;">{{ number_format($opening, 2) }}</td>
            </tr>
            @foreach ($entries as $e)
                <tr>
                    <td class="mono">{{ $e['entry_date'] }}</td>
                    <td>{{ ucfirst($e['type']) }}</td>
                    <td>
                        @if ($e['reference'])
                            <span class="mono" style="color: #3F5A78;">{{ $e['reference']['label'] }}</span>
                            @if ($e['description'])<span class="small muted"> &middot; {{ $e['description'] }}</span>@endif
                        @else
                            <span class="muted">{{ $e['description'] ?? '—' }}</span>
                        @endif
                    </td>
                    <td class="right mono">{{ $e['debit'] > 0 ? number_format($e['debit'], 2) : '—' }}</td>
                    <td class="right mono pos">{{ $e['credit'] > 0 ? number_format($e['credit'], 2) : '—' }}</td>
                    <td class="right mono" style="font-weight: 500;">{{ number_format($e['running_balance'], 2) }}</td>
                </tr>
            @endforeach
            <tr class="row-closing">
                <td class="mono">{{ $filters['to'] }}</td>
                <td>Closing</td>
                <td>Balance carried forward</td>
                <td class="right mono">{{ number_format($totalDebit, 2) }}</td>
                <td class="right mono pos">{{ number_format($totalCredit, 2) }}</td>
                <td class="right mono {{ $closing > 0 ? 'neg' : ($closing < 0 ? 'pos' : '') }}">{{ number_format($closing, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <p class="small muted" style="margin-top: 12px;">Positive balance = you owe the supplier. Negative = supplier owes you (advance).</p>

    <div class="footer"><p class="mono">Generated {{ now()->format('d M Y H:i') }} &middot; {{ $business['name'] }}</p></div>
</body>
</html>
