'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { toggleFavorite, checkFavorited } from '@/lib/api';

interface FavoriteButtonProps {
  vehiclePublicId: number;
  /** Only pass true on the vehicle detail page — one extra request there is
   *  cheap; doing it per-card on a listing grid would be one request per
   *  card, so cards always start unfilled and rely on the toggle itself. */
  checkInitialState?: boolean;
  className?: string;
}

export function FavoriteButton({
  vehiclePublicId,
  checkInitialState = false,
  className,
}: FavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken } = useCustomerAuth();
  const [favorited, setFavorited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!checkInitialState || !accessToken) return;
    checkFavorited(accessToken, vehiclePublicId)
      .then((result) => setFavorited(result.favorited))
      .catch(() => undefined);
  }, [checkInitialState, accessToken, vehiclePublicId]);

  async function handleClick(event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (!accessToken) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await toggleFavorite(accessToken, vehiclePublicId);
      setFavorited(result.favorited);
    } catch {
      // A failed toggle isn't worth an error banner — the button simply doesn't change.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(event) => void handleClick(event)}
      disabled={isSubmitting}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
      className={
        className ??
        'flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-card transition hover:bg-background'
      }
    >
      <Heart
        className={favorited ? 'h-4 w-4 fill-primary text-primary' : 'h-4 w-4 text-foreground'}
        strokeWidth={1.75}
      />
    </button>
  );
}
