import Link from 'next/link';
import { brand } from '@cg/shared-config';

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-foreground">
          {brand.name}
        </Link>
      </div>
    </header>
  );
}
