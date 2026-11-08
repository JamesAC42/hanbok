'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Google's one-tap "Continue as …" prompt for signed-out visitors, on every
// page except the ones that already ask (login, sign-up) or where it would get
// in the way. Before this it only appeared on pages that render a Google
// button (GoogleSignInButton calls prompt()), so the home page and most search
// landings never offered the one-tap sign-up. Google rate-limits the prompt by
// itself after someone closes it, so it won't nag.
const CLIENT_ID = '404846185478-rg9vrit25ke3kbkfbntcadb69c79mv2q.apps.googleusercontent.com';
const SKIP = /^\/(login|register|forgot|reset|verify|admin|pricing|success|cancel|unsubscribe)(\/|$)/;
const DELAY_MS = 6000;

export default function GoogleOneTap() {
    const { isAuthenticated, loading, login } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        if (loading || isAuthenticated || SKIP.test(pathname || '')) return;
        let cancelled = false;
        const timer = setTimeout(() => {
            if (cancelled || !window.google?.accounts?.id) return;
            window.google.accounts.id.initialize({
                client_id: CLIENT_ID,
                callback: (response) => login(response),
                context: 'signup',
                itp_support: true,
                use_fedcm_for_prompt: true,
                cancel_on_tap_outside: false,
            });
            window.google.accounts.id.prompt();
        }, DELAY_MS);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [loading, isAuthenticated, pathname, login]);

    return null;
}
