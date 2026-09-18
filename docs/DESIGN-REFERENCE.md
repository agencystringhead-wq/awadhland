# Design reference: probate.help

Measured on 2026-09-18 from https://probate.help/ at a 1440 × 1000 viewport, using the site's stylesheet (`/_astro/Footer.*.css`, Tailwind 4 + custom layer) and computed styles read from the live DOM. Values marked *inline* come from `style=""` attributes that override the stylesheet. Values marked *screenshot* were read visually, not measured. Captures are in `docs/screenshots/reference/`.

This is a record of the reference, not our tokens. Our tokens are derived in Phase B and recorded in `app/globals.css`.

Re-verified against the live stylesheet (`/_astro/Footer.CzVtAyW7.css`, 22.7 KB) later the same day: every colour token, radius, shadow, `.btn*`, `.wrap`, `section`, `.eyebrow`, `.lede`, `.h-display`, `.heading-1/2`, `.italic-touch` and `body` rule below matches. The only `backdrop-filter` strings in the CSS are inside Tailwind's generated `transition-property` list; no rule applies one.

## 1. Colour tokens

| Role | Token on reference | Value |
| --- | --- | --- |
| Page background | `--paper` | `#f6f1e8` |
| Secondary panel / band | `--paper-2` | `#efe7d7` |
| Tertiary sand (nav strip, notice) | `--paper-3` | `#e6dac2` |
| Surface (cards, inputs, footer contact card) | `--vellum` | `#fbf7ef` |
| Surface highlight (gradient tops) | inline | `#fdfaf3`, `#fdf9f1` |
| Ink | `--ink` | `#1f1a14` |
| Ink 2 (body copy, ledes) | `--ink-2` | `#3b342a` |
| Ink 3 (muted, eyebrows, labels) | `--ink-3` | `#6b6053` |
| Ink 4 (faint) | `--ink-4` | `#978b7b` |
| Border / hairline | `--rule` | `#d9cdb6` |
| Accent | `--terracotta` | `oklch(62% .13 38)` ≈ `#c45f2a` |
| Accent deep (text accents, italic touch, links hover) | `--terracotta-deep` | `oklch(46% .13 36)` ≈ `#8f3d1a` |
| Accent soft (chips, focus ring) | `--terracotta-soft` | `oklch(86% .05 40)` |
| Secondary accent | `--sage`, `--sage-soft` | `oklch(62% .06 140)`, `oklch(88% .03 140)` |
| Stars, top-strip dot | `--gold` | `oklch(74% .1 78)` |
| Dark bands (tools, closing CTA, top strip) | `--ink` / inline | `#1f1a14`; strip `linear-gradient(#1a130a, #221a0e 30%, #1a130a 70%, #0a0703)` |
| Text on dark | `--vellum` at 0.7–0.82 alpha | `rgba(251,247,239,.78)` |

Border widths are **0.8px** everywhere borders are inline (cards, inputs, pills); the stylesheet's `.surface` uses 1px.

## 2. Font families

| Family | File | Weights | Used for |
| --- | --- | --- | --- |
| Fraunces (variable) | `fraunces-latin.woff2` + italic | 300–600 | Display headings, h3s, ledes, card titles, stat numbers, logo, review quotes. `font-variation-settings: "opsz" 144, "SOFT" 100` on display; `"opsz" 96` on heading-1; `"opsz" 60` on heading-2 |
| Instrument Serif | `instrument-serif-latin(-italic).woff2` | 400 | `.italic-touch`: the italic accent inside h1/h2, at `1.08em`, colour terracotta-deep |
| Inter (variable) | `inter-latin.woff2` | 300–700 | Body, buttons, nav, form inputs, card body copy |
| JetBrains Mono | `jetbrains-mono-latin.woff2` | 400–700 | Eyebrows, form labels, stat captions, footer column heads, meta lines ("HIRED · JUNE 2022"), bottom bar |

All four are self-hosted from `/fonts/`, preloaded (`<link rel=preload as=font>`), `font-display: swap` for the serifs and `optional` for Inter and Mono. Local fallbacks `Fraunces Display FB` / `Fraunces Text FB` map Georgia with `size-adjust` 92% / 106% and ascent/descent overrides to stop layout shift.

## 3. Type scale (measured at 1440)

