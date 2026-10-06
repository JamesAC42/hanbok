import Link from 'next/link';
import LearnShell from '@/components/learn/LearnShell';
import Tiger from '@/components/Tiger';
import { articles } from '@/content/learn';
import { JsonLd, SITE_URL } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';

export const metadata = {
    title: 'Learn Korean Grammar with Real Examples',
    description: 'Short, clear Korean grammar guides where every example is interactive: tap a word to see what it means, save it to your flashcards, then test yourself.',
    alternates: { canonical: '/learn' },
};

export default function LearnIndex() {
    const list = [...articles].sort((a, b) => b.meta.published.localeCompare(a.meta.published));
    return (
        <LearnShell>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: 'Hanbok Learn',
                url: `${SITE_URL}/learn`,
                hasPart: list.map(({ meta }) => ({ '@type': 'Article', headline: meta.title, url: `${SITE_URL}/learn/${meta.slug}` })),
            }} />
            <header className={styles.hubHeader}>
                <Tiger pose="wave" size={110} motion="bob" />
                <div>
                    <p className={styles.label}>Hanbok Learn</p>
                    <h1 className={styles.title}>Grammar you can tap</h1>
                    <p className={styles.dek}>
                        Short guides with Horangi. Every example is a real Hanbok breakdown: tap a word, save it, then check yourself.
                    </p>
                </div>
            </header>
            <ul className={styles.cards}>
                {list.map(({ meta }) => (
                    <li key={meta.slug}>
                        <Link href={`/learn/${meta.slug}`} className={`${styles.card} ${styles[`tone_${meta.color}`] || ''}`}>
                            <span className={styles.cardTitle} lang={meta.language}>{meta.shortTitle}</span>
                            <span className={styles.cardDek}>{meta.description}</span>
                            <span className={styles.cardMeta}>{meta.level} · {meta.minutes} min</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </LearnShell>
    );
}
