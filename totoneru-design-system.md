# Design System — totoneru (Phantombuster-derived)

## 1. Visual Theme & Atmosphere

totoneru's surface feels like standing at a well-lit workbench inside a quiet room — warm paper under clean light, with a single lacquered tool sitting on the bench. The canvas is not white; it is a soft, barely-warm off-white that breathes like washi paper, occasionally stirred by slow-drifting aurora gradients in peach and periwinkle that never demand attention. Deep black sections appear for moments of focus (the tool showcase, the finisher band), creating a tonal rhythm of *paper → paper → ink → paper* that mirrors the app's own logical rhythm of *import → stage → commit → export*.

The signature move is the **animated aurora background** — two slow-drifting radial gradients (warm peach and cool periwinkle) on the paper surface, creating ambient motion that reads as alive but never distracting. Against this restraint, **sumi ink (`#1A1A1A`) is the voice** — used for display type, primary buttons, and structural marks — and **vermillion (`#D93A26`) is the decision** — reserved almost exclusively for the moment of committing a destructive action (apply, confirm, commit). Vermillion never decorates; it always means *this action will change your deck*.

Typography carries the weight. **Space Grotesk** at large display sizes with tight line-height (1.05–1.1) and near-black weight (600) does the heavy lifting — no illustrations are needed when the type itself is this confident. **Geist Mono** appears for technical metadata (field names, schema markers, deck stats), reinforcing the tool identity without shouting. Cards use barely-there borders (`rgba(26,26,26,0.08)`) and soft warm surfaces that look less like containers and more like pieces of paper resting on the bench.

**Key Characteristics:**
- Warm paper canvas (`#FAF7F2`), never pure white — washi-adjacent warmth
- Animated aurora background: two drifting radial gradients (peach `#FFD9A8` + periwinkle `#C8D0FF`) at 8–12% opacity, 40s+ cycle
- Sumi ink (`#1A1A1A`) as primary foreground — not pure black, has warmth
- Vermillion (`#D93A26`) reserved for commit/apply/confirm actions only — never decorative
- Space Grotesk (300–700 variable) as the typographic voice, used at display scale with tight tracking
- Geist Mono for all technical metadata, schema references, and code surfaces
- Soft warm card surfaces (`#F4EFE7`) with 16–20px radius and near-invisible borders
- Dual-mode section rhythm: paper sections alternate with sumi-black sections for tonal breaks

## 2. Color Palette & Roles

### Primary
- **Sumi Ink** (`#1A1A1A`): Primary foreground — display type, primary buttons, structural marks. Warm-black, not pure black.
- **Vermillion** (`#D93A26`): The decision color — commit, apply, confirm destructive actions. Used sparingly.
- **Paper** (`#FAF7F2`): Primary page canvas — warm off-white, washi-adjacent.

### Secondary & Accent
- **Peach Aurora** (`#FFD9A8`): Warm radial gradient stop for animated background
- **Periwinkle Aurora** (`#C8D0FF`): Cool radial gradient stop for animated background
- **Aurora Peach Translucent** (`rgba(255, 217, 168, 0.35)`): Overlay tint for feature card surfaces
- **Aurora Periwinkle Translucent** (`rgba(200, 208, 255, 0.30)`): Overlay tint for alternate feature cards

### Surface & Background
- **Paper** (`#FAF7F2`): Page canvas
- **Paper Elevated** (`#F4EFE7`): Soft warm card surface, resting on paper
- **Paper Sunken** (`#EFE9DD`): Inset surfaces, input wells, code backgrounds
- **Sumi Surface** (`#1A1A1A`): Dark section canvas (tool showcase, finisher band)
- **Sumi Elevated** (`#242424`): Cards on dark sections
- **Sumi Sunken** (`#0E0E0E`): Input wells and code blocks on dark sections

