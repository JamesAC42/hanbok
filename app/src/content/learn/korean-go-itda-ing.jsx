import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-go-itda-ing',
    language: 'ko',
    title: 'Korean -고 있다: How to Say "I Am Doing" (-ing)',
    shortTitle: 'Saying "-ing" (-고 있다)',
    description: 'Learn how to say "I am doing" in Korean with -고 있다. Ask 지금 뭐 하고 있어요?, say what you were doing with -고 있었어요, and use -고 계세요 for elders.',
    level: 'Beginner',
    topic: 'verbs',
    minutes: 6,
    published: '2026-10-11',
    color: 'und',
    grammar: [
        { form: '-고 있다', label: 'is doing (-ing)' },
        { form: '-고 있었다', label: 'was doing (past -ing)' },
        { form: '-고 계시다', label: 'is doing (honorific)' },
    ],
};

export const faq = [
    {
        q: 'How do you say "-ing" in Korean?',
        a: 'Add 고 있다 to a verb stem. In polite speech that is 고 있어요: 먹고 있어요 (I am eating), 가고 있어요 (I am going), 공부하고 있어요 (I am studying).',
    },
    {
        q: 'What does 지금 뭐 하고 있어요 mean?',
        a: 'It means "What are you doing right now?" To answer, put your verb stem before 고 있어요: 밥 먹고 있어요 (I am eating), TV 보고 있어요 (I am watching TV).',
    },
    {
        q: 'What is the difference between 해요 and 하고 있어요?',
        a: 'The plain present 해요 can already mean "I do" or "I am doing". 하고 있어요 makes it clear that the action is happening right now or is ongoing these days. Both are correct; Koreans use the plain form a lot.',
    },
    {
        q: 'What is the difference between 고 있어요 and 고 계세요?',
        a: '고 계세요 is the respectful version, used when the person doing the action is older or higher in status: 할머니께서 주무시고 계세요. You never use it about yourself.',
    },
];

