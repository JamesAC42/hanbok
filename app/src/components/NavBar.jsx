'use client';
import { TablerAlphabetKorean } from './icons/Korean';
import { IcBaselinePerson } from './icons/Profile';
import { SolarLogoutLinear } from './icons/Logout';
import { MakiInformation11 } from './icons/Info';
import { MaterialSymbolsCardsStarRounded } from './icons/Deck';
import { MaterialSymbolsMenu } from './icons/Menu';
import { SolarChatRoundMoneyBold } from './icons/Money';
import { MingcuteCommentFill } from './icons/CommentFill';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {IcSharpQueueMusic} from './icons/MusicLyrics';
import { useRouter } from 'next/navigation';
import styles from '@/styles/components/navbar.module.scss';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MaterialSymbolsStyleCards } from './icons/Cards';
import { MaterialSymbolsBookmarkSharp } from './icons/Bookmark';

const NavBar = () => {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const [isNavVisible, setIsNavVisible] = useState(false);
    const { t } = useLanguage();
    
    const totalItems = user ? 6 : 3;

    useEffect(() => {
        const handleClickOutside = (event) => {
            const navBar = document.querySelector(`.${styles.navBar}`);
            const navToggle = document.querySelector(`.${styles.navBarToggle}`);
            
            if (isNavVisible && navBar && !navBar.contains(event.target) && !navToggle.contains(event.target)) {
                setIsNavVisible(false);
            }
        };

        if (isNavVisible) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isNavVisible]);

    const handleLogout = () => {
        logout();
        router.push('/');
    }

    const toggleNav = () => {
        setIsNavVisible(!isNavVisible);
    }

    const navItems = [
        { name: t('navbar.home'), path: '/' },
        { name: t('navbar.bookmarks'), path: '/bookmarks' },
        { name: t('navbar.cards'), path: '/cards' },
        { name: t('navbar.profile'), path: '/profile' },
        { name: t('navbar.about'), path: '/about' },
        { name: t('navbar.feedback'), path: '/feedback' },
        { name: t('navbar.pricing'), path: '/pricing' },
    ];

    if (loading) return null;

    return (
        <>
        <div className={`${styles.navBar} ${isNavVisible ? styles.visible : ''}`}>
            <div className={styles.navBarContent} style={{ '--total-items': totalItems }}>
                <div className={styles.navBarItem} style={{ '--nav-index': 0 }}>  
                    <Link href="/">
                        <TablerAlphabetKorean />
                        <div className={styles.navBarItemText}>{t('navbar.home')}</div>
                    </Link>
                </div>
                <div className={styles.navBarItem} style={{ '--nav-index': 1 }}>   
                    <Link href="/profile">
                        <IcBaselinePerson />
                        <div className={styles.navBarItemText}>{t('navbar.profile')}</div>
                    </Link>
                </div>
                {user && (
                    <div className={styles.navBarItem} style={{ '--nav-index': 2 }}>   
                        <Link href="/bookmarks">
                            <MaterialSymbolsBookmarkSharp />
                            <div className={styles.navBarItemText}>{t('navbar.bookmarks')}</div>
                        </Link>
                    </div>
                )}
                {user && (
                    <div className={`${styles.navBarItem} `} style={{ '--nav-index': 3 }}>   
                        <Link href="/cards">
                            <MaterialSymbolsCardsStarRounded />
                            <div className={styles.navBarItemText}>{t('navbar.cards')}</div>
                        </Link>
                    </div>
                )}
                <div className={styles.navBarItem} style={{ '--nav-index': user ? 4 : 2 }}>   
                    <Link href="/about">
                        <MakiInformation11 />
                        <div className={styles.navBarItemText}>{t('navbar.about')}</div>
                    </Link>
                </div>
                {
                    false && (
                        <div className={`${styles.navBarItem} ${styles.cardsNew}`} style={{ '--nav-index': user ? 5 : 3 }}>   
                            <Link href="/lyrics">
                                <IcSharpQueueMusic />
                                <div className={styles.navBarItemText}>{t('navbar.lyrics')}</div>
                            </Link>
                        </div>
                    )
                }
                <div className={styles.navBarItem} style={{ '--nav-index': user ? 6 : 4 }}>   
                    <Link href="/feedback">
                        <MingcuteCommentFill />
                        <div className={styles.navBarItemText}>{t('navbar.feedback')}</div>
                    </Link>
                </div>
                
                <div className={styles.navBarItem} style={{ '--nav-index': user ? 7 : 5 }}>   
                    <Link href="/pricing">
                        <SolarChatRoundMoneyBold />
                        <div className={styles.navBarItemText}>{t('navbar.pricing')}</div>
                    </Link>
                </div>
                {user && (
                    <div className={styles.navBarItem} style={{ '--nav-index': user ? 8 : 6 }}>   
                        <div 
                            onClick={handleLogout}
                            className={styles.navBarItemIcon}>
                            <SolarLogoutLinear />
                            <div className={styles.navBarItemText}>{t('navbar.logout')}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className={styles.navBarToggle} onClick={toggleNav}>
            <div className={styles.navBarItemIcon}>
                <MaterialSymbolsMenu />
            </div>
        </div>
        </>
    )
}

export default NavBar;