import Link from 'next/link';
import styles from '@/styles/pages/landing.module.scss';
import ContentPage from '@/components/ContentPage';
import Footer from '@/components/Footer';
import Mascot from '@/components/Mascot';
import Tiger from '@/components/Tiger';
import HeroDemo from '@/components/landing/HeroDemo';
import HeroTry from '@/components/landing/HeroTry';
import SignedInRedirect from '@/components/landing/SignedInRedirect';
import { apiGet, JsonLd, SITE_NAME, SITE_URL } from '@/lib/seo';

export const metadata = {
    // absolute: the landing title shouldn't get the "| Hanbok" suffix
    title: { absolute: 'Hanbok: Learn Korean, Japanese & Chinese from Real Sentences' },
    description: 'Paste any Korean, Japanese or Chinese sentence and Hanbok breaks it down word by word: grammar, readings, translation and audio. Save words to flashcards, learn from K-pop lyrics, and practice with an AI tutor. Free to start.',
    alternates: { canonical: '/' },
};

// Numbers and songs refresh every so often; the rest of the page is static.
export const revalidate = 900;

const LOOP = [
    {
        key: 'read', n: 1, title: 'Read', color: 'read',
        text: 'Paste a lyric, a text from a friend, a line from a drama. Or snap a photo of a menu.',
    },
    {
        key: 'und', n: 2, title: 'Understand', color: 'und',
        text: 'Every word gets its meaning, reading and role, plus the grammar that holds the sentence together.',
    },
    {
        key: 'keep', n: 3, title: 'Keep', color: 'keep',
        text: 'Save the words you want to remember. Each card keeps the sentence you found it in.',
    },
    {
        key: 'rev', n: 4, title: 'Review', color: 'rev',
        text: 'A few minutes of flashcards a day. Hanbok brings each word back right before you forget it.',
    },
];

const FEATURES = [
    { key: 'lyrics', color: 'pink', icon: '♪', title: 'Song lyrics', text: 'K-pop, J-pop and anime songs broken down line by line, ready to sing along to.', href: '/lyrics', cta: 'Browse songs' },
    { key: 'tutor', color: 'flame', tiger: true, title: 'Horangi, your tutor', text: 'Stuck on a sentence? Ask the tutor why, get more examples, or practice a conversation.', href: '/analyze', cta: 'Try a sentence first' },
    { key: 'paragraphs', color: 'purple', icon: '¶', title: 'Whole paragraphs', text: 'News articles, webtoon pages or your own writing, split into sentences you can open one by one.', href: '/analyze', cta: 'Start reading' },
    { key: 'photo', color: 'read', icon: '◎', title: 'Photo to text', text: 'Point your camera at a sign, a menu or a screenshot and Hanbok reads the text for you.', href: '/analyze', cta: 'Try it' },
    { key: 'audio', color: 'und', icon: '▶', title: 'Native audio', text: 'Hear any sentence read aloud, then slow it down to catch every sound.', href: '/analyze', cta: 'Listen' },
    { key: 'hangeul', color: 'freeze', icon: '가', title: 'Start from zero', text: 'New to Korean? Learn Hangeul with short lessons, then practice typing it.', href: '/hangeul', cta: 'Learn Hangeul' },
];

const QUOTES = [
    { quote: 'I was amazed when I discovered this site. I have no words, really great site.', name: 'Mina' },
    { quote: "Oh my god! It's exactly what I need!! I'm a highly visual person and the interface is so pretty.", name: 'Jordan' },
    { quote: 'This is such an amazing website and by far the best translation tool I ever came across.', name: 'Taylor' },
    { quote: "I use Hanbok nearly everyday and honestly I can't thank you enough!!!", name: 'Korean learner' },
    { quote: 'This is such an insanely useful tool.', name: 'Alex' },
    { quote: 'I loveeee this site!! The translations are super helpful!', name: 'Jamie' },
];

