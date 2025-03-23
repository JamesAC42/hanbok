'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import styles from '@/styles/components/flashcardsfeature.module.scss';

const FlashcardsFeature = () => {
    const { t } = useLanguage();

    return (
        <div className={styles.flashcardsFeature}>
            <h2 className={styles.sectionTitle}>{t('flashcardsFeature.title')}</h2>
            <p className={styles.description}>{t('flashcardsFeature.description')}</p>
            
            <div className={styles.featureGridContainer}>
                <div className={styles.featureItem}>
                    <div className={styles.screenshotContainer}>
                        <Image 
                            src="/images/screenshots/flashcards/flashcardsaddwords.png" 
                            alt={t('flashcardsFeature.addWordsAlt')} 
                            width={800} 
                            height={450} 
                            className={styles.screenshot}
                        />
                    </div>
                    <div className={styles.featureDescription}>
                        <h3 className={styles.featureTitle}>{t('flashcardsFeature.addWords.title')}</h3>
                        <p>{t('flashcardsFeature.addWords.description')}</p>
                    </div>
                </div>

                <div className={styles.featureItem}>
                    <div className={styles.screenshotContainer}>
                        <Image 
                            src="/images/screenshots/flashcards/flashcardsmain.png" 
                            alt={t('flashcardsFeature.mainAlt')} 
                            width={800} 
                            height={450} 
                            className={styles.screenshot}
                        />
                    </div>
                    <div className={styles.featureDescription}>
                        <h3 className={styles.featureTitle}>{t('flashcardsFeature.main.title')}</h3>
                        <p>{t('flashcardsFeature.main.description')}</p>
                    </div>
                </div>

                <div className={styles.featureItem}>
                    <div className={styles.screenshotContainer}>
                        <Image 
                            src="/images/screenshots/flashcards/flashcardsstats.png" 
                            alt={t('flashcardsFeature.statsAlt')} 
                            width={800} 
                            height={450} 
                            className={styles.screenshot}
                        />
                    </div>
                    <div className={styles.featureDescription}>
                        <h3 className={styles.featureTitle}>{t('flashcardsFeature.stats.title')}</h3>
                        <p>{t('flashcardsFeature.stats.description')}</p>
                    </div>
                </div>

                <div className={styles.featureItem}>
                    <div className={styles.screenshotContainer}>
                        <Image 
                            src="/images/screenshots/flashcards/flashcardsstudy.png" 
                            alt={t('flashcardsFeature.studyAlt')} 
                            width={800} 
                            height={450} 
                            className={styles.screenshot}
                        />
                    </div>
                    <div className={styles.featureDescription}>
                        <h3 className={styles.featureTitle}>{t('flashcardsFeature.study.title')}</h3>
                        <p>{t('flashcardsFeature.study.description')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlashcardsFeature; 