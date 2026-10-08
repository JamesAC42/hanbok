import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import WordList from '@/components/learn/WordList';
import Link from 'next/link';
import { chip, W, P } from './parts';
import { phraseForWord, phraseHref } from '@/content/phrases';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-words-from-kdramas',
    language: 'ko',
    title: '25 Korean Words You Hear in Every K-Drama (and What They Mean)',
    shortTitle: '25 K-drama words',
    description: 'What do daebak, aigoo, oppa and eotteokhae actually mean? The 25 Korean words and phrases that show up in every K-drama, with when people use them and one-tap saving to your flashcards.',
    level: 'Beginner',
    minutes: 9,
    published: '2026-10-06',
    color: 'pink',
    grammar: [],
};

const FEELINGS = [
    { ko: '대박', rom: 'daebak', en: 'Awesome! / No way!', note: 'For anything surprisingly great, or just surprising.' },
    { ko: '헐', rom: 'heol', en: 'OMG / What?!', note: 'Shocked disbelief. Very casual, often typed in texts.' },
    { ko: '아이고', rom: 'aigo (aigoo)', en: 'Oh my / Ugh', note: 'A sigh for tiredness, pain, pity or mild frustration. Grandmas say it a lot.' },
    { ko: '진짜', rom: 'jinjja', en: 'Really / For real', note: 'As a question (진짜?) it means "Seriously?"' },
    { ko: '뭐야', rom: 'mwoya', en: 'What is this? / What the...', note: 'Casual. Annoyed or confused, depending on tone.' },
    { ko: '미쳤어', rom: 'michyeosseo', en: 'Are you crazy? / Have you lost it?', note: 'Strong and casual; only between close people.' },
    { ko: '짜증나', rom: 'jjajeungna', en: "It's so annoying / I'm annoyed", note: 'From 짜증 (irritation) + 나다 (to arise).' },
    { ko: '어떡해', rom: 'eotteokhae', en: 'What do I do?! / Oh no', note: 'Panic or sympathy. Short for 어떻게 해.' },
];

const PEOPLE = [
    { ko: '오빠', rom: 'oppa', en: 'older brother (said by women)', note: 'Also used for an older male friend or a boyfriend.' },
    { ko: '언니', rom: 'eonni (unnie)', en: 'older sister (said by women)', note: 'Also for an older female friend.' },
    { ko: '형', rom: 'hyeong (hyung)', en: 'older brother (said by men)', note: 'Also for an older male friend.' },
    { ko: '누나', rom: 'nuna (noona)', en: 'older sister (said by men)', note: 'Also for an older female friend.' },
    { ko: '선배', rom: 'seonbae (sunbae)', en: 'senior (at school or work)', note: 'Someone who started before you. The opposite is 후배 (hubae).' },
    { ko: '아저씨', rom: 'ajeossi (ahjussi)', en: 'mister / middle-aged man', note: 'Polite enough for strangers, but nobody young wants to be called it.' },
];

const PHRASES = [
    { ko: '괜찮아', rom: 'gwaenchana', en: "It's okay / Are you okay?", note: 'Casual. Polite form: 괜찮아요.' },
    { ko: '미안해', rom: 'mianhae', en: "I'm sorry", note: 'Casual. Polite form: 미안해요; very formal: 죄송합니다.' },
    { ko: '고마워', rom: 'gomawo', en: 'Thanks', note: 'Casual. Polite form: 고마워요.' },
    { ko: '사랑해', rom: 'saranghae', en: 'I love you', note: 'From 사랑하다 (to love).' },
    { ko: '보고 싶어', rom: 'bogo sipeo', en: 'I miss you', note: 'Literally "I want to see (you)".' },
    { ko: '잠깐만', rom: 'jamkkanman', en: 'Wait a second', note: 'Said while grabbing someone\'s wrist, in at least one episode of every drama.' },
    { ko: '가자', rom: 'gaja', en: "Let's go", note: 'From 가다 (to go) + -자 ("let\'s").' },
    { ko: '화이팅', rom: 'hwaiting (fighting)', en: 'You can do it! / Good luck!', note: 'From English "fighting", used as a cheer.' },
    { ko: '배고파', rom: 'baegopa', en: "I'm hungry", note: 'From 배 (stomach) + 고프다 (to be empty).' },
    { ko: '맛있다', rom: 'masitda', en: "It's delicious", note: 'Often 맛있어 or 맛있어요 when talking to someone.' },
    { ko: '왜', rom: 'wae', en: 'Why? / What?', note: 'Alone, it can also mean "What do you want?"' },
];

