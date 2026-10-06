import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-future-tense-eul-geoyeyo',
    language: 'ko',
    title: 'Korean Future Tense: -(으)ㄹ 거예요 Made Easy',
    shortTitle: 'Future tense -(으)ㄹ 거예요',
    description: 'Learn the Korean future tense -(으)ㄹ 거예요: how to say "I will" and "it will probably", how to build it from any verb, and when to use -(으)ㄹ게요 instead.',
    level: 'Beginner',
    minutes: 7,
    published: '2026-10-07',
    color: 'keep',
    grammar: [
        { form: '-(으)ㄹ 거예요', label: 'will, going to (plans and guesses)' },
        { form: '-(으)ㄹ게요', label: 'I will (promise to the listener)' },
        { form: '-(으)ㄹ 거야', label: 'will, going to (casual)' },
    ],
};

export const faq = [
    {
        q: 'How do you say "will" in Korean?',
        a: 'Add -(으)ㄹ 거예요 to the verb stem. After a vowel use ㄹ 거예요 (가다 becomes 갈 거예요), after a consonant use 을 거예요 (먹다 becomes 먹을 거예요).',
    },
    {
        q: 'Is it 거예요 or 거에요?',
        a: '거예요 is the correct spelling. It is short for 것이에요. Many Koreans write 거에요 online, and it sounds the same, but it is a spelling mistake.',
    },
    {
        q: 'What is the difference between -(으)ㄹ 거예요 and -(으)ㄹ게요?',
        a: '-(으)ㄹ 거예요 states a plan or a guess. -(으)ㄹ게요 is a promise or offer to the person you are talking to, like "I\'ll do it (for you)". -(으)ㄹ게요 is only used about yourself.',
    },
    {
        q: 'How do you say "it will probably" in Korean?',
        a: 'The same -(으)ㄹ 거예요 form. When the subject is not you, it usually means a guess: 비가 올 거예요 means "It will probably rain."',
    },
];