const FAQ = [
    {
        q: 'Is Hanbok free?',
        a: 'Yes. You can break down 10 sentences a week, save words, review flashcards and read song lyrics without paying. Paid plans start at $4 a month for unlimited sentences.',
    },
    {
        q: 'Which languages can I learn?',
        a: 'Korean, Japanese and Chinese are where Hanbok shines, and it also breaks down Spanish, French, German, Italian, Dutch, Russian, Turkish, Hindi, Indonesian, Vietnamese and English.',
    },
    {
        q: "I'm a total beginner. Is it for me?",
        a: 'Yes. Start with the Hangeul lessons and the Learn articles, then paste short sentences. Every word comes with its reading, so you never have to guess how to say it.',
    },
    {
        q: 'Do I need an account?',
        a: 'No. You can try the analyzer right away. A free account lets you save words, build flashcards and keep your history.',
    },
    {
        q: 'Does it work on my phone?',
        a: 'Yes. Hanbok works in any browser on phones, tablets and computers. Nothing to install.',
    },
];

const GENRE_COLORS = { kpop: 'pink', jpop: 'purple', anime: 'flame', other: 'read' };
const GENRE_LABELS = { kpop: 'K-pop', jpop: 'J-pop', anime: 'Anime', other: 'Song' };

// The video's thumbnail stands in for album art.
const youtubeId = (url) => (typeof url === 'string' && url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/)?.[1]) || null;

const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : null);