### Neutrals & Text (Light Mode)
- **Primary Text** (`#1A1A1A`): Display type, body headings, high-emphasis content
- **Secondary Text** (`#4A4744`): Body paragraphs, descriptions
- **Tertiary Text** (`#7A7671`): Metadata, captions, field labels
- **Muted Text** (`#A39E96`): Disabled states, low-emphasis labels
- **Border Default** (`rgba(26, 26, 26, 0.08)`): Standard card containment
- **Border Strong** (`rgba(26, 26, 26, 0.14)`): Hover states, focus rings
- **Divider** (`rgba(26, 26, 26, 0.06)`): Horizontal rules, table row dividers

### Neutrals & Text (Dark Mode / Sumi Sections)
- **Primary Text Inverted** (`#FAF7F2`): Display type on sumi surfaces
- **Secondary Text Inverted** (`#C9C4BC`): Body on sumi surfaces
- **Tertiary Text Inverted** (`#8A847B`): Metadata on sumi surfaces
- **Border Inverted** (`rgba(250, 247, 242, 0.08)`): Card containment on sumi
- **Border Inverted Strong** (`rgba(250, 247, 242, 0.14)`): Hover states on sumi

### Semantic
- **Commit / Apply** (`#D93A26`): Vermillion — the decision color. Used only for actions that mutate the user's deck.
- **Commit Hover** (`#C23220`): Vermillion, slightly darkened for hover state
- **Commit Translucent** (`rgba(217, 58, 38, 0.10)`): Vermillion tint for commit-action surfaces (diff rows about to be applied, confirmation card backgrounds)
- **Success** (`#4A7A4E`): Muted forest — successful backup, import complete, export finished. Distinct from vermillion.
- **Warning** (`#B8873A`): Muted amber — dry-run warnings, schema concerns
- **Info** (`#3A5FA8`): Muted indigo — informational helpers, aizome-adjacent
- **Error** (`#A8321A`): Darker vermillion for error states only — kept distinct from commit so commit never reads as "error"

### Gradient System
- **Aurora Background**: Two stacked radial gradients on paper canvas, animated
  - Layer 1: `radial-gradient(circle at 20% 30%, #FFD9A8 0%, transparent 45%)` — peach
  - Layer 2: `radial-gradient(circle at 75% 60%, #C8D0FF 0%, transparent 45%)` — periwinkle
  - Animated via slow (40s+) CSS keyframes drifting the position values
- **Finisher Gradient**: `linear-gradient(135deg, #FFD9A8 0%, #F4EFE7 40%, #C8D0FF 100%)` — used once at the bottom of a long page for a closing visual
- **Sumi Card Gradient**: `linear-gradient(180deg, #242424 0%, #1A1A1A 100%)` — subtle vertical gradient on dark section cards for depth

## 3. Typography Rules

### Font Family
- **Primary**: `Space Grotesk` (variable, weight range 300–700). Fallbacks: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `system-ui`, sans-serif.
- **Monospace**: `Geist Mono` (weight 400). Fallbacks: `ui-monospace`, `SFMono-Regular`, `Menlo`, `Monaco`, monospace.
- **OpenType features**: `'ss01', 'ss02', 'cv11'` enabled globally on Space Grotesk for more geometric, less quirky glyphs. `'zero', 'ss02'` on Geist Mono to force slashed zero for data contexts.

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|--------|-------------|----------------|-------|
| Display XL | 72px | 600 | 1.02 | -0.02em | Hero statements, section openers. Use sparingly. |
| Display L | 56px | 600 | 1.05 | -0.015em | "A better way to..." section headers |
| Display M | 40px | 600 | 1.10 | -0.01em | Feature section headlines |
| Display S | 32px | 500 | 1.15 | -0.005em | Sub-section heads, pricing tier names |
| Heading L | 24px | 500 | 1.25 | 0em | Card titles, modal headers |
| Heading M | 20px | 500 | 1.30 | 0em | In-card section titles, form group labels |
| Heading S | 18px | 500 | 1.35 | 0em | Dense UI titles, table column heads |
| Body L | 18px | 400 | 1.55 | 0em | Marketing paragraph text, prose |
| Body | 16px | 400 | 1.55 | 0em | Primary body text, descriptions |
| Body S | 14px | 400 | 1.50 | 0.005em | UI labels, compact contexts, field descriptions |
| Button | 15px | 500 | 1.0 | 0.005em | Primary/secondary button labels |
| Button S | 13px | 500 | 1.0 | 0.01em | Compact button labels |
| Nav Link | 15px | 500 | 1.0 | 0em | Top navigation items |
| Caption | 13px | 500 | 1.40 | 0.005em | Timestamps, small metadata |
| Micro | 11px | 600 | 1.30 | 0.04em | Badges, tags, uppercase labels |
| Code | 14px (Geist Mono) | 400 | 1.55 | 0em | Code blocks, schema markers |
| Code S | 12px (Geist Mono) | 400 | 1.50 | 0em | Inline code, field names in metadata |

