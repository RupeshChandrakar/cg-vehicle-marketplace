import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Inter, Geist_Mono } from 'next/font/google';
import { brand } from '@cg/shared-config';
import { SiteHeader } from '@/components/site-header';
import { BottomNav } from '@/components/bottom-nav';
import { PageTransition } from '@/components/page-transition';
import { AnalyticsTracker } from '@/components/analytics-tracker';
import { SeoFooterLinks } from '@/components/seo-footer-links';
import { WhatsAppChannelFab } from '@/components/whatsapp-channel-fab';
import { CustomerAuthProvider } from '@/lib/customer-auth-context';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${brand.name} | Buy & Sell Used Vehicles in Chhattisgarh`,
    template: `%s | ${brand.name}`,
  },
  description:
    'Buy and sell verified used cars, bikes, scooters, tractors, and commercial vehicles across Chhattisgarh.',
  applicationName: brand.name,
  keywords: [
    'used cars chhattisgarh',
    'second hand bikes chhattisgarh',
    'used tractors chhattisgarh',
    'commercial vehicles chhattisgarh',
    'cg auto mart',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: brand.name,
    title: `${brand.name} | Buy & Sell Used Vehicles in Chhattisgarh`,
    description:
      'Buy and sell verified used vehicles across Chhattisgarh with trusted listings and quick support.',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${brand.name} | Buy & Sell Used Vehicles in Chhattisgarh`,
    description:
      'Discover verified used vehicles in Chhattisgarh and connect quickly for purchase or sale.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
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

const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: brand.name,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512`,
  description: brand.tagline,
  areaServed: {
    '@type': 'State',
    name: 'Chhattisgarh',
  },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${displaySans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        <CustomerAuthProvider>
          <AnalyticsTracker />
          <Suspense fallback={null}>
            <SiteHeader />
          </Suspense>
          {/* pb-24 clears the fixed mobile BottomNav, which floats with its
              own bottom margin now (not flush to the edge). Desktop no longer
              reserves a dedicated left rail, so the content can use the full
              width of the shell. */}
          <div className="mx-auto flex w-full max-w-[88rem] flex-1 flex-col gap-4 px-4 pb-24 lg:px-6 sm:pb-0">
            <div className="min-w-0 flex-1">
              <PageTransition>{children}</PageTransition>
            </div>
          </div>
          <SeoFooterLinks />
          <WhatsAppChannelFab />
          <BottomNav />
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
