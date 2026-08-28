import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';

const execFileAsync = promisify(execFile);
const MAX_BUFFER_BYTES = 64 * 1024 * 1024;

/**
 * Thin wrapper around the ffmpeg-static/ffprobe-static binaries — real
 * child-process execution, no shell involved (execFile, not exec), so
 * argument values never need shell-quoting. See ReelsService for how the
 * commands themselves are built.
 */
@Injectable()
export class FfmpegService {
  private readonly logger = new Logger(FfmpegService.name);

  /**
   * FFmpeg's own filtergraph syntax uses `:` to separate a filter's
   * options — a bare Windows drive letter (`C:\...`) breaks that parsing
   * unless the colon is escaped, independent of any shell-quoting concern.
   * Forward slashes sidestep the rest of the Windows-path escaping
   * headache. Safe to call on POSIX paths too (no drive letter to escape).
   */
  toFilterPath(absolutePath: string): string {
    return absolutePath.replace(/\\/g, '/').replace(/^([A-Za-z]):/, '$1\\:');
  }

  async run(args: string[]): Promise<void> {
    this.logger.debug(`ffmpeg ${args.join(' ')}`);
    try {
      await execFileAsync(ffmpegPath as unknown as string, args, {
        maxBuffer: MAX_BUFFER_BYTES,
      });
    } catch (error) {
      const stderr = (error as { stderr?: string }).stderr;
      const detail = stderr
        ? stderr.trim().split('\n').slice(-5).join(' ')
        : (error as Error).message;
      this.logger.error(`ffmpeg failed: ${detail}`);
      throw new Error(`Video generation failed: ${detail}`);
    }
  }

  async probeDurationSeconds(filePath: string): Promise<number> {
    const { stdout } = await execFileAsync(ffprobePath, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    return parseFloat(stdout.trim());
  }
}