| Role | Family | Size | Line-height | Letter-spacing | Weight | Colour |
| --- | --- | --- | --- | --- | --- | --- |
| Hero h1 | Fraunces display | 95px (*inline*, ≈6.6vw; stylesheet `.h-display` is `clamp(48px, 6.5vw, 88px)`) | 0.94 (89.3px) | −0.038em (−3.6px) | 320 | ink |
| h1 italic touch | Instrument Serif italic | 1.08em → 102.6px | 0.94 | inherits | 400 | terracotta-deep |
| Section h2, large | Fraunces display | 64–72px | 0.98–1.02 | −0.025 to −0.028em | 340–350 | ink |
| Section h2 italic touch | Instrument Serif italic | 1.08em → 69–73px | ≈1.0 | inherits | 400 | terracotta-deep |
| Closing CTA h2 (`.h-display`) | Fraunces display | 88px | 0.98 | −0.02em | 350 | vellum |
| `.heading-1` (stylesheet) | Fraunces | `clamp(36px, 4.5vw, 56px)` | 1.1 | −0.018em | 380 | |
| `.heading-2` (stylesheet) | Fraunces | `clamp(28px, 3vw, 40px)` | 1.1 | −0.01em | 400 | |
| Notice h2 (dark band) | Fraunces | 40px | 1.06 | −0.025em | 380 | white |
| Pillar h3 | Fraunces | 26px | 1.15 | −0.01em | 450 | ink |
| Card title (situation, guide, step) | Fraunces | 22px | 1.12–1.2 | −0.012 to −0.015em | 460–500 | ink |
| Big h3 (primer columns) | Fraunces | 36–38px | 0.98–1.02 | −0.025em | 360–380 | ink |
| Hero lede | Fraunces text | 24px | 1.45 (34.8px) | −0.005em | 300 | ink-2 |
| Section lede (`.lede`) | Fraunces text | `clamp(20px, 1.6vw, 24px)` → 20–22px | 1.45–1.5 | −0.005em | 300 | ink-2; on dark `rgba(251,247,239,.78)` |
| Body (`body`) | Inter | 17px | 1.55 (26.35px) | 0 | 400 | ink |
| Card body | Inter | 14–14.5px | 1.5–1.55 | 0 | 400 | ink-2 |
| Pillar body | Inter | 16px | 1.6 | 0 | 400 | ink-2 |
| Eyebrow (`.eyebrow`) | JetBrains Mono | 12px | 1.55 | 0.14em (1.68px) | 500 | ink-3; terracotta-deep when used as section marker; gold on dark |
| Form label | JetBrains Mono | 11px | 1.55 | 0.14em (1.54px) | 600 | ink-2, uppercase, margin-bottom 8px |
| Stat caption, footer col head | JetBrains Mono | 10px | 1.55 | 0.12–0.14em | 500–600 | ink-3 / ink, uppercase |
| Meta line ("HIRED · DATE", credential sub-line) | JetBrains Mono | 9.5px | 1.55 | 0.12em | 400 | ink-3, uppercase |
| Small note (hero, credential) | Fraunces text italic | 13px | 1.4–1.55 | 0 | 300 | ink-3 / ink-2 |
| Button | Inter | 15px (13px `.btn-sm`, 16px `.btn-lg`) | 1.55 | −0.005em | 500 (700 on header CTA, 600 on form submit) | |
| Nav tile | Fraunces 22px 600 −0.02em + italic sub 13.5px | | | | | |
| Logo | Fraunces 29–32px 500–600 −0.034em, terracotta italic "." + Mono 9px 600 tracking 0.14em sub-line | | | | | |
| Footer links | Inter 13.5px / 1.32, ink-2; terminal link terracotta-deep 600 | | | | | |
| Footer bottom bar | Mono 12px (©) + Inter 12px muted links; disclaimer Fraunces italic 12px | | | | | |

## 4. Layout and rhythm

| Property | Value |
| --- | --- |
| Container (`.wrap`) | `max-width: 1240px; padding: 0 32px` → 1176px content at ≥1240; 24px gutters ≤980; 18px ≤640 |
| Narrow container (`.wrap-narrow`) | 880px |
| Section padding (stylesheet default) | `96px 0`; 72px ≤980; 46px ≤640. `.sec-tight` 64px / 34px |
| Section padding actually used (*inline*, desktop) | hero 56 / 72; "by the numbers" band 24 / 24; primer 140; situations 120; first 72 hours 96; library 140; tools 120; why we exist 140; how we work 96; recently published 112; reviews 120; service area 96; planning 112; closing CTA 112 |
| Section backgrounds alternate | paper → vellum → paper-2 → ink, each with `border-top: 0.8px solid --rule` when adjacent tones are close |
| Grid gaps | 4-col card grids 16–24px; pillar grid 48px; hero form fields 14px; footer contact grid 40px |
| Column widths at 1440 | 4-col: 276px (gap 24) or 282px (gap 16); 3-col pillars 240px in an 816px narrow block; footer 5 × 235px |

Breakpoints in use: 1180 (hero collapses, nav sub-lines hide), 1080, 980, 900, 880, 860, 720, 640, 560.

