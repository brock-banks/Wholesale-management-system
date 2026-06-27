# Wholesale Management System — Style Guide

Locked design tokens for the project. All UI components should derive from these. Never hardcode a color, font, or spacing value not listed here.

---

## 1. Brand mood

- **Trustworthy** — money is sacred. Calm colors, clear hierarchy, no surprises.
- **Dense but readable** — wholesale users want lots of data per screen. Generous line height, tight padding.
- **Quiet, not playful** — no animations for fun. Animations only confirm an action.

---

## 2. Color tokens

### 2.1 Primary — muted blue

| Token | Hex | Use |
|---|---|---|
| `primary-50` | `#EFF3F8` | Surface, hover bg, secondary button bg |
| `primary-200` | `#C2D1E0` | Tint, focus ring tint, disabled |
| `primary-500` | `#5C7DA0` | Accent, links, active icons |
| `primary-700` | `#3F5A78` | **Primary** — main button, active nav, brand bar |
| `primary-900` | `#233649` | Strong text on light, headings on tinted bg |

### 2.2 Neutrals — slate

| Token | Hex | Use |
|---|---|---|
| `slate-50` | `#F8FAFC` | Page background |
| `slate-100` | `#F1F5F9` | Panel, table header bg, hover row |
| `slate-300` | `#CBD5E1` | Default input border |
| `slate-500` | `#64748B` | Muted text, helper, labels |
| `slate-800` | `#1E293B` | Body text |
| `slate-900` | `#0F172A` | Headings |

### 2.3 Semantic — status & money

