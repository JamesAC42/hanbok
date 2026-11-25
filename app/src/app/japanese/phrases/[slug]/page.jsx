import Link from 'next/link';
import { notFound } from 'next/navigation';
import LearnShell from '@/components/learn/LearnShell';
import Example from '@/components/learn/Example';
import TryIt from '@/components/learn/TryIt';
import SignUpCta from '@/components/learn/SignUpCta';
import { jaPhrases, getJaPhrase, jaPhraseHref, CATEGORIES } from '@/content/japanese-phrases';
import { exampleText } from '@/content/japanese-grammar';
import { JsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';
import own from '@/styles/pages/phrases.module.scss';

export const dynamicParams = false;

export function generateStaticParams() {
    return jaPhrases.map(({ slug }) => ({ slug }));
}

const REGISTER = {
    casual: 'Casual: friends, family and people younger than you',
    polite: 'Polite: safe with most people',
    formal: 'Formal: customers, strangers, work',
    any: 'Fine in most situations',
    rude: 'Rude: can easily offend, mostly heard in anime and fights',
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const p = getJaPhrase(slug);
    if (!p) return {};
    const title = `${cap(p.roman)} (${p.ja}) Meaning in Japanese: What It Means + Examples`;
    const description = `What does ${p.roman} (${p.ja}) mean in Japanese? ${p.meaning}. When people say it, who you can say it to, and example sentences with furigana you can tap to break down.`;
    const url = jaPhraseHref(p);
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { type: 'article', url, title, description, siteName: SITE_NAME },
        twitter: { card: 'summary_large_image', title, description },
    };
}

export default async function JapanesePhrasePage({ params }) {
    const { slug } = await params;
    const p = getJaPhrase(slug);
    if (!p) notFound();
    const url = `${SITE_URL}${jaPhraseHref(p)}`;
    const category = CATEGORIES.find((c) => c.key === p.category);
    const related = (p.related || []).map(getJaPhrase).filter(Boolean);
    const firstLine = p.examples[0] ? exampleText(p.examples[0]) : '';

    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'DefinedTerm',
            name: p.ja,
            alternateName: [p.kana, p.roman, ...(p.aka || [])].filter((n) => n && n !== p.ja),
            description: p.meaning,
            url,
            inLanguage: 'ja',
            inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Hanbok Japanese words', url: `${SITE_URL}/japanese/phrases` },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Japanese words', item: `${SITE_URL}/japanese/phrases` },
                { '@type': 'ListItem', position: 2, name: `${p.ja} (${p.roman})`, item: url },
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
                    <Link href="/japanese/phrases">Japanese words</Link> <span aria-hidden="true">›</span>{' '}
                    {category && <><Link href={`/japanese/phrases#${category.key}`}>{category.title}</Link> <span aria-hidden="true">›</span> </>}
                    <span lang="ja">{p.ja}</span>
                </nav>
                <h1 className={styles.title}>What does <span lang="ja">{p.ja}</span> ({p.roman}) mean in Japanese?</h1>

                <div className={own.formCard}>
                    <p className={own.formKo} lang="ja">
                        {p.kana !== p.ja ? <ruby>{p.ja}<rt>{p.kana}</rt></ruby> : p.ja}
                    </p>
                    <p className={own.formRom}>{p.roman}</p>
                    <p className={own.formMeaning}>{p.meaning}</p>
                    <p className={own.formMeta}>{REGISTER[p.register]}</p>
                </div>

                <div className={styles.prose}>
                    <p className={own.answer}>{p.intro}</p>
                </div>

                <TryIt
                    lang="ja"
                    run
                    source="ja_phrase_page_top"
                    id="ja-phrase-try-top"
                    initial={firstLine}
                    title="See the full breakdown"
                    blurb="Tap Break it down and Hanbok explains every word and ending in this sentence, with furigana, audio and a translation. Or paste your own line from an anime, a song or a text."
                />

                <div className={styles.prose}>
                    {p.literal && (
                        <>
                            <h2 id="origin">Where it comes from</h2>
                            <p>{p.literal}</p>
                        </>
                    )}

                    <h2 id="how-to-use">How to use <span lang="ja">{p.ja}</span></h2>
                    {p.usage.map((para) => <p key={para}>{para}</p>)}

                    <h2 id="examples">Examples</h2>
                    <p>Tap a word to see what it means and save it to your flashcards.</p>
                    {p.examples.map((ex) => (
                        <div key={ex.en} className={own.example}>
                            {ex.context && <p className={own.context}>{ex.context}</p>}
                            <Example words={ex.words} translation={ex.en} note={ex.romaji} lang="ja" />
                        </div>
                    ))}

                    {p.forms?.length > 0 && (
                        <>
                            <h2 id="forms">Other ways to say it</h2>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead><tr><th>Japanese</th><th>Meaning</th><th>When</th></tr></thead>
                                    <tbody>
                                        {p.forms.map((f) => (
                                            <tr key={f.ja}>
                                                <td lang="ja">{f.ja}</td>
                                                <td>{f.en}</td>
                                                <td>{f.note}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                    <p>
                        Learning the grammar too? The <Link href="/japanese/grammar">Japanese grammar list</Link> explains
                        particles, verb forms and patterns from JLPT N5 to N3.
                    </p>
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

                <SignUpCta source="ja_phrase_page" title={`Remember ${p.ja} next time you hear it`} />

                {related.length > 0 && (
                    <section>
                        <h2 className={styles.sectionTitle}>Related words</h2>
                        <ul className={styles.cards}>
                            {related.map((r) => (
                                <li key={r.slug}>
                                    <Link href={jaPhraseHref(r)} className={styles.card}>
                                        <span className={styles.cardTitle} lang="ja">{r.ja} <small>{r.roman}</small></span>
                                        <span className={styles.cardDek}>{r.meaning}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <TryIt lang="ja" run source="ja_phrase_page" id="ja-phrase-try-bottom" title={`Heard ${p.ja} in an anime or a song?`} placeholder="Paste the whole line to break it down" />
            </article>
        </LearnShell>
    );
}
