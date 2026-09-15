'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Clapperboard } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  createReel,
  getAdminReels,
  getAdminVehicles,
  updateReelPublishStatus,
  ApiError,
} from '@/lib/api';
import type { Reel, ReelTemplate, ReelPublishStatus } from '@/types/reel';
import type { AdminVehicle } from '@/types/vehicle';

const TEMPLATES: Array<{ value: ReelTemplate; label: string }> = [
  { value: 'ken_burns', label: 'Ken Burns (zoom/pan)' },
  { value: 'classic', label: 'Classic (fade)' },
];

const PUBLISH_STATUSES: ReelPublishStatus[] = ['draft', 'scheduled', 'published'];
const PLATFORMS = ['instagram', 'facebook', 'youtube'];

export default function ReelsPage() {
  const router = useRouter();
  const { user, accessToken, isLoading: isAuthLoading } = useAuth();

  const [reels, setReels] = useState<Reel[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await getAdminReels(accessToken);
      setReels(result.data);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/login');
    }
  }, [isAuthLoading, user, router]);

  useEffect(() => {
     
    void load();
  }, [load]);

  useEffect(() => {
    if (!accessToken) return;
    getAdminVehicles(accessToken, undefined, 50)
      .then((result) => setVehicles(result.data))
      .catch(() => undefined);
  }, [accessToken]);

  // Async generation with no queue/websocket status push yet (see
  // docs/ARCHITECTURE.md "Phase 6 notes") — poll while anything's in flight.
  useEffect(() => {
    if (!reels.some((r) => r.status === 'processing')) return;
    const interval = setInterval(() => void load(), 3000);
    return () => clearInterval(interval);
  }, [reels, load]);

  if (isAuthLoading || !user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setShowCreateForm((s) => !s)}
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-btn transition hover:bg-[#12703a]"
      >
        {showCreateForm ? 'Cancel' : '+ Create New Reel'}
      </button>

      {showCreateForm && (
        <CreateReelForm
          accessToken={accessToken as string}
          vehicles={vehicles}
          onCreated={() => {
            setShowCreateForm(false);
            void load();
          }}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : reels.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">
            <Clapperboard className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <p className="text-sm text-muted">No reels yet — create one from a vehicle with photos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reels.map((reel) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              accessToken={accessToken as string}
              onChanged={load}
              isAdmin={user.role === 'admin'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateReelForm({
  accessToken,
  vehicles,
  onCreated,
}: {
  accessToken: string;
  vehicles: AdminVehicle[];
  onCreated: () => void;
}) {
  const [vehicleId, setVehicleId] = useState('');
  const [template, setTemplate] = useState<ReelTemplate>('ken_burns');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!vehicleId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await createReel(accessToken, vehicleId, template);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to start reel generation.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-background p-5 shadow-card">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          className="rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Select a vehicle</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title} ({v.media.length} photo{v.media.length === 1 ? '' : 's'})
            </option>
          ))}
        </select>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value as ReelTemplate)}
          className="rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          {TEMPLATES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-foreground">{error}</p>}
      <button
        type="submit"
        disabled={!vehicleId || isSubmitting}
        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-btn transition hover:bg-[#12703a] disabled:opacity-50"
      >
        {isSubmitting ? 'Starting…' : 'Generate Reel'}
      </button>
    </form>
  );
}

function ReelCard({
  reel,
  accessToken,
  onChanged,
  isAdmin,
}: {
  reel: Reel;
  accessToken: string;
  onChanged: () => void;
  isAdmin: boolean;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  async function handlePublishChange(
    publishStatus: ReelPublishStatus,
    platform?: string,
  ): Promise<void> {
    setIsUpdating(true);
    try {
      await updateReelPublishStatus(accessToken, reel.id, publishStatus, platform);
      onChanged();
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-background shadow-card">
      <div className="relative aspect-[9/16] w-full bg-primary-light">
        {reel.status === 'completed' && reel.videoUrl ? (
          <video
            src={reel.videoUrl}
            poster={reel.thumbnailUrl ?? undefined}
            controls
            className="h-full w-full object-cover"
          />
        ) : reel.status === 'processing' ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            Processing…
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 p-4 text-center text-sm text-muted">
            <span>Generation failed</span>
            {reel.errorMessage && <span className="text-xs">{reel.errorMessage}</span>}
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <p className="font-medium text-foreground">{reel.vehicle.title}</p>
        <p className="text-xs text-muted capitalize">
          {reel.template.replace('_', ' ')}
          {reel.durationSeconds ? ` · ${reel.durationSeconds}s` : ''}
        </p>
        {isAdmin ? (
          <div className="flex gap-2">
            <select
              value={reel.publishStatus}
              onChange={(e) =>
                void handlePublishChange(
                  e.target.value as ReelPublishStatus,
                  reel.platform ?? undefined,
                )
              }
              disabled={isUpdating || reel.status !== 'completed'}
              className="flex-1 rounded-lg border border-line px-2 py-1.5 text-xs text-foreground disabled:opacity-60"
            >
              {PUBLISH_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={reel.platform ?? ''}
              onChange={(e) =>
                void handlePublishChange(reel.publishStatus, e.target.value || undefined)
              }
              disabled={isUpdating || reel.status !== 'completed'}
              className="flex-1 rounded-lg border border-line px-2 py-1.5 text-xs text-foreground disabled:opacity-60"
            >
              <option value="">Platform</option>
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className="inline-block rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary capitalize">
            {reel.publishStatus}
          </span>
        )}
      </div>
    </div>
  );
}
