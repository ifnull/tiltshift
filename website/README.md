# TiltSync Website

A lightweight static website for the TiltSync app.

## Files

```
website/
├── index.html             # Landing page
├── privacy.html           # Privacy policy
├── terms.html             # Terms of service
├── support.html           # Support & FAQ page
├── favicon-32.png         # Favicon (32x32)
├── apple-touch-icon.png   # iOS home screen icon (180x180)
├── social.png             # OG image for social sharing (1200x630)
├── web-screenshot-01.png  # App screenshot: main dashboard (dark)
├── web-screenshot-02.png  # App screenshot: bubble level (light)
├── web-screenshot-03.png  # App screenshot: main dashboard (light)
├── web-screenshot-04.png  # App screenshot: compass mode
└── README.md              # This file
```

## Deployment

This is a static site with no build step. Simply upload all HTML files to your hosting provider.

**Domain:** `tiltsync.altmake.com`

### Hosting options:
- **Vercel**: Drop the folder or connect via Git
- **Netlify**: Drag and drop the folder
- **Cloudflare Pages**: Connect your repo
- **GitHub Pages**: Push to a `gh-pages` branch

## Required Assets

Before going live, you'll need to create:

### 1. OG Image (`og-image.png`)
- **Size:** 1200 × 630px
- **Format:** PNG
- **Location:** Root of website (`/og-image.png`)
- See `docs/CREATIVE_BRIEF.md` for design direction

### 2. App Store Link
Replace the placeholder `#` links in all HTML files with your actual App Store URL once the app is published:
```html
<a href="https://apps.apple.com/app/tiltsync/id123456789" class="btn btn-primary">
```

## Customization

### Colors (CSS variables in each file)
```css
--panel: #0d0d0d;       /* Background */
--amber: #ffaa00;       /* Accent/CTA */
--green: #00ff66;       /* Success state */
--text-dim: #888888;    /* Secondary text */
```

### Fonts
The site uses Google Fonts:
- **JetBrains Mono** — Headings, code, monospace elements
- **Space Grotesk** — Body text

## Local Development

No build required. Just open the HTML files in a browser:

```bash
# macOS
open website/index.html

# Or use a simple HTTP server
cd website
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## Pages

| Page | Path | Purpose |
|------|------|---------|
| Home | `/` | Landing page with features, modes, CTA |
| Privacy | `/privacy` | Privacy policy (required for App Store) |
| Terms | `/terms` | Terms of service |
| Support | `/support` | FAQ and troubleshooting |

## Meta Tags

OG and Twitter meta tags are configured in `index.html`. Update these if you change the domain:

```html
<meta property="og:url" content="https://tiltsync.altmake.com/">
<meta property="og:image" content="https://tiltsync.altmake.com/og-image.png">
```

## Notes

- The site is designed mobile-first and responsive
- Dark theme matches the app's default aesthetic
- Animated compass in hero section adds visual interest
- Scanline overlay gives a subtle cockpit display feel
- All pages share consistent styling
