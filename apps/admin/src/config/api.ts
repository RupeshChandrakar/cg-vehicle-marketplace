/**
 * Single place the admin web app learns where the API lives.
 *
 * `||`, not `??` — see apps/web's identical config/api.ts for the exact
 * bug this avoids: a declared-but-empty NEXT_PUBLIC_API_URL resolves to
 * `""`, which `??` treats as a real value, silently turning every API call
 * into a same-origin relative request instead of falling back correctly.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
