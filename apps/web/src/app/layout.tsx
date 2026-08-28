import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import { brand } from '@cg/shared-config';
import { SiteHeader } from '@/components/site-header';
import { AnalyticsTracker } from '@/components/analytics-tracker';
import { CustomerAuthProvider } from '@/lib/customer-auth-context';
import './globals.css';

// Plus Jakarta Sans: a warm, geometric sans with real character — replaces the
// generic Geist Sans default. Chosen after reviewing Spinny/Ola/Uber's actual
// typefaces (see docs/ARCHITECTURE.md "Design language" section): it's in the
// same confident-geometric family as Spinny's Jost-based identity without
// reusing anyone's proprietary/licensed font.
const displaySans = Plus_Jakarta_Sans({
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
      <body className="min-h-full flex flex-col bg-warm">
        <CustomerAuthProvider>
          <AnalyticsTracker />
          <SiteHeader />
          {children}
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
