'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';

export function VehicleGallery({ media, title }: { media: Vehicle['media']; title: string }) {
  const [index, setIndex] = useState(0);

  if (media.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center bg-primary-light text-sm text-muted">
        Photos coming soon
      </div>
    );
  }

  const active = media[index];

  return (
    <div className="relative aspect-[4/3] w-full bg-primary-light">
      {/* eslint-disable-next-line @next/next/no-img-element -- remote media host isn't configured until we finalize a CDN */}
      <img src={active.url} alt={title} className="h-full w-full object-cover" />

      {media.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
            className="absolute top-1/2 left-2 -translate-y-1/2 bg-white/90 p-1.5"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => setIndex((i) => (i + 1) % media.length)}
            className="absolute top-1/2 right-2 -translate-y-1/2 bg-white/90 p-1.5"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
          <span className="absolute right-2 bottom-2 bg-black/60 px-2 py-0.5 text-xs text-white">
            {index + 1} / {media.length}
          </span>
        </>
      )}
    </div>
  );
}
