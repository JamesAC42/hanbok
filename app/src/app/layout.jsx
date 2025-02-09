import { AuthProvider } from '@/contexts/AuthContext';
import "../styles/globals.scss";
import Script from 'next/script';

export const metadata = {
  title: "hanbok",
  description: "korean learning tool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Script
              src="https://accounts.google.com/gsi/client"
              strategy="afterInteractive"
          />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
