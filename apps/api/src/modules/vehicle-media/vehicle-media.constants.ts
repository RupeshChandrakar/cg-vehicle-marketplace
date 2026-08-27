export const MAX_FILES_PER_VEHICLE = 10;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_MIME_TYPE_PATTERN = /^image\/(jpeg|png|webp)$/;

export const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
