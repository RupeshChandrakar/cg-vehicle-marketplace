const REFERRAL_CODE_STORAGE_KEY = 'cg_referral_code';

/**
 * Captures a `?ref=<code>` query param and remembers it in localStorage
 * until it's actually used — a visitor might land on a shared vehicle
 * link, browse for a while, and only sign up (via OTP) later. See
 * ReferralCapture (mounted once in the root layout) and the login page,
 * which reads this back when calling requestOtp().
 */
export function captureReferralCodeFromUrl(): void {
  if (typeof window === 'undefined') return;
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (!ref) return;
  try {
    window.localStorage.setItem(REFERRAL_CODE_STORAGE_KEY, ref);
  } catch {
    // Private browsing / storage disabled — referral just won't be attributed.
  }
}

export function getStoredReferralCode(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage.getItem(REFERRAL_CODE_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
