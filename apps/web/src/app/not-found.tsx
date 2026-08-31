import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">Page nahi mila</h1>
      <p className="text-sm text-muted">
        Yeh page maujood nahi hai, ya listing ab available nahi hai.
      </p>
      <Link
        href="/"
        className="inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark"
      >
        Vehicles Dekhein
      </Link>
    </div>
  );
}
