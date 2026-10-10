import Link from 'next/link';
import { notFound } from 'next/navigation';
import LearnShell from '@/components/learn/LearnShell';
import Example from '@/components/learn/Example';
import TryIt from '@/components/learn/TryIt';
import WordList from '@/components/learn/WordList';
import { phrases, getPhrase, phraseHref, CATEGORIES } from '@/content/phrases';
import { apiGet, JsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';
import own from '@/styles/pages/phrases.module.scss';

export const dynamicParams = false;
// Song lines come from the API; refresh them daily as new songs are added.
export const revalidate = 86400;

export function generateStaticParams() {
    return phrases.map(({ slug }) => ({ slug }));
}

const titleFor = (p) => `${p.roman.charAt(0).toUpperCase()}${p.roman.slice(1)} (${p.ko}) Meaning in Korean`;
const REGISTER = {
    casual: 'Casual: friends and people younger than you',
    polite: 'Polite: safe with most people',
    formal: 'Formal: strangers, work, customers',
    any: 'Fine in most situations',
};

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const p = getPhrase(slug);
    if (!p) return {};
    const title = `${titleFor(p)}: What It Means + Examples`;
    const description = `What does ${p.roman} (${p.ko}) mean? ${p.meaning}. When Koreans say it, who you can say it to, and example sentences you can tap to break down.`;
    const url = phraseHref(p);
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { type: 'article', url, title, description, siteName: SITE_NAME },
        twitter: { card: 'summary_large_image', title, description },
    };
}

export default async function PhrasePage({ params }) {
    const { slug } = await params;
    const p = getPhrase(slug);
    if (!p) notFound();
    const url = `${SITE_URL}${phraseHref(p)}`;
    const category = CATEGORIES.find((c) => c.key === p.category);
    const related = (p.related || []).map(getPhrase).filter(Boolean);
    const songs = await apiGet(`/api/lyrics/lines?q=${encodeURIComponent(p.ko)}&limit=4`, { revalidate });
    const lines = songs?.lines || [];

    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'DefinedTerm',
            name: p.ko,
            alternateName: [p.roman, ...(p.aka || [])],
            description: p.meaning,
            url,
            inLanguage: 'ko',
            inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Hanbok Korean phrases', url: `${SITE_URL}/phrases` },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Korean phrases', item: `${SITE_URL}/phrases` },
                { '@type': 'ListItem', position: 2, name: `${p.ko} (${p.roman})`, item: url },
            ],
        },
        p.faq?.length && {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: p.faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        },
    ].filter(Boolean);

    return (
        <LearnShell>
            <JsonLd data={structuredData} />
            <article className={styles.article}>
                <nav className={styles.crumbs} aria-label="Breadcrumb">
                    <Link href="/phrases">Korean phrases</Link> <span aria-hidden="true">›</span>{' '}
                    {category && <><Link href={`/phrases#${category.key}`}>{category.title}</Link> <span aria-hidden="true">›</span> </>}
                    <span lang="ko">{p.ko}</span>
                </nav>
                <h1 className={styles.title}>What does <span lang="ko">{p.ko}</span> ({p.roman}) mean?</h1>

                <div className={own.card}>
                    <WordList items={[{ ko: p.ko, rom: p.roman, en: p.meaning, note: REGISTER[p.register] }]} />
                </div>

                <div className={styles.prose}>
                    <p className={own.answer}>{p.intro}</p>
                    {p.literal && (
                        <>
                            <h2 id="origin">Where it comes from</h2>
                            <p>{p.literal}</p>
                        </>
                    )}

                    <h2 id="how-to-use">How to use <span lang="ko">{p.ko}</span></h2>
                    {p.usage.map((para) => <p key={para}>{para}</p>)}

                    <h2 id="examples">Examples</h2>
                    <p>Tap a word to see what it means and save it to your flashcards.</p>
                    {p.examples.map((ex) => (
                        <div key={ex.en} className={own.example}>
                            {ex.context && <p className={own.context}>{ex.context}</p>}
                            <Example words={ex.words} translation={ex.en} />
                        </div>
                    ))}

                    {p.forms?.length > 0 && (
                        <>
                            <h2 id="forms">Other ways to say it</h2>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead><tr><th>Korean</th><th>Meaning</th><th>When</th></tr></thead>
                                    <tbody>
                                        {p.forms.map((f) => (
                                            <tr key={f.ko}>
                                                <td lang="ko">{f.ko}</td>
                                                <td>{f.en}</td>
                                                <td>{f.note}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {lines.length > 0 && (
                        <>
                            <h2 id="songs">Hear it in songs</h2>
                            <p>Real lines from songs broken down on Hanbok. Open a song to see every line explained.</p>
                            <ul className={own.lines}>
                                {lines.map((line) => (
                                    <li key={`${line.lyricId}-${line.text}`}>
                                        <Link href={`/lyrics/${line.lyricId}`} className={own.line}>
                                            <span className={own.lineKo} lang="ko">{line.text}</span>
                                            <span className={own.lineEn}>{line.translation}</span>
                                            <span className={own.lineSong}>{line.title}{line.artist ? ` · ${line.artist}` : ''}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                {p.faq?.length > 0 && (
                    <section className={styles.faq}>
                        <h2 className={styles.sectionTitle} id="faq">Questions learners ask</h2>
                        {p.faq.map(({ q, a }) => (
                            <details key={q} className={styles.faqItem}>
                                <summary>{q}</summary>
                                <p>{a}</p>
                            </details>
                        ))}
                    </section>
                )}

                {related.length > 0 && (
                    <section>
                        <h2 className={styles.sectionTitle}>Related words</h2>
                        <ul className={styles.cards}>
                            {related.map((r) => (
                                <li key={r.slug}>
                                    <Link href={phraseHref(r)} className={styles.card}>
                                        <span className={styles.cardTitle} lang="ko">{r.ko} <small>{r.roman}</small></span>
                                        <span className={styles.cardDek}>{r.meaning}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <TryIt lang="ko" run source="phrase_page" title={`Heard ${p.ko} in a drama or a song?`} placeholder="Paste the whole line to break it down" />
            </article>
        </LearnShell>
    );
}