### Principles
- **Negative tracking on display**: Space Grotesk has slightly wide default spacing; tighten it (-0.01em to -0.02em) at display sizes for a confident, resolved feel. Do not tighten body text.
- **Weight 500 as UI baseline**: all interactive elements (buttons, nav, card titles) use 500, not 600 or 400. Creates a consistent "this is interactive" weight signal.
- **Display weight ceiling at 600**: never use 700 for display. 600 is already heavy enough on paper; 700 feels like shouting.
- **Geist Mono for data, Space Grotesk for voice**: never mix them mid-sentence. Field names, deck counts, timestamps, and schema markers are always mono. Headlines and prose are always sans.
- **No italics in UI**: Space Grotesk italics are acceptable in prose/blog content but never in component labels or button text.

## 4. Component Stylings

### Buttons

**Primary (Sumi Pill)** — the default for most actions
- Background: `#1A1A1A` (sumi ink)
- Text: `#FAF7F2` (paper), weight 500, 15px
- Padding: 12px 24px
- Border-radius: 999px (full pill)
- Border: none
- Shadow: `0 1px 2px rgba(26, 26, 26, 0.08)`
- Hover: background darkens to `#000000`, shadow intensifies to `0 2px 6px rgba(26, 26, 26, 0.12)`
- Transition: `background 180ms ease, box-shadow 180ms ease`

**Commit (Vermillion Pill)** — used only for destructive/mutating actions
- Background: `#D93A26` (vermillion)
- Text: `#FAF7F2`, weight 500, 15px
- Padding: 12px 24px
- Border-radius: 999px
- Shadow: `0 1px 2px rgba(217, 58, 38, 0.16)`
- Hover: background `#C23220`, shadow `0 2px 8px rgba(217, 58, 38, 0.24)`
- **Never use for cancel, back, or navigation.** Reserved for apply/commit/export/confirm.

**Secondary (Paper Button)** — for secondary actions on paper surfaces
- Background: `#FAF7F2`
- Text: `#1A1A1A`, weight 500, 15px
- Padding: 12px 20px
- Border-radius: 10px
- Border: `1px solid rgba(26, 26, 26, 0.12)`
- Shadow: `0 1px 2px rgba(26, 26, 26, 0.04)`
- Hover: background `#F4EFE7`, border `rgba(26, 26, 26, 0.18)`

**Ghost Button** — for tertiary actions, filter chips
- Background: transparent
- Text: `#4A4744`, weight 500, 14px
- Padding: 8px 14px
- Border-radius: 8px
- Hover: background `rgba(26, 26, 26, 0.05)`, text `#1A1A1A`

**Link with Arrow** — the Phantombuster-style "See enrichment solutions →"
- Background: `#F4EFE7`
- Text: `#1A1A1A`, weight 500, 15px
- Padding: 14px 20px
- Border-radius: 10px
- Includes right-side arrow icon (16px), 8px gap from text
- Hover: background `#EFE9DD`, arrow translates 2px right
- Transition: `background 180ms ease, transform 180ms ease` (on the arrow)

### Cards & Containers

**Paper Card** — the standard card on light sections
- Background: `#F4EFE7`
- Border: `1px solid rgba(26, 26, 26, 0.06)`
- Border-radius: 20px
- Padding: 32px
- Shadow: `0 1px 3px rgba(26, 26, 26, 0.03)`
- Hover (if interactive): border `rgba(26, 26, 26, 0.10)`, shadow `0 4px 12px rgba(26, 26, 26, 0.06)`

