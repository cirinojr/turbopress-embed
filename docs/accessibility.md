# Accessibility guidelines

TurboPress Embedded is designed to support WCAG 2.2 Level AA and the WordPress Accessibility Coding Standards. This is an engineering target, not a claim of certification. Conformance also depends on the active theme, authored content, WordPress configuration, and third-party providers.

## Component rules

- Use a native `button` for an action on the current page and a native link for navigation.
- Keep Play, provider links, profile links, hashtags, and music links as separate interaction targets. Never nest buttons and links.
- Give icon-only controls a translated accessible name. Prefer visible translated text when it fits.
- Play labels must include context, such as `Play video: {title}`. Every generated iframe must have a provider- and content-specific title.
- Preserve focus when a preview is replaced. Focus the newly mounted player or an appropriate stable result container without scrolling the page.
- Use `:focus-visible` with a high-contrast outline and keep interactive targets at least 24 by 24 CSS pixels; primary controls should normally be larger.
- Treat thumbnails and avatars as decorative when adjacent text already supplies the same information. Provide an author-facing alt-text field for meaningful, user-selected images.
- Use `pre` and `code` for source code. Keep line numbers hidden from assistive technology and the horizontal overflow inside the code region.
- Announce concise results such as copy success and actionable errors with a polite status or alert. Do not announce decorative skeleton details.
- Never communicate status only through color. Keep secondary text at 4.5:1 contrast and focus/UI indicators at 3:1 against adjacent colors.
- Respect `prefers-reduced-motion` for non-essential transitions, zoom effects, and loading animations.
- Use Gutenberg controls with visible labels and help text. Repeated items must have Move up/Move down controls in addition to any dragging behavior.
- Reusable blocks must not assume an `h1`. When semantic headings are required, expose a heading-level control and preserve a logical section hierarchy.

## Third-party boundary

TurboPress owns the accessibility of its preview, loading control, fallback, iframe title, focus transition, and surrounding markup. YouTube, TikTok, Spotify, SoundCloud, Vimeo, Twitch, Loom, Figma, CodePen, X/Twitter, and other providers control the contents of their own players or widgets; TurboPress cannot repair accessibility defects inside those third-party documents.

## Audited block matrix

| Blocks | Primary pattern checked |
| --- | --- |
| YouTube, Spotify, SoundCloud, TikTok | Contextual Play button, separate navigation links, decorative thumbnails, lazy player title and focus transition |
| Vimeo, Twitch, CodePen, Loom, Figma | Shared lazy-media semantics, trusted iframe, contextual title, focus and target size |
| X/Twitter | Explicit widget-loading action, stable loading focus, failure state and external-content boundary |
| Bluesky, Smart URL Preview | Standalone article semantics, decorative repeated images, distinguishable provider link and responsive reading order |
| GitHub Gist, GitHub Code Showcase | `pre`/`code`, selectable source, internal scrolling, hidden line numbers and announced copy result |
| GitHub Project Showcase | Standalone article, textual repository metrics and separate repository/demo links |
| Tech Stack | Technology names as text and keyboard Move up/Move down/remove authoring controls |
| Developer Project Case Study | Configurable heading hierarchy, DOM reading order and author-provided image alternative text |
| Project Metrics | Explicit Before/After text, textual direction and keyboard Move up/Move down/remove controls |

## Regression checklist

For every block, verify keyboard operation with Tab, Shift+Tab, Enter, and Space; visible focus; sensible screen-reader names and reading order; 320px layout and 200% zoom; light/dark contrast; reduced motion; meaningful static output before JavaScript; and understandable behavior when provider loading fails.
