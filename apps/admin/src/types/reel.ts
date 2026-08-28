// Mirrors the API's reel shape (apps/api/src/modules/reels/reels.service.ts).

export type ReelTemplate = 'classic' | 'ken_burns';
export type ReelStatus = 'processing' | 'completed' | 'failed';
export type ReelPublishStatus = 'draft' | 'published' | 'scheduled';

export interface Reel {
  id: string;
  template: ReelTemplate;
  status: ReelStatus;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  errorMessage: string | null;
  publishStatus: ReelPublishStatus;
  platform: string | null;
  createdAt: string;
  vehicle: { id: string; publicId: number | null; slug: string; title: string };
  createdBy: { id: string; name: string | null; email: string | null };
}
