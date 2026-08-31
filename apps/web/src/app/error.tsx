'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-16 text-center">
      <p className="text-foreground">Kuch gadbad ho gayi. Vehicles load nahi ho paayein.</p>
      <button
        onClick={() => reset()}
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark"
      >
        Try again
      </button>
    </div>
  );
}
