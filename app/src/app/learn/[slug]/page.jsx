import Link from 'next/link';
import { notFound } from 'next/navigation';
import LearnShell from '@/components/learn/LearnShell';
import Quiz from '@/components/learn/Quiz';
import { articles, getArticle } from '@/content/learn';
import { JsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';

export const dynamicParams = false;

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

export default async function LearnArticle({ params }) {
    const { slug } = await params;
    const article = getArticle(slug);
    if (!article) notFound();
    const { meta, Body, quiz, faq } = article;
    const url = `${SITE_URL}/learn/${meta.slug}`;
    const at = articles.findIndex((a) => a.meta.slug === meta.slug);
    const more = [1, 2, 3].map((i) => articles[(at + i) % articles.length]).filter((a) => a.meta.slug !== meta.slug);

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
            <article className={styles.article}>
                <nav className={styles.crumbs} aria-label="Breadcrumb">
                    <Link href="/learn">Learn</Link> <span aria-hidden="true">›</span> <span lang={meta.language}>{meta.shortTitle}</span>
                </nav>
                <h1 className={styles.title} lang={meta.language}>{meta.title}</h1>
                <p className={styles.dek}>{meta.description}</p>
                <p className={styles.articleMeta}>
                    <span className={styles.pill}>{meta.level}</span>
                    <span>{meta.minutes} min read</span>
                    <span>Tap any Korean word to see it explained</span>
                </p>

                <div className={styles.prose}>
                    <Body />
                </div>

                {quiz?.length > 0 && (
                    <>
                        <h2 className={styles.sectionTitle} id="quiz">Check yourself</h2>
                        <Quiz questions={quiz} lang={meta.language} />
                    </>
                )}

                {faq?.length > 0 && (
                    <section className={styles.faq}>
                        <h2 className={styles.sectionTitle} id="faq">Questions learners ask</h2>
                        {faq.map(({ q, a }) => (
                            <details key={q} className={styles.faqItem}>
                                <summary>{q}</summary>
                                <p>{a}</p>
                            </details>
                        ))}
                    </section>
                )}

                {more.length > 0 && (
                    <section>
                        <h2 className={styles.sectionTitle}>Keep going</h2>
                        <ul className={styles.cards}>
                            {more.map(({ meta: m }) => (
                                <li key={m.slug}>
                                    <Link href={`/learn/${m.slug}`} className={styles.card}>
                                        <span className={styles.cardTitle} lang={m.language}>{m.shortTitle}</span>
                                        <span className={styles.cardMeta}>{m.level} · {m.minutes} min</span>
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
