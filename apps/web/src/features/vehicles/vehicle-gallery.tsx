'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';
import { MediaImage } from '@/components/media-image';

export function VehicleGallery({ media, title }: { media: Vehicle['media']; title: string }) {
  const [index, setIndex] = useState(0);
  const active = media[index];

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-primary-light shadow-card">
      <MediaImage
        key={active?.url}
        src={active?.url}
        alt={title}
        shape="thumb"
        emptyIcon={ImageOff}
        emptyIconClassName="h-8 w-8"
        emptyLabel="Photos coming soon"
        className="aspect-[4/3] w-full rounded-2xl bg-primary-light"
      />

      {media.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
            className="press-icon absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-card transition hover:bg-background"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => setIndex((i) => (i + 1) % media.length)}
            className="press-icon absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-card transition hover:bg-background"
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