## 5. Radii, shadows, glass

| Token | Value |
| --- | --- |
| `--r-xs / sm / md / lg / xl / pill` | 6 / 10 / 14 / 20 / 28 / 999px |
| Used: cards 14–20px; hero form card 18px; credential card 12px; situation cards 16px; step cards 20px; tools card 24px; portrait mobile card 24px; hero inputs 8px; base inputs 12px |
| `--shadow-sm` | `0 1px 2px #281e0f0a, 0 2px 6px #281e0f0a` |
| `--shadow-md` | `0 2px 8px #281e0f0d, 0 12px 32px #281e0f0f` |
| `--shadow-lg` | `0 4px 18px #281e0f14, 0 24px 60px #281e0f14` |
| Card "lift" recipe (*inline*, everywhere) | `inset 0 1px 0 rgba(255,255,255,.7–.9)`, `inset 0 -1px 0 rgba(40,30,15,.04–.06)`, plus a soft drop `0 1px 2px rgba(40,30,15,.04)` |
| Form card shadow | `inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(40,30,15,.04), 0 6px 20px -10px rgba(40,30,15,.18), 0 2px 6px -3px rgba(40,30,15,.08)` |
| Header shadow | `inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(40,30,15,.06), 0 2px 0 rgba(40,30,15,.03)` |
| Glass / backdrop-filter | **None.** No element on the page uses `backdrop-filter`. The "glass" feel comes from vertical gradients on opaque surfaces plus the inset white highlight |

## 6. Gradients

| Where | Value |
| --- | --- |
| Header (sticky, whole block) | `linear-gradient(#fdf9f1 0%, #f6f1e8 55%, #ede5d2 100%)` |
| Hero form card | `linear-gradient(#fbf7ef, #fdf9f1)` |
| Inputs, idle pills, soft buttons | `linear-gradient(#fdfaf3, #fbf7ef)` |
| Status pill, situation cards | `linear-gradient(#fbf7ef, #efe7d7)` |
| Credential card | `linear-gradient(rgba(255,255,255,.5), rgba(245,234,215,.4))` |
| Primary (ink) button, form submit | `linear-gradient(#2a2218, #15110a)` |
| Header CTA (terracotta) | `linear-gradient(#e88a4f 0%, #c45f2a 55%, #a04a1f 100%)` |
| Selected pill radio | `linear-gradient(oklch(62% .13 38), oklch(46% .13 36))` |
| Stat band | `linear-gradient(#f6f1e8, #fbf7ef)` |
| Top strip | dark ink gradient (above) with a `radial-gradient(rgba(196,140,80,.06), transparent 70%)` glow behind the left cluster |
| Gold dot | `radial-gradient(circle at 30% 25%, oklch(92% .17 72), oklch(68% .17 60) 70%, oklch(52% .15 50))` + `0 0 10px oklch(78% .18 65 / .7)` glow; 10px in the strip, 7px in the hero pill |
| Underlined link (`.link`) | 1px `background-image` underline of `currentColor`, `padding-bottom: 2px`, hover → terracotta-deep |

## 7. Buttons

| Variant | Padding | Font | Fill | Border | Shadow | Hover |
| --- | --- | --- | --- | --- | --- | --- |
| `.btn` base | 14px 22px, gap 10px | Inter 15px 500 −0.005em | | 1px transparent | | `transition: all .2s` |
| `.btn-primary` | 14/22 (53px tall) | 15px 500, vellum text | `--ink` | | | terracotta-deep bg + `translateY(-1px)` |
| `.btn-secondary` | 14/22 | ink text | transparent | 1px ink | | ink bg, vellum text |
| `.btn-soft` | 14/22 | ink | vellum | 1px rule | | paper-2 bg, ink-3 border |
| `.btn-warm` | 14/22 | white | `oklch(56% .14 38)` | | | terracotta-deep |
| `.btn-lg` | 18px 28px (60–62px tall) | 16px | | | | |
| `.btn-sm` | 9px 14px (40px tall) | 13px | | | | |
| Header CTA (*inline*) | 16px 28px (57px) | 16px 700 white | terracotta gradient | | `inset 0 1px 0 rgba(255,235,210,.55), inset 0 -1px 0 rgba(0,0,0,.22), 0 0 0 1px rgba(140,55,20,.55), 0 0 0 4px rgba(232,138,79,.18), 0 10px 22px rgba(196,95,42,.5), 0 4px 8px rgba(40,30,15,.18), 0 1px 2px rgba(40,30,15,.2)` | |
| Header "Text us" pill (*inline*) | 14px 20px (53px) | 15px 600 terracotta-deep | `linear-gradient(#fdfaf3, #f6f1e8)` | 0.8px `rgba(196,95,42,.35)` | `inset 0 1px 0 rgba(255,255,255,.7), inset 0 -1px 0 rgba(40,30,15,.06), 0 2px 6px rgba(40,30,15,.08)` | |
| Form submit (*inline*) | 18px 28px (60px), width 390px | 15.5px 600 vellum | ink gradient | none | `inset 0 1px 0 rgba(255,255,255,.15), inset 0 -1px 0 rgba(0,0,0,.5), 0 6px 16px rgba(40,30,15,.25), 0 1px 2px rgba(40,30,15,.15)` | |
| Tools tabs (on dark) | 12px 18px (47px) | 14px 500 | active: vellum bg, ink text; idle: transparent, vellum text, 0.8px `rgba(251,247,239,.25)` border | | | |
| Chip (`.chip`) | 6px 12px | 13px 500 ink-2 | paper-2 | 1px rule | | `.chip-warm` / `.chip-sage` tinted variants |
| Focus ring | `outline: 2px solid --terracotta; outline-offset: 3px`; inputs `box-shadow: 0 0 0 4px --terracotta-soft` | | | | | |

