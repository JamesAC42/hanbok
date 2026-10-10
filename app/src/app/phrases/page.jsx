import Link from 'next/link';
import LearnShell from '@/components/learn/LearnShell';
import Tiger from '@/components/Tiger';
import { phrases, phraseHref, CATEGORIES } from '@/content/phrases';
import { JsonLd, SITE_URL } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';
import own from '@/styles/pages/phrases.module.scss';

const TITLE = 'Korean Phrases and Slang from K-Dramas and K-Pop, Explained';
const DESCRIPTION = 'What do aigoo, daebak, oppa and eojjeol TV mean? Plain-English meanings of the Korean words you hear in dramas and songs, with when to use them and examples you can tap.';

export const metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/phrases' },
};

export default function PhrasesIndex() {
    const groups = CATEGORIES.map((c) => ({ ...c, items: phrases.filter((p) => p.category === c.key) })).filter((g) => g.items.length);
    return (
        <LearnShell>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'DefinedTermSet',
                name: 'Hanbok Korean phrases',
                url: `${SITE_URL}/phrases`,
                hasDefinedTerm: phrases.map((p) => ({ '@type': 'DefinedTerm', name: p.ko, alternateName: p.roman, description: p.meaning, url: `${SITE_URL}${phraseHref(p)}` })),
            }} />
            <header className={styles.hubHeader}>
                <Tiger pose="wave" size={110} motion="bob" />
                <div>
                    <p className={styles.label}>Korean phrases</p>
                    <h1 className={styles.title}>What does that Korean word mean?</h1>
                    <p className={styles.dek}>
                        The words you keep hearing in dramas and songs, explained in plain English with real examples.
                    </p>
                </div>
            </header>
            {groups.map((g) => (
                <section key={g.key} id={g.key} className={own.group}>
                    <h2 className={styles.sectionTitle}>{g.title}</h2>
                    <p className={own.groupDek}>{g.dek}</p>
                    <ul className={own.grid}>
                        {g.items.map((p) => (
                            <li key={p.slug}>
                                <Link href={phraseHref(p)} className={own.tile}>
                                    <span className={own.tileKo} lang="ko">{p.ko}</span>
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
