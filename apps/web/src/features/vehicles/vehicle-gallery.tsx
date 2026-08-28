'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';

export function VehicleGallery({ media, title }: { media: Vehicle['media']; title: string }) {
  const [index, setIndex] = useState(0);

  if (media.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-primary-light text-sm text-muted">
        Photos coming soon
      </div>
    );
  }

  const active = media[index];

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-primary-light shadow-card">
      {/* eslint-disable-next-line @next/next/no-img-element -- remote media host isn't configured until we finalize a CDN */}
      <img src={active.url} alt={title} className="h-full w-full object-cover" />

      {media.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
            className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-card transition hover:bg-background"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => setIndex((i) => (i + 1) % media.length)}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-card transition hover:bg-background"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
          <span className="absolute right-3 bottom-3 rounded-full bg-foreground/70 px-2.5 py-1 text-xs font-medium text-white">
            {index + 1} / {media.length}
          </span>
        </>
      )}
    </div>
  );
}
