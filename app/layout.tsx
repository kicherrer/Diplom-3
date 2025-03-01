import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/components/navigation';
import { I18nProvider } from '@/components/i18n-provider';

// Remove Inter font import and usage
export const metadata: Metadata = {
  title: 'MediaVault - Your Personal Media Library',
  description: 'Track, discover, and manage your media content with personalized recommendations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen bg-background">
              <Navigation />
              <main className="container mx-auto px-4 py-6">
                {children}
              </main>
            </div>
            <Toaster />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}