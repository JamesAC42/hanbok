import Link from 'next/link';
import LearnShell from '@/components/learn/LearnShell';
import Tiger from '@/components/Tiger';
import { sayings, sayingHref, CATEGORIES } from '@/content/how-to-say';
import { JsonLd, SITE_URL } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';
import own from '@/styles/pages/phrases.module.scss';

const TITLE = 'How to Say It in Korean: Everyday Phrases, Casual to Formal';
const DESCRIPTION = 'How to say hello, thank you, I love you, I miss you and more in Korean. The casual, polite and formal versions, when to use each, and examples you can tap.';

export const metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/how-to-say' },
};

export default function HowToSayIndex() {
    const groups = CATEGORIES.map((c) => ({ ...c, items: sayings.filter((s) => s.category === c.key) })).filter((g) => g.items.length);
    return (
        <LearnShell>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                name: 'How to say it in Korean',
                url: `${SITE_URL}/how-to-say`,
                hasPart: sayings.map((s) => ({ '@type': 'WebPage', name: `How to say "${s.english}" in Korean`, url: `${SITE_URL}${sayingHref(s)}` })),
            }} />
            <header className={styles.hubHeader}>
                <Tiger pose="wave" size={110} motion="bob" />
                <div>
                    <p className={styles.label}>How to say it in Korean</p>
                    <h1 className={styles.title}>How do you say that in Korean?</h1>
                    <p className={styles.dek}>
                        {sayings.length} everyday things to say, each with the casual, polite and formal version and
                        examples you can tap. Wondering what a word you heard means instead? Try{' '}
                        <Link href="/phrases">Korean phrases</Link>.
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
                        {g.items.map((s) => (
                            <li key={s.slug}>
                                <Link href={sayingHref(s)} className={own.tile}>
                                    <span className={own.tileSay}>{s.english}</span>
                                    <span className={own.tileKo} lang="ko">{s.answer.ko}</span>
                                    <span className={own.tileRom}>{s.answer.roman}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </LearnShell>
    );
}
