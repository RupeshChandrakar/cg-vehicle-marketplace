import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { brand } from '@cg/shared-config';
import { SiteHeader } from '@/components/site-header';
import { BottomNav } from '@/components/bottom-nav';
import { AnalyticsTracker } from '@/components/analytics-tracker';
import { ReferralCapture } from '@/components/referral-capture';
import { CustomerAuthProvider } from '@/lib/customer-auth-context';
import './globals.css';

// Inter (2026-08-31): swapped from Plus Jakarta Sans — the PO pointed at a
// sibling reference app (see docs/ARCHITECTURE.md "Mobile 'real app' polish")
// that uses Inter and reads noticeably tighter/less "bloated" at the same
// nominal sizes; Jakarta Sans's wider, more geometric letterforms were a real
// contributor to the site feeling bigger/heavier than intended everywhere,
// not just on one page.
const displaySans = Inter({
  variable: '--font-display-sans',
  subsets: ['latin'],
});

// Kept specifically for prices and other tabular/numeric readouts — every
// design direction explored for this refresh converged on mono-for-price.
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: brand.name,
  description: brand.tagline,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${displaySans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <CustomerAuthProvider>
          <AnalyticsTracker />
          <ReferralCapture />
          <SiteHeader />
          {/* pb-24 clears the fixed mobile BottomNav, which floats with its
              own bottom margin now (not flush to the edge) — sm:hidden
              itself, so this bottom padding is likewise dropped at sm, no
              dead space on desktop where the header is the only nav. */}
          <div className="flex flex-1 flex-col pb-24 sm:pb-0">{children}</div>
          <BottomNav />
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