export default async function Home() {
    const [statsRes, lyricsRes] = await Promise.all([
        apiGet('/api/stats', { revalidate }),
        apiGet('/api/lyrics', { revalidate }),
    ]);
    const stats = statsRes?.success ? statsRes.stats : null;
    const songs = (lyricsRes?.lyrics || [])
        .slice()
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 6);

    return (
        <ContentPage>
            <SignedInRedirect />
            <JsonLd data={[
                { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, alternateName: 'Hanbok Study', url: SITE_URL },
                { '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/hanbokicon-512x512.png` },
                {
                    '@context': 'https://schema.org',
                    '@type': 'WebApplication',
                    name: SITE_NAME,
                    url: SITE_URL,
                    applicationCategory: 'EducationalApplication',
                    operatingSystem: 'Any (web browser)',
                    description: 'Word-by-word breakdowns of Korean, Japanese and Chinese sentences with grammar, readings, translation, audio and flashcards.',
                    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free plan; paid plans from $4/month' },
                },
                {
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
                },
            ]} />

            <main className={styles.landing}>
                {/* ---------- Hero ---------- */}
                <section className={styles.hero}>
                    <div className={styles.heroCopy}>
                        <span className={styles.eyebrow}>Free to try · no account needed</span>
                        <h1 className={styles.heroTitle}>
                            Understand any <span className={styles.hlRead}>Korean</span> sentence, word by word.
                        </h1>
                        <p className={styles.heroSub}>
                            Paste a line from a song, a drama or a text message. Hanbok explains every word and the grammar
                            behind it, then turns the words you want into flashcards. Japanese and Chinese too.
                        </p>
                        <HeroTry />
                        <p className={styles.heroLogin}>
                            Already learning with us? <Link href="/login">Log in</Link>
                        </p>
                    </div>
                    <div className={styles.heroVisual}>
                        <Mascot pose="teach" size={128} label="Kkachi the magpie pointing at the example" className={styles.heroMascot} motion="bob" />
                        <HeroDemo />
                    </div>
                </section>

                {/* ---------- Proof ---------- */}
                <section className={styles.proof} aria-label="Hanbok in numbers">
                    <div className={styles.proofItem}>
                        <strong>{fmt(stats?.totalSentences) || 'Thousands of'}</strong>
                        <span>sentences broken down</span>
                    </div>
                    <div className={styles.proofItem}>
                        <strong>{fmt(stats?.totalUsers) || 'Thousands of'}</strong>
                        <span>learners</span>
                    </div>
                    <div className={styles.proofItem}>
                        <strong>14</strong>
                        <span>languages</span>
                    </div>
                    <div className={styles.proofItem}>
                        <strong>★★★★★</strong>
                        <span>from learners on Reddit</span>
                    </div>
                </section>

                {/* ---------- The loop ---------- */}
                <section className={styles.section} id="how-it-works">
                    <header className={styles.sectionHead}>
                        <span className={styles.kicker}>How it works</span>
                        <h2>One sentence becomes a lesson</h2>
                        <p>Four steps, the same every time. Hanbok shows you where you are and what to do next.</p>
                    </header>
                    <ol className={styles.loop}>
                        {LOOP.map((step) => (
                            <li key={step.key} className={`${styles.loopStep} ${styles[`stage_${step.color}`]}`}>
                                <div className={styles.loopBadge} aria-hidden="true">{step.n}</div>
                                <div className={styles.loopCard}>
                                    <LoopVignette step={step.key} />
                                    <h3>{step.title}</h3>
                                    <p>{step.text}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>

                {/* ---------- Features ---------- */}
                <section className={`${styles.section} ${styles.sectionSoft}`}>
                    <header className={styles.sectionHead}>
                        <span className={styles.kicker}>Everything in one place</span>
                        <h2>From your first <span lang="ko">안녕</span> to full song lyrics</h2>
                    </header>
                    <div className={styles.features}>
                        {FEATURES.map((f) => (
                            <article key={f.key} className={`${styles.feature} ${styles[`tone_${f.color}`]}`}>
                                <div className={styles.featureIcon} aria-hidden="true">
                                    {f.tiger ? <Tiger pose="head" size={44} label="" /> : <span lang={f.key === 'hangeul' ? 'ko' : undefined}>{f.icon}</span>}
                                </div>
                                <h3>{f.title}</h3>
                                <p>{f.text}</p>
                                <Link href={f.href} className={styles.featureLink}>{f.cta} →</Link>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ---------- Songs ---------- */}
                {songs.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.songsHead}>
                            <header className={styles.sectionHead}>
                                <span className={styles.kicker}>Learn with music</span>
                                <h2>Study the songs you already love</h2>
                                <p>Every line translated and broken down, so you know exactly what you&apos;re singing.</p>
                            </header>
                            <Mascot pose="speak" size={110} label="Kkachi singing" className={styles.songsMascot} />
                        </div>
                        <ul className={styles.songs}>
                            {songs.map((song) => (
                                <li key={song.lyricId}>
                                    <Link href={`/lyrics/${song.lyricId}`} className={`${styles.song} ${styles[`tone_${GENRE_COLORS[song.genre] || 'read'}`]}`}>
                                        <span className={styles.songArt} aria-hidden="true"
                                            style={youtubeId(song.youtubeUrl) ? { backgroundImage: `url(https://i.ytimg.com/vi/${youtubeId(song.youtubeUrl)}/mqdefault.jpg)` } : undefined}>♪</span>
                                        <span className={styles.songText}>
                                            <strong lang={song.language}>{song.title}</strong>
                                            <span>{[song.artist, song.anime].filter(Boolean).join(' · ')}</span>
                                        </span>
                                        <span className={styles.songGenre}>{GENRE_LABELS[song.genre] || 'Song'}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div className={styles.center}>
                            <Link href="/lyrics" className={styles.ghostButton}>See all songs</Link>
                        </div>
                    </section>
                )}

                {/* ---------- Quotes ---------- */}
                <section className={`${styles.section} ${styles.sectionSoft}`}>
                    <header className={styles.sectionHead}>
                        <span className={styles.kicker}>From learners</span>
                        <h2>People actually use it every day</h2>
                    </header>
                    <ul className={styles.quotes}>
                        {QUOTES.map((q) => (
                            <li key={q.name} className={styles.quote}>
                                <span className={styles.stars} aria-label="5 out of 5 stars">★★★★★</span>
                                <blockquote>{q.quote}</blockquote>
                                <span className={styles.quoteName}>
                                    <i aria-hidden="true">{q.name[0]}</i>{q.name}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* ---------- Pricing teaser ---------- */}
                <section className={styles.section}>
                    <div className={styles.plans}>
                        <div className={styles.plansCopy}>
                            <span className={styles.kicker}>Pricing</span>
                            <h2>Start free. Upgrade when you&apos;re hooked.</h2>
                            <p>The free plan is a real plan, not a trial. When you want more, unlimited sentences cost less than a coffee a month.</p>
                            <Link href="/pricing" className={styles.ghostButton}>Compare plans</Link>
                        </div>
                        <div className={styles.planCards}>
                            <div className={styles.planCard}>
                                <span className={styles.planName}>Free</span>
                                <strong>$0</strong>
                                <ul>
                                    <li>10 sentences a week</li>
                                    <li>Flashcards and song lyrics</li>
                                    <li>A few tutor chats to try it</li>
                                </ul>
                            </div>
                            <div className={`${styles.planCard} ${styles.planCardHot}`}>
                                <span className={styles.planName}>Basic</span>
                                <strong>$4<small>/month</small></strong>
                                <ul>
                                    <li>Unlimited sentences</li>
                                    <li>Unlimited saved words</li>
                                    <li>Unlimited paragraphs, 50 tutor chats a month</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ---------- FAQ ---------- */}
                <section className={`${styles.section} ${styles.sectionSoft}`}>
                    <header className={styles.sectionHead}>
                        <span className={styles.kicker}>Questions</span>
                        <h2>Good to know</h2>
                    </header>
                    <div className={styles.faq}>
                        {FAQ.map((f) => (
                            <details key={f.q} className={styles.faqItem}>
                                <summary>{f.q}</summary>
                                <p>{f.a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* ---------- Final call ---------- */}
                <section className={styles.final}>
                    <div className={styles.finalCast} aria-hidden="true">
                        <Mascot pose="celebrate" size={150} label="" motion="bob" />
                        <Tiger pose="wave" size={150} label="" />
                    </div>
                    <h2>Your first sentence takes ten seconds.</h2>
                    <p>No account, no credit card. Paste something you want to read and see what happens.</p>
                    <Link href="/analyze" className={styles.bigButton} data-cta="footer">Start reading for free</Link>
                </section>
            </main>
            <Footer />
        </ContentPage>
    );
}

// Small drawings of each step, built from the same pieces as the app.
function LoopVignette({ step }) {
    if (step === 'read') {
        return (
            <div className={styles.vignette} aria-hidden="true">
                <div className={styles.vInput}>
                    <span lang="ko">너무 보고 싶었어</span>
                    <i className={styles.vCaret} />
                </div>
                <div className={styles.vRow}>
                    <span className={styles.vPill}>📷 Photo</span>
                    <span className={`${styles.vPill} ${styles.vPillSolid}`}>Break it down</span>
                </div>
            </div>
        );
    }
    if (step === 'und') {
        return (
            <div className={styles.vignette} aria-hidden="true">
                <div className={styles.vChips} lang="ko">
                    <span className={styles.vChipA}>너무</span>
                    <span className={styles.vChipB}>보고</span>
                    <span className={styles.vChipC}>싶었어</span>
                </div>
                <div className={styles.vGrammar}><b lang="ko">보고 싶다</b> to miss (lit. want to see)</div>
                <div className={styles.vTranslation}>I missed you so much.</div>
            </div>
        );
    }
    if (step === 'keep') {
        return (
            <div className={styles.vignette} aria-hidden="true">
                <div className={styles.vWord}><span lang="ko">보다</span><em>to see</em><b className={styles.vCheck}>✓</b></div>
                <div className={styles.vWord}><span lang="ko">너무</span><em>so, too</em><b className={styles.vCheck}>✓</b></div>
                <div className={styles.vWord}><span lang="ko">싶다</span><em>want to</em><b className={styles.vPlus}>+</b></div>
            </div>
        );
    }
    return (
        <div className={styles.vignette} aria-hidden="true">
            <div className={styles.vCard}>
                <span lang="ko">보고 싶다</span>
                <small>to miss someone</small>
            </div>
            <div className={styles.vRow}>
                <span className={`${styles.vPill} ${styles.vAgain}`}>Again</span>
                <span className={`${styles.vPill} ${styles.vGood}`}>Got it</span>
                <span className={styles.vStreak}>🔥 12</span>
            </div>
        </div>
    );
}
