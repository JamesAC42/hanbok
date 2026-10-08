import Link from 'next/link';
import UpdatesShell from '@/components/updates/UpdatesShell';
import Mascot from '@/components/Mascot';
import { updates } from '@/content/updates';
import { JsonLd, SITE_URL } from '@/lib/seo';
import styles from '@/styles/pages/updates.module.scss';

const post = updates.find(u => u.slug === 'speak');

export const metadata = {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/updates/${post.slug}` },
    openGraph: {
        title: post.title,
        description: post.description,
        type: 'article',
        images: [{ url: post.image, width: 1600, height: 1000 }],
    },
};

const PLANS = [
    { name: 'Free', minutes: '5 minutes', per: 'every week' },
    { name: 'Basic', minutes: '60 minutes', per: 'every month' },
    { name: 'Plus', minutes: '120 minutes', per: 'every month' },
];

const Shot = ({ src, alt, width, height, narrow }) => (
    <figure className={`${styles.shot} ${narrow ? styles.narrow : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={width} height={height} loading="lazy" />
    </figure>
);

export default function SpeakPost() {
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
                    <Mascot pose="speak" size={120} motion="hop" className={styles.postMascot} />
                    <p className={styles.label}>{post.dateLabel}</p>
                    <h1 className={styles.title}>Talk it out: Speak with Horang and Sora</h1>
                    <p className={styles.dek}>
                        Reading Korean is one thing. Saying it out loud is another. With Speak, you can now practice
                        real conversations by voice, at your own pace, with no one judging your mistakes.
                    </p>
                </header>

                <section className={styles.section}>
                    <h2>Pick a scene and start talking</h2>
                    <p>
                        Speak puts you in everyday situations: ordering at a café, taking a taxi, chatting at a
                        corner store, or even a K-drama rooftop confession. You play yourself, and one of our two
                        characters plays the other part.
                    </p>
                    <Shot
                        src="/images/updates/speak-picker.webp" width={1600} height={1000}
                        alt="The Speak scene picker with scenes like a café, a taxi and a rooftop, each with Horang or Sora"
                    />
                </section>

                <section className={`${styles.callout} ${styles.cast}`} aria-labelledby="cast-heading">
                    <div className={styles.castPhotos} aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/speak/horang/happy.webp" alt="" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/speak/sora/happy.webp" alt="" />
                    </div>
                    <div>
                        <h2 id="cast-heading">Meet Horang and Sora</h2>
                        <p>
                            Horang is a patient tutor with tiger ears who keeps things clear and simple. Sora is a
                            countryside girl who just moved to Seoul and is figuring out the city right alongside you. Pick whoever fits your mood.
                        </p>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2>How it works</h2>
                    <ol className={styles.steps}>
                        <li><b>Pick a scene.</b> Choose a situation and who you want to talk to.</li>
                        <li><b>Allow your microphone and just talk.</b> Speak Korean the way you would in real life. Short answers are fine.</li>
                        <li><b>Get help in English anytime.</b> If you are stuck, ask for a hint or a translation, and save new phrases to review later.</li>
                    </ol>
                    <Shot
                        src="/images/updates/speak-scene.webp" width={780} height={1688} narrow
                        alt="A Speak call on a phone, with the character on screen and the conversation shown as text"
                    />
                    <p>
                        Words you have saved in Hanbok come up in your conversations too, so you get to use them
                        out loud, not just see them on flashcards.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>How many minutes you get</h2>
                    <p>Everyone can try Speak. Here is how much talking time each plan includes:</p>
                    <ul className={styles.planList}>
                        {PLANS.map(plan => (
                            <li key={plan.name}>
                                <span>{plan.name}</span>
                                <strong>{plan.minutes}</strong>
                                <span>{plan.per}</span>
                            </li>
                        ))}
                    </ul>
                    <p>
                        Want more time to practice? See the <Link href="/pricing">plans</Link>.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2>Give it a try</h2>
                    <p>
                        A five-minute call is a great way to start. Tell us how it goes, we are improving Speak every week.
                    </p>
                    <div className={styles.actions}>
                        <Link href="/speak" className={styles.primary}>Start speaking</Link>
                        <Link href="/feedback" className={styles.ghost}>Send feedback</Link>
                    </div>
                </section>
            </article>
        </UpdatesShell>
    );
}
