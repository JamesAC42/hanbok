import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// `text` is Google's button wording (signin_with, signup_with, continue_with).
// The button fills its container, within Google's 200-400px limits.
// onSignIn runs just before the login call: the button lives in Google's iframe,
// so click handlers on a wrapper never see the click.
export default function GoogleSignInButton({ text = 'signin_with', onSignIn }) {
    const buttonRef = useRef(null);
    const onSignInRef = useRef(onSignIn);
    onSignInRef.current = onSignIn;
    const { login } = useAuth();

    useEffect(() => {
        const initializeGoogleSignIn = () => {
            if (typeof window !== 'undefined' && window.google && buttonRef.current) {
                google.accounts.id.initialize({
                    client_id: '404846185478-rg9vrit25ke3kbkfbntcadb69c79mv2q.apps.googleusercontent.com',
                    callback: (response) => { try { onSignInRef.current?.(); } catch { /* never block sign-in */ } login(response); }
                });
                const width = Math.max(200, Math.min(400, buttonRef.current.offsetWidth || 0)) || undefined;
                google.accounts.id.renderButton(
                    buttonRef.current,
                    { theme: "outline", size: "large", shape: "pill", text, width }
                );
                google.accounts.id.prompt();
            }
        };

        // Check if the Google script is already loaded
        if (window.google) {
            initializeGoogleSignIn();
        } else {
            // If not, wait for it to load
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            script?.addEventListener('load', initializeGoogleSignIn);
        }

        return () => {
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            script?.removeEventListener('load', initializeGoogleSignIn);
        };
    }, [login, text]);

    return <div ref={buttonRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: 44 }}></div>;
}