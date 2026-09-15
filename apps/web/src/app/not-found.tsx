import Link from 'next/link';
import { CarFront } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="empty-state">
        <span className="empty-state-icon">
          <CarFront className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h1 className="text-xl font-semibold text-foreground">Page nahi mila</h1>
        <p className="text-sm text-muted">
          Yeh page maujood nahi hai, ya listing ab available nahi hai.
        </p>
        <Link
          href="/"
          className="press inline-flex rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-btn transition hover:bg-primary-dark"
        >
          Vehicles Dekhein
        </Link>
      </div>
    </div>
  );
}
