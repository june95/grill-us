# Visualization Recipes

These sections were moved from the maintained [SKILL](../SKILL.md) preserving their executable content. Only trailing whitespace in two debug examples was cleaned up. Read the complete [skeleton](skeleton.md) first; keep its single theme/menu/print initialization. Read only the applicable recipe, including its adjacent sizing, variable, DOM, configuration and lifecycle context. Recipe examples are guidance for integration, not a second output contract.

## Reveal.js Navigation

- **Reveal.js** — full-featured slide engine when needed. **CRITICAL:** Must set `html, body { height: 100%; overflow: hidden; }` and give the `.reveal` container `height: 100%`. Config MUST use numeric dimensions: `Reveal.initialize({ width: 1280, height: 720, center: true, controls: false })` — NEVER use string percentages like `'100%'` which cause zero-height viewport and blank slides. **MANDATORY: Disable Reveal.js default controls** (`controls: false`) — the default `<` `>` arrow overlays are ugly. Instead, add a custom minimal bottom nav bar:
```html
<nav class="slide-nav" aria-label="Slide navigation">
  <button onclick="prevSlide()" aria-label="Previous slide">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
  </button>
  <span class="slide-counter" id="slideCounter">1 / 8</span>
  <button onclick="nextSlide()" aria-label="Next slide">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
  </button>
</nav>
```
```css
.slide-nav { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; z-index: 9998; }
.slide-nav button { width: 28px; height: 28px; border-radius: 6px; background: transparent; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0.3; transition: opacity 0.2s; }
.slide-nav button:hover { opacity: 0.7; }
.slide-counter { font-size: 12px; color: var(--text-secondary); font-weight: 400; min-width: 40px; text-align: center; opacity: 0.35; }
```

## Format Recipes

### Carousel Card Rules

Carousel cards are huge for social media. Get these right:

- **Square format** — `1080×1080px` (or configurable via CSS var)
- **One idea per card** — bold headline + 1-2 supporting points max
- **Swipe nav** — arrows + dots + touch swipe + keyboard
- **Card counter** — "3 / 8" visible
- **Download all** — PNG export of individual cards or full set
- **Typography dominates** — headline at 2.5-4rem, minimal body text
- **Color-coded** — each card can have a subtle accent shift
- **Print layout** — grid of all cards for printing
- **Max 10 cards** — keep it focused

### Event Poster Rules

- **Portrait orientation** — A4/letter ratio or square
- **Visual hierarchy** — Event name (largest) → Date/Time → Location → Description → CTA
- **Bold headline** — 3-5rem, max 6 words
- **Date/time prominent** — styled as a badge or highlighted block
- **QR code area** — placeholder box for registration link
- **Print-first** — looks great printed, dark or light theme

### Quote Card Rules

- **Large quotation marks** — decorative " " in accent color, oversized
- **Quote text** — 1.5-2.5rem, serif or italic weight for contrast
- **Attribution** — name, title, company below quote
- **Square or portrait** — optimized for social sharing
- **Minimal design** — quote is the hero, everything else is subtle

### Single-Screen / Mobile-Fit Rules (Posters, Cards, One-Pagers)

When the user asks for something that fits "one screen," "phone screen," "9:16," or "mobile-fit," create a **fixed-dimension single-viewport** visualization — NOT a scrolling page.

**Dimensions:**
- **9:16 portrait (phone):** `width: 1080px; height: 1920px;` — standard Instagram Story / phone screen
- **1:1 square:** `width: 1080px; height: 1080px;` — Instagram post
- **4:5 portrait:** `width: 1080px; height: 1350px;` — Instagram portrait post
- **16:9 landscape:** `width: 1920px; height: 1080px;` — presentation slide

**Critical CSS pattern:**
```css
body {
  width: 1080px; height: 1920px; /* or chosen ratio */
  overflow: hidden; /* MUST — prevents scroll, enforces single screen */
  display: flex; flex-direction: column; /* Flex column fills canvas completely */
}
.poster-header { padding: 44px 48px 0; }
.poster-grid { flex: 1; padding: 24px 48px 0; } /* flex:1 expands to fill remaining space */
.poster-footer { padding: 16px 48px 36px; }
```

**Layout rules:**
- `overflow: hidden` on body — this is what makes it "one screen." Non-negotiable.
- `justify-content: space-between` on the main container — distributes sections evenly with NO dead gaps.
- **Use `flex: 1` on the main content area** (grid, body, etc.) so it expands to fill ALL remaining space between header and footer. Never use fixed `height` values that leave dead space.
- Wrap each logical section in a `<div>` so flexbox distributes them as blocks.
- **Zero dead space rule:** The poster canvas should be 100% utilized. No large empty margins at bottom or sides. If there's visible empty space, either expand content to fill it or reduce padding. Content should feel like it "fits" the frame perfectly.
- **Test mentally:** count your sections, divide 1920px among them. Each section gets ~200-300px. If content is sparse, make elements bigger (larger fonts, more padding, bigger icons).
- **No hamburger menu** for fixed-dimension posters — it wastes space and the poster is meant for screenshot/export, not interaction.

