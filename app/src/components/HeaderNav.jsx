'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '@/styles/components/headernav.module.scss';
import Mascot from '@/components/Mascot';
import { useAuth } from '@/contexts/AuthContext';

const LINKS = [
    { href: '/lyrics', label: 'Lyrics' },
    { href: '/learn', label: 'Learn' },
    { href: '/lessons', label: 'Lessons' },
    { href: '/pricing', label: 'Pricing' },
];

// Header for the public pages (landing, lyrics, learn, pricing, login).
// Signed-in learners get one button back into the app instead of log in / sign up.
function HeaderNav() {
    const pathname = usePathname();
    const { isAuthenticated, loading } = useAuth();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => setOpen(false), [pathname]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    const isActive = (href) => pathname === href || pathname?.startsWith(`${href}/`);

    const actions = loading ? null : isAuthenticated ? (
        <Link href="/home" className={styles.primary}>Open Hanbok</Link>
    ) : (
        <>
            <Link href="/login" className={styles.ghost}>Log in</Link>
            <Link href="/analyze" className={styles.primary} data-cta="nav">Start free</Link>
        </>
    );

    return (
        <header className={`${styles.header} ${scrolled || open ? styles.raised : ''}`}>
            <div className={styles.inner}>
                <Link href="/" className={styles.wordmark} aria-label="Hanbok home">
                    <Mascot pose="head" size={34} label="" />
                    <span>hanbok</span>
                </Link>

                <nav className={styles.links} aria-label="Main">
                    {LINKS.map((link) => (
                        <Link key={link.href} href={link.href} className={isActive(link.href) ? styles.active : undefined}
                            aria-current={isActive(link.href) ? 'page' : undefined}>
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className={styles.actions}>{actions}</div>

                <button type="button" className={styles.menuButton} aria-expanded={open} aria-controls="site-menu"
                    aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((v) => !v)}>
                    <span className={open ? styles.menuIconOpen : styles.menuIcon} aria-hidden="true"><i /><i /><i /></span>
                </button>
            </div>

            <div id="site-menu" className={`${styles.sheet} ${open ? styles.sheetOpen : ''}`} hidden={!open}>
                <nav aria-label="Main">
                    {LINKS.map((link) => (
                        <Link key={link.href} href={link.href} className={isActive(link.href) ? styles.active : undefined}>
                            {link.label}
                        </Link>
                    ))}
                </nav>
                <div className={styles.sheetActions}>{actions}</div>
            </div>
            {open && <button type="button" className={styles.scrim} aria-label="Close menu" onClick={() => setOpen(false)} />}
        </header>
    );
}

export default HeaderNav;
