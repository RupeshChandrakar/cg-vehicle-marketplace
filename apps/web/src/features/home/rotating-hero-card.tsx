'use client';

import { useEffect, useState, type ReactNode } from 'react';

interface HeroVariant {
  key: string;
  className: string;
}

/** The 4 approved looks from the review — a 5th, a "road motif," was
 *  dropped: a dark strip crossed the paragraph text and hurt legibility. */
const VARIANTS: HeroVariant[] = [
  { key: 'blobs', className: 'hero-background' },
  { key: 'dots', className: 'hero-variant-dots' },
  { key: 'stripes', className: 'hero-variant-stripes' },
  { key: 'spotlight', className: 'hero-variant-spotlight' },
];

// Slower than PromoTicker's own 4s text rotation, deliberately — the badge
// text and the card background changing on the same beat would read as
// everything flickering at once instead of two calm, independent rhythms.
const ROTATE_INTERVAL_MS = 8000;

/**
 * Cycles the home hero card's decorative background live while a visitor is
 * on the page. The background layer is a separate, absolutely-positioned
 * div that remounts (via `key`) each rotation to replay its fade — the
 * `children` (heading, PromoTicker, CTA) sit in a sibling div that never
 * remounts, so PromoTicker's own independent timer is never disrupted by
 * the background changing underneath it.
 */
export function RotatingHeroCard({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % VARIANTS.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const variant = VARIANTS[index];

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-card">
      <div key={index} className={`${variant.className} animate-hero-bg-fade-in absolute inset-0`}>
        {variant.key === 'blobs' && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="hero-blob-a absolute -top-20 -right-10 h-64 w-64 rounded-full blur-3xl sm:h-80 sm:w-80" />
            <div className="hero-blob-b absolute -bottom-24 -left-16 h-72 w-72 rounded-full blur-3xl sm:h-96 sm:w-96" />
          </div>
        )}
      </div>
      <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14">{children}</div>
    </div>
  );
}
