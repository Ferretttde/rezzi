# PWA Icons

Place the following icon files here:

- `icon-192.png` — 192×192 app icon
- `icon-512.png` — 512×512 app icon
- `icon-maskable-512.png` — 512×512 maskable icon (with safe zone padding)

## Generating Icons

You can generate these from an SVG using tools like:
- https://maskable.app/ (for maskable icons)
- https://realfavicongenerator.net/
- `sharp` CLI: `sharp -i icon.svg -o icon-192.png resize 192`

The app theme color is `#e8572a` (tomato orange) on `#faf9f7` (warm off-white).
