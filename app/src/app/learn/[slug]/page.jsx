import Link from 'next/link';
import { notFound } from 'next/navigation';
import LearnShell from '@/components/learn/LearnShell';
import Quiz from '@/components/learn/Quiz';
import MarkRead from '@/components/learn/MarkRead';
import SignUpCta from '@/components/learn/SignUpCta';
import ArticleToc from '@/components/learn/ArticleToc';
import Mascot from '@/components/Mascot';
import { articles, getArticle, TOPICS } from '@/content/learn';
import { JsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';

export const dynamicParams = false;

// Sections after the body that "On this page" also lists.
const TOC_EXTRA = [{ id: 'quiz', text: 'Check yourself' }, { id: 'faq', text: 'Questions learners ask' }];

export function generateStaticParams() {
    return articles.map(({ meta }) => ({ slug: meta.slug }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const article = getArticle(slug);
    if (!article) return {};
    const { meta } = article;
    const url = `/learn/${meta.slug}`;
    return {
        title: meta.title,
        description: meta.description,
        alternates: { canonical: url },
        openGraph: { type: 'article', url, title: meta.title, description: meta.description, siteName: SITE_NAME, publishedTime: meta.published },
        twitter: { card: 'summary_large_image', title: meta.title, description: meta.description },
    };
}

const formatDate = (iso) => (iso
    ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : null);

export default async function LearnArticle({ params }) {
    const { slug } = await params;
    const article = getArticle(slug);
    if (!article) notFound();
    const { meta, Body, quiz, faq } = article;
    const url = `${SITE_URL}/learn/${meta.slug}`;
    const at = articles.findIndex((a) => a.meta.slug === meta.slug);
    const more = [1, 2, 3].map((i) => articles[(at + i) % articles.length]).filter((a) => a.meta.slug !== meta.slug);
    const topic = TOPICS.find((t) => t.key === meta.topic);

    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: meta.title,
            description: meta.description,
            url,
            datePublished: meta.published,
            dateModified: meta.updated || meta.published,
            inLanguage: 'en',
            author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
            publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: { '@type': 'ImageObject', url: `${SITE_URL}/hanbokicon-512x512.png` } },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Learn', item: `${SITE_URL}/learn` },
                { '@type': 'ListItem', position: 2, name: meta.shortTitle, item: url },
            ],
        },
        faq?.length && {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        },
    ].filter(Boolean);

    return (
        <LearnShell>
            <JsonLd data={structuredData} />
            <article className={styles.guide}>
                <header className={styles.guideHead}>
                    <nav className={styles.crumbs} aria-label="Breadcrumb">
                        <Link href="/learn">Learn</Link> <span aria-hidden="true">›</span>{' '}
                        {topic && <><Link href={`/learn#${topic.key}`}>{topic.title}</Link> <span aria-hidden="true">›</span> </>}
                        <span lang={meta.language}>{meta.shortTitle}</span>
                    </nav>
                    <h1 className={styles.title} lang={meta.language}>{meta.title}</h1>
                    <p className={styles.dek}>{meta.description}</p>
                    <dl className={styles.facts}>
                        <div><dt>Level</dt><dd><span className={styles.levelTag} data-level={meta.level}>{meta.level}</span></dd></div>
                        {topic && <div><dt>Topic</dt><dd><Link href={`/learn#${topic.key}`} className={styles.topicLink}>{topic.title}</Link></dd></div>}
                        <div><dt>Read time</dt><dd>{meta.minutes} min{quiz?.length ? ` + ${quiz.length}-question quiz` : ''}</dd></div>
                        <div><dt>Updated</dt><dd><time dateTime={meta.updated || meta.published}>{formatDate(meta.updated || meta.published)}</time></dd></div>
                    </dl>
                </header>

                <div className={styles.guideCols}>
                    <div className={styles.guideMain}>
                        <ArticleToc rootId="guide-body" inline extra={TOC_EXTRA} />
                        <div className={`${styles.prose} ${styles.guideBody}`} id="guide-body">
                            <Body />
                        </div>
                        <MarkRead slug={meta.slug} />

                        {quiz?.length > 0 && (
                            <section className={styles.guideSection}>
                                <p className={styles.sectionKicker}>Practice</p>
                                <h2 className={styles.sectionTitle} id="quiz">Check yourself</h2>
                                <Quiz questions={quiz} lang={meta.language} />
                            </section>
                        )}

                        {faq?.length > 0 && (
                            <section className={`${styles.guideSection} ${styles.faq}`}>
                                <p className={styles.sectionKicker}>{faq.length} answers</p>
                                <h2 className={styles.sectionTitle} id="faq">Questions learners ask</h2>
                                {faq.map(({ q, a }) => (
                                    <details key={q} className={styles.faqItem}>
                                        <summary>{q}</summary>
                                        <p>{a}</p>
                                    </details>
                                ))}
                            </section>
                        )}

                        <SignUpCta source="learn_article" title="Keep what you just learned" />

                        {more.length > 0 && (
                            <section className={styles.guideSection}>
                                <p className={styles.sectionKicker}>Next in the reading order</p>
                                <h2 className={styles.sectionTitle}>Keep going</h2>
                                <ul className={`${styles.cards} ${styles.moreCards}`}>
                                    {more.map(({ meta: m }) => (
                                        <li key={m.slug}>
                                            <Link href={`/learn/${m.slug}`} className={`${styles.card} ${styles[`tone_${m.color}`] || ''}`}>
                                                <span className={styles.cardTitle} lang={m.language}>{m.shortTitle}</span>
                                                <span className={styles.cardDek}>{m.description.split('. ')[0].replace(/\.$/, '')}.</span>
                                                <span className={styles.cardMeta}>{m.level} · {m.minutes} min</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>

                    <aside className={styles.rail} aria-label="About this guide">
                        <ArticleToc rootId="guide-body" extra={TOC_EXTRA} />

                        {meta.grammar?.length > 0 && (
                            <div className={styles.railCard}>
                                <p className={styles.railLabel}>Grammar in this guide</p>
                                <ul className={styles.railForms}>
                                    {meta.grammar.map((g) => (
                                        <li key={g.form}>
                                            <b lang={meta.language}>{g.form}</b>
                                            <span>{g.label}</span>
                                        </li>
                                    ))}
                                </ul>
                                {quiz?.length > 0 && <a href="#quiz" className={styles.railButton}>Take the {quiz.length}-question quiz</a>}
                            </div>
                        )}

                        <div className={`${styles.railCard} ${styles.railAbout}`}>
                            <div className={styles.railAboutHead}>
                                <Mascot pose="teach" size={56} label="" />
                                <p className={styles.railLabel}>About this guide</p>
                            </div>
                            <p>
                                Written by the Hanbok team for English speakers. Every Korean example is real, everyday
                                Korean you can tap to see each word, and open in the analyzer for a full breakdown.
                            </p>
                            <p className={styles.railFine}>
                                Updated {formatDate(meta.updated || meta.published)}.{' '}
                                <Link href="/feedback">Spot a mistake? Tell us</Link> and we fix it.
                            </p>
                        </div>
                    </aside>
                </div>
            </article>
        </LearnShell>
    );
}
