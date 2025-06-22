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

    return (
        <div className={styles.navBar}>
            <div className={styles.navBarSection}>
                <div className={styles.navBarItem}>
                    <div className={styles.navBarItemIcon}>section</div>
                    <div className={styles.navBarItemText}>section</div>
                </div>
                <div className={styles.navBarItem}>
                    <div className={styles.navBarItemIcon}>section</div>
                    <div className={styles.navBarItemText}>section</div>
                </div>
            </div>
            <div className={styles.navBarSection}>
                <div className={styles.navBarItem}>
                    <div className={styles.navBarItemIcon}></div>
                    <div className={styles.navBarItemText}>section</div>
                </div>
            </div>
        </div>
    )
}

export default NavBar;