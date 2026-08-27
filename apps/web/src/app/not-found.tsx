import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">Page nahi mila</h1>
      <p className="text-sm text-muted">
        Yeh page maujood nahi hai, ya listing ab available nahi hai.
      </p>
      <Link href="/" className="inline-block border border-primary px-4 py-2 text-sm text-primary">
        Vehicles Dekhein
      </Link>
    </div>
  );
}
