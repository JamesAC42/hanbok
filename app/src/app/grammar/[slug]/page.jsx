import Link from 'next/link';
import { notFound } from 'next/navigation';
import LearnShell from '@/components/learn/LearnShell';
import Example from '@/components/learn/Example';
import TryIt from '@/components/learn/TryIt';
import SignUpCta from '@/components/learn/SignUpCta';
import { patterns, getPattern, patternHref, CATEGORIES } from '@/content/grammar';
import { JsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';
import own from '@/styles/pages/phrases.module.scss';

export const dynamicParams = false;

export function generateStaticParams() {
    return patterns.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const g = getPattern(slug);
    if (!g) return {};
    const title = `${g.form} Korean Grammar: "${g.meaning}" with Examples`;
    const description = `What ${g.form} (${g.roman}) means in Korean: "${g.meaning}". How to attach it, when to use it, how it differs from similar forms, and example sentences you can tap to break down.`;
    const url = patternHref(g);
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { type: 'article', url, title, description, siteName: SITE_NAME },
        twitter: { card: 'summary_large_image', title, description },
    };
}

export default async function GrammarPatternPage({ params }) {
    const { slug } = await params;
    const g = getPattern(slug);
    if (!g) notFound();
    const url = `${SITE_URL}${patternHref(g)}`;
    const category = CATEGORIES.find((c) => c.key === g.category);
    const related = (g.related || []).map(getPattern).filter(Boolean);
    const firstLine = g.examples[0]?.chips.map((word) => word.map((part) => part.t).join('')).join(' ') || '';

    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Korean grammar', item: `${SITE_URL}/grammar` },
                { '@type': 'ListItem', position: 2, name: `${g.form} (${g.meaning})`, item: url },
            ],
        },
        {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: `${g.form} Korean grammar: ${g.meaning}`,
            url,
            inLanguage: 'en',
            about: { '@type': 'Thing', name: `Korean grammar ${g.form}` },
            educationalLevel: g.level,
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
                    <Link href="/grammar">Korean grammar</Link> <span aria-hidden="true">›</span>{' '}
                    {category && <><Link href={`/grammar#${category.key}`}>{category.title}</Link> <span aria-hidden="true">›</span> </>}
                    <span lang="ko">{g.form}</span>
                </nav>
                <h1 className={styles.title}>
                    <span lang="ko">{g.form}</span> in Korean: &ldquo;{g.meaning}&rdquo;
                </h1>

                <div className={own.formCard}>
                    <p className={own.formKo} lang="ko">{g.form}</p>
                    <p className={own.formRom}>{g.roman}</p>
                    <p className={own.formMeaning}>{g.meaning}</p>
                    <p className={own.formMeta}>{g.level}{category ? ` · ${category.title}` : ''}</p>
                </div>

                <div className={styles.prose}>
                    <p className={own.answer}>{g.intro}</p>

                    <h2 id="how-to-form">How to form it</h2>
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th>When</th><th>Add</th><th>Example</th></tr></thead>
                            <tbody>
                                {g.formation.map((r) => (
                                    <tr key={`${r.when}${r.example}`}>
                                        <td>{r.when}</td>
                                        <td lang="ko">{r.rule}</td>
                                        <td lang="ko">{r.example}</td>
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
                            <Example words={ex.words} translation={ex.en} />
                        </div>
                    ))}
                </div>

                <TryIt
                    lang="ko"
                    run
                    source="grammar_page_top"
                    id="grammar-try-top"
                    initial={firstLine}
                    title="See the full breakdown"
                    blurb={`Hanbok explains every word and ending in a sentence, with audio and a translation. Try it on this example, or paste a line with ${g.form} from a drama, a song or a text.`}
                />

                <div className={styles.prose}>
                    {g.compare?.length > 0 && (
                        <>
                            <h2 id="compare">Don&rsquo;t mix it up with</h2>
                            {g.compare.map((c) => (
                                <p key={c.form}><strong lang="ko">{c.form}</strong>: {c.note}</p>
                            ))}
                        </>
                    )}
                    {g.mistakes?.length > 0 && (
                        <>
                            <h2 id="mistakes">Common mistakes</h2>
                            {g.mistakes.map((m) => <p key={m}>{m}</p>)}
                        </>
                    )}
                    {g.guide && (
                        <p>
                            Want the basics first? Read{' '}
                            <Link href={`/learn/${g.guide.meta.slug}`}>{g.guide.meta.shortTitle || g.guide.meta.title}</Link>.
                        </p>
                    )}
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

                <SignUpCta source="grammar_page" title={`Save ${g.form} and review it later`} />

                {related.length > 0 && (
                    <section>
                        <h2 className={styles.sectionTitle}>Related grammar</h2>
                        <ul className={styles.cards}>
                            {related.map((r) => (
                                <li key={r.slug}>
                                    <Link href={patternHref(r)} className={styles.card}>
                                        <span className={styles.cardTitle} lang="ko">{r.form}</span>
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
