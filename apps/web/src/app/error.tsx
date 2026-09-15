'use client';

import { AlertTriangle } from 'lucide-react';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="empty-state">
        <span className="empty-state-icon">
          <AlertTriangle className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <p className="text-foreground">Kuch gadbad ho gayi. Vehicles load nahi ho paayein.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="press rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
