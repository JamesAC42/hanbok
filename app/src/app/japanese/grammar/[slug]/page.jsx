import Link from 'next/link';
import { notFound } from 'next/navigation';
import LearnShell from '@/components/learn/LearnShell';
import Example from '@/components/learn/Example';
import TryIt from '@/components/learn/TryIt';
import SignUpCta from '@/components/learn/SignUpCta';
import { jaPatterns, getJaPattern, jaPatternHref, exampleText, CATEGORIES } from '@/content/japanese-grammar';
import { JsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';
import own from '@/styles/pages/phrases.module.scss';

export const dynamicParams = false;

export function generateStaticParams() {
    return jaPatterns.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const g = getJaPattern(slug);
    if (!g) return {};
    // Forms like "敬語 (honorific speech)" already carry a gloss, so skip the romaji there.
    const named = g.form.includes('(') ? g.form : `${g.form} (${g.roman})`;
    const title = `${named} Japanese Grammar: Meaning and Examples`;
    const description = `What ${named} means in Japanese: ${g.meaning}. JLPT ${g.level}. How to form it, when to use it, look-alikes, common mistakes and example sentences with furigana you can tap to break down.`;
    const url = jaPatternHref(g);
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { type: 'article', url, title, description, siteName: SITE_NAME },
        twitter: { card: 'summary_large_image', title, description },
    };
}

export default async function JapaneseGrammarPage({ params }) {
    const { slug } = await params;
    const g = getJaPattern(slug);
    if (!g) notFound();
    const url = `${SITE_URL}${jaPatternHref(g)}`;
    const category = CATEGORIES.find((c) => c.key === g.category);
    const related = (g.related || []).map(getJaPattern).filter(Boolean);
    const firstLine = g.examples[0] ? exampleText(g.examples[0]) : '';

    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Japanese grammar', item: `${SITE_URL}/japanese/grammar` },
                { '@type': 'ListItem', position: 2, name: `${g.form} (${g.meaning})`, item: url },
            ],
        },
        {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `${g.form} Japanese grammar: ${g.meaning}`,
            url,
            inLanguage: 'en',
            about: { '@type': 'Thing', name: `Japanese grammar ${g.form}` },
            educationalLevel: `JLPT ${g.level}`,
            publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        },
        g.faq?.length && {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: g.faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        },
    ].filter(Boolean);

    return (
        <LearnShell>
            <JsonLd data={structuredData} />
            <article className={styles.article}>
                <nav className={styles.crumbs} aria-label="Breadcrumb">
                    <Link href="/japanese/grammar">Japanese grammar</Link> <span aria-hidden="true">›</span>{' '}
                    {category && <><Link href={`/japanese/grammar#${category.key}`}>{category.title}</Link> <span aria-hidden="true">›</span> </>}
                    <span lang="ja">{g.form}</span>
                </nav>
                <h1 className={styles.title}>
                    <span lang="ja">{g.form}</span> in Japanese: {g.meaning}
                </h1>

                <div className={own.formCard}>
                    <p className={own.formKo} lang="ja">{g.form}</p>
                    <p className={own.formRom}>{g.roman}</p>
                    <p className={own.formMeaning}>{g.meaning}</p>
                    <p className={own.formMeta}>JLPT {g.level}{category ? ` · ${category.title}` : ''}</p>
                </div>

                <div className={styles.prose}>
                    <p className={own.answer}>{g.intro}</p>
                </div>

                <TryIt
                    lang="ja"
                    run
                    source="ja_grammar_page_top"
                    id="ja-grammar-try-top"
                    initial={firstLine}
                    title="See the full breakdown"
                    blurb={`Tap Break it down and Hanbok explains every word, particle and verb ending in this sentence, with furigana, audio and a translation. Or paste your own Japanese line from an anime, a song or a text.`}
                />

                <div className={styles.prose}>
                    <h2 id="how-to-form">How to form it</h2>
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th>When</th><th>Add</th><th>Example</th></tr></thead>
                            <tbody>
                                {g.formation.map((r) => (
                                    <tr key={`${r.when}${r.example}`}>
                                        <td>{r.when}</td>
                                        <td lang="ja">{r.rule}</td>
                                        <td lang="ja">{r.example}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <h2 id="how-to-use">How to use it</h2>
                    {g.usage.map((para) => <p key={para}>{para}</p>)}

                    <h2 id="examples">Examples</h2>
                    <p>Tap a word to see what it means and save it to your flashcards.</p>
                    {g.examples.map((ex) => (
                        <div key={ex.en} className={own.example}>
                            {ex.context && <p className={own.context}>{ex.context}</p>}
                            <Example words={ex.words} translation={ex.en} note={ex.romaji} lang="ja" />
                        </div>
                    ))}
                    {g.compare?.length > 0 && (
                        <>
                            <h2 id="compare">Don&rsquo;t mix it up with</h2>
                            {g.compare.map((c) => (
                                <p key={c.form}><strong lang="ja">{c.form}</strong>: {c.note}</p>
                            ))}
                        </>
                    )}
                    {g.mistakes?.length > 0 && (
                        <>
                            <h2 id="mistakes">Common mistakes</h2>
                            {g.mistakes.map((m) => <p key={m}>{m}</p>)}
                        </>
                    )}
                    <p>
                        Have a sentence of your own? The <Link href="/japanese-sentence-analyzer">Japanese sentence analyzer</Link> breaks
                        down any line word by word.
                    </p>
                </div>

                {g.faq?.length > 0 && (
                    <section className={styles.faq}>
                        <h2 className={styles.sectionTitle} id="faq">Questions learners ask</h2>
                        {g.faq.map(({ q, a }) => (
                            <details key={q} className={styles.faqItem}>
                                <summary>{q}</summary>
                                <p>{a}</p>
                            </details>
                        ))}
                    </section>
                )}

                <SignUpCta source="ja_grammar_page" title={`Save ${g.form} and review it later`} />

                {related.length > 0 && (
                    <section>
                        <h2 className={styles.sectionTitle}>Related grammar</h2>
                        <ul className={styles.cards}>
                            {related.map((r) => (
                                <li key={r.slug}>
                                    <Link href={jaPatternHref(r)} className={styles.card}>
                                        <span className={styles.cardTitle} lang="ja">{r.form}</span>
                                        <span className={styles.cardDek}>{r.meaning}</span>
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