**Content density for 9:16:**
- Hero (title + subtitle): ~25% of height
- 2-3 content sections: ~55% of height
- Footer/CTA: ~10% of height
- Breathing room (gaps): ~10% of height
- **If it looks empty, your content is too small.** Scale up fonts, add more grid items, use larger icons.

**Font sizing for 1080px-wide posters:**
- Hero h1: `68-80px` (bigger than web — this is a poster)
- Section labels: `15-18px` uppercase, letter-spacing `0.06em`
- Card text: `16-20px`
- Body: `20-24px`

**Common mistake:** Making a scrolling page and screenshotting it. That's NOT a poster — it's a webpage screenshot. A poster is a fixed canvas where every pixel is intentional.

## Slide Deck Rules

Slides are the most common request. Get these right:

- **16:9 aspect ratio** — `100vw × 100vh`, content centered
- **Responsive breakpoints** — Use `clamp()` and container queries for mobile-friendly slides:
  ```css
  .slide-container { container-type: inline-size; }
  .slide-title { font-size: clamp(2rem, 8vw, 4rem); }
  @container (width < 768px) { .slide-content { padding: 1rem; } }
  ```
- **One idea per slide** — if you need a second thought, make a second slide
- **Max 40 words per slide** — more than that, split or use visuals
- **Headlines max 6 words** — short, punchy, memorable
- **Big number + small label** for stat slides — number at 3-5rem, label at 0.875rem
- **Keyboard nav** — ← → arrows, Space, Enter
- **Touch nav** — swipe left/right
- **Click nav** — left third = prev, right two-thirds = next
- **Progress bar** — thin gradient bar at top showing position
- **Slide counter** — "3 / 12" in bottom nav
- **Mobile navigation prominence** — Ensure navigation controls are clearly visible on mobile. Use larger touch targets (min 44px), contrasting colors, and backdrop-blur for floating nav
- **Smooth transitions** — `transform: translateX()` with 500ms cubic-bezier
- **Entrance animations** — elements within slides animate in with staggered delays
- **Speaker notes** — `data-notes` attribute, visible in print only

### High-Impact Presentation Slides (Business Context)
For investor presentations, startup pitches, and executive briefings:
- **Hero slide visual weight** — Use stronger gradients, larger typography (4-6rem), and compelling statistics prominently displayed
- **Value proposition clarity** — Hero should communicate core value in under 5 seconds
- **Professional credibility** — Ensure typography, spacing, and color choices match enterprise/investment-grade expectations
- **Data storytelling** — Each chart slide should have clear insight callouts, not just raw data visualization

### Theme-Aware Slide Gradients (CRITICAL)

Slide decks MUST look visually distinct in dark vs light themes. Gradient backgrounds must change:

```css
/* Dark theme: deep, saturated gradients */
.theme-dark .slide-title { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%); }
.theme-dark .slide-content { background: var(--bg); }

/* Light theme: soft, pastel gradients */
.theme-light .slide-title { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 50%, #dbeafe 100%); }
.theme-light .slide-content { background: var(--bg); }
```

Rules:
- Title/section slides: use theme-specific gradient pairs (dark=deep+saturated, light=soft+pastel). **Choose gradient colors that evoke the content's subject matter** — a tech pitch uses cool blues, a game pitch uses vibrant purples/cyans, a healthcare deck uses calming greens/teals.
- Content slides: use `var(--bg)` or `var(--surface)` — NOT hardcoded dark backgrounds
- Data cards on slides: use `var(--surface)` with `var(--border)` — they auto-adapt
- Never hardcode `#1a1a2e` or similar dark colors on slide content — use CSS variables
- Test: toggle theme and every slide should look intentionally designed for that mode

### Slide Types
1. **Title** — theme-aware gradient background, big headline, subtitle. Center aligned.
2. **Content** — heading + bullets OR heading + visual. Never text-heavy.
3. **Section divider** — full-bleed accent color, section title only.
4. **Stat** — one big number, one label, one insight sentence.
5. **Chart** — Chart.js visualization with title and key takeaway. MUST use chart-container wrapper class.
6. **Two-column** — split layout for comparisons, text+visual.
7. **Quote** — large pull quote with attribution.
8. **Closing** — CTA, contact info, or summary + social links.

