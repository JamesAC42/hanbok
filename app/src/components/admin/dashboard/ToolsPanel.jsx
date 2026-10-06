'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/components/admin/dashboard.module.scss';
import { fmt } from './format';

const TOOLS = [
    { href: '/admin/wordaudioedit', title: 'Word audio', text: 'Find a word and regenerate its pronunciation.', color: 'var(--bp-und)' },
    { href: '/lyrics/admin', title: 'Lyrics library', text: 'Add songs, edit lyrics, publish or hide them.', color: 'var(--bp-pink)' },
    { href: '/lyrics/suggestions', title: 'Lyric requests', text: 'Songs learners asked for, sorted by votes.', color: 'var(--bp-pink)' },
    { href: '/feedback', title: 'Feedback board', text: 'Read and reply to what learners post.', color: 'var(--bp-freeze)' },
];

const LINKS = [
    { href: 'https://dashboard.stripe.com', title: 'Stripe dashboard', text: 'Payments, refunds and subscriptions.' },
    { href: 'https://umami.fukuin.dev', title: 'Umami', text: 'Page views and visitors.' },
];

export default function ToolsPanel() {
    const [exporting, setExporting] = useState(false);
    const [exportNote, setExportNote] = useState(null);

    const exportEmails = async () => {
        setExporting(true);
        setExportNote(null);
        try {
            const response = await fetch('/api/admin/email-list');
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || 'Export failed');
            window.open('/api/admin/email-list?format=text', '_blank');
            setExportNote(`Downloading ${fmt(data.count)} addresses.`);
        } catch (error) {
            setExportNote(error.message);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className={styles.panel}>
            <div className={styles.toolGrid}>
                {TOOLS.map((tool) => (
                    <Link key={tool.href} href={tool.href} className={styles.toolCard} style={{ '--accent': tool.color }}>
                        <strong>{tool.title}</strong>
                        <span>{tool.text}</span>
                        <em aria-hidden="true">Open →</em>
                    </Link>
                ))}
                <div className={styles.toolCard} style={{ '--accent': 'var(--bp-keep)' }}>
                    <strong>Email list</strong>
                    <span>Every learner&apos;s name and email as a CSV file.</span>
                    <button type="button" className={styles.pressButton} onClick={exportEmails} disabled={exporting}>
                        {exporting ? 'Preparing…' : 'Download CSV'}
                    </button>
                    {exportNote && <span className={styles.muted} role="status">{exportNote}</span>}
                </div>
            </div>

            <section className={styles.card}>
                <header className={styles.cardHead}><div><h2>Elsewhere</h2></div></header>
                <ul className={styles.plainList}>
                    {LINKS.map((link) => (
                        <li key={link.href}>
                            <a href={link.href} target="_blank" rel="noreferrer"><strong>{link.title} ↗</strong></a>
                            <span className={styles.muted}>{link.text}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