## 8. Card patterns

| Card | Size at 1440 | Surface | Border | Radius | Padding | Inside |
| --- | --- | --- | --- | --- | --- | --- |
| `.surface` (step cards) | 276px, 4-up, gap 24 | vellum | 1px rule | 20px | 28px | numeral Fraunces 56px 300 terracotta `−0.02em`; title Fraunces 22px 500 (margin 18/0/10); body Inter 14.5/1.55 ink-2 |
| Situation card | 282px, 4-up, gap 16 | gradient vellum→paper-2 | 0.8px rule | 16px | 28px 24px | eyebrow Mono 10px 500 0.14em ink-3 (mb 10); title Fraunces 22px 460; body Inter 14/1.5 ink-2; hairline; footer row: Mono 11px 400 caption + "Open →" Inter 13px 600 terracotta-deep |
| Guide card ("recently published") | 276px, 4-up, gap 24 | vellum | 0.8px rule | 14px | 28px 24px, gap 16 | "New" chip Mono 10px 600 in terracotta-soft, radius 999, 4px 10px; title Fraunces 22px 460; meta row Mono 11px uppercase ink-3 |
| Pillar (why we exist) | 240px, 3-up, gap 48, in an 816px block | none | hairline above the row (`padding-top: 48px; margin-top: 96px`) | | | eyebrow "01 — Calm" Mono 12px terracotta-deep (mb 16); h3 Fraunces 26px 450 (mb 14); body Inter 16/1.6 ink-2 |
| Stat cell ("by the numbers") | 196px, 6-up | none | `border-left: 1px rule` between cells | | 6px 24px, gap 4 | number Fraunces 22px 480 −0.02em ink; caption Mono 10px 500 0.12em ink-3 uppercase |
| Rating tile (reviews) | 479px | gradient vellum→#fdf9f1 | 0.8px rule | 16px | 26px 28px | "5.0" Fraunces 68px 380 terracotta-deep; 5 gold stars 17px; "8 VERIFIED REVIEWS" Mono 10px; hairline; award line; "See the profile →" link |
| Sub-score tile | 293px, 4-up | vellum | none | (*screenshot*) 12px | 16px 20px, gap 10 | label Mono 10px 500 0.1em ink-3; value Fraunces 22px 460 |
| Review card (*screenshot*) | ≈376px, 3-up, gap 24 | vellum | 0.8px rule | 20px | 28px | 5 gold stars + Mono 9.5px category right-aligned; quote Fraunces 17px 300 ink-2 in quotation marks; dotted hairline; name Fraunces 15px 500 + "HIRED · MONTH YEAR" Mono 9.5px |
| Tools card (on dark) | 1176px | vellum | none | 24px | (*screenshot*) 48px | `--shadow-lg` |
| Footer contact card | 620px | gradient vellum→#fdf9f1 | none | 14px | 22px 24px 24px | `inset 0 1px 0 rgba(255,255,255,.7), 0 4px 12px -8px rgba(40,30,15,.1)` |

## 9. Hero (measured at 1440)

