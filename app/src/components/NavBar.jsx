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
import { useRouter } from 'next/navigation';
import styles from '@/styles/components/navbar.module.scss';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MaterialSymbolsStyleCards } from './icons/Cards';
import { MaterialSymbolsBookmarkSharp } from './icons/Bookmark';

const NavBar = () => {
    const { user, logout, loading } = useAuth();
    const router = useRouter();
    const [isNavVisible, setIsNavVisible] = useState(false);
    const { t } = useLanguage();
    
    const totalItems = user ? 6 : 3;

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
                    </Link>
                </div>
                <div className={styles.navBarItem} style={{ '--nav-index': 1 }}>   
                    <Link href="/profile">
                        <IcBaselinePerson />
                    </Link>
                </div>
                {user && (
                    <div className={styles.navBarItem} style={{ '--nav-index': 2 }}>   
                        <Link href="/bookmarks">
                            <MaterialSymbolsBookmarkSharp />
                        </Link>
                    </div>
                )}
                {user && (
                    <div className={`${styles.navBarItem} ${styles.cardsNew}`} style={{ '--nav-index': 3 }}>   
                        <Link href="/cards">
                            <MaterialSymbolsCardsStarRounded />
                        </Link>
                    </div>
                )}
                <div className={styles.navBarItem} style={{ '--nav-index': user ? 4 : 2 }}>   
                    <Link href="/about">
                        <MakiInformation11 />
                    </Link>
                </div>
                <div className={styles.navBarItem} style={{ '--nav-index': user ? 5 : 3 }}>   
                    <Link href="/feedback">
                        <MingcuteCommentFill />
                    </Link>
                </div>
                
                <div className={styles.navBarItem} style={{ '--nav-index': user ? 6 : 4 }}>   
                    <Link href="/pricing">
                        <SolarChatRoundMoneyBold />
                    </Link>
                </div>
                {user && (
                    <div className={styles.navBarItem} style={{ '--nav-index': 7 }}>   
                        <div 
                            onClick={handleLogout}
                            className={styles.navBarItemIcon}>
                            <SolarLogoutLinear />
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