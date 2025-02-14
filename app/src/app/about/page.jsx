import styles from '@/styles/components/pagelayout.module.scss';
import aboutStyles from '@/styles/components/about.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import { LineMdTwitterX } from '@/components/icons/Twitter';
import { LineMdGithub } from '@/components/icons/Github';
import { LineMdEmail } from '@/components/icons/Email';

const About = () => {
    const updates = [
        {
            date: '2025-02-13',
            content: 'Initial beta release'
        }
    ];

    const upcomingFeatures = [
        'Personalized vocabulary decks with spaced repetition learning',
        'Upload or paste screenshots of text to analyze',
        'Premium features to allow users to save unlimited sentences, words, and generate more audio examples',
        'Interactive grammar exercises based on saved sentences',
        'Community features for sharing and discussing sentences',
    ];

    const contactLinks = [
        {
            icon: <LineMdTwitterX />,
            label: 'Twitter',
            url: 'https://x.com/fifltriggi',
            text: 'Follow development updates'
        },
        {
            icon: <LineMdGithub />,
            label: 'GitHub',
            url: 'https://github.com/JamesAC42/hanbok',
            text: 'View source code'
        },
        {
            icon: <LineMdEmail />,
            label: 'Email',
            url: 'mailto:jamescrovo450@gmail.com',
            text: 'Questions and feedback'
        }
    ];

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={aboutStyles.aboutContent}>
                    <h1 className={styles.pageTitle}>About</h1>
                    
                    <div className={aboutStyles.section}>
                        <h2>What is hanbok?</h2>
                        <p>
                            Hanbok is a comprehensive tool designed to help Korean language learners understand and master Korean sentences. Hanbok breaks down Korean sentences into their component parts, providing detailed analysis of grammar patterns, vocabulary, and usage.
                        </p>

                        <div className={aboutStyles.screenshot}>
                            <Image src="/images/screenshots/sentence.png" alt="screenshot" width={1243} height={869} />
                            <p>
                                Example sentence analysis
                            </p>
                        </div>
                        <p>
                            Registered accounts get access to audio examples from both male and female native speakers, helping you perfect your pronunciation and understand natural speech patterns. We also provide cultural notes to give you context and deeper understanding of Korean language usage.
                        </p>

                        <div className={aboutStyles.screenshot}>
                            <Image src="/images/screenshots/sentencenotes.png" alt="screenshot" width={1193} height={785} />
                            <p>
                                Cultural notes and variants for different contexts
                            </p>
                        </div>
                        <p>
                            Whether you're a beginner or an advanced learner, our tool helps you understand the nuances of Korean grammar, vocabulary, and cultural context all in one place.
                        </p>
                        <p>
                            Save sentences that you find interesting or challenging for later reference. Soon, you'll be able to create personalized study decks from the words and grammar patterns you encounter, enabling efficient learning through spaced repetition techniques.
                        </p>
                    </div>

                    <section className={aboutStyles.section}>
                        <h2>Upcoming Features</h2>
                        <ul className={aboutStyles.featuresList}>
                            {upcomingFeatures.map((feature, index) => (
                                <li key={index}>{feature}</li>
                            ))}
                        </ul>
                    </section>

                    <section className={aboutStyles.section}>
                        <h2>Update History</h2>
                        <div className={aboutStyles.updates}>
                            {updates.map((update, index) => (
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
                        <h2>Contact & Links</h2>
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
                    </section>
                </div>
            </div>
            <div className={styles.girlContainer}>
                <Image
                    src="/images/girl1.png"
                    alt="girl"
                    width={1920}
                    height={1080}
                    priority
                />
            </div>
        </div>
    );
};

export default About;