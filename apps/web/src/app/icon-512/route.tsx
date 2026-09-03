import { ImageResponse } from 'next/og';
import { renderAppIcon } from '@/lib/app-icon';

// See icon-192/route.tsx — same reasoning, the other manifest-required
// size. Also reused as the 'maskable' purpose icon since the background
// already fills edge-to-edge (safe for OS-side cropping/masking).
export function GET() {
  return new ImageResponse(renderAppIcon(512, 80), { width: 512, height: 512 });
}
