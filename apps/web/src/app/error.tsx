'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-16 text-center">
      <p className="text-foreground">Kuch gadbad ho gayi. Vehicles load nahi ho paayein.</p>
      <button onClick={() => reset()} className="border border-primary px-4 py-2 text-primary">
        Try again
      </button>
    </div>
  );
}
