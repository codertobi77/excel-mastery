import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'components/theme-provider';
import { Toaster } from 'components/ui/sonner';
import Footer from 'components/footer'; // Importing the Footer component
import ClerkAppearanceProvider from '@/components/ClerkAppearanceProvider'
import AppBootstrap from '@/components/AppBootstrap'
import RouteLoader from '@/components/RouteLoader'
import ConvexClientProvider from '@/components/ConvexClientProvider'

export const metadata: Metadata = {
  title: 'Excel Mastery AI - Votre tuteur intelligent pour Excel',
  description: 'Plateforme d\'apprentissage Excel alimentée par l\'IA pour tous les niveaux',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#166534',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ClerkAppearanceProvider>
            <ConvexClientProvider>
              <RouteLoader />
              <AppBootstrap />
              <div className="flex-1">{children}</div>
            </ConvexClientProvider>
            <Toaster />
            <Footer />
          </ClerkAppearanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
