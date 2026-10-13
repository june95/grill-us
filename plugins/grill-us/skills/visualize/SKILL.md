---
name: visualize
description: >
  Create beautiful, self-contained HTML visualizations from any content or idea.
  Use for: slide decks, presentations, infographics, dashboards, flowcharts, diagrams,
  timelines, comparison tables, data visualizations, landing pages, one-pagers, org charts,
  mind maps, process flows, kanban boards, report summaries, or any visual that helps
  humans digest information faster. Trigger on requests like "visualize this," "make a deck,"
  "create a slide," "build an infographic," "show me a dashboard," "make this visual,"
  or any request to present information in a visual HTML format.
license: MIT
metadata:
  author: careerhackeralex
  version: 0.3.0
  category: document-creation
  tags: [visualization, html, slides, dashboard, infographic]
---

# Visualize

Turn any idea, data, or content into a stunning single-file HTML visualization.

## References by Need

Keep this file and the complete skeleton as the output contract. Read only the references needed for the current format or issue; these references do not replace the required theme/menu/Chart.js/output boundaries below.

| Need | Read |
| :--- | :--- |
| Every output: complete template and integration rules | [skeleton](references/skeleton.md) |
| Detailed typography, palette, spacing, accessibility | [design system](references/design-system.md) |
| Format selection and structural patterns | [types](references/types.md); applicable [format recipes](references/recipes.md#format-recipes) |
| Chart construction, configuration, debugging | [chart lifecycle](references/recipes.md#chart-lifecycle-example); [debugging](references/recipes.md#critical-debugging-patterns) |
| Adapting theme/menu, PNG export, print or slide capture | [menu](references/menu.md) — replace the existing component, do not add another |
| Entrance/reveal/counter motion | [animations](references/animations.md) — adapt examples to the skeleton's top-level var/lifecycle/reduced-motion rules |
| Advanced CSS or optional libraries | [CSS techniques](references/css-techniques.md), [libraries](references/libraries.md), [Reveal.js navigation](references/recipes.md#revealjs-navigation) |
| Manual visual quality review | [evaluation rubric](references/eval.md) |
| Maintained source, attribution and selective updates | [provenance](references/provenance.md) |

## After Creating a File

**Always do BOTH of these after writing the HTML file:**

1. **Auto-open in browser:** Use the IDE's browser-opening tool when available. Otherwise run `Invoke-Item <filename>.html` on Windows, `open <filename>.html` on macOS, or `xdg-open <filename>.html` on Linux.
2. **Return a clickable file link:** In VS Code responses, use a Markdown link to the generated workspace file. Use a `file://` URL only when the output is outside the workspace and the client supports it.

Example response after creation:
```
Created your visualization! Opening in browser now...
[my-dashboard.html](my-dashboard.html)
```

## Required Output Contract

The following output requirements remain mandatory. The [evaluation rubric](references/eval.md) is a manual quality guide, not an executable evaluation protocol or a guarantee of automatic checks.

**EVERY file MUST start from the skeleton template in [references/skeleton.md](references/skeleton.md) — copy the ENTIRE template, then add your content.**

1. **CSS Custom Properties:** Exact names required: `--bg, --surface, --surface-hover, --border, --text, --text-secondary, --accent, --accent-secondary, --positive, --negative, --warning` — NO other names (not --bg-primary, not --text-primary).  These exact property names are required for the required output contract.
2. **Utility Menu System (MANDATORY):** Complete `.viz-menu` element with `.viz-menu-toggle` button, `.viz-menu-dropdown` container, download PNG button (`onclick="downloadImage()"`), print button (`onclick="window.print()"`), and html-to-image CDN script (`<script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js"></script>`).  The complete menu remains required.
3. **Theme Classes (required):** Must explicitly define BOTH `.theme-light` and `.theme-dark` classes in stylesheet with complete custom property definitions. **EXAMPLE REQUIRED:**
```css
:root { /* base properties */ }
.theme-light { --bg: #ffffff; --surface: #f8f9fa; --text: #1a1a1a; /* etc */ }
.theme-dark { --bg: #0a0a0a; --surface: #1a1a1a; --text: #ffffff; /* etc */ }
```
**NEVER rely on just `:root` or `@media (prefers-color-scheme)` — class-based themes are required.**
4. **Semantic HTML:** `<main id="main-content">` element, **Multiple `<section>` elements for major content blocks** (header, metrics, charts, etc.), skip-to-content link. Each distinct content area must be wrapped in semantic `<section>` tags.
5. **Chart.js Requirements (required):** MUST include `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>` before closing `</head>`.  IMMEDIATELY after Chart.js script, add `<script>Chart.defaults.animation = false;</script>` (prevents animation glitches). **MANDATORY CHART VALIDATION:** Every chart function MUST start with `if (typeof Chart === 'undefined') { console.error('Chart.js not loaded'); return; }`. **CHART ACCESSIBILITY:** Every canvas element MUST have `role="img"` and descriptive `aria-label` attributes. **CRITICAL CHART CONFIG:** Set `maintainAspectRatio: false`, `responsive: true`, and `plugins: { tooltip: { enabled: true } }` for accessibility. **NEVER disable tooltips** - tooltips must remain enabled. **CHART RELIABILITY SYSTEM:** Use dedicated ChartManager pattern for bulletproof integration:
Use the single [Chart Lifecycle Example](references/recipes.md#chart-lifecycle-example). Copy its manager, DOM-ready binding, and theme hook once; other chart sections provide configuration details.
Use `ChartManager.safeInit()` instead of raw `new Chart()`. **CRITICAL CHART CONFIG:** Set `maintainAspectRatio: false`, `responsive: true`, and `plugins: { tooltip: { enabled: true } }` for accessibility. **CHART CONTAINER DIMENSIONS:** Container must have explicit `height` >= 300px for charts to render properly. Use theme-aware colors with CSS custom properties, never static hex colors. **NEVER use import/export syntax with Chart.js CDN** — use standard var declarations only.

**CHART.JS TROUBLESHOOTING:** If charts appear as blank white spaces:
- Verify Chart.js CDN is included before `</head>`
- Verify `Chart.defaults.animation = false;` is immediately after CDN
- Verify chart initialization is in DOMContentLoaded event listener
- Verify no module import/export syntax anywhere in the file
- Verify ChartManager.safeInit() pattern is used correctly
- Verify canvas has `role="img"` and `aria-label` attributes

6. **Responsive Design:** Section spacing ≥48px, **CRITICAL: NO horizontal overflow at 375px viewport** (add `@media (max-width: 375px) { body { overflow-x: hidden; } }` to prevent horizontal scroll), **MANDATORY FONT-SIZE HIERARCHY:** h1 ≥ 2.5rem, h2 ≥ 2rem, h3 ≥ 1.5rem, body = 1rem. **SLIDE DECK REQUIREMENTS:** Title slide h1 ≥ 3rem, content slide titles ≥ 2.5rem, clear visual distinction between heading levels. **SLIDE SECTION SPACING:** Major sections within slides must have ≥48px spacing (title-to-content, content-to-charts, charts-to-navigation). **Test all layouts at 375px width — dashboards especially prone to chart container overflow.** **CSS CONTAINER QUERIES:** For advanced responsiveness, use container-based queries:
```css
.chart-container { container-type: inline-size; }
@container (max-width: 400px) { 
  .chart-legend { display: none; } 
  .chart-title { font-size: 1rem; }
}
```
This provides true component-level responsiveness beyond viewport media queries.
7. **Print & Accessibility:** `@media print` styles, `@media (prefers-reduced-motion: reduce)` with disabled animations
8. **Entrance Animations (MANDATORY):** Must include entrance animations via `.animate` classes, `data-reveal` attributes, or CSS `@keyframes`.  Entrance animations remain required.
9. **JavaScript Functions:** `cycleTheme()`, `toggleMenu()`, top-level variables use `var` not `let`/`const`

Copy the complete skeleton → add visualization content in "YOUR CONTENT HERE" → save the file.

## Core Principles

1. **Single-file HTML** — one `.html` file with inline CSS/JS. Opens in any browser, works offline, emails easily.
2. **Light theme optimized** — modern designs prioritize light mode quality. Dark theme available via toggle.
3. **Beautiful by default** — the first output should look professional with zero iteration.
4. **Content-first** — the visualization serves the message. Never sacrifice clarity for aesthetics.
5. **Responsive** — works on desktop, tablet, and mobile unless explicitly fixed-dimension (e.g., 16:9 slides).
6. **Visual restraint** — Professional designs avoid decorative elements that add noise. No floating gradient orbs, rainbow borders, or ornamental animations.

## Philosophy

HTML is not a "website" — it's a visualization tool. Code is cheap. Everyone should feel empowered to visualize anything. This skill turns conversation context, URLs, articles, data, or raw ideas into something visual and digestible in seconds.

Users invoke this **mid-conversation** with Claude Code. Use the full conversation context — whatever they've been discussing, any links they've shared, any data they've pasted — as source material. When given a URL, crawl it and extract the content to visualize.

## Output Rules

**MANDATORY FIRST STEP: Copy the complete skeleton from [references/skeleton.md](references/skeleton.md) — this includes all required elements (menu, theme system, CSS properties, semantic HTML, accessibility features). Never write HTML from scratch.**

- Write ONE `.html` file to `~/Downloads/` (or user-specified path)
- Filename: descriptive kebab-case, e.g., `q4-revenue-dashboard.html`, `team-roadmap-deck.html`
- Start with skeleton.md template, add your content to the `<!-- YOUR CONTENT HERE -->` section
- All custom styles in `<style>` after the skeleton's base styles
- **CDN libraries are encouraged** — use the best tool for the job:
  - **Tailwind CSS** — `https://cdn.tailwindcss.com` (utility-first styling, use freely)
  - **Chart.js** — `https://cdn.jsdelivr.net/npm/chart.js` (bar, line, pie, radar, doughnut)
  - **D3.js** — `https://cdn.jsdelivr.net/npm/d3@7` (complex/custom data viz, force graphs)
  - **Mermaid** — `https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js` (flowcharts, sequence diagrams)
  - **Three.js** — 3D when appropriate
  - **Reveal.js** — use numeric dimensions (1280×720), full-height containers, and custom navigation with default controls disabled. Read the complete [Reveal.js navigation recipe](references/recipes.md#revealjs-navigation) before implementing it.
  - **Leaflet** — maps and geospatial data (`https://unpkg.com/leaflet@1.9/dist/leaflet.js` + CSS). **Required for geographic data** — never hand-draw SVG continent shapes. Use OpenStreetMap tiles or a minimal tile provider.
- SVG for icons and simple graphics — never use external image URLs unless user provides them
- Prefer CSS animations over JS when possible

See [references/libraries.md](references/libraries.md) for detailed CDN links, patterns, and tips.

## Design System

Apply these defaults. They are opinionated and tested — override only when user requests it.

**Full design system reference:** See [references/design-system.md](references/design-system.md) for complete typography, color, spacing, animation, accessibility, and visual polish specifications.

Key requirements (read the reference for full details):

### Design Notes

**Theming System:**
- Use **class-based theming ONLY** — `<html class="theme-dark">` or `<html class="theme-light">`
- Use the skeleton's `applyTheme()` and `cycleTheme()` to replace only theme classes, preserving other root classes and the existing chart theme hook.
- Save `dark` or `light` under `viz-theme`. Legacy `0`/`1` restore dark/light; `2` and invalid values use the OS preference through `resolveTheme()`.
- **Never use `data-theme` attributes** — the output contract requires class-based themes
- **Required CSS custom properties:** `--bg, --surface, --text, --accent, --border` (minimum set for the output contract)

**Typography:**
- **Inter font mandatory** — `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap`
- **MANDATORY font weight hierarchy:** h1 ≥ 700, h2 ≥ 600, h3 ≥ 500, body = 400 (required typography hierarchy)
- -0.03em tracking on headings
- **KOREAN TYPOGRAPHY EXCELLENCE:** For Korean content, use Noto Sans KR for body text with Inter for UI elements. Apply `line-height: 1.6` for Korean (vs 1.4 for Latin). Korean Medium weight maps to Western Regular (400). Include: `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap`

**Colors:**
- Class-based theming only (NO @media prefers-color-scheme)
- Dark: #0A0A0A bg, #EDEDED text. Light: #FAFAF9 bg, #0f172a text
- See reference for full palette.
- **Cards:** 8px radius, shadow-only hover (no translateY/scale), 1px solid var(--border). **GLASS MORPHISM UPGRADE:** For premium layouts, use glass containers with `backdrop-filter: blur(8px)`, semi-transparent backgrounds with CSS var `--glass-opacity: 0.08`, and elevated shadows. Apply selectively to hero sections or primary cards for sophisticated layering.
- **Animations:** CSS @keyframes for page-load (.animate + .delay-N), data-reveal + IntersectionObserver for scroll, data-count for counters. Content visible by default. **Above-fold content must NEVER use data-reveal** — use `.animate` classes instead. Use `data-reveal` sparingly (max 3-4 sections) for below-fold content only.
- **Accessibility:** Skip-to-content, aria-labels, landmark roles, :focus-visible, sr-only for chart data. See reference for full checklist.
- **Icons:** Inline SVG only, never emojis. Lucide-style 24x24, stroke-based.
- **Chart.js (required patterns):** `Chart.defaults.animation = false;` at top of script, destroy+recreate on theme toggle, explicit rgba() colors, tooltips always enabled, `maintainAspectRatio: false` on all chart options. **Accessibility: Wrap canvas in div with `role="img"` and descriptive `aria-label`**. **Guard pattern:** Use `chartsBuilt` flag — `onThemeChange()` must check `if (chartsBuilt)` before rebuilding. **Chart containers need min-height: 360px for substantial presence.**
- **Chart.js customization:** Apply professional styling beyond defaults — custom padding (`layout: { padding: 30 }`), remove excessive gridlines (opacity ≤ 0.04), use rounded corners (`borderRadius: 4`), thoughtful color palettes that match theme. Chart containers need 12px border radius, 40px internal padding, and 360px minimum height for substantial presence. Avoid library defaults that look auto-generated.
- **Typography hierarchy:** MANDATORY descending font-size scale: h1 > h2 > h3 > body text. **REQUIRED MINIMUMS:** h1: ≥3rem (48px), h2: ≥2rem (32px), h3: ≥1.5rem (24px), body: 1rem (16px).  Each heading level must be visibly smaller than the previous level with at least 0.5rem difference between levels. Example valid hierarchy: h1: 3rem, h2: 2.5rem, h3: 1.5rem, body: 1rem.
- **Visual restraint:** No floating orbs, gradient borders, gradient text on headings, scale transforms, glow effects, decorative animations.
- **Stat value colors:** Colored numbers must have semantic meaning (green/positive = good metric, red/negative = bad metric, accent = primary/neutral highlight). If no clear semantic meaning, use `var(--text)`. Never randomly colorize stat values. **For KPI grids with 4+ cards:** use at most 2 accent colors for values — `var(--accent)` for the single most important metric and `var(--text)` for all others. Reserve `var(--positive)`/`var(--negative)` only for delta indicators (arrows, percentages), not the main card value.
- **Background atmosphere:** One subtle technique per file (radial gradient, noise texture, or dot grid). **Adapt the atmosphere to the content** — a game dashboard should feel different from a financial report. Adjust accent colors and gradient hues to match the subject matter.
- **AI-NATIVE INFORMATION ARCHITECTURE:** Modern designs prioritize insight-driven hierarchy. Place the most important metric/insight above the fold. Use progressive revelation patterns — show key data immediately, provide drill-down on hover/click. Contextual actions should appear near relevant content. Lead with conclusions, support with details.
- **Entrance animations mandatory:** fadeInUp + stagger on all cards/sections.
- **Single-screen posters:** overflow:hidden + justify-content:space-between on fixed-dimension body. See reference for 9:16, 1:1, 4:5 sizing.


## Critical Implementation Requirements

**Use the skeleton template** — see [references/skeleton.md](references/skeleton.md) for complete copy-paste HTML with all requirements built-in.

**JavaScript Implementation Rules:**
- **All top-level variables MUST use `var`** (not `let`/`const`) to avoid TDZ errors with function hoisting
- **Theme toggle MUST use `cycleTheme()` function** — this is built into the skeleton with proper `applyTheme()` implementation
- **Menu MUST use `toggleMenu()` with outside-click handling** — skeleton includes automatic dropdown closure on outside clicks and escape key
- **Chart rebuilding:** Define `function onThemeChange() {}` for chart re-rendering on theme changes
- **Mobile responsive:** Test all layouts at 375px viewport width — use CSS Grid `minmax(320px, 1fr)` for card grids

**Evaluation Checkers Expect:**
- `cycleTheme()` function exists and works (changes html class)
- `toggleMenu()` function exists and closes on outside clicks  
- Top-level JS variables are declared with `var`
- No horizontal overflow at 375px width
- Interactive elements beyond basic menu (hover states, chart interactions, etc.)

**The skeleton template automatically provides all required functionality. ALWAYS start from skeleton.md to avoid implementation errors.**

## Semantic HTML Requirements

All visualizations must include these semantic elements:

**Required Structure:**
- `<main>` element containing primary content
- `<section>` elements for major content blocks
- Landmark roles (`role="banner"`, `role="main"`, `role="complementary"`) OR skip-to-content link
- Chart accessibility: `role="img"` and `aria-label` on chart containers

**Additional Requirements:**
- `@media print` styles defined
- `@media (prefers-reduced-motion)` styles for accessibility
- Adequate spacing between sections (≥48px)
- Hover states for interactive elements

## Visualization Types

Choose the right format. See [references/types.md](references/types.md) for detailed patterns.

| Type | When to Use | Key Feature |
|------|-------------|-------------|
| **Slide Deck** | Presentations, pitches | 16:9, keyboard nav, transitions |
| **Infographic** | Data summaries, visual stories | Long scroll, big numbers, sections |
| **Dashboard** | Metrics, KPIs | Grid of cards + charts |
| **Flowchart** | Processes, architecture | Mermaid or SVG diagrams |
| **Timeline** | Chronological events | Alternating left/right, scroll-triggered |
| **Comparison** | Side-by-side analysis | Feature matrix, pros/cons |
| **Data Viz** | Charts, data stories | Chart.js or D3 |
| **One-Pager** | Summaries, briefs | Single viewport, print-friendly |
| **Mind Map** | Concept relationships | Radial SVG layout |
| **Kanban** | Status tracking | Column-based cards |
| **Carousel Cards** | Social media (IG/LinkedIn) | 1080×1080 per card, swipeable, bold text |
| **Event Poster** | Conferences, meetups, webinars | Portrait A4/letter, bold headline, date/venue |
| **Resume/CV** | Job applications | One-page, two-column, print-optimized |
| **Banner/Header** | Email, blog, social cover | 1200×630 or 1500×500, centered text on visual bg |
| **Quote Card** | Social proof, testimonials | Portrait/square, large quote, attribution |
| **Process Guide** | How-to, step-by-step | Numbered steps, icons, clear flow |
| **Status Report** | Executive updates | KPIs + progress bars + highlights, one-page |
| **Org Chart** | Team structure | Hierarchical tree, photos/avatars, roles |
| **Data Story** | Narrative + data | Scrollytelling, charts woven with narrative text |
| **Product Card** | Feature highlight, launch | Hero image area, feature pills, CTA |

### Format Recipes

Read the applicable [format recipes](references/recipes.md#format-recipes) when creating carousel cards, event/quote posters, fixed-dimension single-screen outputs, or slide decks. Keep their sizing, navigation, theme-specific gradients, content density, and chart requirements.

## Data Ingestion

When user provides data:
- **CSV** — parse with JS, auto-detect headers, render appropriate chart type
- **JSON** — extract keys as labels, values as data, nested objects as series
- **Tables** — convert to visual comparison or chart
- **Numbers in text** — extract and highlight as stat cards
- **URLs** — crawl, extract key info, visualize as summary

## Context Awareness

This skill is used mid-conversation. Leverage everything:

- **Conversation context** — summarize, structure, or visualize what's been discussed
- **URLs/links** — crawl and extract content, then visualize
- **Pasted data** — CSV, JSON, tables → charts, dashboards
- **Ideas/concepts** — turn abstract discussions into visual diagrams
- **Code/architecture** — visualize system designs, data flows

Always use real content. Never generate placeholder data when real context exists.

## Type-Specific Interactivity

Every file MUST have at least ONE meaningful interaction beyond theme toggle + menu. Static-feeling pages score low on interactivity.

| Type | Required Interaction |
|------|---------------------|
| **Cheatsheet** | Search/filter input + copy-to-clipboard on code blocks. Use `<details name="...">` for collapsible groups. |
| **Dashboard** | Filter toolbar or metric drill-down. At minimum: date range or category filter. |
| **Status Report** | Collapsible detail sections (use `<details>`). Progress bars animate on scroll. |
| **Quote Card** | Auto-cycling quotes OR swipeable carousel. Share/copy button. |
| **Event Poster** | Animated countdown timer (days/hours/min/sec). RSVP/register button. |
| **Process Guide** | Steps as exclusive accordion (`<details name="steps">`). Or interactive progress tracker. |
| **Architecture** | Clickable nodes with popover details (use Popover API). Hover highlights connections. |
| **Timeline** | Filter by era/category. Or click to expand event details. |
| **Comparison** | Toggle categories on/off. Or highlight winner per row. |
| **Carousel** | Touch swipe + keyboard + auto-advance option. Card counter always visible. |
| **Slide Deck** | Already interactive (nav). Add: presenter timer, slide overview grid. |

If a type isn't listed, add at minimum: a filter, search, sort, or expand/collapse interaction.

## Layout Variation

Every file must feel like a UNIQUE design, not a template with different text. Vary these per file type:
- **Grid structure**: Mix 1-col, 2-col, 3-col. Use CSS Grid `span 2` for featured cards. **CRITICAL: Always test at 768px and 375px - no horizontal overflow allowed.**

**Mobile-First Responsive Pattern (MANDATORY):**
```css
.grid { 
  display: grid; 
  gap: 24px; 
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
}
@media (max-width: 768px) { 
  .grid { grid-template-columns: 1fr; gap: 16px; }
  .container { padding: 24px 16px; }
}
@media (max-width: 375px) {
  .card { padding: 16px; }  
  .stat-value { font-size: 2rem; }
}
```
- **Section rhythm**: Alternate between full-width sections, card grids, and single-focus sections.
- **Content density**: More content at smaller sizes looks more professional than sparse content at large sizes. A dashboard with 8 KPI cards + 4 charts feels real; 4 KPI cards + 2 charts feels like a demo.
- **Visual focal point**: Every file needs ONE visually dominant element (hero stat, key chart, primary message) — not everything at equal weight.
- **No orphaned grid items**: When a grid has an odd number of items where the last row isn't full, use `grid-column: span 2` on the last item or adjust `grid-template-columns` to avoid a single card stranded alone on a row.

## Anti-Patterns

- ❌ Walls of text — if it reads like a document, it's not a visualization
- ❌ Tiny fonts — minimum 14px body, 20px+ for presentation headings
- ❌ Rainbow colors — stick to 2-3 colors from the palette + neutrals
- ❌ Placeholder content — never use "Lorem ipsum" or fake data
- ❌ Over-engineering — simplest approach that looks stunning
- ❌ Cramped layouts — when in doubt, add more whitespace
- ❌ Generic design — each visualization should feel intentional, not templated
- ❌ Missing menu — every output needs the hamburger menu
- ❌ Broken print — always include `@media print` styles

## Advanced Techniques

Use these when they add value. See [references/css-techniques.md](references/css-techniques.md) for code snippets.

- **Glass morphism** — `backdrop-blur-md bg-white/5 border border-white/10` for floating cards
- **Gradient text** — `background: linear-gradient(...); -webkit-background-clip: text` for hero headlines
- **Scroll-snap** — `scroll-snap-type: y mandatory` as alternative slide navigation (no JS needed)
- **Conic gradients** — `conic-gradient()` for pure CSS pie/donut charts
- **Number animations** — animate counters from 0 to target value on scroll
- **Spring easing** — `cubic-bezier(0.34, 1.56, 0.64, 1)` for playful micro-interactions
- **Animate to auto** — `interpolate-size: allow-keywords` on `:root` enables smooth `height: auto` transitions (Chrome 129+)
- **CSS counters** — auto-numbering for step-by-step processes
- **View Transitions API** — smooth theme switching animations
- **Inline SVG icons** — draw simple icons as `<svg>` paths, no icon library needed

## Mandatory HTML Skeleton

**EVERY visualization MUST start from the skeleton.** Copy it, then add content.

**Full skeleton code:** See [references/skeleton.md](references/skeleton.md) for the complete copy-paste HTML template with themes, print styles, Inter font, animations, menu, and hover effects.

The skeleton provides:
- Class-based dark/light theming (OS detection on first visit, localStorage persistence)
- CSS @keyframes animations (fadeInUp, fadeIn, slideInLeft, slideInRight) + .animate/.delay-N classes
- Scroll-reveal via data-reveal attribute + IntersectionObserver
- Number counter via data-count attribute
- Hamburger menu with theme toggle, PNG download (html-to-image), print/PDF
- Popover and details accordion CSS (Chrome 114+/120+)
- Print styles with @page margin boxes
- prefers-reduced-motion support

### Skeleton Rules
- Use `var` for all top-level JS variables (prevents TDZ errors)
- Use `data-reveal` for scroll animation OR `.animate.delay-N` for page-load entrance. Add JavaScript scroll observer for `.reveal` classes.
- Define `function onThemeChange() {}` to re-render charts on theme toggle
- Use semantic HTML: `<main>`, `<section>`, `<header>`, `<article>`
- Don't use `let`/`const` at script top level

## Minimum Sizing Rules

Elements must be large enough to read and feel substantial:

- **Timeline cards:** minimum width 280px, minimum padding 20px
- **Timeline layout:** Distribute timeline items evenly to prevent large gaps. If you have 5 items but only fill 60% of the vertical space, add more content sections (like investment breakdown or impact metrics) to fill the remaining 40%. Never leave massive empty spaces below the last timeline item.
- **Chart containers:** minimum 60% of parent width, minimum height 300px (360px+ for dashboards). In grid layouts, charts should use `flex-grow: 1` to fill available space — 300px is a floor, not a target.
- **Stat numbers:** minimum font-size 2rem (32px), bold/extrabold weight
- **Card content area:** minimum padding 24px
- **Section spacing:** **MANDATORY minimum 48px between major sections** — use `margin-bottom: 48px` or larger on section elements
- **Slide headings:** minimum 2rem (32px), maximum 6 words
- **Body text:** minimum 1rem (16px), never smaller

**If content feels too small, it IS too small. Err on the side of larger.**

## Text Visibility Rules

**Text must ALWAYS be visible.** This is the #1 cause of broken outputs.

- Dark theme: text MUST use `var(--text)` which resolves to `#f9fafb` (near-white)
- Light theme: text MUST use `var(--text)` which resolves to `#0f172a` (near-black)
- On gradient backgrounds: add `text-shadow: 0 1px 3px rgba(0,0,0,0.3)` for readability
- On hero slides with gradient/image backgrounds: use a dark overlay (`rgba(0,0,0,0.5)`)
- NEVER set text color to a value close to the background color
- Test mentally: "would this text be visible on BOTH dark (#030712) and light (#f8fafc) backgrounds?"

## Chart Integration and Debugging

For charts, read [Chart.js Integration Rules](references/recipes.md#chartjs-integration-rules-critical--most-common-failure) and use the single [Chart Lifecycle Example](references/recipes.md#chart-lifecycle-example). Copy its complete manager, canvas/container, DOM-ready binding, and theme hook once; keep its related configuration and retry/cleanup context together.

For counter, chart, or menu issues, read [debugging patterns](references/recipes.md#critical-debugging-patterns). Adapt the corresponding skeleton component; do not duplicate an initializer.

## Process

1. **Understand** — what's the message? Who's the audience? What format fits?
2. **Start from skeleton** — copy the Mandatory HTML Skeleton above. NEVER start from a blank file.
3. **Structure** — outline content/sections BEFORE filling in the skeleton
4. **Build** — add content, charts, styles. Keep all colors as CSS vars.
5. **Verify checklist:**
   - [ ] `html.theme-dark` and `html.theme-light` class-based theme selectors (NO @media prefers-color-scheme)?
   - [ ] JS detects OS preference on first visit, stores in localStorage?
   - [ ] All text uses `var(--text)` or `var(--text-secondary)`?
   - [ ] `@media print` hides menu, shows all content?
   - [ ] `@media (prefers-reduced-motion: reduce)` present?
   - [ ] `.viz-menu` with toggle, theme, download, print?
   - [ ] Correct font loaded? (Inter default, Noto Sans KR for Korean, etc.)
   - [ ] Non-Latin content has appropriate CJK/RTL font?
   - [ ] Entrance animations via `.animate` classes (CSS @keyframes)?
   - [ ] Scroll sections use `data-reveal` (visible without JS)?
   - [ ] `.card:hover` has transform effect?
   - [ ] All top-level JS variables use `var` (not `let`/`const`)?
   - [ ] Charts use `var` declarations + `onThemeChange` hook?
   - [ ]  All charts wrapped with `role="img" aria-label="..."`?
   - [ ]  All charts have hover tooltips enabled (never disabled)?
   - [ ] Animated number counters use `data-count` where stats exist?
   - [ ] Semantic HTML: `<main>`, `<section>`, `<header>`, `<article>`?
   - [ ] All charts have explicit container sizing (≥300px height)?
   - [ ] Hero/title text visible on both themes?
   - [ ] Minimum sizing rules followed (cards 280px+, text 16px+)?
   - [ ] Zero console errors on load?

The quality bar: **"good, period"** — not "good for AI-generated."
