import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import { brand } from '@cg/shared-config';
import { AuthProvider } from '@/lib/auth-context';
import { AdminShell } from '@/components/admin-shell';
import './globals.css';

// Same typeface choice as apps/web, for one consistent look across both
// surfaces — see apps/web's layout.tsx for the full rationale.
const displaySans = Plus_Jakarta_Sans({
  variable: '--font-display-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: `${brand.name} Admin`,
  description: 'Admin and agent console',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${displaySans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-warm">
        <AuthProvider>
          <AdminShell>{children}</AdminShell>
        </AuthProvider>
      </body>
    </html>
  );
}
