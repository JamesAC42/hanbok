import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-neyo-vs-jiyo',
    language: 'ko',
    title: 'Korean -네요 vs -지요/-죠: "Oh, I See!" vs "Right?"',
    shortTitle: '-네요 vs -죠',
    description: 'Learn when to say 맛있네요 and when to say 맛있죠. -네요 reacts to something you just noticed. -지요/-죠 asks for agreement, means "right?" or suggests "let\'s".',
    level: 'Intermediate',
    topic: 'politeness',
    minutes: 8,
    published: '2026-10-11',
    color: 'pink',
    grammar: [
        { form: '-네요', label: 'oh, I see! (reacting to something new)' },
        { form: '-지요/-죠', label: 'right? (seeking agreement)' },
        { form: '-죠', label: 'let\'s, of course (soft statement)' },
        { form: '(이)네요/(이)죠', label: 'with a noun' },
    ],
};

export const faq = [
    {
        q: 'What does 네요 mean in Korean?',
        a: '네요 shows you just noticed or felt something and are reacting to it, like "Oh, ..." or "Wow, ..." in English. 맛있네요! means "Oh, this is tasty!" when you have just taken a bite.',
    },
    {
        q: 'What does 죠 mean at the end of a sentence?',
        a: '죠 is short for 지요. It turns a sentence into "..., right?" when you expect the listener to agree: 오늘 춥죠? (It is cold today, right?). It can also make a soft statement or a suggestion: 같이 가죠 (Let\'s go together).',
    },
    {
        q: 'What is the difference between 네요 and 죠?',
        a: '네요 is for news to you: you just found it out. 죠 is for things you already know or think the listener knows too. Tasting new food: 맛있네요! Recommending food you love: 맛있죠?',
    },
    {
        q: 'Is 지요 or 죠 more common?',
        a: 'In speech, 죠 is far more common. 지요 is the full form and sounds a little slower and more careful. Both are polite.',
    },
];