| Element | Value |
| --- | --- |
| Section | `padding: 56px 0 72px`; background paper; height 1402px |
| Column split | Single text column `.hero-col { max-width: 54% }` = 635px, inside the 1176px container. There is **no second grid column**: the portrait is `position: absolute` in `.hero-floating`, `left: 792px` (right edge at 1267px, i.e. 173px from the viewport edge), top of the section, width 475px |
| Portrait | `rachel-feather-520.webp`, natural 860 × 1219, rendered 475 × 674, `object-fit: contain`, **mask** `linear-gradient(#000 40%, rgba(0,0,0,.55) 66%, transparent 88%)` (vertical fade to nothing at 88% of the image height). Below 1180px it moves into the flow as a 380px card: paper-2 bg, radius 24px, `--shadow-lg`, margin-top 56px |
| Left column order | status pill → h1 → lede → button row → small note → form card → credential card |
| Status pill | height 35px, `padding: 8px 14px 8px 10px`, gap 10, gradient vellum→paper-2, 0.8px rule, radius 999, inset highlight; 7px gold dot; text Mono 11px 500 0.1em uppercase ink-2; margin-bottom 28px |
| h1 | see scale: 95px / 0.94 / −0.038em / 320; margin-bottom 28px; width 635px; second line italic touch in terracotta-deep |
| Lede | Fraunces 24px / 1.45 / 300 ink-2, max-width 560px, margin-bottom 36px; trailing `<em>` is Fraunces italic in ink (not Instrument, not coloured) |
| Button row | gap 12px, margin-bottom 24px; primary `.btn-primary` 185 × 53 (14/22, 15px 500) + `.btn-soft` with the phone number 170 × 53 |
| Small note | Fraunces italic 13px / 1.55 300 ink-3, margin-bottom 56px |
| Form card | width 580px (max-width 580), `padding: 26px 30px 28px`, radius 18px, 0.8px rule, gradient vellum→#fdf9f1, shadow as in §5; sits **below** the hero text, still in the left column |
| Form head row | eyebrow with dot "WAITLIST · REOPENS…" Mono 11px terracotta-deep; then Fraunces 22px "Leave your details." + Instrument italic terracotta-deep "We'll call when intake reopens."; `padding-bottom: 14px; margin-bottom: 18px`, hairline below |
| Field grid | two rows of `grid-template-columns` 252/252 then 275/229 (name+phone, email+county), gap 14px, row margin 14px |
| Label | Mono 11px 600 0.14em uppercase ink-2, margin-bottom 8px |
| Input / select | height 51px (`padding: 13px 14px`, 15px 450 Inter), radius **8px**, 0.8px rule, gradient #fdfaf3→#fbf7ef, `inset 0 1px 0 rgba(255,255,255,.7), inset 0 1px 2px rgba(40,30,15,.04)`; select has a 12 × 8 chevron SVG at right with `padding-right: 32px`. Stylesheet base (used elsewhere): `padding: 14px 16px; font-size 16px; radius 12px; background vellum` |
| Pill radios | `<button type=button>` 40px tall, `padding: 9px 14px`, 13px 500, radius 999, gap ≈7px; idle: gradient #fdfaf3→#fbf7ef, 0.8px rule, ink-2 text; **selected**: gradient terracotta→terracotta-deep, 0.8px terracotta-deep border, white text, `inset 0 1px 0 rgba(255,255,255,.25), inset 0 -1px 0 rgba(0,0,0,.2), 0 2px 6px rgba(196,95,42,.25)`. Label above: Mono 11px + Fraunces italic 13px "— pick the closest" |
| Submit row | margin-top 14px, gap 14: submit 390 × 60 (18/28, 15.5px 600, ink gradient) + "or call 941.352.1006" Fraunces italic 13px with the number in terracotta-deep 500 |
| Trust line | margin-top 18px, `padding-top: 16px`, hairline above; gold star + Mono 11px 600 0.13em uppercase ink-2 items separated by "·" |
| Credential card | margin-top 24px, width 580, height 110, `padding: 14px 20px`, gap 18, radius 12px, 0.8px rule, gradient white .5→sand .4. Row: 16px shield icon; name Fraunces 15px 500 + sub Mono 9.5px 0.12em uppercase ink-3; `.hero-cred-note` Fraunces italic 13px ink-2 with `border-left: 1px rule; padding-left: 18px; flex: 240px`; right: 5 gold stars 13px + "RATED 5.0 / 5 ON LAWYERS.COM" Mono 9.5px, `margin-left: auto` |

## 10. Header

| Element | Value |
| --- | --- |
| Whole header | `position: sticky; top: 0`, 207px tall in three rows, gradient #fdf9f1→#f6f1e8 55%→#ede5d2, inset highlight/shadow as in §5; a 1px white horizontal gradient hairline at the top |
| Top strip (`.hdr-top`) | 45px, dark gradient (§6), `padding: 13px 32px`, Inter 12.5px 500 +0.005em; first item white 600 with glowing 10px gold dot; other items `rgba(255,235,210,.7)`; separators 1 × 18px vertical gradient hairlines `rgba(255,200,140,.55)` with `margin: 0 4px` and a `1px 0 0 rgba(0,0,0,.6)` shadow; right cluster: 5 gold stars + "Florida Bar member · 9 years" |
| Main row (`.hdr-main`) | 103px, `padding: 14px 32px`, `justify-content: space-between`, gap 16: logo left; right cluster = italic Fraunces "Office line · current clients" 14px over phone Fraunces 32px 600 −0.02em with "·" separators, 1px vertical hairline, "Text us" pill, terracotta CTA |
| Nav row | 101px, paper-3 band, 8 tiles 146px each, `padding: 26px 6px 28px`, `border-left: 1px rule`; name Fraunces 22px 600 −0.02em; sub Fraunces italic 13.5px ink-3 |

