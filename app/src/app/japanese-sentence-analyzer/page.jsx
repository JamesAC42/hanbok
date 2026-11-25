import Link from 'next/link';
import LearnShell from '@/components/learn/LearnShell';
import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Tiger from '@/components/Tiger';
import { JsonLd, SITE_URL, SITE_NAME } from '@/lib/seo';
import styles from '@/styles/pages/learn.module.scss';

const TITLE = 'Free Japanese Sentence Analyzer: Word-by-Word Breakdown with Furigana';
const DESCRIPTION = 'Paste any Japanese sentence and see how it is built: every word with its reading and dictionary form, particles and verb endings explained, grammar points named, plus a translation and audio. Free to try, no account needed.';

export const metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/japanese-sentence-analyzer' },
    openGraph: { url: '/japanese-sentence-analyzer', title: TITLE, description: DESCRIPTION, siteName: SITE_NAME },
    twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

// One chip part: text, gloss, and optional reading (furigana) and dictionary form.
const w = (t, g, r, base) => ({ t, g, ...(r && { r }), ...(base && { base }) });
const p = (t, g, base) => ({ t, g, particle: true, ...(base && { base }) });

const EXAMPLE = [
    { parts: [w('私', 'I', 'わたし'), p('は', 'topic marker: "as for me"')] },
    { parts: [w('毎日', 'every day', 'まいにち')] },
    { parts: [w('アニメ', 'anime'), p('を', 'object marker')] },
    { parts: [w('見', 'watch', 'み', '見る'), p('ながら', 'while doing')] },
    { parts: [w('日本語', 'Japanese (language)', 'にほんご'), p('を', 'object marker')] },
    { parts: [w('勉強', 'study', 'べんきょう'), p('して', 'do (te-form)', 'する'), p('います', 'be doing (polite)', 'いる'), p('。', '')] },
];

const faq = [
    {
        q: 'What is Hanbok?',
        a: 'Hanbok (hanbokstudy.com) is a language learning site built around a sentence analyzer for Japanese, Korean and Chinese. You paste a sentence, such as an anime line, a song lyric or a message, and it breaks the sentence down word by word with readings, grammar notes, a translation and audio. The words and grammar you look up turn into flashcards and short reviews.',
    },
    {
        q: 'How do I break down a Japanese sentence word by word?',
        a: 'Paste the sentence into the Hanbok Japanese sentence analyzer on this page. Japanese is written without spaces, so it first splits the sentence into words. Then it gives each word its reading in hiragana, its dictionary form and its meaning, marks every particle and verb ending, and explains the grammar points it finds.',
    },
    {
        q: 'Is the Japanese sentence analyzer free?',
        a: 'Yes. You can try a few breakdowns without an account, and a free account gives you 5 a week. Basic and Plus plans give you unlimited breakdowns.',
    },
    {
        q: 'Does it show furigana and romaji?',
        a: 'Yes. Every word with kanji gets its reading, and you can listen to the whole sentence read aloud.',
    },
    {
        q: 'How is this different from Google Translate or DeepL?',
        a: 'A translator gives you a sentence back in English. Hanbok shows you how the Japanese sentence works: where each word starts and ends, how each kanji is read, what every particle and verb ending does, and which grammar points are in it. You learn the sentence instead of just reading a translation.',
    },
    {
        q: 'Can I use it for anime, manga and song lyrics?',
        a: 'Yes. Paste any line from an anime, a manga, a song, a game or a text message. Casual speech is fine. You can also paste a screenshot and Hanbok reads the Japanese in it.',
    },
    {
        q: 'Does it help with JLPT grammar?',
        a: 'Yes. Grammar points in your sentence are named and explained, and the Hanbok Japanese grammar list covers over 100 points from JLPT N5 to N3, each with its own examples.',
    },
];

