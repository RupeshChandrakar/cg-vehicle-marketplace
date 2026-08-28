import { ReelTemplate } from '../../generated/prisma/client';

// Instagram Reels / YouTube Shorts vertical format.
export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;
export const REEL_FPS = 30;
export const REEL_SEGMENT_DURATION_SECONDS = 3;

export interface SegmentFilterInput {
  /** Already run through FfmpegService.toFilterPath(). */
  titleFilterPath: string;
  priceFilterPath: string;
  fontFilterPath: string;
}

/**
 * Two genuinely different filter graphs, not just cosmetic labels:
 * "classic" is a static frame with a fade in/out; "ken_burns" adds a slow
 * zoom/pan (`zoompan`) so the same photo feels alive. Both share the same
 * crop-to-vertical and title/price overlay treatment.
 */
export function buildSegmentFilter(
  template: ReelTemplate,
  input: SegmentFilterInput,
): string {
  const frames = REEL_SEGMENT_DURATION_SECONDS * REEL_FPS;

  const base = `scale=${REEL_WIDTH}:${REEL_HEIGHT}:force_original_aspect_ratio=increase,crop=${REEL_WIDTH}:${REEL_HEIGHT}`;

  const motion =
    template === 'ken_burns'
      ? `,zoompan=z='min(zoom+0.0015,1.15)':d=${frames}:s=${REEL_WIDTH}x${REEL_HEIGHT}:fps=${REEL_FPS}`
      : '';

  const overlay =
    ',drawbox=x=0:y=ih-260:w=iw:h=260:color=black@0.55:t=fill' +
    `,drawtext=fontfile='${input.fontFilterPath}':textfile='${input.titleFilterPath}':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=h-220` +
    `,drawtext=fontfile='${input.fontFilterPath}':textfile='${input.priceFilterPath}':fontcolor=0x168A45:fontsize=64:x=(w-text_w)/2:y=h-130`;

  const fade =
    template === 'classic'
      ? `,fade=t=in:st=0:d=0.3,fade=t=out:st=${REEL_SEGMENT_DURATION_SECONDS - 0.3}:d=0.3`
      : '';

  return `${base}${motion}${overlay}${fade}`;
}
