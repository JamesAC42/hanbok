import Link from 'next/link';
import LearnShell from '@/components/learn/LearnShell';
import Tiger from '@/components/Tiger';
import { jaPatterns, jaPatternHref, CATEGORIES, LEVELS } from '@/content/japanese-grammar';
import { JsonLd, SITE_URL } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';
import own from '@/styles/pages/phrases.module.scss';

const TITLE = 'Japanese Grammar List (JLPT N5 to N3): Meanings and Examples';
const DESCRIPTION = 'What てしまう, ながら, かもしれない, は vs が and 100 more Japanese grammar points mean. How to form each one, when to use it, and example sentences with furigana you can tap.';

export const metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/japanese/grammar' },
    openGraph: { url: '/japanese/grammar', title: TITLE, description: DESCRIPTION },
};

export default function JapaneseGrammarIndex() {
    const groups = CATEGORIES.map((c) => ({
        ...c,
        items: jaPatterns
            .filter((p) => p.category === c.key)
            .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level)),
    })).filter((g) => g.items.length);
    return (
        <LearnShell>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: 'Japanese grammar list',
                url: `${SITE_URL}/japanese/grammar`,
                hasPart: jaPatterns.map((p) => ({ '@type': 'WebPage', name: `${p.form} (${p.meaning})`, url: `${SITE_URL}${jaPatternHref(p)}` })),
            }} />
            <header className={styles.hubHeader}>
                <Tiger pose="think" size={110} motion="bob" />
                <div>
                    <p className={styles.label}>Japanese grammar</p>
                    <h1 className={styles.title}>Japanese grammar list</h1>
                    <p className={styles.dek}>
                        {jaPatterns.length} particles, verb forms and patterns from JLPT N5 to N3, each with how to form it,
                        when to use it and example sentences with furigana you can tap. Stuck on a real sentence? Paste it into
                        the <Link href="/japanese-sentence-analyzer">Japanese sentence analyzer</Link>.
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
                                <Link href={jaPatternHref(p)} className={own.tile}>
                                    <span className={own.tileKo} lang="ja">{p.form}</span>
                                    <span className={own.tileEn}>{p.meaning}</span>
                                    <span className={own.tileRom}>{p.roman} · {p.level}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </LearnShell>
    );
}
