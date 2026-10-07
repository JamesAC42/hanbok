'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ContentPage from '@/components/ContentPage';
import Dashboard from '@/components/Dashboard';
import Mascot from '@/components/Mascot';
import styles from '@/styles/pages/partners.module.scss';

const BlankShell = () => <div style={{ minHeight: '100dvh', background: 'var(--background)' }} />;

const CONTACT = 'admin@hanbokstudy.com';
const APPLY_SUBJECT = encodeURIComponent('Hanbok partner program');
const APPLY_BODY = encodeURIComponent('Hi! I\'d like to join the Hanbok partner program.\n\nMy channel(s):\nAudience size:\nWhat I teach or post about:\nCode I\'d like (e.g. my handle):\n');

const STEPS = [
    { title: 'Get your link', text: 'We give you a link like hanbokstudy.com/?ref=yourname and a private page with your numbers.' },
    { title: 'Share it your way', text: 'Put it in your bio, video descriptions or a lesson. Show a real breakdown of a line your audience cares about.' },
    { title: 'Earn 30% for 12 months', text: 'Anyone who signs up through your link and subscribes earns you 30% of what they pay in their first 12 months, monthly or yearly.' },
];

const FAQ = [
    { q: 'Who can join?', a: 'Anyone who makes content about learning Korean, Japanese or Chinese, K-dramas, K-pop or anime: TikTok, YouTube, Instagram, blogs, newsletters, Discord servers or classrooms. Small audiences are welcome.' },
    { q: 'How do I get paid?', a: 'Once a month by PayPal or Wise once you are owed $20 or more. Your stats page shows what you have earned and what has been paid.' },
    { q: 'How long does a referral count?', a: 'Your link is remembered in the visitor\'s browser, so they can sign up days later. The first creator link someone used is the one that counts.' },
    { q: 'Anything I shouldn\'t do?', a: 'No paid search ads on the Hanbok name, no fake reviews or misleading claims, and say that it\'s an affiliate link where your platform requires it.' },
];

export default function Partners() {
    const { user, loading } = useAuth();
    const Shell = loading ? BlankShell : (user ? Dashboard : ContentPage);

    return (
        <Shell>
            <div className={styles.page}>
                <header className={styles.hero}>
                    <Mascot pose="celebrate" size={120} motion="bob" />
                    <div>
                        <p className={styles.label}>Partner program</p>
                        <h1 className={styles.title}>Share Hanbok, earn 30% for a year</h1>
                        <p className={styles.lead}>
                            Hanbok breaks any Korean, Japanese or Chinese sentence down word by word. If your audience is learning,
                            share it with them and earn 30% of every payment they make for their first 12 months.
                        </p>
                        <a className={styles.cta} href={`mailto:${CONTACT}?subject=${APPLY_SUBJECT}&body=${APPLY_BODY}`}>Apply by email</a>
                    </div>
                </header>

                <ol className={styles.steps}>
                    {STEPS.map((step, i) => (
                        <li key={step.title} className={styles.step}>
                            <span className={styles.stepNumber}>{i + 1}</span>
                            <h2>{step.title}</h2>
                            <p>{step.text}</p>
                        </li>
                    ))}
                </ol>

                <section className={styles.example}>
                    <h2>What it can add up to</h2>
                    <p>
                        20 followers on Plus yearly ($99) earn you about <strong>$594</strong>. 50 on Basic monthly ($4) earn
                        about <strong>$720</strong> over their first year.
                    </p>
                </section>

                <section className={styles.faq}>
                    {FAQ.map((item) => (
                        <div key={item.q} className={styles.faqItem}>
                            <h3>{item.q}</h3>
                            <p>{item.a}</p>
                        </div>
                    ))}
                </section>

                <p className={styles.footnote}>
                    Questions? Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a> or see <Link href="/pricing">our prices</Link>.
                </p>
            </div>
        </Shell>
    );
}
