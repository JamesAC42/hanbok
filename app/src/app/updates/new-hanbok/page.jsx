import Link from 'next/link';
import UpdatesShell from '@/components/updates/UpdatesShell';
import Mascot from '@/components/Mascot';
import Tiger from '@/components/Tiger';
import { updates } from '@/content/updates';
import { JsonLd, SITE_URL } from '@/lib/seo';
import styles from '@/styles/pages/updates.module.scss';

const post = updates.find(u => u.slug === 'new-hanbok');

export const metadata = {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/updates/${post.slug}` },
    openGraph: {
        title: post.title,
        description: post.description,
        type: 'article',
        images: [{ url: '/images/updates/new-home.webp', width: 1600, height: 944 }],
    },
};

const SAME = [
    'You log in the same way, with Google or with email.',
    'Your saved sentences, words and flashcards are all still there, and so is your place in your reviews.',
    'Your plan and billing have not changed.',
    'Old links and bookmarks still work. History and Bookmarks open in Library, and Lessons now live in Learn.',
];

const Shot = ({ src, alt, width, height, narrow }) => (
    <figure className={`${styles.shot} ${narrow ? styles.narrow : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={width} height={height} loading="lazy" />
    </figure>
);

export default function NewHanbokPost() {
    return (
        <UpdatesShell>
            <JsonLd data={{
                '@context': 'https://schema.org',
                '@type': 'BlogPosting',
                headline: post.title,
                description: post.description,
                datePublished: post.published,
                url: `${SITE_URL}/updates/${post.slug}`,
                image: `${SITE_URL}${post.image}`,
                publisher: { '@type': 'Organization', name: 'Hanbok', url: SITE_URL },
            }} />
            <article className={styles.column}>
                <Link href="/updates" className={styles.back}>← All updates</Link>

                <header className={styles.postHeader}>
                    <Mascot pose="celebrate" size={120} motion="hop" className={styles.postMascot} />
                    <p className={styles.label}>{post.dateLabel}</p>
                    <h1 className={styles.title}>Hanbok has a new look</h1>
                    <p className={styles.dek}>
                        Same Hanbok, same account, and everything you saved is still here. We redesigned the site
                        so its parts work together as one path, from the first sentence you read to the words you
                        end up remembering.
                    </p>
                </header>

                <section className={`${styles.callout} ${styles.toneUnd}`} aria-labelledby="same-heading">
                    <h2 id="same-heading">Nothing to do on your end</h2>
                    <ul className={styles.checks}>
                        {SAME.map(line => <li key={line}>{line}</li>)}
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2>Read, understand, keep, review</h2>
                    <p>
                        Hanbok has always been about learning from real sentences. Now the site is built around the
                        four steps that make that stick: <b className={styles.read}>read</b> something you care about,{' '}
                        <b className={styles.und}>understand</b> it word by word, <b className={styles.keep}>keep</b> the
                        words you want, and <b className={styles.rev}>review</b> them before you forget.
                    </p>
                    <p>
                        Your new Home page shows today&apos;s path, what you have already done, and the one thing to
                        do next. It also tracks your streak and how many words you have saved.
                    </p>
                    <Shot
                        src="/images/updates/new-home.webp" width={1600} height={944}
                        alt="The new Home page with today's path: Read, Understand, Keep and Review, and a button to start reviewing"
                    />
                </section>

                <section className={styles.section}>
                    <h2>Sentence breakdowns that are easier to read</h2>
                    <p>
                        The analysis page is still the heart of Hanbok, with a cleaner layout. Tap any word to see
                        what it means, what job it does in the sentence and how it was conjugated. Words that are new
                        to you are marked, so you can save them one by one or all at once.
                    </p>
                    <Shot
                        src="/images/updates/new-sentence.webp" width={1600} height={1084}
                        alt="A Korean sentence broken into word cards, with 공부하고 tapped and its details in a side panel"
                    />
                    <p>
                        When you are done with a sentence, the next steps sit right underneath it: save the new
                        words, review them, or ask Horangi, the tutor, about anything that is still unclear.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Flashcards remember where you found the word</h2>
                    <p>
                        Every card now shows the sentence you saved it from, with a link back to the full
                        breakdown. Grading is two big buttons, Missed it and Got it. If you prefer Again, Hard, Good
                        and Easy, you can switch with one tap.
                    </p>
                    <Shot
                        src="/images/updates/new-review.webp" width={1200} height={938} narrow
                        alt="A flashcard for 공부하다 showing the sentence it came from, with Missed it and Got it buttons"
                    />
                </section>

                <section className={styles.section}>
                    <h2>One Library for everything you saved</h2>
                    <p>
                        History, saved sentences and your words used to live on separate pages. They are now tabs
                        in one <Link href="/library">Library</Link>, so whatever you are looking for is in one place.
                    </p>
                    <Shot
                        src="/images/updates/new-library.webp" width={1200} height={878} narrow
                        alt="The Library page with History, Saved and Words tabs and a list of analyzed sentences"
                    />
                </section>

                <section className={styles.section}>
                    <h2>Learn replaces Lessons</h2>
                    <p>
                        <Link href="/learn">Learn</Link> has short grammar guides where every example is a real
                        Hanbok breakdown you can tap. Song lyrics are still under{' '}
                        <Link href="/lyrics">Lyrics</Link>, and Paragraphs, Tutor, Korean Typing and Learn Hangeul
                        are all in the sidebar.
                    </p>
                </section>

                <section className={`${styles.callout} ${styles.cast}`} aria-labelledby="cast-heading">
                    <div className={styles.castArt} aria-hidden="true">
                        <Mascot pose="wave" size={96} label="" />
                        <Tiger pose="teach" size={96} label="" />
                    </div>
                    <div>
                        <h2 id="cast-heading">Meet Kkachi and Horangi</h2>
                        <p>
                            Kkachi the magpie greets you and cheers you on. Horangi the tiger is your tutor. They come
                            from <span lang="ko">까치호랑이</span>, the Korean folk painting of a magpie and a tiger.
                        </p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>Tell us what you think</h2>
                    <p>
                        If something looks broken, or you miss something from the old design, please let us know.
                    </p>
                    <div className={styles.actions}>
                        <Link href="/" className={styles.primary}>Open Hanbok</Link>
                        <Link href="/feedback" className={styles.ghost}>Send feedback</Link>
                        <a href="https://discord.gg/EQVvphzctc" target="_blank" rel="noopener noreferrer" className={styles.ghost}>Join the Discord</a>
                    </div>
                </section>
            </article>
        </UpdatesShell>
    );
}
