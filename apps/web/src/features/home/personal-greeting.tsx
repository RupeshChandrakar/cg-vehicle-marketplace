'use client';

import { useCustomerAuth } from '@/lib/customer-auth-context';

/**
 * "Hi, {first name} 👋" above the hero tagline when logged in — a real
 * native app rarely wastes its home screen's top slot on a generic tagline
 * for a user it already knows. Renders nothing for a guest (no name to
 * greet with, and the tagline alone already carries the value prop).
 */
export function PersonalGreeting() {
  const { user } = useCustomerAuth();
  if (!user?.name) return null;

  const firstName = user.name.trim().split(/\s+/)[0];
  return (
    <p className="text-sm font-semibold text-foreground">
      Hi, {firstName} <span aria-hidden>👋</span>
    </p>
  );
}