export const quiz = [
    {
        prompt: '먹다 (eat) + 고 있어요 = ?',
        hint: 'I am eating.',
        choices: ['먹어고 있어요', '먹고 있어요'],
        answer: 1,
        why: 'Drop 다 and add 고 straight to the stem: 먹 + 고 있어요. No 어 in between.',
    },
    {
        prompt: 'Which one means "I was watching TV"?',
        hint: '보다 = to watch, see',
        choices: ['TV 봤고 있어요', 'TV 보고 있었어요'],
        answer: 1,
        why: 'The verb before 고 stays in its plain stem form. The past tense goes on 있다: 보고 있었어요.',
    },
    {
        prompt: 'Talking respectfully about your grandmother: 할머니께서 책을 ___',
        choices: ['읽고 계세요', '읽고 있어요'],
        answer: 0,
        why: 'With an elder (and 께서), use the honorific 계세요. 읽고 있어요 is understandable, but it does not match the respect you showed with 께서.',
    },
    {
        prompt: 'Can 지금 뭐 해요? mean "What are you doing now?"',
        choices: ['Yes, the plain present can mean -ing', 'No, you must say 하고 있어요'],
        answer: 0,
        why: 'The Korean present tense covers both "I do" and "I am doing". 하고 있어요 just makes the "right now" part extra clear.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    To say something is happening right now, add <span lang="ko">고 있다</span> to a verb stem. In
                    polite speech: <span lang="ko">먹고 있어요</span> (I&rsquo;m eating). For the past, change{' '}
                    <span lang="ko">있어요</span> to <span lang="ko">있었어요</span>: <span lang="ko">먹고 있었어요</span>{' '}
                    (I was eating).
                </p>
            </section>

            <p>
                In English we add &ldquo;-ing&rdquo; to a verb. Korean does something similar with{' '}
                <span lang="ko">고 있다</span>. It literally means something like &ldquo;doing and being there&rdquo;.
                It is easy to build, and there are no vowel rules. Tap the chips below to see each part.
            </p>

            <h2 id="form">1. Verb stem + 고 있어요</h2>
            <p>
                Take the dictionary form, drop <span lang="ko">다</span>, and add <span lang="ko">고 있어요</span>.
                Notice the space: <span lang="ko">고</span> sticks to the verb, and <span lang="ko">있어요</span> is a
                separate word.
            </p>
            <Example
                words={[chip(W('지금', 'now')), chip(W('뭐', 'what')), chip(W('하', 'do', '하다'), P('고', '-ing (links the verb to 있다)')), chip(P('있어요', 'is ...ing, polite'))]}
                translation="What are you doing right now?"
            />
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('밥', 'rice, a meal'), P('을', 'object')), chip(W('먹', 'eat', '먹다'), P('고', '-ing (links the verb to 있다)')), chip(P('있어요', 'is ...ing, polite'))]}
                translation="I'm eating."
            />
            <Example
                words={[chip(W('친구', 'friend'), P('가', 'subject')), chip(W('음악', 'music'), P('을', 'object')), chip(W('듣', 'listen', '듣다'), P('고', '-ing (links the verb to 있다)')), chip(P('있어요', 'is ...ing, polite'))]}
                translation="My friend is listening to music."
                note="듣다 changes in the 요 form (들어요), but before 고 the stem stays the same: 듣고."
            />
            <Example
                words={[chip(W('비', 'rain'), P('가', 'subject')), chip(W('오', 'come, fall', '오다'), P('고', '-ing (links the verb to 있다)')), chip(P('있어요', 'is ...ing, polite'))]}
                translation="It's raining."
            />

            <h2 id="ongoing">2. Ongoing actions: &ldquo;these days&rdquo;</h2>
            <p>
                Just like English, <span lang="ko">고 있다</span> is not only for this exact second. It also works for
                things you are in the middle of these days.
            </p>
            <Example
                words={[chip(W('요즘', 'these days')), chip(W('한국어', 'Korean (language)'), P('를', 'object')), chip(W('배우', 'learn', '배우다'), P('고', '-ing (links the verb to 있다)')), chip(P('있어요', 'is ...ing, polite'))]}
                translation="I'm learning Korean these days."
            />
            <p>
                With verbs for putting on clothes, like <span lang="ko">입다</span> (put on) and{' '}
                <span lang="ko">쓰다</span> (put on glasses or a hat), <span lang="ko">고 있다</span> usually describes
                what someone is wearing.
            </p>
            <Example
                words={[chip(W('민지', 'Minji (a name)'), P('는', 'topic')), chip(W('오늘', 'today')), chip(W('청바지', 'jeans'), P('를', 'object')), chip(W('입', 'put on, wear', '입다'), P('고', '-ing (links the verb to 있다)')), chip(P('있어요', 'is ...ing, polite'))]}
                translation="Minji is wearing jeans today."
            />

            <h2 id="past">3. Past: 고 있었어요 (was doing)</h2>
            <p>
                To say what you were doing at some moment in the past, keep the verb as it is and put the past tense
                on <span lang="ko">있다</span>: <span lang="ko">있었어요</span>.
            </p>
            <Example
                words={[chip(W('아까', 'a little while ago')), chip(W('전화했을', 'called (+ 을 때 = when)', '전화하다')), chip(W('때', 'when, time')), chip(W('샤워하', 'shower', '샤워하다'), P('고', '-ing (links the verb to 있다)')), chip(P('있었어요', 'was ...ing, polite past'))]}
                translation="When you called earlier, I was taking a shower."
            />

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Dictionary form</th><th>Is doing</th><th>Was doing</th><th>Honorific</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다 (go)</td><td lang="ko">가고 있어요</td><td lang="ko">가고 있었어요</td><td lang="ko">가고 계세요</td></tr>
                        <tr><td lang="ko">먹다 (eat)</td><td lang="ko">먹고 있어요</td><td lang="ko">먹고 있었어요</td><td lang="ko">드시고 계세요</td></tr>
                        <tr><td lang="ko">듣다 (listen)</td><td lang="ko">듣고 있어요</td><td lang="ko">듣고 있었어요</td><td lang="ko">듣고 계세요</td></tr>
                        <tr><td lang="ko">하다 (do)</td><td lang="ko">하고 있어요</td><td lang="ko">하고 있었어요</td><td lang="ko">하고 계세요</td></tr>
                        <tr><td lang="ko">읽다 (read)</td><td lang="ko">읽고 있어요</td><td lang="ko">읽고 있었어요</td><td lang="ko">읽고 계세요</td></tr>
                    </tbody>
                </table>
            </div>
            <Tutor>
                The verb in front of <span lang="ko">고</span> never changes. All the work happens on{' '}
                <span lang="ko">있다</span>: present, past, polite, casual. Learn one verb, and you know them all!
            </Tutor>

            <h2 id="honorific">4. Respectful: 고 계세요</h2>
            <p>
                When the person doing the action is older or higher in status, like a grandparent or a boss, swap{' '}
                <span lang="ko">있어요</span> for its respectful partner <span lang="ko">계세요</span>. A few verbs also
                have their own respectful word, like <span lang="ko">드시다</span> for eating. Never use it about
                yourself.
            </p>
            <Example
                words={[chip(W('아버지', 'father'), P('께서', 'subject (honorific)')), chip(W('신문', 'newspaper'), P('을', 'object')), chip(W('읽', 'read', '읽다'), P('고', '-ing (links the verb to 있다)')), chip(P('계세요', 'is ...ing (honorific)'))]}
                translation="My father is reading the newspaper."
            />

            <h2 id="plain">5. The plain present can mean -ing too</h2>
            <p>
                Here is good news. You do not always need <span lang="ko">고 있다</span>. The ordinary present tense
                in Korean covers both &ldquo;I do&rdquo; and &ldquo;I am doing&rdquo;. Koreans say{' '}
                <span lang="ko">뭐 해요?</span> for &ldquo;What are you doing?&rdquo; all the time.
            </p>
            <Example
                words={[chip(W('지금', 'now')), chip(W('뭐', 'what')), chip(W('해요', 'do (polite)', '하다'))]}
                translation="What are you doing now?"
                note="Same meaning as 지금 뭐 하고 있어요? Shorter and very common in daily talk."
            />
            <Example
                words={[chip(W('지금', 'now')), chip(W('가요', 'go (polite)', '가다'))]}
                translation="I'm on my way now! (I'm going now.)"
            />
            <Tutor>
                Use <span lang="ko">고 있어요</span> when you want to stress &ldquo;right now, in the middle of
                it&rdquo;. For everything else, the plain <span lang="ko">해요</span> form is perfectly fine.
            </Tutor>

            <TryIt placeholder="예: 저는 지금 한국 노래를 듣고 있어요." />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Songs love <span lang="ko">고 있어요</span>: &ldquo;I&rsquo;m waiting for you&rdquo;, &ldquo;I&rsquo;m
                thinking of you&rdquo;. Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line to see
                every ending explained. Next, review the{' '}
                <Link href="/learn/korean-present-tense-a-yo-eo-yo">Korean present tense</Link>, learn the{' '}
                <Link href="/learn/korean-past-tense">past tense</Link>, or see how respect works in{' '}
                <Link href="/learn/korean-honorific-eusi">honorific 시</Link>.
            </p>
        </>
    );
}
