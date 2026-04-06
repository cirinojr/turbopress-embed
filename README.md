# TurboPress Embed

TurboPress Embed is a Gutenberg block plugin focused on performance-first embeds.
It ships static preview cards and loads third-party players only after user interaction.

## Supported Providers

- YouTube
- Spotify
- TikTok
- X / Twitter
- SoundCloud

## Why This Plugin Exists

Default third-party embeds often load heavy iframes and external scripts immediately, even when users do not interact with them.
TurboPress Embed reduces this cost by rendering a lightweight preview UI first.

## Key Technical Benefits

- Lower initial network requests on pages with embeds
- Better LCP/INP conditions by deferring heavy iframe initialization
- Predictable, namespaced CSS to reduce theme conflicts
- Accessibility-focused interaction: semantic buttons, visible focus states, keyboard support
- Native Gutenberg architecture with per-block frontend assets

## How It Works

1. In the editor, paste a valid YouTube or Spotify URL.
2. The block fetches metadata (title/thumbnail) in the editor context.
3. On the frontend, a static preview card is rendered.
4. When the user clicks the card, the real provider iframe is mounted.

For providers with oEmbed HTML widgets (TikTok and X/Twitter), the external widget script is loaded only after user interaction.

## Compatibility Notes

- Works with classic themes and block themes (FSE)
- Designed to resist aggressive theme resets by using a strict component namespace
- No jQuery dependency

## Limitations

- Provider metadata depends on public oEmbed responses from YouTube/Spotify
- If provider APIs are temporarily unavailable, preview metadata can be incomplete

## Development

```bash
npm install
npm run start
```

Build for production:

```bash
npm run build
```