export const quiz = [
    {
        prompt: '먹다 (to eat) in the future = ?',
        hint: 'I will eat.',
        choices: ['먹을 거예요', '먹ㄹ 거예요'],
        answer: 0,
        why: 'The stem 먹 ends in a consonant, so you add 을 거예요.',
    },
    {
        prompt: '만들다 (to make) in the future = ?',
        choices: ['만들을 거예요', '만들 거예요'],
        answer: 1,
        why: 'Stems ending in ㄹ already have the ㄹ, so you just add 거예요: 만들 거예요.',
    },
    {
        prompt: 'The bill arrives. You want to say "I\'ll pay!" to your friend.',
        choices: ['제가 낼게요', '제가 낼 거예요'],
        answer: 0,
        why: '낼게요 is an offer to the listener. 낼 거예요 sounds like you are announcing a plan you made earlier.',
    },
    {
        prompt: 'Looking at dark clouds: "It will probably rain."',
        choices: ['비가 올게요', '비가 올 거예요'],
        answer: 1,
        why: '-(으)ㄹ게요 is only for your own promises. For a guess about the weather, use 올 거예요.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    To say &ldquo;will&rdquo; or &ldquo;going to&rdquo; in Korean, add <span lang="ko">-(으)ㄹ 거예요</span> to
                    the verb stem: <span lang="ko">가다 → 갈 거예요</span> (I will go), <span lang="ko">먹다 → 먹을 거예요</span>{' '}
                    (I will eat). The same form also makes a guess: <span lang="ko">비가 올 거예요</span> means &ldquo;it will
                    probably rain.&rdquo;
                </p>
            </section>

            <p>
                Korean has one main way to talk about the future, and it is easy to build. It covers your plans (&ldquo;I&rsquo;m
                going to see a friend&rdquo;) and your guesses (&ldquo;it&rsquo;ll probably be cold&rdquo;). Tap any word
                below to see what it means.
            </p>

            <h2 id="how-to-make">1. How to make it</h2>
            <p>
                Take the verb, drop <span lang="ko">다</span>, and look at the last letter of the stem.
            </p>
            <ul className={styles.list}>
                <li><strong>Ends in a vowel:</strong> add <span lang="ko">ㄹ</span> to the last syllable, then <span lang="ko">거예요</span>. <span lang="ko">가 → 갈 거예요</span></li>
                <li><strong>Ends in a consonant:</strong> add <span lang="ko">을 거예요</span>. <span lang="ko">먹 → 먹을 거예요</span></li>
                <li><strong>Ends in ㄹ:</strong> just add <span lang="ko">거예요</span>. <span lang="ko">만들 → 만들 거예요</span></li>
            </ul>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Verb</th><th>Meaning</th><th>Future (polite)</th><th>Rule</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다</td><td>to go</td><td lang="ko">갈 거예요</td><td>vowel + ㄹ</td></tr>
                        <tr><td lang="ko">보다</td><td>to see, watch</td><td lang="ko">볼 거예요</td><td>vowel + ㄹ</td></tr>
                        <tr><td lang="ko">공부하다</td><td>to study</td><td lang="ko">공부할 거예요</td><td>vowel + ㄹ</td></tr>
                        <tr><td lang="ko">먹다</td><td>to eat</td><td lang="ko">먹을 거예요</td><td>consonant + 을</td></tr>
                        <tr><td lang="ko">읽다</td><td>to read</td><td lang="ko">읽을 거예요</td><td>consonant + 을</td></tr>
                        <tr><td lang="ko">만들다</td><td>to make</td><td lang="ko">만들 거예요</td><td>ㄹ stem, no change</td></tr>
                        <tr><td lang="ko">살다</td><td>to live</td><td lang="ko">살 거예요</td><td>ㄹ stem, no change</td></tr>
                        <tr><td lang="ko">듣다</td><td>to listen</td><td lang="ko">들을 거예요</td><td>ㄷ becomes ㄹ</td></tr>
                        <tr><td lang="ko">덥다</td><td>to be hot</td><td lang="ko">더울 거예요</td><td>ㅂ becomes 우</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                The last two are irregular verbs. Most verbs follow the first three rules, so learn those first.
            </p>

            <h2 id="plans">2. Talking about your plans</h2>
            <p>
                When you talk about yourself (or ask someone about their plans), <span lang="ko">-(으)ㄹ 거예요</span> means
                &ldquo;I&rsquo;m going to&rdquo; or &ldquo;I will.&rdquo;
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('주말', 'weekend'), P('에', 'at (time)')), chip(W('부산', 'Busan'), P('에', 'to')), chip(W('갈', 'go', '가다')), chip(P('거예요', 'will, going to (polite)'))]}
                translation="I'm going to Busan this weekend."
            />
            <Example
                words={[chip(W('저녁', 'dinner, evening'), P('에', 'at (time)')), chip(W('비빔밥', 'bibimbap'), P('을', 'object')), chip(W('먹', 'eat', '먹다'), P('을', 'future: 을 after a consonant')), chip(P('거예요', 'will, going to (polite)'))]}
                translation="I'm going to have bibimbap for dinner."
            />
            <Example
                words={[chip(W('내일', 'tomorrow')), chip(W('친구', 'friend'), P('를', 'object')), chip(W('만날', 'meet', '만나다')), chip(P('거예요', 'will, going to (polite)'))]}
                translation="I'm meeting a friend tomorrow."
            />
            <Example
                words={[chip(W('오늘', 'today')), chip(W('케이크', 'cake'), P('를', 'object')), chip(W('만들', 'make', '만들다')), chip(P('거예요', 'will, going to (polite)'))]}
                translation="I'm going to make a cake today."
                note="만들다 already ends in ㄹ, so nothing is added before 거예요."
            />
            <Example
                words={[chip(W('주말', 'weekend'), P('에', 'at (time)')), chip(W('뭐', 'what')), chip(W('할', 'do', '하다')), chip(P('거예요', 'will, going to (polite)'))]}
                translation="What are you going to do this weekend?"
                note="Same form for questions. Just raise your voice at the end."
            />
            <Tutor>
                <span lang="ko">거예요</span> is pronounced like <span lang="ko">꺼예요</span>, with a strong &ldquo;kk&rdquo;
                sound. And it is spelled <span lang="ko">거예요</span>, not <span lang="ko">거에요</span>, even though you
                will see both online.
            </Tutor>

            <h2 id="guesses">3. Guessing: &ldquo;it will probably&rdquo;</h2>
            <p>
                When the subject is something you can&rsquo;t control, like the weather or another person, the same form
                usually sounds like a guess. English would add &ldquo;probably&rdquo; or &ldquo;I think.&rdquo;
            </p>
            <Example
                words={[chip(W('내일', 'tomorrow')), chip(W('비', 'rain'), P('가', 'subject')), chip(W('올', 'come', '오다')), chip(P('거예요', 'will probably (guess)'))]}
                translation="It will probably rain tomorrow."
                note="In Korean, rain comes: 비가 오다."
            />
            <Example
                words={[chip(W('그', 'that')), chip(W('영화', 'movie')), chip(W('재미있', 'fun, interesting', '재미있다'), P('을', 'future: 을 after a consonant')), chip(P('거예요', 'will probably (guess)'))]}
                translation="That movie will probably be fun."
                note="It works with describing words too, not just action verbs."
            />

            <h2 id="ge-yo">4. -(으)ㄹ게요: &ldquo;I&rsquo;ll do it (for you)&rdquo;</h2>
            <p>
                Korean has a second &ldquo;will&rdquo; that learners often mix up. <span lang="ko">-(으)ㄹ게요</span> is a
                promise or offer you make to the listener, often in reply to something they just said. Use it only
                about yourself, and not in questions.
            </p>
            <Example
                words={[chip(W('제', 'I (humble)', '저'), P('가', 'subject')), chip(W('전화할게요', 'I\'ll call (promise)', '전화하다'))]}
                translation="I'll call you."
                note="A promise to the listener. 전화할 거예요 would sound more like announcing your plan."
            />
            <ul className={styles.list}>
                <li><span lang="ko">내일 갈 거예요</span>: &ldquo;I&rsquo;m going tomorrow.&rdquo; (my plan)</li>
                <li><span lang="ko">내일 갈게요</span>: &ldquo;I&rsquo;ll come tomorrow, okay?&rdquo; (a promise to you)</li>
            </ul>
            <p>
                Spelling tip: it sounds like <span lang="ko">할께요</span>, but the correct spelling is{' '}
                <span lang="ko">할게요</span>.
            </p>

            <h2 id="casual">5. Casual: 거야</h2>
            <p>
                With close friends, drop the polite ending. <span lang="ko">거예요</span> becomes <span lang="ko">거야</span>,
                and <span lang="ko">게요</span> becomes <span lang="ko">게</span>.
            </p>
            <Example
                words={[chip(W('나', 'I (casual)')), chip(W('내일', 'tomorrow')), chip(W('갈', 'go', '가다')), chip(P('거야', 'will, going to (casual)'))]}
                translation="I'm going tomorrow."
            />
            <Tutor>
                Listen for <span lang="ko">거야</span> in K-pop. Lines like <span lang="ko">널 기다릴 거야</span> (&ldquo;I will
                wait for you&rdquo;) are everywhere in love songs.
            </Tutor>

            <TryIt placeholder="예: 저는 내일 친구를 만날 거예요" />

            <h2 id="next">Keep going</h2>
            <p>
                Future forms are all over song lyrics. Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and tap
                a line to see each ending explained. To talk about what already happened, read{' '}
                <Link href="/learn/korean-past-tense">the Korean past tense</Link>, and for the everyday present, see{' '}
                <Link href="/learn/korean-present-tense-a-yo-eo-yo">the present tense with 아요/어요</Link>.
            </p>
        </>
    );
}
