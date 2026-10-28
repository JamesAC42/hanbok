import Link from 'next/link';
import { notFound } from 'next/navigation';
import LearnShell from '@/components/learn/LearnShell';
import Example from '@/components/learn/Example';
import TryIt from '@/components/learn/TryIt';
import WordList from '@/components/learn/WordList';
import SignUpCta from '@/components/learn/SignUpCta';
import { sayings, getSaying, sayingHref, CATEGORIES } from '@/content/how-to-say';
import { phraseHref } from '@/content/phrases';
import { JsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';
import own from '@/styles/pages/phrases.module.scss';

export const dynamicParams = false;

export function generateStaticParams() {
    return sayings.map(({ slug }) => ({ slug }));
}

const REGISTER = {
    casual: 'Casual',
    polite: 'Polite',
    formal: 'Formal',
    any: 'Any',
};

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const s = getSaying(slug);
    if (!s) return {};
    const title = `How to Say "${s.english}" in Korean (${s.answer.ko})`;
    const description = `"${s.english}" in Korean is ${s.answer.ko} (${s.answer.roman}). Casual, polite and formal ways to say it, when to use each, and example sentences you can tap to break down.`;
    const url = sayingHref(s);
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { type: 'article', url, title, description, siteName: SITE_NAME },
        twitter: { card: 'summary_large_image', title, description },
    };
}

export default async function SayingPage({ params }) {
    const { slug } = await params;
    const s = getSaying(slug);
    if (!s) notFound();
    const url = `${SITE_URL}${sayingHref(s)}`;
    const category = CATEGORIES.find((c) => c.key === s.category);
    const related = (s.related || []).map(getSaying).filter(Boolean);
    const firstLine = s.examples[0]?.chips.map((word) => word.map((part) => part.t).join('')).join(' ') || '';
    const phraseLinks = s.ways.filter((w) => w.phrase);

    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'How to say it in Korean', item: `${SITE_URL}/how-to-say` },
                { '@type': 'ListItem', position: 2, name: `How to say "${s.english}" in Korean`, item: url },
            ],
        },
        s.faq?.length && {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: s.faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        },
    ].filter(Boolean);

    return (
        <LearnShell>
            <JsonLd data={structuredData} />
            <article className={styles.article}>
                <nav className={styles.crumbs} aria-label="Breadcrumb">
                    <Link href="/how-to-say">How to say it in Korean</Link> <span aria-hidden="true">›</span>{' '}
                    {category && <><Link href={`/how-to-say#${category.key}`}>{category.title}</Link> <span aria-hidden="true">›</span> </>}
                    <span>{s.english}</span>
                </nav>
                <h1 className={styles.title}>How to say &ldquo;{s.english}&rdquo; in Korean</h1>

                <div className={own.card}>
                    <WordList items={[{ ko: s.answer.ko, rom: s.answer.roman, en: s.answer.en }]} />
                </div>

                <div className={styles.prose}>
                    <p className={own.answer}>{s.intro}</p>

                    <h2 id="ways">Ways to say it</h2>
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th>Korean</th><th>Level</th><th>When to use it</th></tr></thead>
                            <tbody>
                                {s.ways.map((w) => (
                                    <tr key={w.ko}>
                                        <td>
                                            <span lang="ko">{w.ko}</span>
                                            <br /><small>{w.roman}</small>
                                        </td>
                                        <td>{REGISTER[w.register] || w.register}</td>
                                        <td>{w.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <h2 id="examples">Examples</h2>
                    <p>Tap a word to see what it means and save it to your flashcards.</p>
                    {s.examples.map((ex) => (
                        <div key={ex.en} className={own.example}>
                            {ex.context && <p className={own.context}>{ex.context}</p>}
                            <Example words={ex.words} translation={ex.en} />
                        </div>
                    ))}
                </div>

                <TryIt
                    lang="ko"
                    run
                    source="how_to_say_top"
                    id="saying-try-top"
                    initial={firstLine}
                    title="See the full breakdown"
                    blurb="Hanbok explains every word and ending in a sentence, with audio and a translation. Try it on this example, or paste your own line from a drama, a song or a text."
                />

                <div className={styles.prose}>
                    <h2 id="tips">Tips</h2>
                    {s.tips.map((para) => <p key={para}>{para}</p>)}
                    {phraseLinks.length > 0 && (
                        <p>
                            More on {phraseLinks.map((w, i) => (
                                <span key={w.ko}>
                                    {i > 0 && (i === phraseLinks.length - 1 ? ' and ' : ', ')}
                                    <Link href={phraseHref(w.phrase)} lang="ko">{w.phrase.ko}</Link>
                                </span>
                            ))}{' '}in our Korean phrase guides.
                        </p>
                    )}
                </div>

                {s.faq?.length > 0 && (
                    <section className={styles.faq}>
                        <h2 className={styles.sectionTitle} id="faq">Questions learners ask</h2>
                        {s.faq.map(({ q, a }) => (
                            <details key={q} className={styles.faqItem}>
                                <summary>{q}</summary>
                                <p>{a}</p>
                            </details>
                        ))}
                    </section>
                )}

                <SignUpCta source="how_to_say" title={`Keep ${s.answer.ko} in your flashcards`} />

                {related.length > 0 && (
                    <section>
                        <h2 className={styles.sectionTitle}>Say more in Korean</h2>
                        <ul className={styles.cards}>
                            {related.map((r) => (
                                <li key={r.slug}>
                                    <Link href={sayingHref(r)} className={styles.card}>
                                        <span className={styles.cardTitle}>{r.english}</span>
                                        <span className={styles.cardDek} lang="ko">{r.answer.ko} ({r.answer.roman})</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </article>
        </LearnShell>
    );
}
