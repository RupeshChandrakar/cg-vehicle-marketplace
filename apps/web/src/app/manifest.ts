import type { MetadataRoute } from 'next';
import { brand } from '@cg/shared-config';

/**
 * Real "Add to Home Screen" support — Next.js serves this at
 * /manifest.webmanifest and links it automatically. display: 'standalone'
 * is what actually hides the browser's own address bar/chrome once
 * installed, which is the single most authentic way a web page can "run
 * like an app" rather than merely look like one. Icons come from
 * app/icon.tsx (generated, not static files — see that file's comment).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.shortName,
    description: brand.tagline,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
