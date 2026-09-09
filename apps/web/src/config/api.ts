/**
 * Single place the customer web app learns where the API lives.
 *
 * Deliberately `||`, not `??` — `NEXT_PUBLIC_*` vars are inlined at *build*
 * time, and an env var that's declared-but-left-empty in a host's
 * dashboard (rather than genuinely unset) resolves to `""`, which `??`
 * treats as a real value and would never fall back from. That exact bug
 * shipped once: API_BASE_URL silently became `""`, and every call in
 * lib/api.ts (`fetch(`${API_BASE_URL}${path}`)`) turned into a same-origin
 * relative request — e.g. a deployed web app calling its own
 * `/auth/customer/otp/request` instead of the real API, a 404 with no
 * indication anything was misconfigured.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
