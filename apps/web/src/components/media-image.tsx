'use client';

import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Shared photo-loading treatment, used everywhere a real (network-hosted)
 * image can render: shimmer behind the image while it downloads, fade it
 * in via `.media-img-fade`/`is-loaded` once `onLoad` fires, and fall back
 * to a static `.media-empty` icon block — never a shimmer — when there's
 * no `src` at all or it fails to load. See globals.css's "Image loading /
 * empty states" section for why loading and empty-of-content are kept as
 * two distinct, non-overlapping treatments.
 *
 * To reset the loading state when the photo itself changes (e.g. paging
 * through a gallery), key this component by the `src` at the call site —
 * the same "remount to replay" convention PromoTicker/RotatingHeroCard
 * already use for their own animations.
 */
export function MediaImage({
  src,
  alt,
  shape = 'thumb',
  emptyIcon: EmptyIcon,
  emptyIconClassName = 'h-6 w-6',
  emptyLabel,
  className = '',
  imgClassName = '',
}: {
  src?: string | null;
  alt: string;
  /** Which skeleton shape shows while the photo is loading. */
  shape?: 'thumb' | 'circle';
  emptyIcon: LucideIcon;
  emptyIconClassName?: string;
  /** Omit for an icon-only empty state (too small a box for a caption). */
  emptyLabel?: string;
  /** Classes for the (relative, sized, rounded) wrapper. */
  className?: string;
  /** Extra classes on the <img> itself, e.g. a hover-zoom transform. */
  imgClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // A cached image can finish loading (browser paints it immediately)
    // before React even attaches the onLoad listener, so onLoad never
    // fires and the fade-in gets stuck at opacity 0 forever — check
    // synchronously on mount/src-change to catch that case too.
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  if (!src || errored) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="media-empty">
          <EmptyIcon className={emptyIconClassName} strokeWidth={1.5} />
          {emptyLabel && <span className="text-xs">{emptyLabel}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && (
        <div className={`skeleton absolute inset-0 ${shape === 'circle' ? 'skeleton-circle' : 'skeleton-thumb'}`} />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- storage host isn't configured for next/image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={`media-img-fade h-full w-full object-cover ${loaded ? 'is-loaded' : ''} ${imgClassName}`}
      />
    </div>
  );
}
