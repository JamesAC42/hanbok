"use client";

import styles from "@/styles/components/sidebar.module.scss";
import Mascot from '@/components/Mascot';
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";

import { MaterialSymbolsVariableAddRounded } from "./icons/AddSentence";
import { MaterialSymbolsBookmarkSharp } from "./icons/Bookmark";
import { MaterialSymbolsLightOtherHouses } from "./icons/Home";
import { IcSharpQueueMusic } from "./icons/MusicLyrics";
import { IcSharpSchool } from "./icons/School";
import { MakiInformation11 } from "./icons/Info";
import { MingcuteCommentFill } from "./icons/CommentFill";
import { MynauiSparklesSolid } from "./icons/Sparkles";
import { PhCardsFill } from "./icons/CardsFill";
import { Fa6SolidParagraph } from "./icons/Paragraph";
import { MaterialSymbolsLibraryBooksSharp } from "./icons/LibraryBooks";
import { CuidaSidebarCollapseOutline } from "./icons/Collapse";
import { IcBaselinePerson } from "./icons/Profile";
import { MaterialSymbolsHistory } from "./icons/History";
import { MaterialSymbolsKeyboard } from "./icons/Keyboard";
import { MaterialSymbolsMicRounded } from "./icons/Mic";
import { TablerAlphabetKorean } from "./icons/Korean";
import { MaterialSymbolsSettingsRounded } from "./icons/Settings";
import { MaterialSymbolsMenuBook } from "./icons/MenuBook";
import { RiBrain2Fill } from "./icons/Brain";
import QuotaDisplay from "./QuotaDisplay";
import useCardsToday from "@/hooks/useCardsToday";

// Translation lookup that falls back to English text for keys that are new
// and not yet translated in every language.
const useLabel = (t) => (key, fallback) => {
    const value = t(key);
    return !value || value === key ? fallback : value;
};

// Hamburger Menu Icon Component
function HamburgerMenuIcon() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );
}

