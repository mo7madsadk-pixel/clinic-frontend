import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { LocaleProvider } from '@/providers/locale-provider';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Medical Clinic Management',
  description: 'Next.js + Tailwind + Lucide frontend',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="light">
          <LocaleProvider>
            <Navbar />
            <main className="container mx-auto mt-4 px-4">{children}</main>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}