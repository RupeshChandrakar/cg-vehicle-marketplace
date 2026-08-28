'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Car } from 'lucide-react';
import { brand } from '@cg/shared-config';
import { staffLogin, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    try {
      const result = await staffLogin(String(form.get('email')), String(form.get('password')));
      login(result.user, result.tokens.accessToken, result.tokens.refreshToken);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-16">
      <div className="mb-6 flex items-center justify-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Car className="h-5 w-5 text-white" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-base leading-tight font-bold text-foreground">{brand.name}</p>
          <p className="text-xs text-muted">Admin Panel</p>
        </div>
      </div>

      <div className="rounded-2xl bg-background p-6 shadow-card">
        <h1 className="mb-5 text-lg font-semibold text-foreground">Admin / Agent Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm text-muted">Email</span>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm text-muted">Password</span>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </label>

          {error && <p className="text-sm text-foreground">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-btn transition hover:bg-[#12703a] hover:shadow-btn-hover-primary disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