**Aurora Card** — feature cards with gradient overlay (stats row style)
- Background: `#F4EFE7` base with radial gradient overlay at 30% opacity
- Variants: peach aurora, periwinkle aurora, warm yellow aurora
- Border: `1px solid rgba(26, 26, 26, 0.06)`
- Border-radius: 20px
- Padding: 40px
- No shadow — the gradient provides visual interest

**Sumi Card** — cards on dark sections
- Background: `#242424` with optional linear gradient to `#1A1A1A`
- Border: `1px solid rgba(250, 247, 242, 0.06)`
- Border-radius: 20px
- Padding: 32px
- Text colors: `#FAF7F2` heading, `#C9C4BC` body

**Diff Row (totoneru-specific)** — for preview/dry-run rows
- Background (unchanged): `#FAF7F2`
- Background (staged): `rgba(217, 58, 38, 0.06)` — faint vermillion tint
- Background (committed): `rgba(74, 122, 78, 0.06)` — faint forest tint
- Left border: 3px solid, color matches state (transparent / vermillion / forest)
- Padding: 12px 16px
- Border-radius: 8px

### Inputs & Forms

**Text Input**
- Background: `#FAF7F2`
- Border: `1px solid rgba(26, 26, 26, 0.12)`
- Border-radius: 10px
- Padding: 12px 16px
- Font: Space Grotesk 15px weight 400
- Placeholder color: `#A39E96`
- Focus: border `#1A1A1A`, shadow `0 0 0 3px rgba(26, 26, 26, 0.08)`
- No focus ring color shift — the shadow ring is sumi-toned to stay calm

**Email Input with Inline Button** (Phantombuster hero pattern)
- Wrapper: `#FAF7F2` background, 12px radius, 6px padding, `1px solid rgba(26,26,26,0.08)` border, `0 2px 8px rgba(26,26,26,0.06)` shadow
- Input inside: transparent background, no border, flex-grow
- Button inside: sumi pill (primary), no radius adjustment needed — full pill sits inside rounded wrapper

**Code / Mono Input** — for field name editing, template editing
- Background: `#EFE9DD`
- Font: Geist Mono 14px
- Border-radius: 8px
- Padding: 10px 14px
- Border: `1px solid rgba(26, 26, 26, 0.08)`

### Navigation

**Floating Pill Nav** — Phantombuster-style top nav
- Container: `#FAF7F2` background, `1px solid rgba(26,26,26,0.08)` border, 999px radius (full pill)
- Padding: 8px 16px
- Shadow: `0 4px 16px rgba(26, 26, 26, 0.04)`
- Sits 20px from top, centered or offset, floating over the aurora background
- Nav items: ghost buttons, 15px weight 500
- Right-side CTA: primary sumi pill button
- Left-side logo: Space Grotesk 18px weight 600, "totoneru" wordmark

### Badges & Tags

**Status Badge** (e.g., "staged", "committed", "dry-run")
- Padding: 4px 10px
- Border-radius: 999px
- Font: Space Grotesk 11px weight 600, uppercase, letter-spacing 0.04em
- Variants:
  - Neutral: `#EFE9DD` bg, `#4A4744` text
  - Staged: `rgba(217, 58, 38, 0.10)` bg, `#A8321A` text
  - Committed: `rgba(74, 122, 78, 0.12)` bg, `#2E5C33` text
  - Warning: `rgba(184, 135, 58, 0.12)` bg, `#8A6528` text

**Schema Badge** (for `collection.anki21b` marker)
- Geist Mono 12px weight 400
- Background: `#EFE9DD`, border-radius 6px, padding 3px 8px

### FAQ Accordion
- Row: `#FAF7F2` background, `1px solid rgba(26,26,26,0.08)` border, 12px radius, 24px 28px padding
- Question: Space Grotesk 18px weight 500
- Chevron: 16px, `#7A7671`, rotates 180deg on open
- Open state: border `rgba(26,26,26,0.14)`, answer appears with `#4A4744` body text
- Spacing between rows: 12px