### Slide Deck Chart Requirements (CRITICAL)
Chart slides in presentations MUST follow the same container standards as dashboards:
```html
<div class="chart-slide-container">
  <h2>Chart Title</h2>
  <div class="chart-container" style="height: 400px; padding: 40px; border-radius: 12px; background: var(--surface);">
    <canvas id="slideChart" role="img" aria-label="Description"></canvas>
  </div>
</div>
```
- **Use chart-container class** — maintains evaluation consistency across formats
- **Minimum height 400px** for slide charts — larger than dashboard charts for presentation readability
- **maintainAspectRatio: false** — required for proper sizing in slide layouts


## Chart.js Integration Rules (CRITICAL — MOST COMMON FAILURE)

Charts are the second most common failure. These rules are MANDATORY for every chart:

### 1. Container Structure (REQUIRED)
```html
<!-- MANDATORY PATTERN FOR EVERY CHART -->
<div role="img" aria-label="Detailed description of chart data and insights">
  <div class="chart-container" style="height: 360px; padding: 40px; border-radius: 12px; background: var(--surface);">
    <canvas id="myChart" role="img" aria-label="Detailed description of chart data and insights"></canvas>
  </div>
</div>
```

### 2. Canvas Dimensions (REQUIRED)
- **Container must have explicit height:** minimum 360px for dashboards, 300px for other types
- **Canvas element needs no sizing** — Chart.js handles this when `maintainAspectRatio: false`
- **Container padding:** 40px internal padding for professional spacing
- **Container border-radius:** 12px for modern card appearance

### 3. Chart.js Initialization (MANDATORY PATTERN)

