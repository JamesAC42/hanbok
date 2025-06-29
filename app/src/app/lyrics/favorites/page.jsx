'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import lyricsStyles from '@/styles/pages/lyrics.module.scss';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MaterialSymbolsArrowBackRounded } from '@/components/icons/ArrowBack';
import { MaterialSymbolsFavorite } from '@/components/icons/Favorite';
import { BasilEyeSolid } from '@/components/icons/Eye';
import ContentPage from '@/components/ContentPage';
import Footer from '@/components/Footer';

const FavoriteLyrics = () => {
    const { t } = useLanguage();
    const { user, loading: authLoading } = useAuth();
    
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [organizedFavorites, setOrganizedFavorites] = useState([]);

    useEffect(() => {
        document.title = t('lyrics.favorites.pageTitle', 'My Favorite Lyrics - Hanbok Study');
    }, [t]);

    useEffect(() => {
        if (!authLoading) {
            if (user) {
                fetchFavorites();
            } else {
                setLoading(false);
            }
        }
    }, [user, authLoading]);

    useEffect(() => {
        organizeFavorites();
    }, [favorites]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/lyrics/favorites', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch favorites');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Error fetching favorites');
            }
            
            setFavorites(data.favorites || []);
        } catch (err) {
            console.error('Error fetching favorites:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const organizeFavorites = () => {
        // If no favorites, reset organized favorites
        if (!favorites || favorites.length === 0) {
            setOrganizedFavorites([]);
            return;
        }

        // Group favorites by genre first
        const genreGroups = {};
        
        favorites.forEach(lyric => {
            const genre = lyric.genre || 'other';
            if (!genreGroups[genre]) {
                genreGroups[genre] = [];
            }
            genreGroups[genre].push(lyric);
        });

        // Then organize each genre by artist/anime
        const organized = [];
        
        Object.keys(genreGroups).forEach(genre => {
            const genreData = {
                genre,
                genreName: getGenreName(genre),
                artists: {}
            };

            genreGroups[genre].forEach(lyric => {
                const groupKey = genre === 'anime' ? (lyric.anime || lyric.artist) : lyric.artist;
                
                if (!genreData.artists[groupKey]) {
                    genreData.artists[groupKey] = {
                        name: groupKey,
                        isAnime: genre === 'anime',
                        animeName: lyric.anime,
                        songs: []
                    };
                }
                
                genreData.artists[groupKey].songs.push(lyric);
            });

            // Convert artists object to sorted array
            genreData.artistsList = Object.values(genreData.artists).sort((a, b) => 
                a.name.localeCompare(b.name)
            );

            organized.push(genreData);
        });

        // Sort genres by name
        organized.sort((a, b) => a.genreName.localeCompare(b.genreName));
        
        setOrganizedFavorites(organized);
    };

    const getGenreName = (genre) => {
        const genreMap = {
            'kpop': 'K-Pop',
            'jpop': 'J-Pop',
            'anime': 'Anime',
            'other': 'Other'
        };
        return genreMap[genre] || genre.charAt(0).toUpperCase() + genre.slice(1);
    };

    // Show login message if user is not authenticated
    if (!authLoading && !user) {
        return (
            <ContentPage>
                <div className={lyricsStyles.lyricsPage}>
                    <Image src="/images/background.png" alt="Background" fill priority style={{ objectFit: 'cover' }} />
                    <div className={lyricsStyles.lyricsHero}>
                        <h1 className={lyricsStyles.heroTitle}>
                            {t('lyrics.favorites.title', 'My Favorite Lyrics')}
                        </h1>
                        <p className={lyricsStyles.heroSubtitle}>
                            {t('lyrics.favorites.loginRequired', 'Sign in to save your favorite songs and access them quickly')}
                        </p>
                    </div>

                    <div className={lyricsStyles.lyricsHomeContainer}>
                        <div className={lyricsStyles.mainContent}>
                            <div className={lyricsStyles.loginPrompt}>
                                <MaterialSymbolsFavorite />
                                <h2>{t('lyrics.favorites.loginPrompt.title', 'Save Your Favorite Lyrics')}</h2>
                                <p>{t('lyrics.favorites.loginPrompt.description', 'Create an account to save your favorite songs and build your personal collection.')}</p>
                                <Link href="/login" className={lyricsStyles.loginButton}>
                                    {t('auth.signIn', 'Sign In')}
                                </Link>
                            </div>
                        </div>
                    </div>
                    <Footer />
                </div>
            </ContentPage>
        );
    }

    return (
        <ContentPage>
            <div className={lyricsStyles.lyricsPage}>
                <Image src="/images/background.png" alt="Background" fill priority style={{ objectFit: 'cover' }} />
                <div className={lyricsStyles.lyricsHero}>
                    <h1 className={lyricsStyles.heroTitle}>
                        {t('lyrics.favorites.title', 'My Favorite Lyrics')}
                    </h1>
                    <p className={lyricsStyles.heroSubtitle}>
                        {t('lyrics.favorites.description', 'Your personal collection of favorite songs')}
                    </p>
                </div>

                <div className={lyricsStyles.lyricsHomeContainer}>
                    <div className={lyricsStyles.mainContent}>
                        <div className={lyricsStyles.categoryHeader}>
                            <div className={lyricsStyles.favoritesHeader}>
                                <Link href="/lyrics" className={lyricsStyles.backButton}>
                                    <MaterialSymbolsArrowBackRounded />
                                    {t('lyrics.favorites.backToLyrics', 'Back to Lyrics')}
                                </Link>
                                <div className={lyricsStyles.favoritesCount}>
                                    <MaterialSymbolsFavorite />
                                    {t('lyrics.favorites.count', '{count} favorites').replace('{count}', favorites.length)}
                                </div>
                            </div>
                        </div>

                        <div className={lyricsStyles.songsContent}>
                            {loading ? (
                                <div className={lyricsStyles.loading}>
                                    {t('lyrics.status.loading', 'Loading...')}
                                </div>
                            ) : error ? (
                                <div className={lyricsStyles.error}>{error}</div>
                            ) : favorites.length === 0 ? (
                                <div className={lyricsStyles.noFavorites}>
                                    <MaterialSymbolsFavorite />
                                    <h3>{t('lyrics.favorites.empty.title', 'No Favorites Yet')}</h3>
                                    <p>{t('lyrics.favorites.empty.description', 'Start exploring lyrics and add songs to your favorites!')}</p>
                                    <Link href="/lyrics" className={lyricsStyles.exploreButton}>
                                        {t('lyrics.favorites.empty.explore', 'Explore Lyrics')}
                                    </Link>
                                </div>
                            ) : organizedFavorites.length === 0 ? (
                                <div className={lyricsStyles.loading}>
                                    {t('lyrics.status.organizing', 'Organizing favorites...')}
                                </div>
                            ) : (
                                <div className={lyricsStyles.favoritesList}>
                                    {organizedFavorites.map((genreGroup) => (
                                        <div key={genreGroup.genre} className={lyricsStyles.genreSection}>
                                            <h2 className={lyricsStyles.genreTitle}>{genreGroup.genreName}</h2>
                                            
                                            <div className={lyricsStyles.lyricsList}>
                                                {genreGroup.artistsList && genreGroup.artistsList.map((artistGroup) => (
                                                    <div key={artistGroup.name} className={lyricsStyles.lyricsSection}>
                                                        <h3>
                                                            {artistGroup.isAnime && artistGroup.animeName 
                                                                ? artistGroup.animeName 
                                                                : artistGroup.name}
                                                        </h3>
                                                        <ul>
                                                            {artistGroup.songs && artistGroup.songs.map((song) => (
                                                                <li key={song.lyricId}>
                                                                    <Link href={`/lyrics/${song.lyricId}`}>
                                                                        <span>{song.artist || artistGroup.name}</span> - <span>{song.title}</span>
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className={lyricsStyles.sidebarContainer}>
                        <div className={lyricsStyles.suggestionsPanel}>
                            <h3>{t('lyrics.suggestBox.title', 'Suggest a Song')}</h3>
                            <p>{t('lyrics.suggestBox.description', 'Help us expand our library! Suggest songs you\'d like to see added.')}</p>
                            <Link href="/lyrics/suggestions" className={lyricsStyles.suggestButton}>
                                {t('lyrics.suggestBox.button', 'Make a Suggestion')}
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </ContentPage>
    );
};

export default FavoriteLyrics; 