## 11. Footer

| Element | Value |
| --- | --- |
| Footer | background paper-2, `padding: 72px 0 32px` |
| Contact grid (`.footer-contact`) | `grid-template-columns: 620px 516px; gap 40px; margin-bottom 64px; padding-bottom 56px`, hairline below. Left: contact form card (§8). Right: logo, Inter 14px/1.55 muted description max-width 320 (mt 18), Inter 13px address (mt 22), row of "Text us" pill + "Call …" (mt 18) |
| Index grid (`.footer-grid`) | 5 × 235px, gap 0, `margin-bottom 56px`; each `.footer-col` `padding: 0 26px; border-left: 1px rule` (first col no border/left padding) |
| Column head | Mono 10px 600 0.14em uppercase ink, mb 5 |
| Column note | Inter 11.5px/1.35 ink-3, `border-bottom: 1px rule; padding-bottom 14px; margin-bottom 16px` |
| Links | Inter 13.5px/1.32 ink-2, `li` margin-bottom 14px, hanging indent (`text-indent −11px; padding-left 11px`); terminal "All … →" terracotta-deep 600, margin-top 16px |
| Bottom row | hairline, `margin-top 24px`: Mono 12px "© 2026 probate.help · Rachel Schadt Law" left; Inter 12px muted Privacy · Terms · Disclaimer · Accessibility right (gap 24); then Fraunces italic 12px disclaimer paragraph |
| ≤1180: 3 cols; ≤860: 2 cols; ≤560: stacked cards with 1px rule, radius 12, padding 18 |

## 12. Section pattern (order and framing on the homepage)

1. **Top strip** (dark) → **header** (logo · phone · Text us · CTA) → **nav tiles** (8, name + italic sub).
2. **Notice band** (dark ink gradient, 26/28 padding): red "INTAKE PAUSED" chip, h2 40px, lede 18px; right column with mono eyebrow, phone, italic note, small ink-on-vellum button.
3. **Hero** (§9): status pill → h1 with italic touch on line 2 → lede with a trailing plain italic → primary + soft button → italic note → form card → credential card. Portrait floats right with the feathered mask.
4. **Notice card** (paper, 56/72, hairline top): h2 with italic touch, lede, three link rows, illustration right.
5. **By the numbers** stat band (24/24, gradient paper→vellum, hairlines top and bottom): 6 cells, number 22px serif over mono caption, 1px rules between cells.
6. **The 3-minute primer** (140): eyebrow "— The 3-minute primer", h2 72px with italic touch, three columns each with a large serif h3 (36–38px) and copy.
7. **Start with your situation** (120): eyebrow, h2 68px with italic touch, mono count on the right, 4 × 2 situation cards.
8. **The first 72 hours** (vellum, 96): eyebrow, h2, four numbered items.
9. **The library** (vellum, 140): eyebrow, h2 64px, tabbed index with numbered columns "01 / 02 / 03…" in terracotta.
10. **Tools** (dark ink, 120): eyebrow, h2, lede on dark, pill tabs, one vellum tool card 24px radius.
11. **Why we exist** (140, narrow 816px block): eyebrow "— Why we exist"; h2 with **strikethrough** ("~~law firms~~") and a long italic-touch run; lede; hairline; three pillars with eyebrows **"01 — Calm", "02 — Clear", "03 — Connected"** (Arabic numerals in mono, not Roman).
12. **How we work** (paper-2, 96): eyebrow "How we work", h2 "Four steps. *That's the whole thing.*", underlined link right; four `.surface` step cards with 56px serif numerals "01–04".
13. **Recently published** (112): eyebrow, h2, four guide cards.
14. **Reviews** (paper-2, 120): two-column head (eyebrow + h2 with italic touch + lede | rating tile); **four sub-score tiles** (label + "5.0", no bars); 3 × 2 review cards; italic disclaimer + link.
15. **Service area** (vellum, 96): eyebrow, h2, county list.
16. **Trust & estate planning** (112): eyebrow, h2, two cards.
17. **Closing CTA** (dark ink, 112, centred): gold eyebrow, 88px display h2 with italic touch in a pale rose, lede at .78 alpha, warm + outline `.btn-lg`, mono credential row.
18. **Footer** (§11).

