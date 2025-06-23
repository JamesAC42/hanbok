"use client";

import styles from "@/styles/components/sidebar.module.scss";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

function Sidebar() {

    const [collapsed, setCollapsed] = useState(false);

    const [showSectionOneHover, setShowSectionOneHover] = useState(false);
    const [showSectionTwoHover, setShowSectionTwoHover] = useState(false);

    const [sectionOneTransform, setSectionOneTransform] = useState(0);
    const [sectionTwoTransform, setSectionTwoTransform] = useState(0);

    const [activePath, setActivePath] = useState(null);
    const [expanding, setExpanding] = useState(false);
    const [collapsing, setCollapsing] = useState(false);

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
            setCollapsed(saved);
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
                localStorage.setItem('sidebarCollapsed', 'false');
                setExpanding(false);
            }, 100);
        } else {
            setCollapsing(true);
            setTimeout(() => {
                setCollapsed(true);
                localStorage.setItem('sidebarCollapsed', 'true');
                setCollapsing(false);
            }, 100);
        }
    }

    return (
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
                                My Account
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
                                Analyze Text
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
                                Saved Sentences
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
                                Flashcards
                            </div>
                        </div>
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
                                My Grammar
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
                                Tutor
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
                                History
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
                        Navigation
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
                                Lyrics
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
                                Lessons
                            </div>
                        </div>
                        <div 
                            onMouseEnter={() => setHoverTransform(2, 2)}
                            className={`
                                ${styles.sidebarSectionItem}
                                ${expanding ? styles.expanding : ""}
                                ${getActiveClass("/about")}`} 
                            onClick={() => navigateTo("/about")}>
                            <div className={styles.sidebarSectionItemIcon}>
                                <MakiInformation11 />
                            </div>
                            <div className={styles.sidebarSectionItemText}>
                                About
                            </div>
                        </div>
                        <div 
                            onMouseEnter={() => setHoverTransform(2, 3)}
                            className={`
                                ${styles.sidebarSectionItem}
                                ${expanding ? styles.expanding : ""}
                                ${getActiveClass("/feedback")}`} 
                            onClick={() => navigateTo("/feedback")}>
                            <div className={styles.sidebarSectionItemIcon}>
                                <MingcuteCommentFill />
                            </div>
                            <div className={styles.sidebarSectionItemText}>
                                Feedback
                            </div>
                        </div>
                        <div 
                            onMouseEnter={() => setHoverTransform(2, 4)}
                            className={`
                                ${styles.sidebarSectionItem}
                                ${expanding ? styles.expanding : ""}
                                ${styles.sidebarSectionItemPricing}`} 
                            onClick={() => navigateTo("/pricing")}>
                            <div className={styles.sidebarSectionItemIcon}>
                                <MynauiSparklesSolid />
                            </div>
                            <div className={styles.sidebarSectionItemText}>
                                View Plans
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
                <div className={styles.sidebarSection}>
                    <div
                        className={styles.sidebarSectionHeader}>
                        Recent
                    </div>
                    <div className={styles.sidebarSectionItems}>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Sidebar;