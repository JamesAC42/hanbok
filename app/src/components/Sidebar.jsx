"use client";

import styles from "@/styles/components/sidebar.module.scss";
import Image from "next/image";
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
import { TablerAlphabetKorean } from "./icons/Korean";
import { MaterialSymbolsSettingsRounded } from "./icons/Settings";
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

    const [hover, setHover] = useState({ section: null, index: 0 });
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
                ...(isAuthenticated ? [{ path: "/home", label: label('sidebar.home', 'Home'), icon: <MaterialSymbolsLightOtherHouses /> }] : []),
                { path: "/analyze", match: ["/analyze", "/sentence"], label: label('sidebar.analyze', 'Analyze'), icon: <MaterialSymbolsVariableAddRounded /> },
                { path: "/extended-text", match: ["/extended-text"], label: label('sidebar.paragraphs', 'Paragraphs'), icon: <Fa6SolidParagraph /> },
                { path: "/library", match: ["/library", "/history", "/bookmarks"], label: label('sidebar.library', 'Library'), icon: <MaterialSymbolsLibraryBooksSharp /> },
                { path: "/cards", match: ["/cards"], label: label('sidebar.review', 'Review'), icon: <PhCardsFill />, badge: cardsToday },
            ],
        },
        {
            key: 'practice',
            header: label('sidebar.practice', 'Practice'),
            items: [
                { path: "/tutor", match: ["/tutor"], label: t('sidebar.tutor'), icon: <IcSharpSchool /> },
                { path: "/typing", match: ["/typing"], label: t('sidebar.koreanTyping'), icon: <MaterialSymbolsKeyboard /> },
                { path: "/hangeul", match: ["/hangeul"], label: t('sidebar.learnHangeul'), icon: <TablerAlphabetKorean /> },
            ],
        },
        {
            key: 'discover',
            header: label('sidebar.discover', 'Discover'),
            items: [
                { path: "/lyrics", match: ["/lyrics"], label: t('sidebar.lyrics'), icon: <IcSharpQueueMusic /> },
                { path: "/feedback", label: t('sidebar.feedback'), icon: <MingcuteCommentFill /> },
                ...(user && isAdmin(user.email) ? [{ path: "/admin", match: ["/admin"], label: "Admin", icon: <MaterialSymbolsSettingsRounded /> }] : []),
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
                    <div className={styles.sidebarSection}>
                        <div className={styles.sidebarHeader}>
                            <div
                                onClick={() => navigateTo(isAuthenticated ? "/home" : "/")}
                                className={`${styles.homeIcon} ${collapsed ? styles.homeCollapsed : ""}`}>
                                <MaterialSymbolsLightOtherHouses />
                            </div>
                            <div 
                            className={styles.collapseButton}
                            onClick={() => toggleCollapse()}
                            >
                                <CuidaSidebarCollapseOutline />
                            </div>
                        </div>
                    </div>
                    <div className={styles.sidebarSection}>
                        <div className={styles.sidebarSectionItems}>
                            <div className={`
                                ${styles.sidebarSectionItem}
                                ${expanding ? styles.expanding : ""} 
                                ${getActiveClass(isAuthenticated ? "/profile" : "/login")}
                                ${styles.profileSection}`}
                             onClick={() => navigateTo(isAuthenticated ? "/profile" : "/login")}>
                                <div className={styles.sidebarSectionItemIcon}>
                                    <IcBaselinePerson />
                                </div>
                                <div className={styles.sidebarSectionItemText}>
                                    {isAuthenticated ? t('sidebar.myAccount') : t('sidebar.signIn')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {sections.map(section => (
                        <div
                            key={section.key}
                            className={styles.sidebarSection}
                            onMouseLeave={() => setHover({ section: null, index: 0 })}>
                            {section.header && (
                                <div className={styles.sidebarSectionHeader}>
                                    {section.header}
                                </div>
                            )}
                            <div className={styles.sidebarSectionItems}>
                                {section.items.map((item, i) => (
                                    <div
                                        key={item.path}
                                        onMouseEnter={() => setHover({ section: section.key, index: i })}
                                        className={`
                                            ${styles.sidebarSectionItem}
                                            ${expanding ? styles.expanding : ""}
                                            ${getActiveClass(item.match || item.path)}`}
                                        onClick={() => navigateTo(item.path)}
                                        title={collapsed ? item.label : undefined}>
                                        <div className={styles.sidebarSectionItemIcon}>
                                            {item.icon}
                                        </div>
                                        <div className={styles.sidebarSectionItemText}>
                                            {item.label}
                                        </div>
                                        {item.badge ? (
                                            <span className={styles.sidebarBadge} aria-label={`${item.badge} cards to study today`}>
                                                {item.badge > 99 ? '99+' : item.badge}
                                            </span>
                                        ) : null}
                                    </div>
                                ))}
                                <div
                                    className={`${styles.sidebarItemFloatyThing} ${hover.section === section.key ? styles.show : ""}`}
                                    style={{ transform: `translateY(${hover.index * 2}rem)` }}>
                                </div>
                            </div>
                        </div>
                    ))}

                    {!collapsed && isAuthenticated && (
                        <div className={`${styles.sidebarSection} ${styles.sidebarQuota}`}>
                            <QuotaDisplay compact />
                        </div>
                    )}
                    {!collapsed && !isAuthenticated && (
                        <div className={`${styles.sidebarSection} ${styles.sidebarQuota}`}>
                            <div
                                className={styles.sidebarPlansLink}
                                onClick={() => navigateTo("/pricing")}>
                                <MynauiSparklesSolid /> {t('sidebar.viewPlans')}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default Sidebar;
