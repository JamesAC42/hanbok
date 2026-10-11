import Link from 'next/link';
import LearnShell from '@/components/learn/LearnShell';
import Tiger from '@/components/Tiger';
import LearnHub from '@/components/learn/LearnHub';
import { articles, LEVELS, TOPICS } from '@/content/learn';
import { JsonLd, SITE_URL } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';

export const metadata = {
    title: 'Learn Korean with Interactive Guides',
    description: 'Short, clear Korean guides where every example is interactive: tap a word to see what it means, save it to your flashcards, then test yourself.',
    alternates: { canonical: '/learn' },
};

export default function LearnIndex() {
    const list = articles;
    // Plain data for the client hub: no Body components cross the boundary.
    const items = list.map(({ meta }) => ({
        slug: meta.slug,
        language: meta.language,
        title: meta.title,
        shortTitle: meta.shortTitle,
        description: meta.description,
        level: meta.level,
        topic: meta.topic,
        minutes: meta.minutes,
        color: meta.color,
        forms: (meta.grammar || []).map((g) => `${g.form} ${g.label}`).join(' '),
    }));
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
                    <h1 className={styles.title}>Korean you can tap</h1>
                    <p className={styles.dek}>
                        Short guides with Horangi, sorted by topic and level. Every example is a real Hanbok breakdown: tap a word, save it, then check yourself. Tell us where you are and we&rsquo;ll pick what to read next.
                    </p>
                    <p className={styles.dek}>
                        Stuck on a sentence of your own? Paste it into the{' '}
                        <Link href="/korean-sentence-analyzer">free Korean sentence analyzer</Link>, or look up a
                        word from a drama in <Link href="/phrases">Korean phrases</Link>.
                    </p>
                </div>
            </header>
            <LearnHub items={items} topics={TOPICS} levels={LEVELS} />
        </LearnShell>
    );
}