Framing rules that repeat: eyebrow (mono, uppercase, often with a leading "— ") → display h2 with one Instrument-italic phrase in terracotta-deep → one serif lede → hairline or gap → content. Every dark band uses the same ink `#1f1a14` and vellum text at 0.7–0.82 alpha.

## 13. Where the brief and the reference differ (decide before Phase B)

| Brief says | Reference does | Recommendation |
| --- | --- | --- |
| Roman numeral section markers (I, II, III) | Arabic "01 — Calm" mono eyebrows on pillars; "01–04" serif numerals on step cards; "01/02/03" on the library index | Use Arabic, mono, to match the reference. Say if you want Roman |
| Reviews with per-category rating **bars** | Four sub-score **tiles**: mono label + serif "5.0", no bar | Tiles, unless you want bars |
| Four-column mega footer | Five index columns plus a two-column contact grid above (form card + brand block) | Four index columns (Ayodhya / Lucknow / Gorakhpur / site) with the same column styling; contact grid above is optional, say if you want it |
| Glass header and glass cards (`backdrop-filter: blur(12px)`, rgba white .55) | No `backdrop-filter` anywhere; opaque gradients with inset white highlight | Reference's approach: cheaper on mobile and it is what the reference looks like. If you want real blur, it stays in the header only |
| Form card in the **right** column | Form card sits in the **left** column under the hero copy; the portrait floats right, absolutely positioned, feathered | Two options: (a) exact replica: form under the copy on the left, portrait floating right; (b) brief's layout: copy left, form card right, portrait behind/beside the form. The measured hero only supports (a); (b) is a new composition using the reference's card metrics |
| Eyebrow 12px, tracking 0.12em | Mono 12px 500, tracking 0.14em, leading "— " typed in the text | Adopt 0.14em and JetBrains Mono (or keep Inter and note it) |
| h1 `clamp(44px, 6vw, 72px)` / 1.02 / −0.02em, weight 600 | 95px at 1440 (≈6.6vw, stylesheet cap 88px), 0.94, −0.038em, weight 320 | Use measured: `clamp(48px, 6.5vw, 88px)`, line-height 0.96, −0.03em, weight 340–380 (Fraunces reads light at 320; Devanagari headings will need a separate weight) |
| Headings weight 600 (CLAUDE.md: Inter 600) | Display serif at 320–380; card titles 460–500; only nav/logo at 600 | Serif display at 350 for h1/h2, 460 for card titles; keep Inter 600 for labels and buttons. **This changes the CLAUDE.md "Inter 600 for headings" rule and the spec's design direction line; both need an edit** |
| Body 17px / 1.6 | 17px / 1.55 | 1.55 |
| Primary button 14/22, 15px semibold, inner highlight, hover lift | 14/22, 15px **500**, ink fill, hover → terracotta-deep + `translateY(-1px)`; inner highlight only on the gradient variants | Match reference; 600 only on the header CTA and form submit |
| Cards radius 20 | 14 / 16 / 18 / 20 / 24 by role | Use the per-role values |
| Section rhythm 112 / 72 | 96 base with 112–140 on hero-grade sections; 72 ≤980; 46 ≤640 | Section primitive with `size="base" | "lg" | "xl"` = 96 / 112 / 140, mobile 72 / 46 |
| Serif from Google Fonts, self-hosted | Fraunces + Instrument Serif + Inter + JetBrains Mono, all self-hosted woff2 with preload and local fallbacks | Add Fraunces (roman + italic) and Instrument Serif italic via fontsource, keep Inter; add JetBrains Mono only if we adopt the mono eyebrows (≈20 KB) |

## 14. Assets referenced

- Portrait: `https://probate.help/rachel-feather-520.webp` (860 × 1219, feathered edges baked into the file; the CSS mask only fades the bottom). Dev-only placeholder per the brief; must never ship.
- Icons: inline SVG, 16–17px, stroke 1.6, currentColor.

## 15. Header and accent, exact values (Step 3, re-fetched 2026-09-18)

Read from the inline styles on the live header; these override the stylesheet and are what the page renders.

