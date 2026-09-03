import { ImageResponse } from 'next/og';
import { renderAppIcon } from '@/lib/app-icon';

// A named route (not the icon.tsx/apple-icon.tsx file convention, which
// only produces one size each) so manifest.ts can reference an exact,
// stable /icon-192 path for the PWA install icon size Android/Chrome ask
// for specifically.
export function GET() {
  return new ImageResponse(renderAppIcon(192, 32), { width: 192, height: 192 });
}
