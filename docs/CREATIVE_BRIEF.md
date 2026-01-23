# Creative Brief: App Icon & OG Preview Images

> For TiltSync — Solar Panel Alignment App

---

## Brand Positioning

**What it is:** A mobile tool that transforms your phone into a precision solar panel alignment device.

**Who it's for:** DIYers, beginners, first-time installers, RV owners, off-grid enthusiasts, homeowners — anyone who wants professional results without the learning curve or expensive equipment.

**Brand personality:** Confident, precise, technical, professional. A precision tool that's functional and beautiful.

**Tone:** Technical but approachable. Think "professional tool" not "generic utility app."

**Key visual DNA from the app:**
- Clean, precision instrument aesthetic
- Rotating compass card with sun position marker
- Tilt indicator with horizon reference
- Monospace fonts (Roboto Mono, Share Tech Mono)
- Status colors: Green (aligned), Amber (close), Red (adjust)
- Dark mode default with light mode option

---

## App Icon

### Concept Direction

The icon should communicate **alignment**, **solar/sun**, and **precision** at a glance. It needs to be instantly recognizable at small sizes (29x29pt) while remaining distinctive at larger sizes.

### Primary Concept: "Aligned Sun"

A stylized sun with a crosshair/target element, suggesting precision alignment. The sun isn't cartoonish — it's geometric and modern.

**Elements to incorporate:**
- Sun motif (rays, circle, or abstract solar representation)
- Alignment indicator (crosshair, level line, or target ring)
- Sense of "locked in" or "on target"

### Visual Requirements

| Spec | Requirement |
|------|-------------|
| Format | 1024x1024px master (scales down to all sizes) |
| Shape | Rounded square (Apple applies mask automatically) |
| Background | Solid or gradient — avoid transparency |
| Style | Flat or subtle depth — no heavy shadows or skeuomorphism |
| Complexity | Simple enough to read at 29x29px |

### Color Direction