// Words with their own phrase page link to it.
const linked = (items) => items.map((item) => {
    const phrase = phraseForWord(item.ko);
    return phrase ? { ...item, href: phraseHref(phrase) } : item;
});

export const faq = [
    {
        q: 'What does daebak mean in Korean?',
        a: '대박 (daebak) means something like "awesome!" or "no way!". People say it when something is surprisingly great, or just surprising.',
    },
    {
        q: 'Can a man say oppa?',
        a: 'No. 오빠 is what women call an older man. Men call an older man 형 (hyeong). Similarly, women say 언니 for an older woman and men say 누나.',
    },
    {
        q: 'Is it rude to use these words?',
        a: 'Most of these are casual (반말), fine with friends, family and people younger than you. With strangers or anyone older, add 요 where there is a polite form, like 괜찮아요 or 고마워요.',
    },
];

export const quiz = [
    {
        prompt: 'A woman talking to her older brother calls him...',
        choices: ['형', '오빠', '누나'],
        answer: 1,
        why: 'Women say 오빠 for an older man. Men say 형.',
    },
    {
        prompt: 'Your friend got concert tickets. You say:',
        choices: ['대박!', '아이고...', '짜증나'],
        answer: 0,
        why: '대박 is for surprisingly great news.',
    },
    {
        prompt: '보고 싶어 means...',
        choices: ['I love you', 'I miss you', 'Let\'s go'],
        answer: 1,
        why: 'Literally "I want to see (you)", so "I miss you".',
    },
    {
        prompt: 'The polite way to say "it\'s okay" to a stranger:',
        choices: ['괜찮아', '괜찮아요'],
        answer: 1,
        why: 'Adding 요 makes it polite. 괜찮아 is for friends.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>Quick answer</p>
                <p>
                    <strong lang="ko">대박</strong> = awesome / no way, <strong lang="ko">아이고</strong> = oh my,
                    <strong lang="ko"> 오빠</strong> = older brother (said by women), <strong lang="ko">어떡해</strong> = what do I do,
                    <strong lang="ko"> 보고 싶어</strong> = I miss you. All 25 are below, each with a Save button for your flashcards.
                </p>
            </section>

            <p>
                Watch enough K-dramas and you start hearing the same handful of words in every episode. Here they are,
                grouped by when people use them. Most are casual speech (반말), so they&rsquo;re for friends, family and
                people younger than you. Where a polite form exists, it&rsquo;s in the note.
            </p>

            <h2 id="feelings">Reactions and feelings</h2>
            <WordList items={linked(FEELINGS)} />

            <h2 id="people">What people call each other</h2>
            <p>
                Koreans rarely call someone older by their name alone. These family words get used for friends,
                coworkers and couples too, and which one you use depends on <em>your</em> gender as well as theirs.
            </p>
            <WordList items={linked(PEOPLE)} />
            <Tutor>
                Rule of thumb: if they&rsquo;re older than you, don&rsquo;t just use their name. Pick the word that matches
                you both, or add <span lang="ko">씨</span> after their name with people you don&rsquo;t know well.
            </Tutor>

            <h2 id="phrases">Everyday lines</h2>
            <WordList items={linked(PHRASES)} />

            <h2 id="in-a-sentence">Hear them in a sentence</h2>
            <p>Tap a word to see how each line is built.</p>
            <Example
                words={[chip(W('오빠', 'older brother (said by a woman)')), chip(W('진짜', 'really')), chip(W('보고', 'see (+고)', '보다')), chip(W('싶었어', 'wanted to (past, casual)', '싶다'))]}
                translation="Oppa, I really missed you."
            />
            <Example
                words={[chip(W('잠깐만', 'wait a second')), chip(W('어디', 'where'), P('에', 'to')), chip(W('가', 'go (casual)', '가다'))]}
                translation="Wait, where are you going?"
            />
            <Example
                words={[chip(W('아이고', 'oh my (a sigh)')), chip(W('배고파', 'hungry (casual)', '배고프다')), chip(W('죽겠다', '"I could die" (exaggeration)', '죽다'))]}
                translation="Ugh, I'm starving."
                note={`-어 죽겠다 is how Koreans exaggerate: 배고파 죽겠다 is "so hungry I could die."`}
            />

            <TryIt title="Heard a line you didn't catch?" placeholder="예: 너 진짜 미쳤어?" />

            <h2 id="next">Keep going</h2>
            <p>
                Dramas switch between polite and casual speech all the time, and the particles carry a lot of the meaning.
                Start with <Link href="/learn/korean-particles-eun-neun-vs-i-ga">은/는 vs 이/가</Link>, or practice with real
                lines in <Link href="/lyrics">Hanbok Lyrics</Link>.
            </p>
        </>
    );
}
