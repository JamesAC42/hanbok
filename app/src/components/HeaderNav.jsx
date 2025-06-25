'use client';
import styles from '@/styles/components/headernav.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import {IcBaselinePerson} from '@/components/icons/Profile';
import { useRouter } from 'next/navigation';    
import { useState, useEffect } from 'react';
import { MaterialSymbolsMenu } from '@/components/icons/Menu';

function HeaderNav() {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar when clicking outside or on links
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarOpen && !event.target.closest(`.${styles.sidebar}`) && !event.target.closest(`.${styles.hamburgerButton}`)) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [sidebarOpen]);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <>
            <div className={styles.headerNav}>
                {/* Hamburger menu button - only visible on mobile */}
                <div 
                    className={styles.hamburgerButton} 
                    onClick={toggleSidebar}
                    aria-label="Toggle navigation menu"
                >
                    <MaterialSymbolsMenu className={styles.hamburgerIcon} />
                </div>

                {/* Desktop navigation links */}
                <div className={styles.headerNavLeft}>
                    <Link href="/pricing" className={styles.headerLinkSpecial}>Pricing</Link>
                    <Link href="/lessons">Lessons</Link>
                    <Link href="/lyrics">Lyrics</Link>
                    <Link href="/feedback">Feedback</Link>
                </div>

                <div className={styles.headerNavCenter}>
                    <Link href="/">hanbok</Link>
                </div>
                <div className={styles.headerNavRight}>
                    <Link href={"/profile"}><IcBaselinePerson className={styles.profileIcon} /></Link>
                    <div className={styles.getStartedButton} onClick={() => router.push("/analyze")}>
                        Get Started
                    </div>
                </div>
            </div>

            {/* Mobile sidebar */}
            <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarContent}>
                    <Link href="/" onClick={closeSidebar}>
                        Home
                    </Link>
                    <Link href="/pricing" className={styles.headerLinkSpecial} onClick={closeSidebar}>
                        Pricing
                    </Link>
                    <Link href="/lessons" onClick={closeSidebar}>Lessons</Link>
                    <Link href="/lyrics" onClick={closeSidebar}>Lyrics</Link>
                    <Link href="/feedback" onClick={closeSidebar}>Feedback</Link>
                    
                    <div 
                        className={styles.getStartedButton} 
                        onClick={() => {
                            router.push("/analyze");
                            closeSidebar();
                        }}
                    >
                        Get Started
                    </div>
                </div>
            </div>

            {/* Overlay */}
            {sidebarOpen && <div className={styles.sidebarOverlay} onClick={closeSidebar}></div>}
        </>
    )
}

export default HeaderNav;