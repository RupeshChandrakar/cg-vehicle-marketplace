'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Bell,
  MapPin,
  ChevronDown,
  Check,
  Menu,
  X,
  Phone,
  Mail,
  Tag,
  Heart,
  MessageSquare,
  ClipboardList,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';
import { brand } from '@cg/shared-config';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import { getLocations, getNotifications } from '@/lib/api';
import type { Location } from '@/types/vehicle';

const SHARED_MENU_ITEMS: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: 'Sell Your Vehicle', href: '/sell', icon: Tag },
  { label: 'Favorites', href: '/favorites', icon: Heart },
  { label: 'My Enquiries', href: '/my-enquiries', icon: MessageSquare },
  { label: 'My Listings', href: '/my-listings', icon: ClipboardList },
  { label: 'My Account', href: '/account', icon: UserCircle },
];

export function SiteHeader() {
  const { user, accessToken, logout } = useCustomerAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [locations, setLocations] = useState<Location[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Classic SSR-safe "mounted" flag — delays client-only rendering until
    // after hydration so the server-rendered and first-client-rendered
    // markup match; there's no external system to synchronize with here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

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

  useEffect(() => {
    // Keep the drawer state in sync with navigation so it closes after a tap.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [pathname, searchParams]);

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
      <ContactBar />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="press-icon rounded-xl border border-line p-2 text-foreground sm:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4.5 w-4.5" strokeWidth={1.85} />
          </button>
          <Link
            href="/"
            className="truncate text-sm font-bold tracking-tight text-foreground sm:text-lg"
          >
            {brand.name}
          </Link>
        </div>

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
        <div className="hidden items-center gap-3 sm:flex">
          <DistrictSelector
            activeDistrictLabel={activeDistrict?.district ?? 'All Chhattisgarh'}
            activeDistrictSlug={activeDistrictSlug}
            locations={locations}
            onChange={navigateToDistrict}
          />

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Desktop menu">
            {SHARED_MENU_ITEMS.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href.split('?')[0]);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary-light text-primary-dark'
                      : 'text-foreground hover:bg-primary-light'
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.85} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {isMounted && user && (
            <>
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
            </>
          )}

          {isMounted && user ? (
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

      <button
        type="button"
        aria-label="Close menu overlay"
        onClick={() => setMobileMenuOpen(false)}
        className={`fixed inset-0 z-30 bg-black/40 transition sm:hidden ${
          mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[82vw] max-w-xs flex-col border-r border-line bg-background transition-transform duration-200 ease-out sm:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile sidebar"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <p className="text-sm font-semibold tracking-tight text-foreground">Menu</p>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="press-icon rounded-lg p-1.5 text-foreground"
            aria-label="Close menu"
          >
            <X className="h-4.5 w-4.5" strokeWidth={1.85} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Mobile menu">
          {SHARED_MENU_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href.split('?')[0]);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-light text-primary-dark'
                    : 'text-foreground hover:bg-primary-light'
                }`}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={1.85} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </header>
  );
}

/** Any direct visitor should see the phone number before anything else on
 *  the page and be able to tap-to-call immediately — this is intentionally
 *  the first thing rendered inside the (sticky) header. */
function ContactBar() {
  return (
    <div className="bg-primary px-4 py-1.5 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-4 sm:justify-between">
        <a
          href={`mailto:${brand.supportEmail}`}
          className="press-text hidden min-w-0 items-center gap-1.5 truncate text-xs hover:underline sm:flex"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">{brand.supportEmail}</span>
        </a>
        <a
          href={`tel:${brand.supportPhone}`}
          className="press-text flex shrink-0 items-center gap-1.5 text-xs font-bold hover:underline sm:text-sm"
        >
          <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          Call Now: {formatPhoneDisplay(brand.supportPhone)}
        </a>
      </div>
    </div>
  );
}

function formatPhoneDisplay(e164Phone: string): string {
  const digits = e164Phone.replace('+91', '');
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
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
        className="press-text block max-w-28 truncate text-left"
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
                  className="press-chip flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground transition hover:bg-primary-light"
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
