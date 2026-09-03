import type { Metadata, Viewport } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { brand } from '@cg/shared-config';
import { SiteHeader } from '@/components/site-header';
import { BottomNav } from '@/components/bottom-nav';
import { PageTransition } from '@/components/page-transition';
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
  // Real installability — see app/manifest.ts + app/icon.tsx. Next.js links
  // manifest.webmanifest automatically once that file exists; appleWebApp
  // covers the iOS-specific "add to home screen, hide Safari chrome" tags
  // that manifest.json alone doesn't reach on iOS.
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: brand.shortName,
  },
};

// viewportFit: 'cover' lets the page draw under the notch/Dynamic
// Island/home-indicator area instead of the browser adding its own blank
// bars there — without it, every env(safe-area-inset-*) reference in this
// app (BottomNav's bottom padding, SiteHeader's .safe-top) silently
// resolves to 0, which is exactly what a live device-emulated audit found
// before this change. themeColor colors the Android status bar / Safari's
// UI chrome to match the app instead of defaulting to browser gray.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
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
          <div className="flex flex-1 flex-col pb-24 sm:pb-0">
            <PageTransition>{children}</PageTransition>
          </div>
          <BottomNav />
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
