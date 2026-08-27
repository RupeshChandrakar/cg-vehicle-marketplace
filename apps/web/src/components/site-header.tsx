import Link from 'next/link';
import { brand } from '@cg/shared-config';

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-foreground">
          {brand.name}
        </Link>
        <Link href="/sell" className="border border-primary px-3 py-1.5 text-sm text-primary">
          Sell your vehicle
        </Link>
      </div>
    </header>
  );
}
