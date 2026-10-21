import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { ToastProvider } from '@/lib/toast-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PureCut AI — Pixel-Perfect Automatic Background Remover & Studio',
  description:
    'Remove image backgrounds 100% automatically in 3 seconds with zero clicks. High-resolution exports, custom backdrops, API endpoints, and studio effects for creators & eCommerce.',
  keywords: [
    'remove background',
    'background remover',
    'transparent png',
    'ai image cutout',
    'erase background',
    'ecommerce photo editor',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
