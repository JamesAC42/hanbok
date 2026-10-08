import Link from 'next/link';
import LearnShell from '@/components/learn/LearnShell';
import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Tiger from '@/components/Tiger';
import { chip, W, P } from '@/content/learn/parts';
import { JsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';

const TITLE = 'Free Korean Sentence Analyzer: Word-by-Word Breakdown';
const DESCRIPTION = 'Paste any Korean sentence and see how it is built: every word with its dictionary form, the particles and endings marked, grammar explained, plus a translation and audio. Free to try, no account needed.';

export const metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/korean-sentence-analyzer' },
    openGraph: { url: '/korean-sentence-analyzer', title: TITLE, description: DESCRIPTION, siteName: SITE_NAME },
    twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const faq = [
    {
        q: 'Is the Korean sentence analyzer free?',
        a: 'Yes. You can try a few breakdowns without an account, and a free account gets 10 sentences a week. Basic and Plus plans give you unlimited breakdowns.',
    },
    {
        q: 'How is this different from Google Translate or Papago?',
        a: 'A translator gives you a sentence back in English. Hanbok shows you how the Korean sentence works: each word with its dictionary form, what every particle and ending does, and the grammar patterns in it. You learn the sentence instead of just reading a translation.',
    },
    {
        q: 'Can I use it for K-pop lyrics and K-drama lines?',
        a: 'Yes. Paste any line from a song, a drama, a webtoon or a text message. Casual speech and slang are fine. Many popular songs are also already broken down line by line on the Hanbok lyrics pages.',
    },
    {
        q: 'Does it show romanization and pronunciation?',
        a: 'Yes. Every word comes with romanization, and you can listen to the whole sentence read aloud.',
    },
    {
        q: 'Can I save the words I look up?',
        a: 'Yes. Save any word or the whole sentence with one tap. Saved words become flashcards, and saved grammar points become short reviews, so the sentence you looked up today turns into practice tomorrow.',
    },
    {
        q: 'Does it work for Japanese and Chinese too?',
        a: 'Yes. The same analyzer breaks down Japanese and Chinese sentences, with readings like furigana and pinyin.',
    },
];

export default function KoreanSentenceAnalyzer() {
    const url = `${SITE_URL}/korean-sentence-analyzer`;

    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Hanbok Korean Sentence Analyzer',
            url,
            description: DESCRIPTION,
            applicationCategory: 'EducationalApplication',
            operatingSystem: 'Web',
            inLanguage: 'en',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        },
    ];

    return (
        <LearnShell>
            <JsonLd data={structuredData} />
            <article className={styles.article}>
                <header className={styles.hubHeader}>
                    <Tiger pose="wave" size={110} motion="bob" />
                    <div>
                        <p className={styles.label}>Free tool</p>
                        <h1 className={styles.title}>Free Korean Sentence Analyzer</h1>
                        <p className={styles.dek}>
                            Paste a Korean sentence and see exactly how it&rsquo;s built: every word, every particle,
                            every ending, explained in plain English.
                        </p>
                    </div>
                </header>

                <TryIt
                    lang="ko"
                    run
                    source="korean_analyzer"
                    title="Paste a Korean sentence"
                    placeholder="예: 저는 요즘 드라마를 보면서 한국어를 공부해요"
                />

                <div className={styles.prose}>
                    <h2 id="example">What a breakdown looks like</h2>
                    <p>
                        Here is a sentence you might write in your first months of Korean. Tap any word to see what it means
                        and what is attached to it. The colored parts are particles and endings, the small pieces that do most
                        of the grammar work in Korean.
                    </p>
                    <Example
                        words={[
                            chip(W('저', 'I (humble)'), P('는', 'topic marker: "as for me"')),
                            chip(W('요즘', 'these days')),
                            chip(W('드라마', 'drama, TV series'), P('를', 'object marker')),
                            chip(W('보', 'watch', '보다'), P('면서', 'while doing')),
                            chip(W('한국어', 'Korean (language)'), P('를', 'object marker')),
                            chip(W('공부', 'study'), P('해요', 'do: present tense, polite')),
                        ]}
                        translation="These days I study Korean while watching dramas."
                    />
                    <p>
                        On the full analyzer you also get the dictionary form of every word, romanization, the grammar
                        patterns in the sentence with their own examples, a natural translation, and audio.
                    </p>

                    <h2 id="what-you-get">What you get for every sentence</h2>
                    <ul className={styles.list}>
                        <li><strong>Word by word.</strong> Each word with its meaning, its dictionary form and its romanization.</li>
                        <li><strong>Particles and endings marked.</strong> See which piece makes a word the subject, the object, a place or a time.</li>
                        <li><strong>Grammar explained.</strong> Patterns like <span lang="ko">-고 싶다</span> or <span lang="ko">-아서/어서</span> are named and explained, with links to full guides.</li>
                        <li><strong>Translation and audio.</strong> A natural English translation, and the sentence read aloud.</li>
                        <li><strong>Save and review.</strong> Keep the words and grammar you looked up as flashcards and short reviews.</li>
                        <li><strong>Screenshots too.</strong> Paste an image of a text message or a subtitle and Hanbok reads the Korean for you.</li>
                    </ul>

                    <h2 id="how-to-read">How to read a Korean sentence</h2>
                    <p>
                        Korean puts the verb at the end, and it marks each word&rsquo;s job with a particle stuck to its end.
                        So <span lang="ko">드라마를</span> is &ldquo;drama&rdquo; plus <span lang="ko">를</span>, which says it&rsquo;s the
                        thing being watched. Once you can split those pieces off, most sentences stop looking like one long blur.
                        {' '}Our guide to <Link href="/learn/korean-sentence-structure">Korean sentence structure</Link> walks
                        through the order step by step.
                    </p>
                    <p>
                        The two particles that confuse learners most are the topic marker <span lang="ko">은/는</span> and the
                        subject marker <span lang="ko">이/가</span>.
                        {' '}Read <Link href="/learn/korean-particles-eun-neun-vs-i-ga" lang="ko">은/는 vs 이/가</Link> when
                        you&rsquo;re ready. The ending of the verb tells you how polite the speaker is being, and{' '}
                        <Link href="/learn/korean-speech-levels">Korean speech levels</Link> explains which one to use.
                    </p>
                    <Tutor>
                        My tip: start with lines you actually care about. A lyric you love or a line from your favorite drama
                        sticks much better than a textbook sentence.
                    </Tutor>

                    <h2 id="songs">Learning from songs?</h2>
                    <p>
                        Hanbok has popular K-pop songs already broken down line by line, with the key words and grammar of each
                        song pulled out. <Link href="/lyrics">Browse the song breakdowns</Link>, or{' '}
                        <Link href="/learn">read the Learn guides</Link> for one grammar point at a time.
                    </p>
                </div>

                <section className={styles.faq}>
                    <h2 className={styles.sectionTitle} id="faq">Questions learners ask</h2>
                    {faq.map(({ q, a }) => (
                        <details key={q} className={styles.faqItem}>
                            <summary>{q}</summary>
                            <p>{a}</p>
                        </details>
                    ))}
                </section>

                <TryIt lang="ko" run source="korean_analyzer_bottom" id="analyzer-try-bottom" title="Ready? Break down your own sentence" placeholder="Paste a Korean sentence" />
            </article>
        </LearnShell>
    );
}
