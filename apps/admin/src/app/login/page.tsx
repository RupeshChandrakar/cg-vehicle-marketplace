'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
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
      router.push('/queue');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Admin / Agent login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm text-muted">Email</span>
          <input
            type="email"
            name="email"
            required
            className="w-full border border-line px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-muted">Password</span>
          <input
            type="password"
            name="password"
            required
            className="w-full border border-line px-3 py-2 text-sm text-foreground"
          />
        </label>

        {error && <p className="text-sm text-foreground">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
