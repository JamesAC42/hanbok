"use client";

import styles from "@/styles/components/sidebar.module.scss";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

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

    const [collapsed, setCollapsed] = useState(false);

    const [showSectionOneHover, setShowSectionOneHover] = useState(false);
    const [showSectionTwoHover, setShowSectionTwoHover] = useState(false);

    const [sectionOneTransform, setSectionOneTransform] = useState(0);
    const [sectionTwoTransform, setSectionTwoTransform] = useState(0);

    const [activePath, setActivePath] = useState(null);
    const [expanding, setExpanding] = useState(false);
    const [collapsing, setCollapsing] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const router = useRouter();

    function setHoverTransform(section, i) {
        if (section === 1) {
            setSectionOneTransform((2 * i) + "rem");
            setShowSectionOneHover(true);
        } else if (section === 2) {
            setSectionTwoTransform((2 * i) + "rem");
            setShowSectionTwoHover(true);
        }
    }

    useEffect(() => {
        
        setActivePath(window.location.pathname);

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
            if (page === activePath) {
                return styles.active;
            }
            return "";
        } else if(Array.isArray(page)) {
            page.forEach(p => {
                if (activePath?.startsWith(p)) {
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
                                onClick={() => navigateTo("/")}
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
                                ${getActiveClass("/profile")}
                                ${styles.profileSection}`}
                             onClick={() => navigateTo("/profile")}>
                                <div className={styles.sidebarSectionItemIcon}>
                                    <IcBaselinePerson />
                                </div>
                                <div className={styles.sidebarSectionItemText}>
                                    {t('sidebar.myAccount')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.sidebarSection}>
                        <div className={styles.sidebarSectionItems}>
                            <div
                                className={`
                                    ${styles.sidebarSectionItem}
                                    ${expanding ? styles.expanding : ""}
                                    ${styles.newAnalysisSection}`}
                                onClick={() => navigateTo("/analyze")}>
                                <div className={styles.sidebarSectionItemIcon}>
                                    <MaterialSymbolsVariableAddRounded />
                                </div>
                                <div className={styles.sidebarSectionItemText}>
                                    {t('sidebar.analyzeText')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div 
                        className={styles.sidebarSection}
                        onMouseEnter={() => setShowSectionOneHover(true)}
                        onMouseLeave={() => setShowSectionOneHover(false)}>
                        <div className={styles.sidebarSectionItems}>
                            <div 
                                onMouseEnter={() => setHoverTransform(1,0)}
                                className={`
                                    ${styles.sidebarSectionItem}
                                    ${expanding ? styles.expanding : ""}
                                    ${getActiveClass("/bookmarks")}`}
                                onClick={() => navigateTo("/bookmarks")}>
                                <div className={styles.sidebarSectionItemIcon}>
                                    <MaterialSymbolsBookmarkSharp />
                                </div>
                                <div className={styles.sidebarSectionItemText}>
                                    {t('sidebar.savedSentences')}
                                </div>
                            </div>
                            <div 
                                onMouseEnter={() => setHoverTransform(1, 1)}
                                className={`
                                    ${styles.sidebarSectionItem}
                                    ${expanding ? styles.expanding : ""}
                                    ${getActiveClass(["/cards"])}`}
                                onClick={() => navigateTo("/cards")}>
                                <div className={styles.sidebarSectionItemIcon}>
                                    <PhCardsFill />
                                </div>
                                <div className={styles.sidebarSectionItemText}>
                                    {t('sidebar.flashcards')}
                                </div>
                            </div>

                            {
                                false && (
                                    <div 
                                        onMouseEnter={() => setHoverTransform(1, 2)}
                                        className={`
                                            ${styles.sidebarSectionItem}
                                            ${expanding ? styles.expanding : ""}
                                            ${getActiveClass("/grammar")}`}
                                        onClick={() => navigateTo("/grammar")}>
                                        <div className={styles.sidebarSectionItemIcon}>
                                            <Fa6SolidParagraph />
                                        </div>
                                        <div className={styles.sidebarSectionItemText}>
                                            {t('sidebar.myGrammar')}
                                        </div>
                                    </div>
                                )
                            }

                            <div 
                                onMouseEnter={() => setHoverTransform(1, 2)}
                                className={`
                                    ${styles.sidebarSectionItem}
                                    ${expanding ? styles.expanding : ""}
                                    ${getActiveClass("/typing")}`}
                                onClick={() => navigateTo("/typing")}>
                                <div className={styles.sidebarSectionItemIcon}>
                                    <MaterialSymbolsKeyboard />
                                </div>
                                <div className={styles.sidebarSectionItemText}>
                                    {t('sidebar.koreanTyping')}
                                </div>
                            </div>
                            <div 
                                onMouseEnter={() => setHoverTransform(1, 3)}
                                className={`
                                    ${styles.sidebarSectionItem}
                                    ${expanding ? styles.expanding : ""}
                                    ${getActiveClass("/tutor")}`}
                                onClick={() => navigateTo("/tutor")}>
                                <div className={styles.sidebarSectionItemIcon}>
                                    <IcSharpSchool />
                                </div>
                                <div className={styles.sidebarSectionItemText}>
                                    {t('sidebar.tutor')}
                                </div>
                            </div>
                            <div 
                                onMouseEnter={() => setHoverTransform(1, 4)}
                                className={`
                                    ${styles.sidebarSectionItem}
                                    ${expanding ? styles.expanding : ""}
                                    ${getActiveClass("/history")}`}
                                onClick={() => navigateTo("/history")}>
                                <div className={styles.sidebarSectionItemIcon}>
                                    <MaterialSymbolsHistory />
                                </div>
                                <div className={styles.sidebarSectionItemText}>
                                    {t('sidebar.history')}
                                </div>
                            </div>

                            <div 
                                className={`${styles.sidebarItemFloatyThing} ${showSectionOneHover ? styles.show : ""}`} 
                                style={{
                                    transform: `translateY(${sectionOneTransform})`}
                                }>
                            </div>
                        </div>
                    </div>
                    <div className={styles.sidebarSection}
                        onMouseEnter={() => setShowSectionTwoHover(true)}
                        onMouseLeave={() => setShowSectionTwoHover(false)}>
                        <div 
                            onMouseEnter={() => setShowSectionTwoHover(false)}
                            className={styles.sidebarSectionHeader}>
                            {t('sidebar.navigation')}
                        </div>
                        <div className={styles.sidebarSectionItems}>
                            <div 
                                onMouseEnter={() => setHoverTransform(2, 0)}
                                className={`
                                    ${styles.sidebarSectionItem}
                                    ${expanding ? styles.expanding : ""}
                                    ${getActiveClass("/lyrics")}`} 
                                onClick={() => navigateTo("/lyrics")}>
                                <div className={styles.sidebarSectionItemIcon}>
                                    <IcSharpQueueMusic />
                                </div>
                                <div className={styles.sidebarSectionItemText}>
                                    {t('sidebar.lyrics')}
                                </div>
                            </div>
                            <div 
                                onMouseEnter={() => setHoverTransform(2, 1)}
                                className={`
                                    ${styles.sidebarSectionItem}
                                    ${expanding ? styles.expanding : ""}
                                    ${getActiveClass("/lessons")}`} 
                                onClick={() => navigateTo("/lessons")}>
                                <div className={styles.sidebarSectionItemIcon}>
                                    <MaterialSymbolsLibraryBooksSharp />
                                </div>
                                <div className={styles.sidebarSectionItemText}>
                                    {t('sidebar.lessons')}
                                </div>
                            </div>
                            <div 
                                onMouseEnter={() => setHoverTransform(2, 2)}
                                className={`
                                    ${styles.sidebarSectionItem}
                                    ${expanding ? styles.expanding : ""}
                                    ${getActiveClass("/feedback")}`} 
                                onClick={() => navigateTo("/feedback")}>
                                <div className={styles.sidebarSectionItemIcon}>
                                    <MingcuteCommentFill />
                                </div>
                                <div className={styles.sidebarSectionItemText}>
                                    {t('sidebar.feedback')}
                                </div>
                            </div>
                            <div 
                                onMouseEnter={() => setHoverTransform(2, 3)}
                                className={`
                                    ${styles.sidebarSectionItem}
                                    ${expanding ? styles.expanding : ""}
                                    ${styles.sidebarSectionItemPricing}`} 
                                onClick={() => navigateTo("/pricing")}>
                                <div className={styles.sidebarSectionItemIcon}>
                                    <MynauiSparklesSolid />
                                </div>
                                <div className={styles.sidebarSectionItemText}>
                                    {t('sidebar.viewPlans')}
                                </div>
                            </div>

                            <div 
                                className={`${styles.sidebarItemFloatyThing} ${showSectionTwoHover ? styles.show : ""}`} 
                                style={{    
                                    transform: `translateY(${sectionTwoTransform})`}
                                }>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Sidebar;