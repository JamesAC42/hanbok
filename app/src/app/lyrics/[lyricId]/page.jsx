'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import styles from '../../../styles/pages/lyrics.module.scss';
import Analysis from '@/components/analysis/Analysis';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supportedLanguages } from '@/translations';
import Image from 'next/image';
import Link from 'next/link';
import ContentPage from '@/components/ContentPage';
import Footer from '@/components/Footer';

import { MaterialSymbolsRightPanelClose } from '@/components/icons/RightPanelClose';
import { MingcuteDownFill } from '@/components/icons/DownCarat';
import { HeroiconsQuestionMarkCircle16Solid } from '@/components/icons/QuestionCircle';
import { LineMdTwitterX } from '@/components/icons/Twitter';
import { LineMdEmail } from '@/components/icons/Email';
import { IcTwotoneDiscord } from '@/components/icons/DiscordIcon';
import { MaterialSymbolsPublishRounded } from '@/components/icons/Publish';
import { BasilEyeSolid } from '@/components/icons/Eye';
import { MaterialSymbolsFavorite, MaterialSymbolsFavoriteOutline } from '@/components/icons/Favorite';

const LyricsPage = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { lyricId } = useParams();
    const [lyric, setLyric] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [activeAnalysisIndex, setActiveAnalysisIndex] = useState(null);
    const [hoveredLineGroup, setHoveredLineGroup] = useState(null);
    const lyricsTextRef = useRef(null);

    const [closingAnalysis, setClosingAnalysis] = useState(false);
    const [shareTooltipVisible, setShareTooltipVisible] = useState(false);

    const [activeView, setActiveView] = useState('original');
    const [isFavorited, setIsFavorited] = useState(false);
    const [favoritesLoading, setFavoritesLoading] = useState(false);

    useEffect(() => {
        const fetchLyricData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/lyrics/${lyricId}?language=${selectedLanguage}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch lyric data');
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.message || 'Error fetching lyric data');
                }
                
                setLyric(data.lyric);
                setError(null);
                // Reset active analysis when loading new lyrics
                setActiveAnalysisIndex(null);
            } catch (err) {
                console.error('Error fetching lyric:', err);
                setError(err.message || 'Failed to load lyric');
            } finally {
                setLoading(false);
            }
        };
        
        if (lyricId) {
            fetchLyricData();
        }
    }, [lyricId, selectedLanguage]);

    useEffect(() => {
        if(!!lyric) {
            document.title = t('lyrics.lyricPageTitle').replace('{song}', lyric.artist ? lyric.artist + ' - ' + lyric.title : lyric.title);
        }
    }, [lyric, t]);

    useEffect(() => {
        // Check if lyric is favorited when user or lyricId changes
        if (user && lyricId) {
            checkFavoriteStatus();
        } else {
            setIsFavorited(false);
        }
    }, [user, lyricId]);

    useEffect(() => {
        // Hide share tooltip after 3 seconds
        if (shareTooltipVisible) {
            const timer = setTimeout(() => {
                setShareTooltipVisible(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [shareTooltipVisible]);

    const handleLanguageChange = (language) => {
        setSelectedLanguage(language);
    };

    const capitalize = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const closeAnalysis = () => {
        setClosingAnalysis(true);
        setTimeout(() => {
            setClosingAnalysis(false);
            setActiveAnalysisIndex(null);
        }, 200);
    }

    const handleTwitterShare = () => {
        if (!lyric) return;
        
        const text = `Learning ${capitalize(supportedLanguages[lyric.language])} with "${lyric.title}" by ${lyric.artist || 'Unknown'}`;
        const url = window.location.href;
        
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            '_blank'
        );
    };

    const handleEmailShare = () => {
        if (!lyric) return;
        
        const subject = `Check out these ${capitalize(supportedLanguages[lyric.language])} lyrics: ${lyric.title}`;
        const body = `I found these ${capitalize(supportedLanguages[lyric.language])} lyrics that might interest you:\n\n${lyric.title} by ${lyric.artist || 'Unknown'}\n\nCheck it out here: ${window.location.href}`;
        
        window.open(
            `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
            '_blank'
        );
    };

    const handleDiscordShare = () => {
        if (!lyric) return;
        
        // Copy a formatted message for Discord
        const message = `**${lyric.title}** by ${lyric.artist || 'Unknown'} - ${capitalize(supportedLanguages[lyric.language])} lyrics: ${window.location.href}`;
        
        navigator.clipboard.writeText(message)
            .then(() => {
                setShareTooltipVisible(true);
            })
            .catch(err => console.error('Could not copy text: ', err));
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                setShareTooltipVisible(true);
            })
            .catch(err => console.error('Could not copy text: ', err));
    };

    const checkFavoriteStatus = async () => {
        try {
            const response = await fetch(`/api/lyrics/${lyricId}/favorited`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setIsFavorited(data.isFavorited);
                }
            }
        } catch (error) {
            console.error('Error checking favorite status:', error);
        }
    };

    const handleFavoriteToggle = async () => {
        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = '/login';
            return;
        }

        try {
            setFavoritesLoading(true);
            
            const method = isFavorited ? 'DELETE' : 'POST';
            const response = await fetch(`/api/lyrics/favorites/${lyricId}`, {
                method,
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setIsFavorited(data.isFavorited);
                }
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        } finally {
            setFavoritesLoading(false);
        }
    };

    // Prepare the lyrics text with line numbers and highlighting
    const renderLyricsWithHighlighting = () => {
        if (!lyric?.lyricsText) return null;

        const lines = lyric.lyricsText.split('\n');
        const analysisGroups = lyric.analysis?.analysisData || [];
        
        // Create a map of content line numbers to their analysis group index
        const lineToGroupMap = {};
        // Create a map of line indices to their translation
        const lineToTranslationMap = {};
        // Track which lines in a group should display the translation (only first line in group)
        const lineIsGroupLeader = {};
        // Track original sentences for lines that don't have translations
        const lineToOriginalMap = {};
        // Track group boundaries for each line (start and end indices)
        const lineToGroupBoundaries = {};
        
        analysisGroups.forEach((group, index) => {
            // Map line numbers to group index
            if (Array.isArray(group.lines)) {
                // For multi-line groups, mark the first line as the group leader
                if (group.lines.length > 0) {
                    lineIsGroupLeader[group.lines[0]] = true;
                    
                    // Set group boundaries for this group
                    const groupStart = Math.min(...group.lines);
                    const groupEnd = Math.max(...group.lines);
                    group.lines.forEach(lineNum => {
                        lineToGroupBoundaries[lineNum] = {start: groupStart, end: groupEnd};
                    });
                }
                
                group.lines.forEach(lineNum => {
                    lineToGroupMap[lineNum] = index;
                    
                    // Store original text for every line
                    if (group.sentence?.analysis?.sentence?.original) {
                        lineToOriginalMap[lineNum] = group.sentence.analysis.sentence.original;
                    }
                });
            } else {
                lineToGroupMap[group.lines] = index;
                lineIsGroupLeader[group.lines] = true;
                lineToGroupBoundaries[group.lines] = {start: group.lines, end: group.lines};
                
                // Store original text
                if (group.sentence?.analysis?.sentence?.original) {
                    lineToOriginalMap[group.lines] = group.sentence.analysis.sentence.original;
                }
            }
            
            // Store translation for this group if available
            if (group.sentence?.analysis?.sentence?.translation) {
                if (Array.isArray(group.lines) && group.lines.length > 0) {
                    // Only store translation on the first line of the group
                    lineToTranslationMap[group.lines[0]] = group.sentence.analysis.sentence.translation;
                } else {
                    lineToTranslationMap[group.lines] = group.sentence.analysis.sentence.translation;
                }
            }
        });

        // Filter out blank lines and keep track of actual line numbers
        // This maps visual line indices to actual line numbers
        const nonBlankLineMap = {};
        let actualLineCount = 0;
        
        lines.forEach((line, index) => {
            if (line.trim().length > 0) {
                actualLineCount++;
                nonBlankLineMap[index] = actualLineCount;
            }
        });
        
        // Group lines by their analysis group
        // This helps us render translations alongside their corresponding lines
        const groupedLines = [];
        let currentGroup = null;
        let currentGroupIndex = null;
        
        lines.forEach((line, index) => {
            const actualLineNumber = nonBlankLineMap[index] || null;
            const groupIndex = actualLineNumber ? lineToGroupMap[actualLineNumber] : undefined;
            const isBlankLine = line.trim().length === 0;
            
            // Check if this line has no analysis but has content
            const hasNoAnalysis = !isBlankLine && groupIndex === undefined;
            
            // If this is a new group, a blank line, or a line without analysis
            if (groupIndex !== currentGroupIndex || isBlankLine || hasNoAnalysis) {
                // Add the previous group if it exists
                if (currentGroup) {
                    groupedLines.push(currentGroup);
                }
                
                // Start a new group
                currentGroup = {
                    groupIndex,
                    lines: [],
                    translation: null,
                    isBlankLine,
                    hasNoAnalysis
                };
                
                currentGroupIndex = groupIndex;
                
                // Set the translation for this group if it's the first line with analysis
                if (actualLineNumber && lineIsGroupLeader[actualLineNumber]) {
                    currentGroup.translation = lineToTranslationMap[actualLineNumber] || null;
                }
            }
            
            // Add the line to the current group
            currentGroup.lines.push({
                index,
                actualLineNumber,
                text: line,
                isBlankLine
            });
        });
        
        // Add the last group
        if (currentGroup) {
            groupedLines.push(currentGroup);
        }

        return (
            <div className={styles.lyricsGrid}>
                {groupedLines.map((group, groupIdx) => {
                    // Skip rendering empty groups (can happen with consecutive blank lines)
                    if (group.lines.length === 0) return null;
                    
                    // Determine if this group should be highlighted
                    const isHighlighted = 
                        group.groupIndex !== undefined && 
                        (hoveredLineGroup === group.groupIndex || activeAnalysisIndex === group.groupIndex);
                    
                    // Determine if this group should be active (selected)
                    const isActive = group.groupIndex !== undefined && activeAnalysisIndex === group.groupIndex;
                    
                    // For lines without analysis, don't apply highlights or interactions
                    const rowClasses = `
                        ${styles.lyricsRow} 
                        ${group.isBlankLine ? styles.blankRow : ''}
                        ${group.hasNoAnalysis ? styles.noAnalysisRow : ''}
                        ${!group.hasNoAnalysis && isHighlighted ? styles.highlighted : ''}
                        ${!group.hasNoAnalysis && isActive ? styles.active : ''}
                    `;
                    
                    const handleMouseEnter = () => {
                        if (group.groupIndex !== undefined && !group.hasNoAnalysis) {
                            setHoveredLineGroup(group.groupIndex);
                        }
                    };
                    
                    const handleClick = () => {
                        if (group.groupIndex !== undefined && !group.hasNoAnalysis) {
                            setActiveAnalysisIndex(group.groupIndex);
                        }
                    };
                    
                    return (
                        <div 
                            key={groupIdx}
                            className={rowClasses}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={() => setHoveredLineGroup(null)}
                            onClick={handleClick}
                        >
                            {/* Left column: line numbers and original text */}
                            <div className={`${styles.originalColumn} ${activeView === 'original' ? styles.activeView : ''}`}>
                                {group.lines.map(line => (
                                    <div key={line.index} className={styles.lineWrapper}>
                                        <span className={styles.lineNumber}>
                                            {line.actualLineNumber || ''}
                                        </span>
                                        <span className={styles.lineContent}>
                                            {line.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Right column: translation or duplicated original text */}
                            <div className={`${styles.translationColumn} ${activeView === 'translation' ? styles.activeView : ''}`}>
                                {!group.isBlankLine && (
                                    <span className={styles.translationContent}>
                                        {group.hasNoAnalysis ? 
                                            (group.lines[0]?.text || '') : // Duplicate the text for lines without analysis
                                            (group.translation || (group.groupIndex !== undefined ? '—' : ''))}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <ContentPage>
                <div className={styles.lyricsContainer}>
                    <h1>{t('lyrics.detail.loading')}</h1>
                </div>
            </ContentPage>
        );
    }

    if (error) {
        return (
            <ContentPage>
                <div className={styles.lyricsContainer}>
                    <h1>{t('lyrics.detail.error')}</h1>
                    <p>{error}</p>
                </div>
            </ContentPage>
        );
    }

    if (!lyric) {
        return (
            <ContentPage>
                <div className={styles.lyricsContainer}>
                    <h1>{t('lyrics.detail.notFound')}</h1>
                </div>
            </ContentPage>
        );
    }

    // Determine if we have analysis data
    const hasAnalysis = lyric.analysis && lyric.analysis.analysisData && lyric.analysis.analysisData.length > 0;
    const activeAnalysis = hasAnalysis && activeAnalysisIndex !== null 
        ? lyric.analysis.analysisData[activeAnalysisIndex] 
        : null;

    // Render the lyric information and analysis
    return (
        <ContentPage>
            <div className={styles.lyricsContainer}>
                <Image src="/images/background.png" alt="Background" fill priority style={{ objectFit: 'cover' }} />
                <div className={styles.lyricsHeader}>
                    <h1>{lyric.title}</h1>
                    {lyric.artist && <h2>{t('lyrics.detail.by')}: {lyric.artist}</h2>}
                    <div className={styles.lyricTags}>
                        <div className={styles.lyricTag}>
                            {t('lyrics.detail.tags.language')}: {supportedLanguages[lyric.language].toUpperCase()}
                        </div>
                        <div className={styles.lyricTag}>
                            {t('lyrics.detail.tags.genre')}: {lyric.genre.toUpperCase()}
                        </div>
                        {lyric.anime && (
                            <div className={`${styles.lyricTag} ${styles.anime}`}>
                                {t('lyrics.detail.tags.anime')}: {lyric.anime}
                            </div>
                        )}
                        {lyric.viewCount && (
                            <div className={`${styles.lyricTag} ${styles.viewCount}`}>
                                <BasilEyeSolid />
                                {lyric.viewCount}
                            </div>
                        )}
                        <button 
                            className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : ''}`}
                            onClick={handleFavoriteToggle}
                            disabled={favoritesLoading}
                            title={user ? (isFavorited ? t('lyrics.detail.removeFavorite', 'Remove from favorites') : t('lyrics.detail.addFavorite', 'Add to favorites')) : t('lyrics.detail.loginToFavorite', 'Sign in to add to favorites')}
                        >
                            {isFavorited ? <MaterialSymbolsFavorite /> : <MaterialSymbolsFavoriteOutline />}
                            {favoritesLoading ? '...' : (isFavorited ? t('lyrics.detail.favorited', 'Favorited') : t('lyrics.detail.favorite', 'Favorite'))}
                        </button>
                    </div>

                    <div className={styles.backButton}>
                        <Link href="/lyrics">
                            {t('lyrics.detail.back')}
                        </Link>
                        {user && (
                            <>
                                <span className={styles.buttonSeparator}>|</span>
                                <Link href="/lyrics/favorites">
                                    {t('lyrics.detail.backToFavorites', 'Back to Favorites')}
                                </Link>
                            </>
                        )}
                    </div>

                    {lyric.youtubeUrl && (
                        <div className={styles.youtubeContainer}>
                            <iframe 
                                src={`https://www.youtube.com/embed/${lyric.youtubeUrl}`}
                                title="YouTube video player"
                            ></iframe>
                        </div>
                    )}

                    <div className={styles.shareButtonsContainer}>
                        <div className={styles.shareButtons}>
                            <button className={`${styles.shareButton} ${styles.twitter}`} onClick={handleTwitterShare}>
                                <LineMdTwitterX />
                                <span>{t('lyrics.detail.share.twitter')}</span>
                            </button>
                            <button className={`${styles.shareButton} ${styles.email}`} onClick={handleEmailShare}>
                                <LineMdEmail />
                                <span>{t('lyrics.detail.share.email')}</span>
                            </button>
                            <button className={`${styles.shareButton} ${styles.discord}`} onClick={handleDiscordShare}>
                                <IcTwotoneDiscord />
                                <span>{t('lyrics.detail.share.discord')}</span>
                            </button>
                            <button className={`${styles.shareButton} ${styles.copy}`} onClick={handleCopyLink}>
                                <MaterialSymbolsPublishRounded />
                                <span>{t('lyrics.detail.share.copyLink')}</span>
                            </button>
                        </div>
                        {shareTooltipVisible && (
                            <div className={styles.shareTooltip}>
                                {t('lyrics.detail.share.copied')}
                            </div>
                        )}
                    </div>

                    <div className={styles.lyricsHelp}>
                        <div className={styles.lyricsHelpInner}>
                            <div className={styles.lyricsHelpBubble}>
                                <HeroiconsQuestionMarkCircle16Solid />
                            </div>
                            <h3>{t('lyrics.detail.help.title')}</h3>
                            <p>{t('lyrics.detail.help.description')}</p>
                        </div>
                    </div>
                </div>


                <div className={`${styles.lyricsText} ${activeAnalysisIndex !== null ? styles.lyricsTextActive : ''}`}>
                    <div className={styles.columnHeaders}>
                        <div className={styles.originalHeader}>{t('lyrics.detail.columns.original')}</div>
                        <div className={styles.translationHeader}>{t('lyrics.detail.columns.translation')}</div>
                    </div>
                    <div className={styles.viewTabs}>
                        <div 
                            className={`${styles.viewTab} ${activeView === 'original' ? styles.activeView : ''}`} 
                            onClick={() => setActiveView('original')}>
                            {t('lyrics.detail.columns.original')}
                        </div>
                        <div 
                            className={`${styles.viewTab} ${activeView === 'translation' ? styles.activeView : ''}`} 
                            onClick={() => setActiveView('translation')}>
                            {t('lyrics.detail.columns.translation')}
                        </div>
                    </div>
                    {renderLyricsWithHighlighting()}
                </div>

                {(hasAnalysis && activeAnalysisIndex !== null) && (
                    <div className={`${styles.analysisContainer} ${closingAnalysis ? styles.closingAnalysis : ''}`}>
                        {activeAnalysis ? (
                            <div className={styles.activeAnalysis}>
                                <div onClick={closeAnalysis} className={styles.closeAnalysis}>
                                    <div className={styles.closeAnalysisSymbolRight}>
                                        <MaterialSymbolsRightPanelClose /> 
                                    </div> 
                                    <div className={styles.closeAnalysisSymbolDown}>
                                        <MingcuteDownFill/> 
                                    </div> 
                                    {t('lyrics.detail.analysis.close')}
                                </div>
                                <h3>{t('lyrics.detail.analysis.title')}</h3>
                                <div className={styles.lineNumbers}>
                                    {Array.isArray(activeAnalysis.lines) 
                                        ? t('lyrics.detail.analysis.lines')
                                            .replace('{start}', activeAnalysis.lines[0])
                                            .replace('{end}', activeAnalysis.lines[activeAnalysis.lines.length - 1])
                                        : t('lyrics.detail.analysis.line').replace('{number}', activeAnalysis.lines)}
                                </div>
                                <div className={styles.originalText}>
                                    <p>{activeAnalysis.text}</p>
                                    {activeAnalysis.sentence?.translation && (
                                        <p className={styles.lineTranslation}>{activeAnalysis.sentence.translation}</p>
                                    )}
                                </div>
                                {activeAnalysis.sentence?.analysis && (
                                    <Analysis 
                                        analysis={activeAnalysis.sentence.analysis} 
                                        voice1={activeAnalysis.sentence.voice1Key} 
                                        voice2={activeAnalysis.sentence.voice2Key}
                                        originalLanguage={lyric.language}
                                        translationLanguage={lyric.analysis.language}
                                        showTransition={false}
                                        sentenceId={activeAnalysis.sentence.sentenceId}
                                        isLyric={true}
                                    />
                                )}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
            <Footer />
        </ContentPage>
    );
};

export default LyricsPage;
