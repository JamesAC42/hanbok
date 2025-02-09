import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function GoogleSignInButton() {
    const buttonRef = useRef(null);
    const { login } = useAuth();

    useEffect(() => {
        const initializeGoogleSignIn = () => {
            if (typeof window !== 'undefined' && window.google && buttonRef.current) {
                google.accounts.id.initialize({
                    client_id: '404846185478-rg9vrit25ke3kbkfbntcadb69c79mv2q.apps.googleusercontent.com',
                    callback: (response) => login(response)
                });
                google.accounts.id.renderButton(
                    buttonRef.current,
                    { theme: "outline", size: "large" }
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
            script.addEventListener('load', initializeGoogleSignIn);
        }

        return () => {
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            script.removeEventListener('load', initializeGoogleSignIn);
        };
    }, [login]);

    return <div ref={buttonRef}></div>;
}