### Image Treatment
- Product screenshots: 16px border-radius, `0 8px 24px rgba(26, 26, 26, 0.08)` shadow
- Screenshots of totoneru app UI sit on the paper canvas without additional frame — the screenshot's own chrome provides the frame
- Illustrations (like the Phantombuster ghost-in-gradient card): Aurora Card container with centered illustration at 50–60% of card width

## 5. Layout Principles

### Spacing System
- **Base unit**: 4px
- **Scale**: 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128
- **Section padding**: 96px–128px vertical between major sections on desktop; 64px on mobile
- **Card padding**: 24px (compact), 32px (standard), 40px (feature card)
- **Component gaps**: 8px tight, 16px standard, 24px loose

### Grid & Container
- **Max width**: 1280px, centered, with 32px horizontal padding minimum on desktop
- **Content max width**: 720px for prose sections (keeps reading line length comfortable)
- **Column patterns**:
  - Hero: single-column centered
  - Feature grid: 3 columns on desktop, 2 on tablet, 1 on mobile
  - Split feature (text left, visual right): 50/50 on desktop, stacked on mobile
  - Stats row: 3 equal columns, always

### Whitespace Philosophy
- **Generous vertical breathing room**: 96–128px between major sections is the norm, not the exception. The aurora background needs space to be felt.
- **Type-dominant hero**: the hero is headline + subhead + single CTA. No imagery, no illustrations. The aurora background is the image.
- **Dense product, sparse marketing**: the diff preview and card browser can be information-dense. Marketing sections around them are deliberately sparse.

### Border Radius Scale
- **4px**: Micro-elements, inline badges
- **6px**: Schema badges, small mono chips
- **8px**: Ghost buttons, code inputs, diff rows
- **10px**: Secondary buttons, text inputs
- **12px**: FAQ rows, inline widgets, small cards
- **16px**: Standard cards, screenshots
- **20px**: Feature cards, aurora cards
- **999px (full pill)**: Primary buttons, commit buttons, floating nav, status badges

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Level 0 (Flat) | No shadow | Page background, aurora layer, flat text blocks |
| Level 1 (Resting) | `0 1px 2px rgba(26, 26, 26, 0.04)` | Buttons at rest, cards at rest |
| Level 2 (Raised) | `0 1px 3px rgba(26, 26, 26, 0.06)` + `0 1px 2px rgba(26, 26, 26, 0.04)` | Paper cards, standard elevation |
| Level 3 (Floating) | `0 4px 16px rgba(26, 26, 26, 0.04)` + `0 1px 3px rgba(26, 26, 26, 0.03)` | Floating nav, email-input wrapper |
| Level 4 (Modal) | `0 12px 32px rgba(26, 26, 26, 0.10)` + `0 2px 8px rgba(26, 26, 26, 0.04)` | Dropdowns, popovers, modal dialogs |
| Level 5 (Overlay) | `0 24px 48px rgba(26, 26, 26, 0.16)` + `0 4px 12px rgba(26, 26, 26, 0.06)` | Confirmation dialogs (commit actions) |

### Shadow Philosophy
Shadows on paper are soft, warm, and short-range — they should feel like an object resting on paper under diffuse natural light, not like a UI element floating in digital space. Never use blue-tinted shadows. Never use pure-black shadows at high opacity. Stack two shadows at different blurs (a short tight one + a longer soft one) for any elevation above Level 1 to simulate realistic light.

### The Aurora Layer (decorative depth)
The animated aurora sits at the **back of the page** as a fixed layer, not attached to any element. Implementation:

```css
.aurora {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at var(--x1, 20%) var(--y1, 30%), #FFD9A8 0%, transparent 45%),
    radial-gradient(circle at var(--x2, 75%) var(--y2, 60%), #C8D0FF 0%, transparent 45%);
  opacity: 0.35;
  animation: aurora-drift 48s ease-in-out infinite;
}

@keyframes aurora-drift {
  0%, 100% { --x1: 20%; --y1: 30%; --x2: 75%; --y2: 60%; }
  33%      { --x1: 30%; --y1: 55%; --x2: 65%; --y2: 35%; }
  66%      { --x1: 15%; --y1: 45%; --x2: 80%; --y2: 70%; }
}
```

