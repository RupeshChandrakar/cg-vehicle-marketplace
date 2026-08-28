'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomerAuth } from '@/lib/customer-auth-context';
import {
  getSelfProfile,
  updateProfile,
  getMyVehicles,
  getFavorites,
  getMyEnquiries,
  getNotifications,
  ApiError,
  type CustomerUser,
} from '@/lib/api';

const MAX_NAME_LENGTH = 80;
const OPEN_ENQUIRY_STATUSES = new Set(['open', 'contacted', 'negotiating']);

interface Tile {
  label: string;
  count: number;
  href: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading, updateUser, logout } = useCustomerAuth();

  // Seeded from the already-known context user, not null — a slow or
  // transiently failed GET /users/me shouldn't blank out identity info
  // (including the phone number, which this page must always show) that's
  // already sitting in localStorage/context from login.
  const [profile, setProfile] = useState<CustomerUser | null>(user);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [tiles, setTiles] = useState<Tile[] | null>(null);
  // A ref, not state: it must be visible to the guard effect below the
  // instant handleLogout() sets it, with no dependency on how state
  // updates from this component and the auth context happen to batch (or
  // not) relative to each other. A state-based flag measurably still lost
  // this race in testing — the effect's router.replace('/login?...') would
  // still fire and win over handleLogout()'s router.push('/').
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    if (!isAuthLoading && !user && !isLoggingOutRef.current) {
      router.replace('/login?next=/account');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
    if (!accessToken) return;
    getSelfProfile(accessToken)
      .then(setProfile)
      .catch((err) => {
        setProfileError(err instanceof ApiError ? err.message : 'Profile load nahi ho paayi.');
      })
      .finally(() => setIsLoadingProfile(false));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    // Each of these already exists for its own page — reused here purely
    // to count, not refetched or re-derived in any new backend call.
    Promise.all([
      getMyVehicles(accessToken),
      getFavorites(accessToken),
      getMyEnquiries(accessToken),
      getNotifications(accessToken),
    ])
      .then(([vehicles, favorites, enquiries, notifications]) => {
        setTiles([
          { label: 'My Listings', count: vehicles.length, href: '/my-listings' },
          { label: 'Favorites', count: favorites.length, href: '/favorites' },
          {
            label: 'Active Enquiries',
            count: enquiries.filter((e) => OPEN_ENQUIRY_STATUSES.has(e.status)).length,
            href: '/my-enquiries',
          },
          {
            label: 'Unread Notifications',
            count: notifications.filter((n) => !n.isRead).length,
            href: '/notifications',
          },
        ]);
      })
      .catch(() => undefined); // Non-critical — identity block above still works.
  }, [accessToken]);

  function startEditingName(): void {
    setNameInput(profile?.name ?? '');
    setSaveError(null);
    setIsEditingName(true);
  }

  async function handleSaveName(): Promise<void> {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setSaveError('Naam khaali nahi ho sakta.');
      return;
    }
    if (!accessToken) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const updated = await updateProfile(accessToken, trimmed);
      setProfile(updated);
      updateUser(updated);
      setIsEditingName(false);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Naam save nahi ho paaya.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout(): void {
    isLoggingOutRef.current = true;
    logout();
    router.push('/');
  }

  if (isAuthLoading || !user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground">My Account</h1>
        <p className="mt-1 text-sm text-muted">Aapki profile aur account ki jaankari.</p>
      </div>

      {profileError && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-foreground">
          {profileError}
        </p>
      )}

      <div className="space-y-4 rounded-2xl bg-background p-5 shadow-card">
        {!profile && isLoadingProfile ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          profile && (
            <>
              <div>
                <p className="text-xs text-muted">Name</p>
                {isEditingName ? (
                  <div className="mt-1.5 space-y-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value.slice(0, MAX_NAME_LENGTH))}
                      autoFocus
                      className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                    {saveError && <p className="text-sm text-foreground">{saveError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleSaveName()}
                        disabled={isSaving}
                        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-btn transition hover:bg-[#12703a] disabled:opacity-60"
                      >
                        {isSaving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => setIsEditingName(false)}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm text-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-base font-medium text-foreground">
                      {profile.name ?? <span className="text-muted">Naam add karein</span>}
                    </p>
                    <button
                      onClick={startEditingName}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-primary-light"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-line pt-4">
                <p className="text-xs text-muted">Phone Number</p>
                <p className="mt-1 text-base font-medium text-foreground">{profile.phone}</p>
                <p className="mt-1 text-xs text-muted">
                  Ye aapka login number hai, isse badla nahi ja sakta.
                </p>
              </div>
            </>
          )
        )}
      </div>

      {tiles && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className="rounded-2xl bg-background p-4 shadow-card transition hover:shadow-card-hover"
            >
              <p className="text-2xl font-semibold text-foreground">{tile.count}</p>
              <p className="mt-1 text-xs text-muted">{tile.label}</p>
            </Link>
          ))}
        </div>
      )}

      <button
        onClick={handleLogout}
        className="rounded-lg border border-line px-4 py-2.5 text-sm text-foreground transition hover:bg-primary-light"
      >
        Logout
      </button>
    </div>
  );
}
