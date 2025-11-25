'use client';
import styles from '@/styles/components/pagelayout.module.scss';
import aboutStyles from '@/styles/components/about.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import { LineMdTwitterX } from '@/components/icons/Twitter';
import { LineMdGithub } from '@/components/icons/Github';
import { LineMdEmail } from '@/components/icons/Email';
import { IcTwotoneDiscord } from '@/components/icons/DiscordIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import FlashcardsFeature from '@/components/FlashcardsFeature';
import { useEffect } from 'react';

const About = () => {
    const { t } = useLanguage();

    useEffect(() => {
        document.title = t('about.pageTitle');
    }, [t]);

    const contactLinks = [
        {
            icon: <IcTwotoneDiscord />,
            label: t('about.discord.label'),
            url: 'https://discord.gg/EQVvphzctc',
            text: t('about.discord.text')
        },
        {
            icon: <LineMdTwitterX />,
            label: t('about.twitter.label'),
            url: 'https://x.com/fifltriggi',
            text: t('about.twitter.text')
        },
        {
            icon: <LineMdGithub />,
            label: t('about.github.label'),
            url: 'https://github.com/JamesAC42/hanbok',
            text: t('about.github.text')
        },
        {
            icon: <LineMdEmail />,
            label: t('about.email.label'),
            url: 'mailto:admin@hanbokstudy.com',
            text: t('about.email.text')
        }
    ];
    
    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={aboutStyles.aboutContent}>
                    <h1 className={styles.pageTitle}>{t('about.title')}</h1>
                    <div className={aboutStyles.section}>
                        <h2>{t('about.whatIsHanbok')}</h2>
                        <p>{t('about.description')}</p>
                        <div className={aboutStyles.languageSupport}>
                            <h3>{t('about.supportedLanguages')}</h3>
                            <p>{t('about.languageSupportDescription')}</p>
                            <ul className={aboutStyles.languageList}>
                                <li>Korean (한국어)</li>
                                <li>Chinese (中文)</li>
                                <li>Japanese (日本語)</li>
                                <li>Spanish (Español)</li>
                                <li>Italian (Italiano)</li>
                                <li>French (Français)</li>
                                <li>German (Deutsch)</li>
                                <li>Dutch (Nederlands)</li>
                                <li>Russian (Русский)</li>
                                <li>Turkish (Türkçe)</li>
                            </ul>
                        </div>
                        <div className={aboutStyles.screenshot}>
                            <Image src="/images/screenshots/example_sentence.png" alt={t('about.screenshotAlt')} width={1243} height={869} />
                            <p>{t('about.exampleAnalysis')}</p>
                        </div>
                        <p>{t('about.registeredFeatures')}</p>
                        <div className={aboutStyles.screenshot}>
                            <Image src="/images/screenshots/sentencenotes.png" alt={t('about.screenshotAlt')} width={1193} height={785} />
                            <p>{t('about.culturalNotes')}</p>
                        </div>
                        <p>{t('about.benefitsDescription')}</p>
                        <p>{t('about.saveFeature')}</p>
                    </div>
                    <div className={aboutStyles.section}>
                        <FlashcardsFeature />
                    </div>
                    <section className={aboutStyles.section}>
                        <h2>{t('about.upcomingFeatures')}</h2>
                        <ul className={aboutStyles.featuresList}>
                            {t('about.upcomingFeaturesList').map((feature, index) => (
                                <li key={index}>{feature}</li>
                            ))}
                        </ul>
                    </section>
                    <section className={aboutStyles.section}>
                        <h2>{t('about.updateHistory')}</h2>
                        <div className={aboutStyles.updates}>
                            {t('about.updates').map((update, index) => (
                                <div key={index} className={aboutStyles.updateItem}>
                                    <div className={aboutStyles.updateDate}>
                                        {update.date}
                                    </div>
                                    <div className={aboutStyles.updateContent}>
                                        {update.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className={aboutStyles.section}>
                        <h2>{t('about.contactLinks')}</h2>
                        <div className={aboutStyles.contactLinks}>
                            {contactLinks.map((link, index) => (
                                <Link 
                                    href={link.url} 
                                    key={index}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={aboutStyles.contactLink}
                                >
                                    <div className={aboutStyles.contactIcon}>
                                        {link.icon}
                                    </div>
                                    <span className={aboutStyles.contactLabel}>
                                        {link.label}
                                    </span>
                                    <span className={aboutStyles.contactText}>
                                        {link.text}
                                    </span>
                                </Link>
                            ))}
                        </div>    
                        <div className={aboutStyles.kofi}>
                            <a href='https://ko-fi.com/U7U21B323R' target='_blank'><img height='36' style={{border:"0px", height: "40px"}} src='https://storage.ko-fi.com/cdn/kofi5.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
                        </div>
                    </section>
                </div>
                <div className={aboutStyles.girl}>
                    <Image
                        src="/images/hanbokgirl.png"
                        alt="girl"
                        width={1024}
                        height={1536}
                        priority
                    />
                </div>
            </div>
        </div>
    );
};

export default About;