| Element | Value |
| --- | --- |
| Accent (`--terracotta`) | `oklch(62% .13 38)` ≈ `#c45f2a` |
| Accent deep (`--terracotta-deep`), wordmark dot, "Text us" text | `oklch(46% .13 36)` ≈ `#8f3d1a` |
| Accent soft (`--terracotta-soft`) | `oklch(86% .05 40)` |
| Primary CTA gradient ("Join the waitlist") | `linear-gradient(180deg, #e88a4f 0%, #c45f2a 55%, #a04a1f 100%)` |
| Primary CTA shadow stack | `inset 0 1px 0 rgba(255,235,210,.55), inset 0 -1px 0 rgba(0,0,0,.22), 0 0 0 1px rgba(140,55,20,.55), 0 0 0 4px rgba(232,138,79,.18), 0 10px 22px rgba(196,95,42,.5), 0 4px 8px rgba(40,30,15,.18), 0 1px 2px rgba(40,30,15,.2)`; text-shadow `0 1px 0 rgba(0,0,0,.28)`; 16px 28px, 16px 700 white |
| Primary hover (stylesheet `.btn-warm:hover`, `.btn-primary:hover`) | background → terracotta-deep, `translateY(-1px)` |
| Icon-only CTA (mobile menu button) | same gradient, 40px circle, shadow `inset 0 1px 0 rgba(255,235,210,.55), inset 0 -1px 0 rgba(0,0,0,.22), 0 0 0 1px rgba(140,55,20,.55), 0 4px 10px rgba(196,95,42,.4)` |
| Secondary pill ("Text us", phone/text icon circles) | `linear-gradient(180deg, #fdfaf3 0%, #f6f1e8 100%)`, border `1px rgba(196,95,42,.35)`, text terracotta-deep 15px 600, shadow `inset 0 1px 0 rgba(255,255,255,.7), inset 0 -1px 0 rgba(40,30,15,.06), 0 2px 6px rgba(40,30,15,.08)`, 14px 20px |
| Top strip background | `linear-gradient(#1a130a, #221a0e 30%, #1a130a 70%, #0a0703)`; 1px top hairline `rgba(255,210,150,.08)`; centred radial glow `rgba(196,140,80,.06)`; padding 13px 32px (45px tall) |
| Top strip text | first item `#fff` 600 with text-shadow `0 1px 0 rgba(0,0,0,.7), 0 0 8px rgba(255,200,140,.15)`; other items `rgba(255,235,210,.7)`; right cluster `rgba(255,235,210,.78)`; Inter 12.5px 500, gap 14px |
| Top strip hairline | 1 × 18px, `linear-gradient(180deg, transparent, rgba(255,200,140,.55) 30%, rgba(255,200,140,.55) 70%, transparent)`, `box-shadow: 1px 0 0 rgba(0,0,0,.6)`, margin 0 4px |
| Amber dot | 10px, `radial-gradient(circle at 30% 25%, oklch(.92 .17 72), oklch(.68 .17 60) 70%, oklch(.52 .15 50))`, shadow `0 0 0 1px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.15), inset 0 -1px 0 rgba(0,0,0,.4), 0 0 10px oklch(.78 .18 65 / .7)` |
| Stars in the strip | `oklch(.86 .17 75)`, 11px, 0.05em |
| Header (brand bar wrapper) | `linear-gradient(180deg, #fdf9f1 0%, #f6f1e8 55%, #ede5d2 100%)`, border-bottom `1px #c9bba0`, shadow `inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(40,30,15,.06), 0 2px 0 rgba(40,30,15,.03)`; a 1px white horizontal gradient hairline at the top; `.hdr-main` padding 14px 32px |
| Wordmark | Fraunces 38px 500 −0.034em (29px ≤879), ink, text-shadow `0 1px 0 rgba(255,255,255,.6)`; dot terracotta-deep italic 500; sub-line mono 10.5px 600 0.24em uppercase ink-3, margin-top 6px |
| Phone block | italic Inter 14px ink-3 (mb 4) over Fraunces 32px 600 −0.02em ink with `·` separators; divider 1 × 44px `linear-gradient(180deg, transparent, rgba(40,30,15,.18), transparent)`; cluster gap 28px |
| Nav tier | `linear-gradient(180deg, #e3d7bb 0%, #d8c9a8 100%)`, border-top `1px #c9bba0`, border-bottom `1px #b8a880`, shadow `inset 0 1px 0 rgba(255,255,255,.6), inset 0 2px 4px rgba(40,30,15,.06), inset 0 -1px 0 rgba(40,30,15,.08)` |
| Nav tile | `flex: 1`; border-left `1px rgba(40,30,15,.1)` (none on first), border-right `1px rgba(255,255,255,.4)`; padding 26px 6px 28px; name Fraunces 22px 600 −0.02em ink with text-shadow `0 1px 0 rgba(255,255,255,.7)`; sub Inter italic 13.5px 500 ink-3, gap 8px; `transition: background .15s` (no active state in the markup) |
| Breakpoints | `bp-1180`, `bp-1080`, `bp-900`, `bp-880`, `bp-720` hide below those widths; the nav tier and the full brand cluster hide ≤879, replaced by 40px icon circles and the menu button |
| Mega menu | **None on the reference.** The tiles are plain links; the panel mechanics in Step 3 are ours |
