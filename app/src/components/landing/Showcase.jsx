import Link from 'next/link';
import styles from '@/styles/pages/landing.module.scss';
import Mascot from '@/components/Mascot';
import Tiger from '@/components/Tiger';
import { phrases, phraseHref } from '@/content/phrases';

// The newer parts of Hanbok, each with a small drawing of the real screen
// built from the same pieces as the app. Drawings are decorative.

/* eslint-disable @next/next/no-img-element */

export const CAST = [
    {
        key: 'kkachi', name: 'Kkachi', ko: '까치', where: 'Everywhere', color: 'read',
        role: 'Your guide',
        text: 'A magpie, the bird that brings good news in Korean stories. Kkachi walks you through every sentence and cheers on your streak.',
        art: <Mascot pose="hero" size={170} label="" />,
    },
    {
        key: 'horangi', name: 'Horangi', ko: '호랑이', where: 'Lessons', color: 'flame',
        role: 'Your grammar teacher',
        text: 'A tiger with very round glasses. Horangi answers your questions about any sentence and teaches each grammar point you save.',
        art: <Tiger pose="teach" size={170} label="" />,
    },
    {
        key: 'sora', name: 'Sora', ko: '소라', where: 'Speak', color: 'purple', scene: 'park',
        role: 'Your new friend in Seoul',
        text: 'She just moved to Seoul from the countryside and is figuring out the city with you, one conversation at a time.',
        art: <img src="/images/speak/sora/happy.webp" alt="" width={705} height={940} loading="lazy" />,
    },
    {
        key: 'horang', name: 'Horang', ko: '호랑', where: 'Speak', color: 'und', scene: 'cafe',
        role: 'Your speaking tutor',
        text: 'Warm, cheeky and a little dramatic. Horang plays the barista, the taxi driver or the K-drama lead so you can practice out loud.',
        art: <img src="/images/speak/horang/happy.webp" alt="" width={705} height={940} loading="lazy" />,
    },
];