Requires `@property` declarations for `--x1`, `--y1`, `--x2`, `--y2` in modern browsers for smooth animation. Cycle length 40–60s. Opacity 30–40% — any stronger competes with content. Disable animation under `prefers-reduced-motion: reduce` and fall back to a static gradient.

## 7. Do's and Don'ts

### Do
- Use `#FAF7F2` (warm paper), not pure white, for the page canvas — the warmth is the brand.
- Reserve vermillion `#D93A26` strictly for commit/apply/confirm actions that mutate the user's deck.
- Run the aurora background at 30–40% opacity and 40s+ cycle length — it must be almost subliminal.
- Use Space Grotesk at 600 weight for display, 500 for UI, 400 for body — never deviate.
- Use Geist Mono for all technical metadata (field names, schema markers, deck counts, timestamps).
- Pair every elevation above Level 1 with two stacked shadows (short + long) for realistic warm depth.
- Use full-pill (999px) radius for primary buttons and nav; 20px for cards — the contrast is intentional.
- Disable aurora animation under `prefers-reduced-motion` and fall back to a static gradient.
- Alternate paper and sumi sections to create tonal rhythm across long pages.

### Don't
- Use pure black (`#000000`) for text or buttons — sumi `#1A1A1A` has necessary warmth.
- Use vermillion for cancel, back, delete-from-UI, or any non-commit action. It breaks the semantic contract.
- Use vermillion as a brand-decoration color on landing pages, icons, or illustrations.
- Run the aurora at full opacity or fast cycle length — it will read as gimmicky and tire the eye.
- Mix Space Grotesk and Geist Mono within a sentence. They have different jobs.
- Use italic type in any UI component label.
- Use blue-tinted or cool-gray shadows — shadows must stay warm to sit correctly on paper.
- Apply green (`#4A7A4E`) as a brand/decorative color — it is strictly reserved for success-state semantics.
- Stack more than two elevation levels on a single screen — pick one hero elevation and keep the rest at Level 1–2.

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | Single column, hero Display XL → 44px, nav collapses to hamburger, aurora reduced to single gradient, section padding 64px |
| Tablet | 640–1024px | 2-column feature grids, nav visible but condensed, hero 56px, section padding 80px |
| Desktop | 1024–1280px | 3-column grids active, full nav, hero 64–72px, section padding 96–128px |
| Large | >1280px | Max-width container centered at 1280px with generous side margins, full typographic scale |

### Touch Targets
- All buttons minimum 44×44px tap area (pill buttons meet this via 12px 24px padding + 15px text)
- FAQ rows minimum 56px tall
- Nav links minimum 44px tall with padding

### Collapsing Strategy
- **Floating pill nav**: full-width pill on desktop → hamburger icon in compact pill on mobile, opens a full-screen paper overlay
- **Hero**: Display XL 72px → 44px on mobile; subhead 18px → 16px; email-input stays horizontal until <480px, then stacks
- **Feature grids**: 3-col → 2-col → 1-col at 1024px and 640px breakpoints
- **Stats row**: always 3 columns but cards shrink padding 40px → 24px → 20px on mobile
- **Split features**: text-and-visual 50/50 → stacked (text above visual) at <768px

### Aurora on Mobile
- Drop to a single radial gradient (peach only) at 40% opacity
- Reduce animation cycle to 60s+ to save battery
- Honor `prefers-reduced-motion` at all sizes

### Image Behavior
- Screenshots retain 16px radius and warm shadow at all sizes
- Illustrations scale proportionally within aurora cards; never stretch
- No lazy-loading placeholders with skeleton shimmer — use a static paper-tone (`#EFE9DD`) block instead; shimmer fights the calm aesthetic

## 9. Agent Prompt Guide

