'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import type { Vehicle } from '@/types/vehicle';
import { MediaImage } from '@/components/media-image';

// Fraction of the gallery's own width a drag must cross before it counts as
// a swipe to the next/previous photo, rather than snapping back.
const SWIPE_RATIO_THRESHOLD = 0.15;
// Drag-preview resistance at the first/last photo — there's nothing to
// slide to, but a hard stop reads as broken; a damped follow reads as a
// deliberate "end of gallery" rubber-band, same as native photo viewers.
const EDGE_RESISTANCE = 0.35;

export function VehicleGallery({ media, title }: { media: Vehicle['media']; title: string }) {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  // Mirrors dragOffset state — read at pointerup time so the drop decision
  // always uses the latest value without the effect below needing
  // dragOffset in its dependency array (which would tear down and
  // re-attach the window listeners on every pixel of movement).
  const dragOffsetRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const count = media.length;

  function goTo(next: number): void {
    setIndex((next + count) % count);
  }

  // Attaches window-level listeners only while actively dragging, rather
  // than relying on onPointerMove/setPointerCapture staying scoped to the
  // element under the pointer — robust to the pointer moving fast enough
  // to leave the element between samples (a real risk on a small gallery),
  // and to the coalesced-event quirks that made an earlier element-scoped
  // version silently drop most move events during testing.
  useEffect(() => {
    if (!isDragging) return;

    function handleMove(event: globalThis.PointerEvent): void {
      let delta = event.clientX - dragStartX.current;
      const atStart = index === 0 && delta > 0;
      const atEnd = index === count - 1 && delta < 0;
      if (atStart || atEnd) delta *= EDGE_RESISTANCE;
      dragOffsetRef.current = delta;
      setDragOffset(delta);
    }

    function handleUp(): void {
      const width = trackRef.current?.clientWidth || 1;
      const ratio = dragOffsetRef.current / width;
      if (ratio <= -SWIPE_RATIO_THRESHOLD) {
        goTo(index + 1);
      } else if (ratio >= SWIPE_RATIO_THRESHOLD) {
        goTo(index - 1);
      }
      dragOffsetRef.current = 0;
      setDragOffset(0);
      setIsDragging(false);
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- goTo closes over count only, stable per render; re-running per index change is intentional (keeps atStart/atEnd current).
  }, [isDragging, index, count]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (count <= 1) return;
    dragStartX.current = event.clientX;
    setIsDragging(true);
  }

  if (count === 0) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-primary-light shadow-card">
        <MediaImage
          src={null}
          alt={title}
          shape="thumb"
          emptyIcon={ImageOff}
          emptyIconClassName="h-8 w-8"
          emptyLabel="Photos coming soon"
          className="aspect-[4/3] w-full rounded-2xl bg-primary-light"
        />
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[4/3] w-full touch-pan-y overflow-hidden rounded-2xl bg-primary-light shadow-card select-none"
      onPointerDown={handlePointerDown}
    >
      {/* All photos render at once (not just the active one) so paging is
          an instant transform, not a network-wait — swiping to a photo the
          user hasn't seen yet still has to load, same as before, but the
          slide motion itself never blocks on that. */}
      <div
        ref={trackRef}
        className={`flex h-full ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
        style={{ transform: `translateX(calc(${-index * 100}% + ${dragOffset}px))` }}
      >
        {media.map((photo, i) => (
          <div key={photo.id} className="h-full w-full shrink-0">
            <MediaImage
              src={photo.url}
              alt={count > 1 ? `${title} — photo ${i + 1} of ${count}` : title}
              shape="thumb"
              emptyIcon={ImageOff}
              emptyIconClassName="h-8 w-8"
              emptyLabel="Photos coming soon"
              className="h-full w-full bg-primary-light"
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => goTo(index - 1)}
            className="press-icon absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-card transition hover:bg-background"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => goTo(index + 1)}
            className="press-icon absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-card transition hover:bg-background"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
          <span className="absolute right-3 bottom-3 rounded-full bg-foreground/70 px-2.5 py-1 text-xs font-medium text-white">
            {index + 1} / {count}
          </span>
        </>
      )}
    </div>
  );
}