export function Cast() {
    return (
        <ul className={styles.cast}>
            {CAST.map((c) => (
                <li key={c.key} className={`${styles.castCard} ${styles[`tone_${c.color}`]}`}>
                    <div
                        className={`${styles.castArt} ${c.scene ? styles.castScene : ''}`}
                        style={c.scene ? { backgroundImage: `url(/images/speak/bg/${c.scene}.webp)` } : undefined}
                        aria-hidden="true"
                    >
                        {c.art}
                    </div>
                    <div className={styles.castText}>
                        <span className={styles.castWhere}>{c.where}</span>
                        <h3>{c.name} <span lang="ko">{c.ko}</span></h3>
                        <strong>{c.role}</strong>
                        <p>{c.text}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}

const SCENES = ['Order at a café', 'Take a taxi', 'Make a new friend', 'Concert merch line', 'K-drama rooftop confession', 'Hanbok day at the palace'];

export function SpeakSpotlight() {
    return (
        <div className={styles.speak}>
            <div className={styles.speakCopy}>
                <span className={styles.newBadge}>New · Beta</span>
                <h2>Say it out loud with Horang and Sora</h2>
                <p>
                    Speak drops you into everyday scenes and you talk your way through them. You play yourself,
                    and Horang or Sora plays the other part, live, by voice.
                </p>
                <ol className={styles.speakSteps}>
                    <li><b>Pick a scene</b> and who you want to talk to.</li>
                    <li><b>Just talk.</b> Short answers are fine, and it can tell you what to say next.</li>
                    <li><b>Get help in English</b> whenever you&apos;re stuck, and save new phrases to review.</li>
                </ol>
                <ul className={styles.scenes} aria-label="Some of the scenes">
                    {SCENES.map((s) => <li key={s}>{s}</li>)}
                </ul>
                <div className={styles.speakCta}>
                    <Link href="/speak" className={styles.pressRead} data-cta="speak">Try Speak free</Link>
                    <span>5 minutes a week on the free plan</span>
                </div>
            </div>
            <div className={styles.speakStage} aria-hidden="true">
                <div className={styles.speakScreen} style={{ backgroundImage: 'url(/images/speak/bg/park.webp)' }}>
                    <span className={styles.speakLive}><i />Live</span>
                    <img className={styles.speakSora} src="/images/speak/sora/excited_talk.webp" alt="" width={705} height={940} loading="lazy" />
                    <div className={styles.speakLine}>
                        <span className={styles.speakName}>Sora</span>
                        <p lang="ko">안녕하세요! 저는 소라예요. 이름이 뭐예요?</p>
                        <small>Hi! I&apos;m Sora. What&apos;s your name?</small>
                    </div>
                </div>
                <div className={styles.speakBar}>
                    <span className={styles.speakTry}>Try saying <b lang="ko">저는 ___예요</b></span>
                    <span className={styles.speakMic}>🎙</span>
                </div>
                <Tiger pose="speak" size={96} label="" className={styles.speakTiger} />
            </div>
        </div>
    );
}

function ExtensionDrawing() {
    return (
        <div className={styles.drawing} aria-hidden="true">
            <div className={styles.browser}>
                <div className={styles.browserBar}><i /><i /><i /><span>news.example.kr</span></div>
                <div className={styles.browserPage}>
                    <span className={styles.lineGhost} />
                    <p lang="ko">
                        오늘 서울은 <mark>하루 종일 비가 올 것으로</mark> 보입니다.
                    </p>
                    <span className={styles.lineGhost} />
                    <span className={`${styles.lineGhost} ${styles.lineShort}`} />
                    <div className={styles.popup}>
                        <div className={styles.popupHead}><Mascot pose="head" size={22} label="" />Hanbok</div>
                        <div className={styles.popupChips} lang="ko">
                            <span className={styles.pcA}>하루 종일</span>
                            <span className={styles.pcB}>비가</span>
                            <span className={styles.pcC}>올 것으로</span>
                        </div>
                        <div className={styles.popupMeaning}>all day · rain · is expected to</div>
                        <span className={styles.popupSave}>+ Save word</span>
                    </div>
                </div>
            </div>
            <Mascot pose="study" size={92} label="" className={styles.drawingMascot} />
        </div>
    );
}

function GrammarDrawing() {
    return (
        <div className={styles.drawing} aria-hidden="true">
            <div className={styles.quiz}>
                <div className={styles.quizHead}>
                    <span className={styles.quizTag}>Grammar</span>
                    <b lang="ko">-고 싶다</b> want to do
                </div>
                <p className={styles.quizQ}>Fill the gap: <span lang="ko">한국에 가<u>&nbsp;&nbsp;&nbsp;&nbsp;</u></span></p>
                <div className={styles.quizOpts} lang="ko">
                    <span className={styles.quizRight}>고 싶어요 ✓</span>
                    <span>아서</span>
                    <span>지만</span>
                </div>
                <div className={styles.quizBar}><i style={{ width: '60%' }} /></div>
            </div>
            <Tiger pose="teach" size={110} label="" className={styles.drawingTiger} />
        </div>
    );
}

function ReaderDrawing() {
    return (
        <div className={styles.drawing} aria-hidden="true">
            <div className={styles.reader}>
                <div className={styles.readerHead}><b>Guided read</b><span>3 of 8 sentences</span></div>
                <div className={`${styles.readerLine} ${styles.readerDone}`}><span lang="ko">어제 친구랑 홍대에 갔어요.</span><small>Yesterday I went to Hongdae with a friend.</small></div>
                <div className={`${styles.readerLine} ${styles.readerDone}`}><span lang="ko">사람이 정말 많았어요.</span><small>There were so many people.</small></div>
                <div className={`${styles.readerLine} ${styles.readerNow}`}><span lang="ko">그래서 작은 카페에 들어갔어요.</span></div>
                <div className={styles.readerLine}><span className={styles.lineGhost} /></div>
                <div className={styles.readerWords} lang="ko"><span>사람</span><span>정말</span><span>그래서</span><span>들어가다</span></div>
            </div>
            <Mascot pose="think" size={86} label="" className={styles.drawingMascot} />
        </div>
    );
}

const FEATURED_PHRASES = ['daebak', 'aigoo', 'heol', 'hwaiting', 'gwaenchana', 'jinjja', 'oppa', 'sseom'];

export function NewFeatures() {
    const picks = FEATURED_PHRASES.map((slug) => phrases.find((p) => p.slug === slug)).filter(Boolean);
    return (
        <>
            <div className={styles.rows}>
                <article className={`${styles.row} ${styles.tone_read}`}>
                    <div className={styles.rowCopy}>
                        <span className={styles.newBadge}>New · Chrome extension</span>
                        <h3>Read Korean anywhere on the web</h3>
                        <p>
                            Select a sentence on any page to get the same word-by-word breakdown, save new words to your
                            deck without leaving the page, and see the words you already know highlighted as you read.
                        </p>
                        <Link href="/extension" className={styles.rowLink}>Get the extension →</Link>
                    </div>
                    <ExtensionDrawing />
                </article>

                <article className={`${styles.row} ${styles.rowFlip} ${styles.tone_flame}`}>
                    <div className={styles.rowCopy}>
                        <span className={styles.newBadge}>New · Grammar lessons</span>
                        <h3>Keep the grammar, not just the words</h3>
                        <p>
                            Tap Save grammar on any pattern in a breakdown. Horangi explains it in four short screens,
                            then it comes back in your reviews as quick questions built from words you saved.
                        </p>
                        <Link href="/analyze" className={styles.rowLink}>Find your first pattern →</Link>
                    </div>
                    <GrammarDrawing />
                </article>

                <article className={`${styles.row} ${styles.tone_und}`}>
                    <div className={styles.rowCopy}>
                        <span className={styles.newBadge}>New · Guided reader</span>
                        <h3>Take on a whole article</h3>
                        <p>
                            Paste a news story, a webtoon chapter or a page from your textbook. Kkachi turns it into a
                            guided read with translations, key words and the grammar that keeps coming up, then a short
                            quiz at the end. Up to 1,000 characters free.
                        </p>
                        <Link href="/extended-text" className={styles.rowLink}>Read something longer →</Link>
                    </div>
                    <ReaderDrawing />
                </article>
            </div>

            <div className={styles.duo}>
                <article className={`${styles.duoCard} ${styles.tone_flame}`}>
                    <span className={styles.newBadge}>New · Daily habit</span>
                    <h3>A sentence a day keeps your streak alive</h3>
                    <p>
                        A fresh Korean sentence waits on your home page every day. Breaking it down counts for your
                        streak, and an evening email reminds you if you haven&apos;t studied yet.
                    </p>
                    <div className={styles.daily} aria-hidden="true">
                        <div className={styles.dailyCard}>
                            <small>Sentence of the day</small>
                            <span lang="ko">오늘도 수고했어요.</span>
                            <em>Good work today, as always.</em>
                        </div>
                        <div className={styles.week}>
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                <span key={i} className={i < 5 ? styles.weekOn : ''}>{i < 5 ? '🔥' : ''}<b>{d}</b></span>
                            ))}
                        </div>
                    </div>
                    <Link href="/login" className={styles.rowLink}>Start your streak →</Link>
                </article>

                <article className={`${styles.duoCard} ${styles.tone_pink}`}>
                    <span className={styles.newBadge}>New · Korean phrases</span>
                    <h3>What does that word from the drama mean?</h3>
                    <p>
                        Plain-English explanations of the words you hear in K-dramas and songs: what they mean, when to
                        use them, and examples you can tap.
                    </p>
                    <ul className={styles.phraseCloud}>
                        {picks.map((p) => (
                            <li key={p.slug}>
                                <Link href={phraseHref(p)}><span lang="ko">{p.ko}</span><small>{p.meaning.split(' / ')[0]}</small></Link>
                            </li>
                        ))}
                    </ul>
                    <Link href="/phrases" className={styles.rowLink}>See all {phrases.length} phrases →</Link>
                </article>
            </div>
        </>
    );
}
