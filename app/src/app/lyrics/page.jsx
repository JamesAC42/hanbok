'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import lyricsStyles from '@/styles/components/lyrics.module.scss';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';

const Lyrics = () => {
    const { t } = useLanguage();
    const { isAdmin } = useAdmin();
    const { user } = useAuth();

    const [activeCategory, setActiveCategory] = useState('kpop');
    const [lyricsByArtist, setLyricsByArtist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    // Using anime field, or fallback to artist if not available
                    const groupKey = lyric.anime || lyric.artist;
                    
                    if (!artistMap[groupKey]) {
                        artistMap[groupKey] = {
                            artist: groupKey,
                            songs: []
                        };
                    }
                    
                    artistMap[groupKey].songs.push({
                        lyricId: lyric.lyricId,
                        title: lyric.title,
                        artist: lyric.artist, // Keep artist info for display
                        genre: lyric.genre,
                        language: lyric.language
                    });
                } else {
                    // Regular grouping by artist for other genres
                    if (!artistMap[lyric.artist]) {
                        artistMap[lyric.artist] = {
                            artist: lyric.artist,
                            songs: []
                        };
                    }
                    
                    artistMap[lyric.artist].songs.push({
                        lyricId: lyric.lyricId,
                        title: lyric.title,
                        genre: lyric.genre,
                        language: lyric.language
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

    // Fetch lyrics when active category changes
    useEffect(() => {
        fetchLyricsByGenre(activeCategory);
    }, [activeCategory]);

    return (
        <div className={lyricsStyles.lyricsContainer}>
            <div className={lyricsStyles.lyricsContent}>
                <h1 className={lyricsStyles.pageTitle}>{t('lyrics.title')}</h1>
                
                <div className={lyricsStyles.section}>
                    <p>{t('lyrics.description')}</p>
                    {isAdmin(user?.email) && (
                        <div className={lyricsStyles.adminContainer}>
                            <Link href="/lyrics/admin">{t('lyrics.adminPanel')}</Link>
                        </div>
                    )}
                </div>

                <div className={lyricsStyles.lyricsListOuter}>
                    <div className={lyricsStyles.suggestionsBox}>
                        <div className={lyricsStyles.suggestionsBoxTitle}>
                            {t('lyrics.suggestBox.title')}
                        </div>  
                        <div className={lyricsStyles.suggestionsBoxDescription}>
                            {t('lyrics.suggestBox.description')}
                        </div>
                        <Link href="/lyrics/suggestions" className={lyricsStyles.suggestionsBoxButton}>
                            {t('lyrics.suggestBox.button')}
                        </Link>
                    </div>

                    <div className={lyricsStyles.categories}>
                        <div 
                            className={`${lyricsStyles.category} ${lyricsStyles.kpop} ${activeCategory === 'kpop' ? lyricsStyles.active : ''}`} 
                            onClick={() => setActiveCategory('kpop')}
                        >
                            {t('lyrics.categories.kpop')}
                        </div>
                        <div 
                            className={`${lyricsStyles.category} ${lyricsStyles.jpop} ${activeCategory === 'jpop' ? lyricsStyles.active : ''}`} 
                            onClick={() => setActiveCategory('jpop')}
                        >
                            {t('lyrics.categories.jpop')}
                        </div>
                        <div 
                            className={`${lyricsStyles.category} ${lyricsStyles.anime} ${activeCategory === 'anime' ? lyricsStyles.active : ''}`} 
                            onClick={() => setActiveCategory('anime')}
                        >
                            {t('lyrics.categories.anime')}
                        </div>
                    </div>
                    
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
                                    <h3>{activeCategory === 'anime' 
                                        ? artistGroup.artist // Display the anime name directly
                                        : artistGroup.artist.charAt(0).toUpperCase() // For other genres, display the first letter
                                    }</h3>
                                    <ul>
                                        {artistGroup.songs.map((song) => (
                                            <li key={song.lyricId}>
                                                <Link href={`/lyrics/${song.lyricId}`}>
                                                    <span>{song.artist || artistGroup.artist}</span> - <span>{song.title}</span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                    
                <div className={`${lyricsStyles.girlContainer}`}>
                    <Image src="/images/hanbokgirlmusic.png" alt={t('login.girlImageAlt')} width={1024} height={1536} />
                </div>
            </div>
        </div>
    );
};

export default Lyrics;
