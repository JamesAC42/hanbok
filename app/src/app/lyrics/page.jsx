'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import lyricsStyles from '@/styles/components/lyrics.module.scss';
import { useState } from 'react';
const lyrics = {
    kpop: [
        {
            letter: 'A',
            lyrics: [
                {
                    title: 'Autumn Leaves',
                    artist: 'Autumn Band',
                },
                {
                    title: 'Azure Sky',
                    artist: 'Astro Stars',
                }
            ]
        },
        {
            letter: 'B',
            lyrics: [
                {
                    title: 'Blue Moon',
                    artist: 'Bright Day',
                },
                {
                    title: 'Beautiful World',
                    artist: 'Binary Group',
                }
            ]
        }
    ],
    jpop: [
        {
            letter: 'C',
            lyrics: [
                {
                    title: 'Crystal Heart',
                    artist: 'Cherry Tree',
                },
                {
                    title: 'Cosmic Love',
                    artist: 'Cloud Nine',
                }
            ]
        }
    ],
    anime: [
        {
            letter: 'D',
            lyrics: [
                {
                    title: 'Dream Walker',
                    artist: 'Dawn Breakers',
                },
                {
                    title: 'Digital World',
                    artist: 'Dusk Riders',
                }
            ]
        }
    ]
}

const Lyrics = () => {
    const { t } = useLanguage();

    const [activeCategory, setActiveCategory] = useState('kpop');

    return (
        <div className={lyricsStyles.lyricsContainer}>
            <div className={lyricsStyles.lyricsContent}>
                <h1 className={lyricsStyles.pageTitle}>Lyrics</h1>
                
                <div className={lyricsStyles.section}>
                    <p>
                        Find detailed translations and breakdowns of your favorite songs
                    </p>
                </div>

                <div className={lyricsStyles.lyricsListOuter}>

                    <div className={lyricsStyles.suggestionsBox}>
                        <div className={lyricsStyles.suggestionsBoxTitle}>
                            Suggest Songs!
                        </div>  
                        <div className={lyricsStyles.suggestionsBoxDescription}>
                            I'm actively adding more songs based on your suggestions! Please submit the songs you would like to see, or vote on the ones that others have submitted.
                        </div>
                        <div className={lyricsStyles.suggestionsBoxButton}>
                            Suggest a Song
                        </div>
                    </div>

                    <div className={lyricsStyles.categories}>
                        <div className={`${lyricsStyles.category} ${lyricsStyles.kpop} ${activeCategory === 'kpop' ? lyricsStyles.active : ''}`} onClick={() => setActiveCategory('kpop')}>K-Pop</div>
                        <div className={`${lyricsStyles.category} ${lyricsStyles.jpop} ${activeCategory === 'jpop' ? lyricsStyles.active : ''}`} onClick={() => setActiveCategory('jpop')}>J-Pop</div>
                        <div className={`${lyricsStyles.category} ${lyricsStyles.anime} ${activeCategory === 'anime' ? lyricsStyles.active : ''}`} onClick={() => setActiveCategory('anime')}>Anime</div>
                    </div>
                    <div className={lyricsStyles.lyricsList}>
                        <div className={lyricsStyles.lyricsSection}>
                            <div className={lyricsStyles.lyricsSectionLetter}>
                                A
                            </div>
                            <div className={lyricsStyles.lyricsSectionContent}>
                                <div className={lyricsStyles.lyricsItem}>
                                    <div className={lyricsStyles.lyricsItemTitle}>
                                        Autumn Leaves
                                    </div>
                                    <div className={lyricsStyles.lyricsItemArtist}>
                                        Autumn Band
                                    
                                    </div>
                                    <div className={lyricsStyles.lyricsItemTitle}>
                                        Autumn Leaves
                                    </div>
                                    <div className={lyricsStyles.lyricsItemArtist}>
                                        Autumn Band
                                    
                                    </div>
                                </div>
                            </div>
                            <div className={lyricsStyles.lyricsSectionLetter}>
                                A
                            </div>
                            <div className={lyricsStyles.lyricsSectionContent}>
                                <div className={lyricsStyles.lyricsItem}>
                                    <div className={lyricsStyles.lyricsItemTitle}>
                                        Autumn Leaves
                                    </div>
                                    <div className={lyricsStyles.lyricsItemArtist}>
                                        Autumn Band
                                    
                                    </div>
                                    <div className={lyricsStyles.lyricsItemTitle}>
                                        Autumn Leaves
                                    </div>
                                    <div className={lyricsStyles.lyricsItemArtist}>
                                        Autumn Band
                                    
                                    </div>
                                </div>
                            </div>
                            <div className={lyricsStyles.lyricsSectionLetter}>
                                A
                            </div>
                            <div className={lyricsStyles.lyricsSectionContent}>
                                <div className={lyricsStyles.lyricsItem}>
                                    <div className={lyricsStyles.lyricsItemTitle}>
                                        Autumn Leaves
                                    </div>
                                    <div className={lyricsStyles.lyricsItemArtist}>
                                        Autumn Band
                                    
                                    </div>
                                    <div className={lyricsStyles.lyricsItemTitle}>
                                        Autumn Leaves
                                    </div>
                                    <div className={lyricsStyles.lyricsItemArtist}>
                                        Autumn Band
                                    
                                    </div>
                                </div>
                            </div>
                            <div className={lyricsStyles.lyricsSectionLetter}>
                                A
                            </div>
                            <div className={lyricsStyles.lyricsSectionContent}>
                                <div className={lyricsStyles.lyricsItem}>
                                    <div className={lyricsStyles.lyricsItemTitle}>
                                        Autumn Leaves
                                    </div>
                                    <div className={lyricsStyles.lyricsItemArtist}>
                                        Autumn Band
                                    
                                    </div>
                                    <div className={lyricsStyles.lyricsItemTitle}>
                                        Autumn Leaves
                                    </div>
                                    <div className={lyricsStyles.lyricsItemArtist}>
                                        Autumn Band
                                    
                                    </div>
                                </div>
                            </div>
                            <div className={lyricsStyles.lyricsSectionLetter}>
                                A
                            </div>
                            <div className={lyricsStyles.lyricsSectionContent}>
                                <div className={lyricsStyles.lyricsItem}>
                                    <div className={lyricsStyles.lyricsItemTitle}>
                                        Autumn Leaves
                                    </div>
                                    <div className={lyricsStyles.lyricsItemArtist}>
                                        Autumn Band
                                    
                                    </div>
                                    <div className={lyricsStyles.lyricsItemTitle}>
                                        Autumn Leaves
                                    </div>
                                    <div className={lyricsStyles.lyricsItemArtist}>
                                        Autumn Band
                                    
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Lyrics;