### Quick Token Reference
- Page canvas: Paper `#FAF7F2`
- Primary foreground: Sumi `#1A1A1A`
- Commit action: Vermillion `#D93A26`
- Card surface: Paper Elevated `#F4EFE7`
- Border: `rgba(26, 26, 26, 0.08)`
- Body text: `#4A4744`
- Metadata: `#7A7671`
- Primary font: Space Grotesk (300–700 variable)
- Mono font: Geist Mono (400)

### Example Component Prompts

- "Create a hero section on `#FAF7F2` canvas with a fixed animated aurora layer (peach `#FFD9A8` + periwinkle `#C8D0FF` radial gradients at 35% opacity, 48s drift cycle). Display 72px Space Grotesk weight 600 tight tracking (-0.02em) in `#1A1A1A`, subhead 18px weight 400 in `#4A4744`, and a centered email-input wrapper (`#FAF7F2` bg, 12px radius, 6px padding, Level 3 shadow) with an inline sumi pill primary button."

- "Design a stats card row with three aurora cards (peach, periwinkle, warm yellow tints at 30% opacity over `#F4EFE7` base), 20px border-radius, 40px padding, `1px solid rgba(26,26,26,0.06)` border. Numbers in Space Grotesk 56px weight 600, labels in 16px weight 400 `#4A4744`. No shadow — gradient provides depth."

- "Build a diff preview row for a staged transformation. `rgba(217, 58, 38, 0.06)` background, 3px left border in `#D93A26`, 12px 16px padding, 8px radius. Field name in Geist Mono 14px, old value struck through in `#A39E96`, new value in `#1A1A1A` weight 500. Right-side status badge: vermillion pill with 'STAGED' in 11px weight 600 uppercase."

- "Create the commit confirmation dialog. Modal on sumi `#1A1A1A` backdrop at 50% opacity. Dialog: `#FAF7F2` bg, 20px radius, Level 5 shadow, 40px padding. Heading in Space Grotesk 24px weight 500 'Apply 247 changes to your deck?'. Body in 16px `#4A4744`. Buttons: secondary paper button 'Cancel' + vermillion pill 'Apply changes' right-aligned."

- "Build a FAQ accordion row. `#FAF7F2` bg, 12px radius, `1px solid rgba(26,26,26,0.08)` border, 24px 28px padding. Question in Space Grotesk 18px weight 500. Chevron icon `#7A7671` rotates 180deg on open. Open state reveals answer in 16px weight 400 `#4A4744`, top margin 16px."

### Iteration Checklist
1. Canvas is `#FAF7F2` (warm), never pure white — check a color picker to be sure.
2. Vermillion `#D93A26` appears only on commit/apply/confirm actions — never as brand decoration or cancel/back.
3. Aurora background is at 30–40% opacity with a 40s+ drift cycle and respects `prefers-reduced-motion`.
4. All elevated elements have two stacked warm shadows (short + long), not a single flat shadow.
5. Space Grotesk display type is at weight 600 with tight tracking (-0.01em to -0.02em); body stays at 400 with neutral tracking.
6. Geist Mono is used for every piece of technical metadata (schema names, field labels, deck counts) and nowhere else.
7. Primary buttons and nav use full-pill radius (999px); cards use 20px — the contrast is intentional, not a mistake.

---

## Implementation Notes (totoneru-specific, not generic design system)

- **Semantic color mapping to app state**: `original` surfaces use Paper; `staged` surfaces use vermillion-translucent; `committed` surfaces use forest-translucent; `backup` surfaces use sumi. The color tells the user which layer they're looking at.
- **Mono-for-data discipline**: every deck stat (`1,247 notes`, `3 note types`, `collection.anki21b`) is Geist Mono. Every piece of prose is Space Grotesk. The user learns this distinction quickly and it becomes a silent UI affordance.
- **The aurora is off in workspace view**: on marketing/landing pages the aurora animates. Inside the actual tool (import → preview → commit flow), the aurora is reduced to a static gradient or removed entirely. Motion in the workspace must only come from user action.
- **Dark mode is not ready in this spec**: the sumi surfaces described above are for *marketing dark sections*, not a full dark-mode workspace theme. Full dark mode is a future concern and would require re-mapping the entire semantic layer.
