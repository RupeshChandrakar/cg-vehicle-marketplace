import { ImageResponse } from 'next/og';
import { renderAppIcon } from '@/lib/app-icon';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  // iOS applies its own corner-rounding mask to home-screen icons — a
  // square source (no radius) is the correct input, unlike the favicon/
  // manifest icons which draw their own rounding.
  return new ImageResponse(renderAppIcon(180, 0), size);
}
