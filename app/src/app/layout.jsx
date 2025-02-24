import { Suspense } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import "../styles/globals.scss";
import NavBar from '@/components/NavBar';
import Script from 'next/script';
import { PopupProvider } from '@/contexts/PopupContext';

export const metadata = {
  title: "hanbok",
  description: "korean learning tool",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' }
    ],
    shortcut: ['/favicon.ico'],
  },
  manifest: '/manifest.json'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon.png" />
      </head>
      <body>
        <AuthProvider>
          <LanguageProvider>
            <PopupProvider>
              <Script
                  src="https://accounts.google.com/gsi/client"
                  strategy="afterInteractive"
              />
              <script defer src="https://umami.ovel.sh/script.js" data-website-id="ef4f8c80-9b1d-4d10-87f3-8b3f5c3963e8"></script>
              <Suspense fallback={<div>Loading...</div>}>
                {children}
              </Suspense>
              <NavBar />
            </PopupProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
