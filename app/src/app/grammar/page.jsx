import Link from 'next/link';
import LearnShell from '@/components/learn/LearnShell';
import Tiger from '@/components/Tiger';
import { patterns, patternHref, CATEGORIES } from '@/content/grammar';
import { JsonLd, SITE_URL } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';
import own from '@/styles/pages/phrases.module.scss';

const TITLE = 'Korean Grammar Patterns: Meanings, Rules and Examples';
const DESCRIPTION = 'What -잖아, -거든요, -는 것 같다, -(으)ㄹ까 봐 and 100 more Korean grammar patterns mean. How to attach each one, when to use it, and examples you can tap.';

export const metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/grammar' },
};

export default function GrammarIndex() {
    const groups = CATEGORIES.map((c) => ({ ...c, items: patterns.filter((p) => p.category === c.key) })).filter((g) => g.items.length);
    return (
        <LearnShell>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: 'Korean grammar patterns',
                url: `${SITE_URL}/grammar`,
                hasPart: patterns.map((p) => ({ '@type': 'WebPage', name: `${p.form} (${p.meaning})`, url: `${SITE_URL}${patternHref(p)}` })),
            }} />
            <header className={styles.hubHeader}>
                <Tiger pose="teach" size={110} motion="bob" />
                <div>
                    <p className={styles.label}>Korean grammar</p>
                    <h1 className={styles.title}>Korean grammar patterns</h1>
                    <p className={styles.dek}>
                        {patterns.length} endings, particles and patterns you hear in dramas and songs, each with how to
                        attach it, when to use it and examples you can tap. New to Korean? Start with the step-by-step{' '}
                        <Link href="/learn">Learn guides</Link>.
                    </p>
                </div>
            </header>
            <nav className={`${styles.chipRow} ${own.jumpNav}`} aria-label="Jump to a topic">
                {groups.map((g) => (
                    <a key={g.key} href={`#${g.key}`} className={`${styles.filterChip} ${own.jump}`}>{g.title} ({g.items.length})</a>
                ))}
            </nav>
            {groups.map((g) => (
                <section key={g.key} id={g.key} className={own.group}>
                    <h2 className={styles.sectionTitle}>{g.title}</h2>
                    <p className={own.groupDek}>{g.dek}</p>
                    <ul className={own.grid}>
                        {g.items.map((p) => (
                            <li key={p.slug}>
                                <Link href={patternHref(p)} className={own.tile}>
                                    <span className={own.tileKo} lang="ko">{p.form}</span>
                                    <span className={own.tileEn}>{p.meaning}</span>
                                    <span className={own.tileRom}>{p.level}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </LearnShell>
    );
}
