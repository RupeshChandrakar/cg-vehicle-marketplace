'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Heart, Bell, MapPin, ChevronDown, Check } from 'lucide-react';
import { brand } from '@cg/shared-config';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getLocations, getNotifications } from '@/lib/api';
import type { Location } from '@/types/vehicle';

export function SiteHeader() {
  const { user, accessToken, logout } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [unreadCount, setUnreadCount] = useState(0);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (!accessToken) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnreadCount(0);
      return;
    }
    getNotifications(accessToken)
      .then((notifications) => setUnreadCount(notifications.filter((n) => !n.isRead).length))
      .catch(() => undefined);
  }, [accessToken]);

  useEffect(() => {
    getLocations()
      .then((data) => setLocations(data))
      .catch(() => undefined);
  }, []);

  const activeDistrictSlug = searchParams.get('district') ?? '';
  const activeDistrict = locations.find((location) => location.slug === activeDistrictSlug);

  function navigateToDistrict(districtSlug: string): void {
    const params = new URLSearchParams(searchParams.toString());
    if (districtSlug) {
      params.set('district', districtSlug);
    } else {
      params.delete('district');
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    // safe-top reserves real device inset space now that layout.tsx's
    // viewport export sets viewportFit: 'cover' — without it this bar would
    // sit directly under a notch/Dynamic Island. Border/backdrop-blur are
    // desktop-only (sm:) below: on mobile a hard divider line under a
    // repeated brand-name bar is exactly the "website header" pattern a
    // live audit flagged — real app screens don't re-announce their own
    // name on every single tab, they rely on the OS chrome (icon, splash)
    // for that once installed, and BottomNav (already the primary mobile
    // nav) plus each page's own heading for in-app wayfinding.
    <header className="safe-top sticky top-0 z-20 bg-background sm:border-b sm:border-line sm:bg-background/95 sm:backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
        <Link
          href="/"
          className="text-sm font-bold tracking-tight text-foreground sm:text-lg"
        >
          {brand.name}
        </Link>

        <div className="relative sm:hidden">
          <DistrictSelector
            activeDistrictLabel={activeDistrict?.district ?? 'All CG'}
            activeDistrictSlug={activeDistrictSlug}
            locations={locations}
            onChange={navigateToDistrict}
            compact
          />
        </div>

        {/* Mobile (<sm): compact district switcher sits at the right side,
            while BottomNav remains the primary nav. Desktop (>=sm): full
            nav row with district selector + actions. */}
        <div className="hidden items-center gap-4 sm:flex">
          <DistrictSelector
            activeDistrictLabel={activeDistrict?.district ?? 'All Chhattisgarh'}
            activeDistrictSlug={activeDistrictSlug}
            locations={locations}
            onChange={navigateToDistrict}
          />

          {user && (
            <>
              <Link
                href="/favorites"
                aria-label="Favorites"
                className="press-icon text-foreground"
              >
                <Heart className="h-5 w-5" strokeWidth={1.75} />
              </Link>
              <Link
                href="/notifications"
                aria-label="Notifications"
                className="press-icon relative text-foreground"
              >
                <Bell className="h-5 w-5" strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/account"
                className="press-text hidden text-sm font-medium text-foreground sm:inline"
              >
                My Account
              </Link>
              <Link
                href="/my-listings"
                className="press-text hidden text-sm font-medium text-foreground sm:inline"
              >
                My Listings
              </Link>
              <Link
                href="/my-enquiries"
                className="press-text hidden text-sm font-medium text-foreground sm:inline"
              >
                My Enquiries
              </Link>
              <Link
                href="/refer"
                className="press-text hidden text-sm font-medium text-foreground sm:inline"
              >
                Invite Friends
              </Link>
            </>
          )}

          <Link
            href="/sell"
            className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark hover:shadow-btn-hover-primary active:scale-[0.97]"
          >
            Sell Your Vehicle
          </Link>

          {user ? (
            <button
              onClick={logout}
              className="press rounded-lg border border-line px-3 py-2 text-sm text-foreground transition hover:bg-primary-light"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="press rounded-lg border border-line px-3 py-2 text-sm text-foreground transition hover:bg-primary-light"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function DistrictSelector({
  activeDistrictLabel,
  activeDistrictSlug,
  locations,
  onChange,
  compact = false,
}: {
  activeDistrictLabel: string;
  activeDistrictSlug: string;
  locations: Location[];
  onChange: (districtSlug: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const options = [
    { slug: '', label: 'All Chhattisgarh' },
    ...locations.map((location) => ({ slug: location.slug, label: location.district })),
  ];

  return (
    <div
      ref={rootRef}
      className={`relative rounded-lg border border-line bg-background text-foreground ${
        compact ? 'pl-8 pr-7 py-1.5 text-xs' : 'pl-3 pr-8 py-2 text-sm'
      }`}
    >
      <MapPin
        className={`absolute left-2 top-1/2 -translate-y-1/2 text-primary ${
          compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
        }`}
      />
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="block max-w-28 truncate text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {activeDistrictLabel}
      </button>
      <ChevronDown
        className={`absolute right-2 top-1/2 -translate-y-1/2 text-muted ${
          compact ? 'h-3.5 w-3.5' : 'h-4 w-4'
        } ${open ? 'rotate-180' : ''} transition-transform`}
      />

      {open && (
        <div
          className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-background shadow-card"
          role="listbox"
          aria-label="District"
        >
          <div className="max-h-72 overflow-auto py-1.5">
            {options.map((option) => {
              const isActive = option.slug === activeDistrictSlug;
              return (
                <button
                  key={option.slug || 'all'}
                  type="button"
                  onClick={() => {
                    onChange(option.slug);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground transition hover:bg-primary-light"
                  role="option"
                  aria-selected={isActive}
                >
                  <span className="truncate">{option.label}</span>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
