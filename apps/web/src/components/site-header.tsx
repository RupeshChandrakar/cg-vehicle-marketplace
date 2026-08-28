import Link from 'next/link';
import { brand } from '@cg/shared-config';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
          {brand.name}
        </Link>
        <Link
          href="/sell"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-btn transition hover:bg-[#12703a] hover:shadow-btn-hover-primary active:scale-[0.97]"
        >
          Sell Your Vehicle
        </Link>
      </div>
    </header>
  );
}