**Primary palette (from app's dark theme):**

| Color | Hex | Usage |
|-------|-----|-------|
| Amber/Gold | `#FFAA00` | Sun, accent, app title |
| Signal Green | `#00FF66` | Aligned state, success |
| Signal Red | `#FF3333` | Error state, adjustment needed |
| Panel Black | `#0D0D0D` | Background |
| Panel Gray | `#1A1A1A` | Secondary surfaces |
| Sky Blue | `#0077CC` | Tilt indicator sky |
| Ground Brown | `#553311` | Tilt indicator ground |

**Icon should use:**
- Dark background (matches app default)
- Amber/gold accent for sun element
- High contrast for visibility at small sizes

**Avoid:**
- Pure red as dominant color (too aggressive)
- Neon colors (too playful)
- Pastels (too soft)
- Purple gradients (AI-slop aesthetic)
- White backgrounds (doesn't match app's dark default)

### Icon Concepts to Explore

**Concept A: Horizon + Sun**
```
┌─────────────────┐
│    ▀▀▀▀▀▀▀▀     │  Sky (blue)
│   ━━━━━━━━━━━   │  Horizon line
│    ▄▄▄▄▄▄▄▄     │  Ground (brown)
│       ☀️         │  Sun on horizon
└─────────────────┘
```
A simplified horizon indicator with a sun positioned at the horizon. Represents the tilt alignment concept visually.

**Concept B: Compass + Sun**
```
┌─────────────────┐
│        N        │
│    ╲   │   ╱    │  Compass with
│  W ────●──── E  │  sun marker at target
│    ╱   │   ╲    │  position (South)
│        ☀️        │
└─────────────────┘
```
A simplified compass with the sun marker at the target direction. Shows directional alignment.

**Concept C: Combined View**
```
┌─────────────────┐
│   ┌─────────┐   │  Outer: compass ticks
│   │ ▀▀▀▀▀▀▀ │   │  Inner: tilt
│   │ ═══════ │   │  indicator with
│   │ ▄▄▄▄▄▄▄ │   │  horizon line
│   └─────────┘   │
└─────────────────┘
```
Nested circles — compass markings on outer ring, tilt indicator in center. Matches the app's main view layout.

**Concept D: Sun Target (Simple)**
```
┌─────────────────┐
│                 │
│    ───┼───      │  Crosshair overlay
│       │         │  on stylized sun
│      ☀️          │
│                 │
└─────────────────┘
```
A geometric sun with a subtle crosshair overlay. Simple, universal "alignment" symbol.

### Recommended Direction

**Concept D (Sun Target)** is the strongest because:
- Immediately communicates "alignment" through the crosshair
- Simple and recognizable at small sizes
- The sun connects to solar panels without being literal
- Differentiates from generic "compass" or "level" app icons
- Clean, memorable, professional

---

## OG Preview Image (Website Meta Tags)

### Purpose

This image appears when the website is shared on social media (Twitter/X, Facebook, LinkedIn, iMessage, Slack, etc.). It needs to communicate the app's value proposition in a single glance.

### Specifications

| Platform | Recommended Size | Aspect Ratio |
|----------|-----------------|--------------|
| Open Graph (Facebook, LinkedIn) | 1200 x 630px | 1.91:1 |
| Twitter Card (Large) | 1200 x 628px | ~1.91:1 |
| General fallback | 1200 x 630px | 1.91:1 |

**File format:** PNG or JPG (PNG preferred for text clarity)
**File size:** Under 1MB for fast loading

### Content Layout

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│                                                                  │
│    ┌──────────┐                                                  │
│    │          │     TiltSync                                     │
│    │  [ICON]  │     ─────────────────────                        │
│    │          │     Align your solar panels                      │
│    └──────────┘     like a pro.                                  │
│                                                                  │
│                     [App Store badge]  [Play Store badge]        │
│                                                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Background: Gradient or subtle solar panel texture
```

### Design Direction

**Option A: Device Mockup (Main Dashboard)**
- iPhone showing the main dashboard with compass + tilt indicator
- Dark background to match app aesthetic
- App name and tagline to the right
- Shows the app's polished, professional interface

**Option B: Device Mockup (Bubble Level)**
- iPhone showing the tilt-only bubble level screen
- Immediately recognizable as "level tool"
- Simpler visual, familiar concept

**Option C: In-Context Photography**
- Photo of hands holding phone against solar panel (blurred/stylized)
- App UI overlaid or floating
- Tagline overlay
- Shows real-world use case

### Recommended Direction

**Option A (Device Mockup — Main Dashboard)** works best because:
- Shows the app's polished, professional interface
- Creates curiosity ("what does that interface do?")
- Dark UI photographs well and looks premium
- Stands out from typical "level" or "compass" app screenshots

### Typography

**App name:** Bold, geometric sans-serif
- Recommendations: **SF Pro Display Bold**, **Satoshi Bold**, **General Sans Bold**, **Clash Display**
- Avoid: Inter, Roboto (too generic)

**Tagline:** Medium weight of same family or complementary sans
- Keep it short: "Align your solar panels like a pro."
- Alternative: "Stop guessing. Start generating."

### Copy for OG Image

**Primary tagline options:**
1. "Align like a pro." ✓ (selected)
2. "Stop guessing. Start generating."
3. "Perfect panel alignment in seconds."
4. "Your phone is now a solar alignment tool."

**Selected:** "Align like a pro." — Short, punchy, aspirational. Speaks to DIY audience.

---

## Additional Assets to Consider

### App Store Screenshots (Later)

Five screenshots showing:
1. Bubble level main screen (Year-Round mode)
2. Mode selector / mode comparison
3. Compass mode for azimuth alignment
4. Location display with coordinates
5. "Aligned" success state with green indicator

### Website Hero Image

Larger format (1920x1080 or responsive) showing:
- App in context (on a roof, at a campsite, etc.)
- Multiple device sizes
- Feature callouts

### Social Media Templates

Square (1080x1080) versions for Instagram/social posts with:
- App icon
- Key feature highlights
- "Available on App Store" messaging

---

## Deliverables Summary

| Asset | Size | Priority |
|-------|------|----------|
| App Icon (master) | 1024x1024px | 🔴 Critical |
| OG Preview Image | 1200x630px | 🔴 Critical |
| App Store Screenshots (5) | 1290x2796px (6.7") | 🟡 High |
| Twitter Header | 1500x500px | 🟢 Nice to have |
| Favicon | 32x32px, 16x16px | 🟢 Nice to have |

---

## Reference & Inspiration

**Apps with strong utility branding:**
- Halide (camera) — pro tool aesthetic, dark UI
- Flighty — clean, confident, premium utility
- Windy (weather) — data-dense but beautiful visualization
- Dark Sky — elegant data presentation

**Aesthetic keywords:**
- Precision tool
- Technical confidence
- Functional beauty
- High-contrast readability
- Professional grade

**Avoid:**
- Overly corporate (stock photo vibes)
- Cartoonish (this is a precision tool, not a game)
- Generic "green energy" clichés (leaves, globes, wind turbines)
- Soft/pastel colors (the app uses high-contrast status colors)
- Over-designed or cluttered

---

## Contact / Feedback

*[Add designer contact info and revision process here]*
