import Link from 'next/link';
import LearnShell from '@/components/learn/LearnShell';
import Tiger from '@/components/Tiger';
import { jaPhrases, jaPhraseHref, CATEGORIES } from '@/content/japanese-phrases';
import { JsonLd, SITE_URL } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';
import own from '@/styles/pages/phrases.module.scss';

const TITLE = 'Japanese Words from Anime and Everyday Life, Explained';
const DESCRIPTION = 'What do senpai, daijoubu, yabai and ara ara mean? Plain-English meanings of the Japanese words you hear in anime, songs and real life, with when to use them and examples with furigana you can tap.';

export const metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/japanese/phrases' },
    openGraph: { url: '/japanese/phrases', title: TITLE, description: DESCRIPTION },
};

export default function JapanesePhrasesIndex() {
    const groups = CATEGORIES.map((c) => ({ ...c, items: jaPhrases.filter((p) => p.category === c.key) })).filter((g) => g.items.length);
    return (
        <LearnShell>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'DefinedTermSet',
                name: 'Hanbok Japanese words',
                url: `${SITE_URL}/japanese/phrases`,
                hasDefinedTerm: jaPhrases.map((p) => ({ '@type': 'DefinedTerm', name: p.ja, alternateName: p.roman, description: p.meaning, url: `${SITE_URL}${jaPhraseHref(p)}` })),
            }} />
            <header className={styles.hubHeader}>
                <Tiger pose="wave" size={110} motion="bob" />
                <div>
                    <p className={styles.label}>Japanese words</p>
                    <h1 className={styles.title}>What does that Japanese word mean?</h1>
                    <p className={styles.dek}>
                        The {jaPhrases.length} words you keep hearing in anime, songs and everyday Japanese, explained in plain
                        English with real examples. For grammar, see the <Link href="/japanese/grammar">Japanese grammar list</Link>.
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
                                <Link href={jaPhraseHref(p)} className={own.tile}>
                                    <span className={own.tileKo} lang="ja">{p.ja}</span>
                                    <span className={own.tileRom}>{p.roman}</span>
                                    <span className={own.tileEn}>{p.meaning}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </LearnShell>
    );
}
