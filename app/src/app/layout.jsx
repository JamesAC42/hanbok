import { AuthProvider } from '@/contexts/AuthContext';
import "../styles/globals.scss";
import NavBar from '@/components/NavBar';
import GoogleSignInScript from '@/components/GoogleSignInScript';

export const metadata = {
  title: "hanbok",
  description: "korean learning tool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <GoogleSignInScript />
          <script defer src="https://umami.ovel.sh/script.js" data-website-id="ef4f8c80-9b1d-4d10-87f3-8b3f5c3963e8"></script>          {children}
          <NavBar />
        </AuthProvider>
      </body>
    </html>
  );
}