Use the [Chart Lifecycle Example](#chart-lifecycle-example) as the only full initialization pattern. Keep the same canvas, destroy the previous instance, and rebuild with current theme colors. Do not add a second manager, canvas-reset function, or DOM/load listener.

### Chart Lifecycle Example

This complete classic-script example manages one canvas named `myChart`. Paste it once below the skeleton's menu/theme setup, and replace the empty `chartData` with the user's data. For multiple charts, add their configuration calls inside this same `buildCharts()`; keep one manager and one lifecycle binding.

`ChartManager.safeInit()` owns chart construction. `buildCharts()` prevents duplicate initialization, while `onThemeChange()` destroys managed instances before rebuilding. A missing library/canvas or failed construction returns no instance and leaves initialization retryable. If destruction fails, retain that reference and stop rebuilding until it can be cleaned up.

```javascript
var chartsBuilt = false;
var chartLifecycleBound = false;
var chartData = { labels: [], datasets: [] }; // Fill with the user's data.

var ChartManager = {
  charts: new Map(),
  safeInit: function(canvasId, config) {
    if (typeof Chart === 'undefined') {
      console.error('Chart.js not loaded');
      return null;
    }
    var canvas = document.getElementById(canvasId);
    try {
      var previous = this.charts.get(canvasId) || (canvas && Chart.getChart(canvas));
      if (previous) {
        previous.destroy();
        this.charts.delete(canvasId);
      }
      if (!canvas) {
        console.error('Canvas element not found: ' + canvasId);
        return null;
      }
      canvas.setAttribute('role', 'img');
      if (!canvas.getAttribute('aria-label')) {
        canvas.setAttribute('aria-label', 'Chart data');
      }
      var chart = new Chart(canvas, config);
      this.charts.set(canvasId, chart);
      return chart;
    } catch (error) {
      // A constructor can register an instance before throwing.
      var partial = canvas && Chart.getChart(canvas);
      if (partial) {
        this.charts.set(canvasId, partial);
        try {
          partial.destroy();
          this.charts.delete(canvasId);
        } catch (cleanupError) {
          console.error('Chart cleanup failed:', cleanupError);
        }
      }
      console.error('Chart initialization failed for ' + canvasId + ':', error);
      return null;
    }
  },
  destroyAll: function() {
    var complete = true;
    this.charts.forEach(function(chart, canvasId, charts) {
      try {
        chart.destroy();
        charts.delete(canvasId);
      } catch (error) {
        complete = false;
        console.error('Chart destruction failed:', error);
      }
    });
    return complete;
  }
};

function getChartColors() {
  var style = getComputedStyle(document.documentElement);
  return {
    text: style.getPropertyValue('--text').trim(),
    textSecondary: style.getPropertyValue('--text-secondary').trim(),
    border: style.getPropertyValue('--border').trim(),
    accent: style.getPropertyValue('--accent').trim()
  };
}

function buildCharts() {
  if (typeof Chart === 'undefined') {
    console.error('Chart.js not loaded');
    return;
  }
  if (chartsBuilt) return;
  var colors = getChartColors();
  Chart.defaults.animation = false;
  Chart.defaults.color = colors.textSecondary;
  var chart = ChartManager.safeInit('myChart', {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { labels: { color: colors.textSecondary } },
        tooltip: { enabled: true, mode: 'index', intersect: false, padding: 12, cornerRadius: 8 }
      },
      scales: {
        x: { ticks: { color: colors.textSecondary, maxRotation: 0 }, grid: { color: colors.border } },
        y: { ticks: { color: colors.textSecondary }, grid: { color: colors.border } }
      },
      layout: { padding: 20 }
    }
  });
  chartsBuilt = Boolean(chart);
}

function onThemeChange() {
  if (typeof Chart === 'undefined') return;
  if (!chartsBuilt) return; // Also guards the skeleton's first applyTheme() call.
  if (!ChartManager.destroyAll()) return;
  chartsBuilt = false;
  buildCharts();
}

function bindChartLifecycle() {
  if (chartLifecycleBound) return;
  chartLifecycleBound = true;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildCharts, { once: true });
  } else {
    buildCharts();
  }
}

bindChartLifecycle();
```

Keep `Chart.defaults.animation = false;` immediately after the required Chart.js CDN script in `<head>` as required by [SKILL](../SKILL.md#required-output-contract). The lifecycle example repeats the setting after checking library availability. It is valid JavaScript on its own; the full chart requires the skeleton, Chart.js, a sized canvas, and actual data.

### Styling and Configuration Details

- **MANDATORY: Hover tooltips enabled** — never disable Chart.js tooltips. The example already enables them.
- **Minimum chart height:** 300px on desktop, 250px on mobile; use the larger dashboard/slide minimum where applicable.
- **Font size defaults:** Axis tick labels at 13px minimum, axis titles at 14px, chart titles at 16px minimum. Legend at 13px.
- **Chart padding:** Use `layout.padding` to give labels breathing room.
- **Axis tick config:** `maxRotation: 0` keeps labels horizontal; use `maxTicksLimit` when needed.
- **Grid lines:** Very faint — `rgba(255,255,255,0.04)` in dark, `rgba(0,0,0,0.06)` in light.
- **Tooltip styling:** `padding: 12`, `cornerRadius: 8`, title font 14px and body font 13px.
- **Point radius:** 0 by default, 6 on hover for line charts.
- **Theme colors:** Read CSS variables during construction. Rebuild through the existing theme hook to apply new colors.
- **Legend:** 'top' for horizontal charts; 'right' where vertical space allows.
- **Donut/pie charts:** Include percentage labels on segments.
- **Responsive:** Use `responsive: true`, `maintainAspectRatio: false`, and explicit container dimensions.
- **Accessibility:** Keep descriptive canvas `aria-label` values and distinguish data series by color.

The following is a configuration fragment for the existing chart, not a standalone script. Do not add a second initializer around it.

<!-- skill-check: fragment — Chart.js options property to merge into the existing configuration. -->
```javascript
options: {
  plugins: {
    tooltip: { enabled: true, mode: 'index', intersect: false }
  }
}
```

## Critical Debugging Patterns

### Counter Animation Debug Pattern
If KPI values show "0%" instead of animating, add this debug pattern:
```javascript
// DEBUG: Add after counter observer setup to verify intersection
var counterEl = document.querySelector('[data-count]');
if (counterEl) {
  console.log('Counter element found:', counterEl); // DEBUG
  var cObs = new IntersectionObserver(function(entries) {
    console.log('Counter intersection triggered:', entries); // DEBUG
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        console.log('Starting counter animation'); // DEBUG
        animateCounters();
        cObs.disconnect();
      }
    });
  }, { threshold: 0.3 });
  cObs.observe(counterEl);
} else {
  console.warn('No [data-count] elements found'); // DEBUG
}
```

### Chart.js Integration Safety Pattern

Use the [Chart Lifecycle Example](#chart-lifecycle-example) above instead of copying another initializer. Check that the canvas ID matches, the library is loaded, and only one `bindChartLifecycle()` call path owns DOM-ready initialization. Theme changes must reach the same `onThemeChange()` hook. Inspect initialization or destruction errors before retrying; do not suppress them by replacing the canvas.

### Menu Outside-Click Fix
Ensure menu closes when clicking outside by strengthening the event handler:
```javascript
document.addEventListener('click', function(e) {
  var menu = document.querySelector('.viz-menu');
  var dropdown = document.getElementById('vizMenuDropdown');
  if (!e.target.closest('.viz-menu') && dropdown) {
    dropdown.classList.remove('open');
  }
});
```
