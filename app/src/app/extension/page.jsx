'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ContentPage from '@/components/ContentPage';
import Dashboard from '@/components/Dashboard';
import Mascot from '@/components/Mascot';
import Footer from '@/components/Footer';
import { CHROME_EXTENSION_URL, useExtensionInstalled } from '@/lib/extension';
import styles from '@/styles/pages/extension.module.scss';

// Signed-in readers get the app shell; visitors keep the public site header.
const BlankShell = () => <div style={{ minHeight: '100dvh', background: 'var(--background)' }} />;

const ICONS = {
    select: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 3l14 7.2-6 1.8 3.8 6.6-2.6 1.5-3.8-6.6L6 18z"/></svg>,
    save: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"/><path d="M12 7v6M9 10h6" stroke="#3A2600" strokeWidth="2.2" strokeLinecap="round"/></svg>,
    highlight: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.5 3.5l5 5-9 9H6.5v-5z"/><rect x="3" y="19" width="18" height="2.6" rx="1.3" fill="currentColor"/></svg>,
};

const InstallButton = ({ big = false }) => (
    CHROME_EXTENSION_URL ? (
        <a
            href={CHROME_EXTENSION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.installButton} ${big ? styles.installBig : ''}`}
        >
            Add to Chrome, it&apos;s free
        </a>
    ) : (
        <button type="button" className={`${styles.installButton} ${big ? styles.installBig : ''}`} disabled>
            Coming soon to Chrome
        </button>
    )
);

const FEATURES = [
    {
        key: 'read',
        icon: ICONS.select,
        title: 'Select to analyze',
        text: 'Highlight a sentence on any page and click "Analyze with Hanbok", or right-click it. You get the translation, every word with its meaning, the grammar, and audio you can listen to.',
    },
    {
        key: 'keep',
        icon: ICONS.save,
        title: 'Save words in one click',
        text: 'See a word you want to remember? One click adds it to your Hanbok deck, ready for your next review.',
    },
    {
        key: 'und',
        icon: ICONS.highlight,
        title: 'See your words everywhere',
        text: 'Words you have saved light up in gold on every page you read. Click one to see its meaning, hear it, and find related words.',
        demo: true,
    },
];

const STEPS = [
    { title: 'Add it to Chrome', text: 'Click the button above, then "Add to Chrome" in the Chrome Web Store.' },
    { title: 'Sign in to Hanbok', text: 'Click the Hanbok icon in your toolbar and sign in with your usual account.' },
    { title: 'Select a sentence', text: 'Go to any page in the language you are learning, select a sentence, and click "Analyze with Hanbok".' },
];

const FAQ = [
    {
        q: 'Is it free?',
        a: <>Yes. The extension is free to install. It uses your normal Hanbok account, so breakdowns use the same limits as your plan on the website.</>,
    },
    {
        q: 'Which browsers does it work in?',
        a: <>Google Chrome and other Chromium browsers on a computer, such as Microsoft Edge and Brave. It does not work on phones or tablets.</>,
    },
    {
        q: 'What does it send to Hanbok?',
        a: <>Only the text you choose to analyze. It does not read or send the rest of the pages you visit. See our <a href="/privacy-policy.html">privacy policy</a> for details.</>,
    },
    {
        q: 'Which languages does it support?',
        a: <>All of them. It works with every language you can study on Hanbok.</>,
    },
];

const ExtensionPage = () => {
    const { user, loading: authLoading } = useAuth();
    const installed = useExtensionInstalled();
    const isPublic = !authLoading && !user;
    const Shell = authLoading ? BlankShell : (user ? Dashboard : ContentPage);

    return (
        <Shell>
            <div className={`${styles.page} ${isPublic ? styles.publicPage : ''}`}>
                <div className={styles.content}>
                    <section className={styles.hero}>
                        <Mascot pose="wave" size={150} motion="bob" className={styles.heroMascot} />
                        <div className={styles.heroText}>
                            <span className={styles.eyebrow}>Hanbok for Chrome</span>
                            <h1>Learn from anything you read online</h1>
                            <p>
                                Select a sentence on any website to see what every word means.
                                Save new words to your deck without leaving the page.
                            </p>
                            <div className={styles.heroActions}>
                                <InstallButton big />
                                {installed ? (
                                    <span className={styles.installedNote}>
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        Already installed in this browser
                                    </span>
                                ) : (
                                    <span className={styles.heroSmall}>For Chrome, Edge and Brave on a computer</span>
                                )}
                            </div>
                        </div>
                    </section>

                    <section aria-labelledby="features-heading">
                        <h2 id="features-heading" className={styles.sectionTitle}>What it does</h2>
                        <div className={styles.features}>
                            {FEATURES.map(f => (
                                <article key={f.key} className={`${styles.feature} ${styles[`feature_${f.key}`]}`}>
                                    <span className={styles.featureIcon}>{f.icon}</span>
                                    <h3>{f.title}</h3>
                                    <p>{f.text}</p>
                                    {f.key === 'read' && (
                                        <div className={styles.demoBox} aria-hidden="true">
                                            <span className={styles.demoSelected}>오늘 날씨가 정말 좋네요.</span>
                                            <span className={styles.demoChip}>Analyze with Hanbok</span>
                                        </div>
                                    )}
                                    {f.key === 'keep' && (
                                        <div className={styles.demoBox} aria-hidden="true">
                                            <span className={styles.demoWord}><b lang="ko">날씨</b> weather</span>
                                            <span className={styles.demoSave}>+ Save</span>
                                        </div>
                                    )}
                                    {f.demo && (
                                        <div className={styles.demoBox} aria-hidden="true">
                                            <span className={styles.demoSentence} lang="ko">
                                                주말에 <mark className={styles.savedWord}>날씨</mark>가 따뜻해요.
                                            </span>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className={styles.card} aria-labelledby="steps-heading">
                        <h2 id="steps-heading" className={styles.sectionTitle}>How to start</h2>
                        <ol className={styles.steps}>
                            {STEPS.map((s, i) => (
                                <li key={s.title}>
                                    <span className={styles.stepNumber}>{i + 1}</span>
                                    <div>
                                        <strong>{s.title}</strong>
                                        <span>{s.text}</span>
                                    </div>
                                </li>
                            ))}
                        </ol>
                        {!user && !authLoading && (
                            <p className={styles.stepsNote}>
                                No Hanbok account yet? <Link href="/login">Create one for free</Link>.
                            </p>
                        )}
                    </section>

                    <section className={styles.card} aria-labelledby="faq-heading">
                        <h2 id="faq-heading" className={styles.sectionTitle}>Questions</h2>
                        <dl className={styles.faq}>
                            {FAQ.map(item => (
                                <div key={item.q} className={styles.faqItem}>
                                    <dt>{item.q}</dt>
                                    <dd>{item.a}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section className={styles.closing}>
                        <Mascot pose="celebrate" size={90} />
                        <div>
                            <h2>Ready to read?</h2>
                            <p>Add Hanbok to your browser and start learning from the pages you already visit.</p>
                        </div>
                        <InstallButton />
                    </section>
                </div>
            </div>
            {isPublic && <Footer />}
        </Shell>
    );
};

export default ExtensionPage;