export const quiz = [
    {
        prompt: 'You try a friend\'s cooking for the first time. It\'s great! You say:',
        choices: ['맛있네요!', '맛있죠?'],
        answer: 0,
        why: 'You just discovered it, so 네요. 맛있죠? would mean "It\'s tasty, right?", as if you already knew.',
    },
    {
        prompt: 'You took your friend to your favorite restaurant. You ask:',
        hint: 'It\'s good, right?',
        choices: ['맛있네요?', '맛있죠?'],
        answer: 1,
        why: 'You already know the food is good and want them to agree: 죠?',
    },
    {
        prompt: '"Oh, you\'re a student!" = 학생___!',
        choices: ['네요', '이네요'],
        answer: 1,
        why: '학생 ends in a consonant, so you need 이: 학생이네요. After a vowel, 이 drops: 의사네요.',
    },
    {
        prompt: '"Wow, you already ate it all!" = 벌써 다 ___!',
        choices: ['먹었네요', '먹네요'],
        answer: 0,
        why: 'Past tense comes first, then the ending: 먹었 + 네요. 먹네요 is present: "Oh, you are eating."',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    Use <span lang="ko">네요</span> when you just noticed something and react to it:{' '}
                    <span lang="ko">맛있네요!</span> (Oh, this is tasty!). Use <span lang="ko">지요</span>, usually
                    shortened to <span lang="ko">죠</span>, when you expect the other person to agree:{' '}
                    <span lang="ko">맛있죠?</span> (It&rsquo;s tasty, right?). <span lang="ko">죠</span> can also
                    suggest: <span lang="ko">같이 가죠</span> (Let&rsquo;s go together).
                </p>
            </section>

            <p>
                Both endings replace the usual <span lang="ko">아요/어요</span> and are just as polite. What changes is
                the feeling. <span lang="ko">네요</span> says &ldquo;this is new to me&rdquo;. <span lang="ko">죠</span>{' '}
                says &ldquo;we both know this&rdquo;. Koreans use them all the time, and they make you sound much more
                natural.
            </p>

            <h2 id="form">1. How to make them</h2>
            <p>
                Both attach straight to the stem. No vowel rules. For nouns, add <span lang="ko">이</span> after a
                consonant. One small trap: stems ending in <span lang="ko">ㄹ</span> drop the <span lang="ko">ㄹ</span>{' '}
                before <span lang="ko">네요</span> (<span lang="ko">멀다 → 머네요</span>).
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Dictionary form</th><th>+ 네요</th><th>+ 죠</th><th>Past</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">좋다 (good)</td><td lang="ko">좋네요</td><td lang="ko">좋죠</td><td lang="ko">좋았네요 / 좋았죠</td></tr>
                        <tr><td lang="ko">오다 (come)</td><td lang="ko">오네요</td><td lang="ko">오죠</td><td lang="ko">왔네요 / 왔죠</td></tr>
                        <tr><td lang="ko">먹다 (eat)</td><td lang="ko">먹네요</td><td lang="ko">먹죠</td><td lang="ko">먹었네요 / 먹었죠</td></tr>
                        <tr><td lang="ko">멀다 (far)</td><td lang="ko">머네요</td><td lang="ko">멀죠</td><td lang="ko">멀었네요 / 멀었죠</td></tr>
                        <tr><td lang="ko">학생이다 (be a student)</td><td lang="ko">학생이네요</td><td lang="ko">학생이죠</td><td lang="ko">학생이었네요 / 학생이었죠</td></tr>
                        <tr><td lang="ko">의사이다 (be a doctor)</td><td lang="ko">의사네요</td><td lang="ko">의사죠</td><td lang="ko">의사였네요 / 의사였죠</td></tr>
                    </tbody>
                </table>
            </div>

            <h2 id="neyo">2. -네요: &ldquo;Oh, I see!&rdquo;</h2>
            <p>
                Use <span lang="ko">네요</span> for something you see, hear, taste or feel right now, or just found
                out. It sounds warm and a little surprised. It is perfect for small talk and compliments.
            </p>
            <Example
                words={[chip(W('와', 'wow')), chip(W('정말', 'really')), chip(W('맛있', 'tasty', '맛있다'), P('네요', 'oh! (reacting to something new)'))]}
                translation="Wow, this is really tasty!"
            />
            <Example
                words={[chip(W('밖', 'outside'), P('에', 'at, in')), chip(W('비', 'rain'), P('가', 'subject')), chip(W('오', 'come, fall', '오다'), P('네요', 'oh! (just noticed)'))]}
                translation="Oh, it's raining outside."
            />
            <Example
                words={[chip(W('한국어', 'Korean (language)'), P('를', 'object')), chip(W('잘하시', 'be good at (respectful)', '잘하다'), P('네요', 'oh! (reacting)'))]}
                translation="You speak Korean really well!"
                note="A compliment you will hear a lot as a learner. A modest reply: 아직 멀었어요 (I still have a long way to go)."
            />
            <Example
                words={[chip(W('벌써', 'already')), chip(W('다', 'all')), chip(W('먹', 'eat', '먹다'), P('었네요', 'past + oh! (you notice it happened)'))]}
                translation="Oh, you already ate it all!"
            />
            <Example
                words={[chip(W('아', 'ah')), chip(W('학생', 'student'), P('이네요', '"is" + oh! (이다 + 네요)'))]}
                translation="Ah, so you're a student."
            />
            <Tutor>
                Don&rsquo;t use <span lang="ko">네요</span> for facts you have always known about yourself.{' '}
                <span lang="ko">저는 미국 사람이네요</span> sounds like you just found out you are American!
            </Tutor>

            <h2 id="jiyo">3. -지요/-죠: &ldquo;..., right?&rdquo;</h2>
            <p>
                Use <span lang="ko">죠</span> with a rising voice to ask for agreement or to check something you
                think is true. It is like &ldquo;right?&rdquo; or &ldquo;isn&rsquo;t it?&rdquo; at the end of an
                English sentence.
            </p>
            <Example
                words={[chip(W('오늘', 'today')), chip(W('진짜', 'really')), chip(W('춥', 'cold', '춥다'), P('죠', 'right? (short for 지요)'))]}
                translation="It's really cold today, isn't it?"
            />
            <Example
                words={[chip(W('이', 'this')), chip(W('집', 'restaurant, place (here)')), chip(W('김치찌개', 'kimchi stew'), P('가', 'subject')), chip(W('맛있', 'tasty', '맛있다'), P('죠', 'right? (you already know)'))]}
                translation="This place's kimchi stew is good, right?"
            />
            <Example
                words={[chip(W('어제', 'yesterday')), chip(W('콘서트', 'concert')), chip(W('갔', 'went', '가다'), P('죠', 'right? (checking)'))]}
                translation="You went to the concert yesterday, right?"
            />
            <p>
                With a question word, <span lang="ko">죠</span> sounds soft, like you are thinking out loud:{' '}
                <span lang="ko">이름이 뭐였죠?</span> (What was your name again?).
            </p>

            <h2 id="statement">4. -죠 as a soft statement or &ldquo;let&rsquo;s&rdquo;</h2>
            <p>
                Said with a falling voice, <span lang="ko">죠</span> is not a question. It states something as
                obvious or shared, or makes a friendly suggestion.
            </p>
            <Example
                words={[chip(W('그럼요', 'of course')), chip(W('당연하', 'be obvious, natural', '당연하다'), P('죠', 'of course (shared, obvious)'))]}
                translation="Of course! Naturally."
            />
            <Example
                words={[chip(W('우리', 'we, us')), chip(W('같이', 'together')), chip(W('가', 'go', '가다'), P('죠', "let's (soft suggestion)"))]}
                translation="Let's go together."
                note="As a suggestion, 가죠 is a little firmer than 갈까요? (shall we go?). A host might say 여기 앉으시죠 (Please, have a seat here)."
            />
            <ul className={styles.list}>
                <li><strong><span lang="ko">맛있네요!</span></strong> I just tasted it. Wow!</li>
                <li><strong><span lang="ko">맛있죠?</span></strong> (voice up) I knew you would like it. Right?</li>
                <li><strong><span lang="ko">맛있죠.</span></strong> (voice down) Of course it&rsquo;s good. Everyone knows that.</li>
            </ul>
            <Tutor>
                Easy memory trick: <span lang="ko">네요</span> is for <em>new</em> news.{' '}
                <span lang="ko">죠</span> is for things we <em>both</em> know.
            </Tutor>

            <TryIt placeholder="예: 날씨가 정말 좋네요!" />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Ballads love <span lang="ko">죠</span>. It gives lines a gentle, talking-to-you feeling, like{' '}
                <span lang="ko">알고 있죠?</span> (You know, right?). Open a song in{' '}
                <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line to see every ending explained. For more on
                politeness, read <Link href="/learn/korean-speech-levels">Korean speech levels</Link> or{' '}
                <Link href="/learn/korean-honorific-eusi">the honorific -(으)시-</Link>.
            </p>
        </>
    );
}
