/**
 * Shared mark for every generated app icon (favicon, apple-touch-icon, and
 * the two PWA manifest sizes) — a near-black rounded square with a white
 * car glyph, matching the exact mark already used on apps/admin's login
 * screen (Car from lucide-react in a bg-primary box) rather than inventing
 * a new one. The car's path data is copied from lucide-react's own car.mjs
 * (view Box 0 0 24 24) since Satori (next/og's renderer) can't `import` a
 * component from a library that isn't plain serializable JSX/SVG.
 *
 * Sized to keep the glyph within the center ~50% of the canvas — Android's
 * maskable-icon spec crops/masks arbitrarily outside a safe zone, and the
 * background already fills edge-to-edge so any crop shape still reads.
 */
export function renderAppIcon(size: number, cornerRadius: number) {
  const strokeWidth = 1.75;
  const glyphSize = size * 0.5;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: cornerRadius,
        background: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={glyphSize}
        height={glyphSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ffffff"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
        <circle cx="7" cy="17" r="2" />
        <path d="M9 17h6" />
        <circle cx="17" cy="17" r="2" />
      </svg>
    </div>
  );
}