function Sidebar() {

    const { t } = useLanguage();
    const { isAuthenticated, user } = useAuth();
    const { isAdmin } = useAdmin();

    const [collapsed, setCollapsed] = useState(false);

    const [expanding, setExpanding] = useState(false);
    const [collapsing, setCollapsing] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        
        if (typeof window !== 'undefined') {
            let saved = localStorage.getItem('sidebarCollapsed');
            saved = saved ? JSON.parse(saved) : false;
            
            // Check if mobile and set initial state
            const checkMobile = () => window.innerWidth <= 1000;
            setIsMobile(checkMobile());
            
            // On mobile, start collapsed
            if (checkMobile()) {
                setCollapsed(true);
            } else {
                setCollapsed(saved);
            }

            // Handle window resize
            const handleResize = () => {
                const mobile = checkMobile();
                setIsMobile(mobile);
                
                if (mobile) {
                    // On mobile, always start collapsed
                    setCollapsed(true);
                } else {
                    // On desktop, restore saved state
                    const saved = localStorage.getItem('sidebarCollapsed');
                    setCollapsed(saved ? JSON.parse(saved) : false);
                }
            };

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }

    }, []);

    function getActiveClass(page) {
        let onPath = false;
        if (typeof page === "string") {    
            if (pathname === page) {
                return styles.active;
            }
            return "";
        } else if(Array.isArray(page)) {
            page.forEach(p => {
                if (pathname?.startsWith(p)) {
                    onPath = true;
                }
            });
            return onPath ? styles.active : "";
        }
    }

    function navigateTo(path) {
        router.push(path);
    }

    function toggleCollapse() {
        if (collapsed) {
            setExpanding(true);
            setTimeout(() => {
                setCollapsed(false);
                if (!isMobile) {
                    localStorage.setItem('sidebarCollapsed', 'false');
                }
                setExpanding(false);
            }, 100);
        } else {
            setCollapsing(true);
            setTimeout(() => {
                setCollapsed(true);
                if (!isMobile) {
                    localStorage.setItem('sidebarCollapsed', 'true');
                }
                setCollapsing(false);
            }, 100);
        }
    }

    function handleBackdropClick() {
        if (isMobile && !collapsed) {
            toggleCollapse();
        }
    }

    const label = useLabel(t);
    const cardsToday = useCardsToday(isAuthenticated);

    const sections = [
        {
            key: 'main',
            items: [
                ...(isAuthenticated ? [{ path: "/home", label: label('sidebar.home', 'Home'), color: 'var(--bp-und)', icon: <MaterialSymbolsLightOtherHouses /> }] : []),
                { path: "/analyze", match: ["/analyze", "/sentence"], label: label('sidebar.analyze', 'Analyze'), color: 'var(--bp-read)', icon: <MaterialSymbolsVariableAddRounded /> },
                { path: "/extended-text", match: ["/extended-text"], label: label('sidebar.paragraphs', 'Paragraphs'), color: 'var(--bp-purple)', icon: <Fa6SolidParagraph /> },
                { path: "/library", match: ["/library", "/history", "/bookmarks"], label: label('sidebar.library', 'Library'), color: 'var(--bp-keep)', icon: <MaterialSymbolsLibraryBooksSharp /> },
                { path: "/cards", match: ["/cards"], label: label('sidebar.review', 'Review'), color: 'var(--bp-rev)', icon: <PhCardsFill />, badge: cardsToday },
                ...(isAuthenticated ? [{ path: "/my-grammar", match: ["/my-grammar"], label: label('sidebar.myGrammar', 'My grammar'), color: 'var(--bp-und)', icon: <RiBrain2Fill /> }] : []),
            ],
        },
        {
            key: 'practice',
            header: label('sidebar.practice', 'Practice'),
            items: [
                { path: "/learn", match: ["/learn"], label: label('sidebar.learn', 'Learn'), color: 'var(--bp-read)', icon: <MaterialSymbolsMenuBook /> },
                { path: "/speak", match: ["/speak"], label: label('sidebar.speak', 'Speak'), color: 'var(--bp-purple)', icon: <MaterialSymbolsMicRounded /> },
                { path: "/tutor", match: ["/tutor"], label: t('sidebar.tutor'), color: 'var(--bp-flame)', icon: <IcSharpSchool /> },
                { path: "/typing", match: ["/typing"], label: t('sidebar.koreanTyping'), color: 'var(--bp-purple)', icon: <MaterialSymbolsKeyboard /> },
                { path: "/hangeul", match: ["/hangeul"], label: t('sidebar.learnHangeul'), color: 'var(--bp-und)', icon: <TablerAlphabetKorean /> },
            ],
        },
        {
            key: 'discover',
            header: label('sidebar.discover', 'Discover'),
            items: [
                { path: "/lyrics", match: ["/lyrics"], label: t('sidebar.lyrics'), color: 'var(--bp-pink)', icon: <IcSharpQueueMusic /> },
                { path: "/feedback", label: t('sidebar.feedback'), color: 'var(--bp-freeze)', icon: <MingcuteCommentFill /> },
                ...(user && isAdmin(user.email) ? [{ path: "/admin", match: ["/admin"], label: "Admin", color: 'var(--bp-gray)', icon: <MaterialSymbolsSettingsRounded /> }] : []),
            ],
        },
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <div 
                className={`${styles.mobileMenuButton} ${isMobile && collapsed ? "" : styles.hidden}`}
                onClick={toggleCollapse}
            >
                <HamburgerMenuIcon />
            </div>

            {/* Backdrop for mobile */}
            <div 
                className={`${styles.sidebarBackdrop} ${isMobile && !collapsed ? styles.show : ""}`}
                onClick={handleBackdropClick}
            />
            
            <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${expanding ? styles.expanding : ""} ${collapsing ? styles.animateCollapse : ""}`}>
                <div className={styles.sidebarInner}>
                    <div className={styles.sidebarHeader}>
                        <Link
                            href={isAuthenticated ? "/home" : "/"}
                            className={styles.wordmark}
                            aria-label="Hanbok home">
                            <Mascot pose="head" size={30} label="" className={styles.wordmarkIcon} />
                            <span className={styles.wordmarkFull}>hanbok</span>
                        </Link>
                        <button
                            type="button"
                            className={styles.collapseButton}
                            aria-label={collapsed ? "Expand menu" : "Collapse menu"}
                            onClick={() => toggleCollapse()}>
                            <CuidaSidebarCollapseOutline />
                        </button>
                    </div>

                    {sections.map(section => (
                        <nav
                            key={section.key}
                            className={styles.sidebarSection}
                            aria-label={section.header || 'Main'}>
                            {section.header && (
                                <div className={styles.sidebarSectionHeader}>
                                    {section.header}
                                </div>
                            )}
                            <div className={styles.sidebarSectionItems}>
                                {section.items.map(item => {
                                    const active = getActiveClass(item.match || item.path);
                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            onClick={() => { if (isMobile && !collapsed) toggleCollapse(); }}
                                            className={`${styles.sidebarSectionItem} ${active}`}
                                            aria-current={active ? "page" : undefined}
                                            style={{ '--item-color': item.color }}
                                            title={collapsed ? item.label : undefined}>
                                            <span className={styles.sidebarSectionItemIcon}>
                                                {item.icon}
                                            </span>
                                            <span className={styles.sidebarSectionItemText}>
                                                {item.label}
                                            </span>
                                            {item.badge ? (
                                                <span className={styles.sidebarBadge} aria-label={`${item.badge} cards to study today`}>
                                                    {item.badge > 99 ? '99+' : item.badge}
                                                </span>
                                            ) : null}
                                        </Link>
                                    );
                                })}
                            </div>
                        </nav>
                    ))}

                    <div className={`${styles.sidebarSection} ${styles.sidebarFooter}`}>
                        {!collapsed && isAuthenticated && (
                            <div className={styles.sidebarQuota}>
                                <QuotaDisplay compact />
                            </div>
                        )}
                        {!collapsed && !isAuthenticated && (
                            <Link href="/pricing" className={styles.sidebarPlansLink}>
                                <MynauiSparklesSolid /> {t('sidebar.viewPlans')}
                            </Link>
                        )}
                        <Link
                            href={isAuthenticated ? "/profile" : "/login"}
                            className={`${styles.sidebarSectionItem} ${styles.accountItem} ${getActiveClass(isAuthenticated ? "/profile" : "/login")}`}
                            style={{ '--item-color': 'var(--bp-gray)' }}
                            title={collapsed ? (isAuthenticated ? t('sidebar.myAccount') : t('sidebar.signIn')) : undefined}>
                            <span className={styles.sidebarSectionItemIcon}>
                                <IcBaselinePerson />
                            </span>
                            <span className={styles.sidebarSectionItemText}>
                                {isAuthenticated ? (user?.name || t('sidebar.myAccount')) : t('sidebar.signIn')}
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Sidebar;