export default function JapaneseSentenceAnalyzer() {
    const url = `${SITE_URL}/japanese-sentence-analyzer`;

    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'Hanbok Japanese Sentence Analyzer',
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
                        <h1 className={styles.title}>Free Japanese Sentence Analyzer</h1>
                        <p className={styles.dek}>
                            Paste a Japanese sentence and see exactly how it&rsquo;s built: where each word starts and ends,
                            how every kanji is read, and what each particle and verb ending is doing.
                        </p>
                    </div>
                </header>

                <TryIt
                    lang="ja"
                    run
                    source="japanese_analyzer"
                    title="Paste a Japanese sentence"
                    placeholder="例: 毎日アニメを見ながら日本語を勉強しています"
                    blurb="Paste a line from an anime, a song, a manga or a text message. Hanbok splits it into words, adds the readings and explains each part."
                />

                <div className={styles.prose}>
                    <p>
                        Hanbok is a language learning site built around this analyzer. Instead of only translating a
                        sentence like Google Translate or DeepL, it shows how the Japanese is put together, so the next
                        sentence with the same words and grammar is easier to read on your own.
                    </p>

                    <h2 id="example">What a breakdown looks like</h2>
                    <p>
                        Tap any word to see what it means and what is attached to it. The small readings above the kanji are
                        furigana. The colored parts are particles and verb endings, the pieces that do most of the grammar
                        work in Japanese.
                    </p>
                    <Example
                        lang="ja"
                        words={EXAMPLE}
                        translation="I study Japanese every day while watching anime."
                        note="Watashi wa mainichi anime o minagara nihongo o benkyou shite imasu."
                    />
                    <p>
                        On the full analyzer you also get the dictionary form of every word, the grammar points in the
                        sentence with their own examples, a natural translation, and audio.
                    </p>

                    <h2 id="what-you-get">What you get for every sentence</h2>
                    <ul className={styles.list}>
                        <li><strong>Split into words.</strong> Japanese has no spaces, so Hanbok shows where each word starts and ends.</li>
                        <li><strong>Readings for every kanji.</strong> Furigana and romaji, so you can say the sentence out loud.</li>
                        <li><strong>Particles and endings marked.</strong> See what <span lang="ja">は</span>, <span lang="ja">が</span>, <span lang="ja">を</span> and <span lang="ja">に</span> are doing, and how each verb is conjugated.</li>
                        <li><strong>Grammar explained.</strong> Points like <Link href="/japanese/grammar/te-shimau" lang="ja">てしまう</Link> or <Link href="/japanese/grammar/nagara" lang="ja">ながら</Link> are named and explained.</li>
                        <li><strong>Translation and audio.</strong> A natural English translation, and the sentence read aloud.</li>
                        <li><strong>Save and review.</strong> Keep the words and grammar you looked up as flashcards and short reviews.</li>
                    </ul>

                    <h2 id="how-to-read">How to read a Japanese sentence</h2>
                    <p>
                        Japanese puts the verb at the end and marks each word&rsquo;s job with a particle right after it. So
                        {' '}<span lang="ja">アニメを</span> is &ldquo;anime&rdquo; plus <span lang="ja">を</span>, which says it&rsquo;s the
                        thing being watched. The verb at the end carries the tense, the politeness and often the mood, like
                        {' '}<span lang="ja">しています</span> (&ldquo;am doing&rdquo;, polite).
                    </p>
                    <p>
                        The particles that confuse learners most are <Link href="/japanese/grammar/wa-vs-ga" lang="ja">は and が</Link>, and
                        {' '}<Link href="/japanese/grammar/ni-vs-de" lang="ja">に and で</Link>. The{' '}
                        <Link href="/japanese/grammar">Japanese grammar list</Link> covers these and 100 more points from JLPT N5 to N3,
                        and <Link href="/japanese/phrases">Japanese words explained</Link> covers words like senpai and daijoubu.
                    </p>
                    <Tutor>
                        My tip: start with lines you actually care about. A lyric you love or a line from your favorite anime
                        sticks much better than a textbook sentence.
                    </Tutor>
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

                <TryIt lang="ja" run source="japanese_analyzer_bottom" id="ja-analyzer-try-bottom" title="Ready? Break down your own sentence" placeholder="Paste a Japanese sentence" />
            </article>
        </LearnShell>
    );
}
