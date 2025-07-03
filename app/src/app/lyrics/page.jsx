'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import lyricsStyles from '@/styles/pages/lyrics.module.scss';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import { MaterialSymbolsArrowBackRounded } from '@/components/icons/ArrowBack';
import { BasilEyeSolid } from '@/components/icons/Eye';
import ContentPage from '@/components/ContentPage';

import Footer from '@/components/Footer';

const Lyrics = () => {
    const { t } = useLanguage();
    const { isAdmin } = useAdmin();
    const { user } = useAuth();

    const [activeCategory, setActiveCategory] = useState('kpop');
    const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'songs'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [lyricsByArtist, setLyricsByArtist] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recentLyrics, setRecentLyrics] = useState([]);
    const [recentLoading, setRecentLoading] = useState(false);

    // Category data with images
    const categories = [
        {
            id: 'kpop',
            name: t('lyrics.categories.kpop'),
            image: '/images/lyrics/straykids.webp',
            description: 'Korean Pop Music'
        },
        {
            id: 'jpop',
            name: t('lyrics.categories.jpop'),
            image: '/images/lyrics/yoasobi.webp',
            description: 'Japanese Pop Music'
        },
        {
            id: 'anime',
            name: t('lyrics.categories.anime'),
            image: '/images/lyrics/renaicirculation.jpg',
            description: 'Anime Theme Songs'
        }
    ];
    
    useEffect(() => {
        document.title = t('lyrics.pageTitle');
        fetchRecentLyrics();
    }, [t]);

    // Fetch recent lyrics (last 7 days)
    const fetchRecentLyrics = async () => {
        try {
            setRecentLoading(true);
            
            const response = await fetch('/api/lyrics/recent');
            
            if (!response.ok) {
                throw new Error('Failed to fetch recent lyrics');
            }
            
            const data = await response.json();
            
            if (data.success) {
                setRecentLyrics(data.lyrics);
            }
        } catch (err) {
            console.error('Error fetching recent lyrics:', err);
        } finally {
            setRecentLoading(false);
        }
    };

    // Fetch lyrics by genre
    const fetchLyricsByGenre = async (genre) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`/api/lyrics?genre=${genre}`);
            
            if (!response.ok) {
                throw new Error(t('lyrics.errors.fetchFailed'));
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || t('lyrics.errors.fetchFailed'));
            }
            
            // Organize lyrics by artist
            const lyrics = data.lyrics;
            const artistMap = {};
            
            lyrics.forEach(lyric => {
                if (genre === 'anime') {
                    // For anime, group by anime name instead of artist
                    const groupKey = lyric.anime || lyric.artist;
                    
                    if (!artistMap[groupKey]) {
                        artistMap[groupKey] = {
                            artist: groupKey,
                            isAnime: true,
                            animeName: lyric.anime,
                            songs: []
                        };
                    }
                    
                    artistMap[groupKey].songs.push({
                        lyricId: lyric.lyricId,
                        title: lyric.title,
                        artist: lyric.artist,
                        genre: lyric.genre,
                        language: lyric.language,
                        viewCount: lyric.viewCount
                    });
                } else {
                    // Regular grouping by artist for other genres
                    if (!artistMap[lyric.artist]) {
                        artistMap[lyric.artist] = {
                            artist: lyric.artist,
                            isAnime: false,
                            songs: []
                        };
                    }
                    
                    artistMap[lyric.artist].songs.push({
                        lyricId: lyric.lyricId,
                        title: lyric.title,
                        genre: lyric.genre,
                        language: lyric.language,
                        viewCount: lyric.viewCount
                    });
                }
            });
            
            // Convert map to array and sort by artist name
            const artistArray = Object.values(artistMap).sort((a, b) => 
                a.artist.localeCompare(b.artist)
            );
            
            setLyricsByArtist(artistArray);
        } catch (err) {
            console.error('Error fetching lyrics:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (categoryId) => {
        setActiveCategory(categoryId);
        setSelectedCategory(categories.find(cat => cat.id === categoryId));
        setViewMode('songs');
        fetchLyricsByGenre(categoryId);
    };

    const handleBackToCategories = () => {
        setViewMode('categories');
        setSelectedCategory(null);
        setLyricsByArtist([]);
    };

    return (
        <ContentPage>
            <div className={lyricsStyles.lyricsPage}>
                <Image src="/images/background.png" alt="Background" fill priority style={{ objectFit: 'cover' }} />
                <div className={lyricsStyles.lyricsHero}>
                    <h1 className={lyricsStyles.heroTitle}>{t('lyrics.title')}</h1>
                    <p className={lyricsStyles.heroSubtitle}>{t('lyrics.description')}</p>
                </div>

                <div className={lyricsStyles.lyricsHomeContainer}>
                    <div className={lyricsStyles.mainContent}>
                        {viewMode === 'categories' ? (
                            // Categories View
                            <>
                                {/* New This Week Section */}
                                {recentLyrics.length > 0 && (
                                    <div className={lyricsStyles.newThisWeekSection}>
                                        <h2 className={lyricsStyles.sectionTitle}>
                                            {t('lyrics.newThisWeek.title', 'New This Week')}
                                        </h2>
                                        <div className={lyricsStyles.recentLyricsList}>
                                            {recentLoading ? (
                                                <div className={lyricsStyles.loading}>{t('lyrics.status.loading')}</div>
                                            ) : (
                                                recentLyrics.slice(0, 6).map((lyric) => (
                                                    <Link 
                                                        href={`/lyrics/${lyric.lyricId}`} 
                                                        key={lyric.lyricId}
                                                        className={lyricsStyles.recentLyricCard}
                                                    >
                                                        <div className={lyricsStyles.recentLyricInfo}>
                                                            <h4>{lyric.title}</h4>
                                                            <p>{lyric.anime || lyric.artist}</p>
                                                            <div className={lyricsStyles.recentLyricMeta}>
                                                                <span className={lyricsStyles.recentLyricGenre}>
                                                                    {lyric.genre}
                                                                </span>
                                                                {lyric.viewCount && (
                                                                    <span className={lyricsStyles.recentLyricViewCount}>
                                                                        <BasilEyeSolid />
                                                                        {lyric.viewCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className={lyricsStyles.newBadge}>
                                                            {t('lyrics.newThisWeek.badge', 'NEW')}
                                                        </div>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                <h2 className={lyricsStyles.sectionTitle}>{t('lyrics.categories.title')}</h2>
                                <div className={lyricsStyles.categoriesGrid}>
                                    {categories.map((category) => (
                                        <div 
                                            key={category.id}
                                            className={lyricsStyles.categoryCard}
                                            onClick={() => handleCategoryClick(category.id)}
                                        >
                                            <div className={lyricsStyles.categoryImageContainer}>
                                                <Image
                                                    src={category.image}
                                                    alt={category.name}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                />
                                                <div className={lyricsStyles.categoryOverlay} />
                                            </div>
                                            <div className={lyricsStyles.categoryInfo}>
                                                <h3>{category.name}</h3>
                                                <p>{category.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            // Songs View
                            <>
                                <div className={lyricsStyles.categoryHeader}>
                                    <div className={lyricsStyles.categoryBanner}>
                                        <Image
                                            src={selectedCategory?.image}
                                            alt={selectedCategory?.name}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                        <div className={lyricsStyles.categoryBannerOverlay} />
                                        <div className={lyricsStyles.categoryBannerContent}>
                                            <button 
                                                className={lyricsStyles.backButton}
                                                onClick={handleBackToCategories}
                                            >
                                                <MaterialSymbolsArrowBackRounded />
                                                Back to Categories
                                            </button>
                                            <h2>{selectedCategory?.name}</h2>
                                        </div>
                                    </div>
                                </div>

                                <div className={lyricsStyles.songsContent}>
                                    {loading ? (
                                        <div className={lyricsStyles.loading}>{t('lyrics.status.loading')}</div>
                                    ) : error ? (
                                        <div className={lyricsStyles.error}>{error}</div>
                                    ) : lyricsByArtist.length === 0 ? (
                                        <div className={lyricsStyles.noLyrics}>
                                            <p>{t('lyrics.status.noLyrics.main').replace('{category}', activeCategory.toUpperCase())}</p>
                                            <p>{t('lyrics.status.noLyrics.suggestion')}</p>
                                        </div>
                                    ) : (
                                        <div className={lyricsStyles.lyricsList}>
                                            {lyricsByArtist.map((artistGroup) => (
                                                <div key={artistGroup.artist} className={lyricsStyles.lyricsSection}>
                                                    <h3>{artistGroup.isAnime && artistGroup.animeName ? artistGroup.animeName : artistGroup.artist}</h3>
                                                    <ul>
                                                        {artistGroup.songs.map((song) => (
                                                            <li key={song.lyricId}>
                                                                <Link href={`/lyrics/${song.lyricId}`}>
                                                                    <div className={lyricsStyles.songItemContent}>
                                                                        <span className={lyricsStyles.songTitle}>
                                                                            <span>{song.artist || artistGroup.artist}</span> - <span>{song.title}</span>
                                                                        </span>
                                                                        {song.viewCount && (
                                                                            <span className={lyricsStyles.songViewCount}>
                                                                                <BasilEyeSolid />
                                                                                {song.viewCount}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Suggestions Sidebar */}
                    <div className={lyricsStyles.sidebarContainer}>
                        {user && (
                            <div className={lyricsStyles.favoritesPanel}>
                                <h3>{t('lyrics.favorites.sidebarTitle', 'My Favorites')}</h3>
                                <p>{t('lyrics.favorites.sidebarDescription', 'Access your personal collection of favorite songs')}</p>
                                <Link href="/lyrics/favorites" className={lyricsStyles.favoritesButton}>
                                    {t('lyrics.favorites.sidebarButton', 'View Favorites')}
                                </Link>
                            </div>
                        )}

                        <div className={lyricsStyles.suggestionsPanel}>
                            <h3>{t('lyrics.suggestBox.title')}</h3>
                            <p>{t('lyrics.suggestBox.description')}</p>
                            <Link href="/lyrics/suggestions" className={lyricsStyles.suggestButton}>
                                {t('lyrics.suggestBox.button')}
                            </Link>
                        </div>

                        {isAdmin(user?.email) && (
                            <div className={lyricsStyles.adminPanel}>
                                <h3>Admin Panel</h3>
                                <Link href="/lyrics/admin" className={lyricsStyles.adminButton}>
                                    {t('lyrics.adminPanel')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
                <Footer />
            </div>
        </ContentPage>
    );
};

export default Lyrics;