| Token | Hex | Use |
|---|---|---|
| `success-bg` | `#ECFDF5` | Paid, Confirmed, In stock, Check cleared badge bg |
| `success` | `#047857` | Paid icon/text, money credit (`+ 30,000.00`) |
| `warning-bg` | `#FFFBEB` | Partial, Modified, On hold, Low stock badge bg |
| `warning` | `#B45309` | Warning text, low-stock number |
| `danger-bg` | `#FEF2F2` | Unpaid, Overdue, Out of stock, Bounced badge bg |
| `danger` | `#B91C1C` | Money debit (`- 50,000.00`), destructive button |
| `info-bg` | `#EFF3F8` | Pending, Reviewing, Check pending badge bg (= primary-50) |
| `info` | `#3F5A78` | Ref links (INV-####, RCT-####) (= primary-700) |

> Info uses the same blue as the primary brand — keeps the whole interface in one calm blue family.

---

## 3. Typography

- **UI font**: Inter (system fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)
- **Number / mono font**: JetBrains Mono (fallback: `ui-monospace, "Cascadia Code", Consolas, monospace`)
- **Two weights only**: 400 regular, 500 medium. Never 600 or 700.
- **Sentence case** everywhere. No Title Case. No ALL CAPS.

### Scale

| Token | Size | Weight | Use |
|---|---|---|---|
| `display` | 30px | 500 | Dashboard headline numbers |
| `h1` | 22px | 500 | Page titles |
| `h2` | 18px | 500 | Section titles, invoice numbers |
| `h3` | 16px | 500 | Card titles, sub-section labels |
| `body` | 14px | 400 | Default body text, table cells |
| `small` | 12px | 400 | Helper, captions, timestamps |
| `mono` | 13px | 400–500 | Money, refs, SKUs |

**Critical rule**: every numeric value (money, quantity, reference, SKU, date) renders in JetBrains Mono. This keeps columns aligned and prevents `1` vs `l` confusion.

---

## 4. Spacing

4px base. Use only: `4, 8, 12, 16, 24, 32, 48`.

Corner radius: `sm 6px, md 8px, lg 12px, pill 999px`.

---

## 5. Buttons

| Variant | Bg | Text | Border |
|---|---|---|---|
| Primary | `#3F5A78` | `#FFFFFF` | none |
| Secondary | `#EFF3F8` | `#2C4360` | none |
| Outline | transparent | `#1E293B` | `1px #CBD5E1` |
| Ghost | transparent | `#475569` | none |
| Danger | `#B91C1C` | `#FFFFFF` | none |

Sizes: `sm 6/10 padding, font 12px` · `default 8/14, font 13px` · `lg 10/18, font 14px`.

---

## 6. Status badges (wholesale-specific)

All badges: `font-size 11px, font-weight 500, padding 3px 9px, radius 999px`.

### Bills
| State | Bg | Text |
|---|---|---|
| Paid | `#ECFDF5` | `#065F46` |
| Partial | `#FFFBEB` | `#92400E` |
| Unpaid | `#FEF2F2` | `#991B1B` |
| Overdue | `#FEF2F2` | `#991B1B` |
| Draft | `#F1F5F9` | `#475569` |
| Cancelled | `#F1F5F9` | `#475569` |

### Orders
| State | Bg | Text |
|---|---|---|
| Pending | `#EFF3F8` | `#2C4360` |
| Reviewing | `#EFF3F8` | `#2C4360` |
| Modified | `#FFFBEB` | `#92400E` |
| Confirmed | `#ECFDF5` | `#065F46` |
| On hold | `#FFFBEB` | `#92400E` |
| Invoiced | `#F1F5F9` | `#475569` |

### Stock & checks
| State | Bg | Text |
|---|---|---|
| In stock | `#ECFDF5` | `#065F46` |
| Low stock | `#FFFBEB` | `#92400E` |
| Out of stock | `#FEF2F2` | `#991B1B` |
| Check pending | `#EFF3F8` | `#2C4360` |
| Check cleared | `#ECFDF5` | `#065F46` |
| Check bounced | `#FEF2F2` | `#991B1B` |

---

## 7. Money & numbers display

| Rule | Example |
|---|---|
| Always 2 decimals | `12,540.00` |
| Thousands separator (comma) | `1,248,500.00` |
| Currency before, space, mono | `PKR 12,540.00` |
| Credit / paid | `+ 30,000.00` in `#047857` |
| Debit / owed | `- 50,000.00` in `#B91C1C` |
| Zero state | `0.00` in `slate-500` |
| Tables | always right-aligned, always mono |

---

## 8. Form inputs

- Height: 38px
- Padding: 0 12px
- Border: `1px solid #CBD5E1`
- Radius: 8px
- Focus: `2px outline #3F5A78`, no shadow
- Label: 12px / 500 / `#334155`, 6px gap above input
- Helper: 11px / 400 / `#64748B`, 4px gap below input
- Currency input: `PKR` prefix in mono, value right-aligned mono

---

## 9. Cards

- White bg (`#FFFFFF`)
- Border: `0.5px solid #E2E8F0` or shadow-less
- Radius: 12px
- Padding: `16px 20px`
- Featured card (e.g., active invoice): `border-left: 3px solid #3F5A78`, radius 0

---

## 10. Tables

- Header row bg: `#F8FAFC`
- Header text: 11px / 500 / `#64748B`, sentence case
- Row divider: `0.5px solid #E2E8F0`
- Cell padding: `10px 14px`
- Money cells: right-aligned, mono
- Reference cells (INV-#, RCT-#): mono in `#3F5A78`
- Alternating row bg `#F8FAFC` (zebra) only on long tables (>10 rows)

---

## 11. Layout

- Page background: `#F8FAFC`
- Content max-width: 1280px
- Sidebar width: 240px (collapsible to 64px)
- Topbar height: 56px
- Page padding: 24px (mobile 16px)

---

## 12. Icons

- Library: Lucide React (`lucide-react` npm package)
- Stroke width: 1.5px (default Lucide)
- Sizes: 16px inline, 18px nav, 24px decorative max
- Color: inherits from text by default

---

## 13. Out of scope (Phase 1)

- Dark mode
- Animations beyond 150ms confirmation feedback
- Decorative gradients, shadows, glassmorphism
- Custom fonts beyond Inter + JetBrains Mono
- Emoji in UI
