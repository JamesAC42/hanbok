import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-a-eo-boda-try',
    language: 'ko',
    title: 'Korean -아/어 보다: "Try Doing" and "Have You Ever"',
    shortTitle: 'Try doing (-아/어 보다)',
    description: 'Learn -아/어 보다 to say "try doing" in Korean: 먹어 보세요 (try it), 먹어 봤어요 (I have tried it) and 가 본 적 있어요? (have you ever been?), plus when to write it with a space.',
    level: 'Intermediate',
    topic: 'expressing',
    minutes: 8,
    published: '2026-10-11',
    color: 'und',
    grammar: [
        { form: '-아/어 보다', label: 'try doing, give it a go' },
        { form: '-아/어 보세요', label: 'try it (polite suggestion)' },
        { form: '-아/어 봤어요', label: 'have tried, have done before' },
        { form: '-아/어 본 적 있다', label: 'have ever done' },
    ],
};

export const faq = [
    {
        q: 'What does 아/어 보다 mean in Korean?',
        a: 'It means "try doing" or "give it a go". Take the polite verb form without 요 and add 보다: 먹어 보다 (try eating), 가 보다 (try going). The 보다 part then changes like any verb: 먹어 보세요, 먹어 봤어요.',
    },
    {
        q: 'How do you say "have you ever" in Korean?',
        a: 'Use 아/어 본 적 있어요?: 한국에 가 본 적 있어요? (Have you ever been to Korea?). Answer 네, 있어요 or 네, 가 봤어요. For "never", say 가 본 적 없어요.',
    },
    {
        q: 'Is it 먹어 보다 or 먹어보다?',
        a: 'Both are accepted. The standard rule is to write a space (먹어 보다), but writing it together (먹어보다) is officially allowed and very common online.',
    },
    {
        q: 'What is the difference between 먹었어요 and 먹어 봤어요?',
        a: '먹었어요 just reports that you ate something. 먹어 봤어요 talks about experience: "I have tried it" or "I have had it before".',
    },
];

export const quiz = [
    {
        prompt: '입다 (to wear) + 아/어 보세요 = ?',
        hint: 'Please try it on.',
        choices: ['입아 보세요', '입어 보세요'],
        answer: 1,
        why: 'The polite form is 입어요, so drop 요 and add 보세요: 입어 보세요.',
    },
    {
        prompt: '"Have you ever been to Busan?" 부산에 ___?',
        choices: ['가 본 적 있어요', '가 보는 적 있어요'],
        answer: 0,
        why: '"Have ever" always uses the past modifier 본 before 적: 가 본 적 있어요.',
    },
    {
        prompt: 'A friend says this song is great. 한번 ___',
        hint: '듣다 = to listen',
        choices: ['듣어 보세요', '들어 보세요', '들어 봐세요'],
        answer: 1,
        why: '듣다 is irregular: its polite form is 들어요. So 들어 + 보세요. 보다 + 세요 is always 보세요.',
    },
    {
        prompt: 'Which one means "I have tried makgeolli (before)"?',
        choices: ['막걸리를 마셔 봤어요', '막걸리를 마셔 봐요'],
        answer: 0,
        why: 'Experience in the past uses 봤어요. 마셔 봐요 means "I try drinking it" or "Try drinking it".',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    To say &ldquo;try doing&rdquo;, take the polite verb form, drop <span lang="ko">요</span>, and add{' '}
                    <span lang="ko">보다</span>: <span lang="ko">먹어요 → 먹어 보다</span>. Then{' '}
                    <span lang="ko">먹어 보세요</span> = &ldquo;try it&rdquo;, <span lang="ko">먹어 봤어요</span> =
                    &ldquo;I&rsquo;ve tried it&rdquo;, and <span lang="ko">먹어 본 적 있어요?</span> = &ldquo;have you
                    ever had it?&rdquo;
                </p>
            </section>

            <p>
                <span lang="ko">보다</span> on its own means &ldquo;to see&rdquo; or &ldquo;to look&rdquo;. After
                another verb, it becomes a helper meaning &ldquo;do it and see how it goes&rdquo;. It is one of the
                friendliest patterns in Korean: you will hear it at every market stall, restaurant and fitting room.
                Tap the chips below to see each part.
            </p>

            <h2 id="form">1. Making 아/어 보다</h2>
            <p>
                If you know the <Link href="/learn/korean-present-tense-a-yo-eo-yo">polite present tense</Link>,
                you already know the first half. Take that form, remove <span lang="ko">요</span>, and add{' '}
                <span lang="ko">보다</span>. Only <span lang="ko">보다</span> changes after that.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Dictionary form</th><th>Try doing</th><th>Try it! (polite)</th><th>Have tried</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다 (go)</td><td lang="ko">가 보다</td><td lang="ko">가 보세요</td><td lang="ko">가 봤어요</td></tr>
                        <tr><td lang="ko">먹다 (eat)</td><td lang="ko">먹어 보다</td><td lang="ko">먹어 보세요</td><td lang="ko">먹어 봤어요</td></tr>
                        <tr><td lang="ko">입다 (wear)</td><td lang="ko">입어 보다</td><td lang="ko">입어 보세요</td><td lang="ko">입어 봤어요</td></tr>
                        <tr><td lang="ko">마시다 (drink)</td><td lang="ko">마셔 보다</td><td lang="ko">마셔 보세요</td><td lang="ko">마셔 봤어요</td></tr>
                        <tr><td lang="ko">하다 (do)</td><td lang="ko">해 보다</td><td lang="ko">해 보세요</td><td lang="ko">해 봤어요</td></tr>
                        <tr><td lang="ko">듣다 (listen)</td><td lang="ko">들어 보다</td><td lang="ko">들어 보세요</td><td lang="ko">들어 봤어요</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                Remember that <span lang="ko">보 + 아요</span> shortens to <span lang="ko">봐요</span>, and the past
                is <span lang="ko">봤어요</span>. This pattern works with action verbs, not adjectives.
            </p>

            <h2 id="suggest">2. &ldquo;Give it a try&rdquo;: 한번 해 보세요</h2>
            <p>
                <span lang="ko">아/어 보세요</span> is a warm, polite way to suggest something. Koreans often add{' '}
                <span lang="ko">한번</span> (&ldquo;once&rdquo;), which works like &ldquo;go on, give it a go&rdquo;.
            </p>
            <Example
                words={[chip(W('이', 'this')), chip(W('김치', 'kimchi')), chip(W('한번', 'once, give it a go')), chip(W('먹', 'eat', '먹다'), P('어', 'connector (아/어) before 보다')), chip(W('보', 'try (helper verb)', '보다'), P('세요', 'please (polite request)'))]}
                translation="Give this kimchi a try."
            />
            <Example
                words={[chip(W('어렵', 'difficult', '어렵다'), P('지', 'part of 지 않다 (not)')), chip(W('않아요', 'not', '않다')), chip(W('한번', 'once, give it a go')), chip(W('해', 'do', '하다')), chip(W('보', 'try (helper verb)', '보다'), P('세요', 'please (polite request)'))]}
                translation="It's not hard. Give it a try."
            />
            <Example
                words={[chip(W('이', 'this')), chip(W('옷', 'clothes')), chip(W('입', 'wear, put on', '입다'), P('어', 'connector before 보다')), chip(W('봐', 'try', '보다'), P('도', 'even if (with 돼요: may I)')), chip(W('돼요', 'is it okay', '되다'))]}
                translation="Can I try this on?"
                note="The fitting-room question. 아/어도 돼요 asks for permission."
            />
            <Example
                words={[chip(W('제', 'I (humble)', '저'), P('가', 'subject')), chip(W('한번', 'once, give it a go')), chip(W('해', 'do', '하다')), chip(W('볼게요', 'will try (I promise)', '보다'))]}
                translation="I'll give it a try."
            />
            <Tutor>
                When a Korean grandma says <span lang="ko">먹어 봐요!</span> and pushes a plate toward you, it is not
                really a question. Take a bite!
            </Tutor>

            <h2 id="tried">3. &ldquo;I&rsquo;ve tried it&rdquo;: 아/어 봤어요</h2>
            <p>
                Put <span lang="ko">보다</span> in the <Link href="/learn/korean-past-tense">past tense</Link> and
                you talk about experience. Compare:
            </p>
            <ul className={styles.list}>
                <li><span lang="ko">막걸리를 마셨어요</span>: I drank makgeolli (a simple event).</li>
                <li><span lang="ko">막걸리를 마셔 봤어요</span>: I&rsquo;ve tried makgeolli (I know what it is like).</li>
            </ul>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('막걸리', 'makgeolli (rice wine)'), P('를', 'object')), chip(W('마셔', 'drink', '마시다')), chip(W('봤어요', 'tried (past of 보다)', '보다'))]}
                translation="I've tried makgeolli."
            />
            <Example
                words={[chip(W('이', 'this')), chip(W('노래', 'song')), chip(W('들어', 'listen', '듣다')), chip(W('봤어요', 'tried, have done (past of 보다)', '보다'))]}
                translation="Have you heard this song?"
                note="Same sentence for question and answer. Your voice goes up for the question."
            />

            <h2 id="ever">4. &ldquo;Have you ever...?&rdquo;: 아/어 본 적 있어요?</h2>
            <p>
                For &ldquo;have you ever&rdquo;, add <span lang="ko">본 적 있어요?</span>. Here{' '}
                <span lang="ko">본</span> is <span lang="ko">보다</span> as a past describing word (&ldquo;that
                tried&rdquo;), and <span lang="ko">적</span> means &ldquo;a time, an occasion&rdquo;. So it literally
                asks: &ldquo;Is there a time you tried going?&rdquo;
            </p>
            <Example
                words={[chip(W('한국', 'Korea'), P('에', 'to')), chip(W('가', 'go', '가다')), chip(W('본', 'tried (보다 + ㄴ, past describing form)', '보다')), chip(W('적', 'time, occasion')), chip(W('있어요', 'there is', '있다'))]}
                translation="Have you ever been to Korea?"
            />
            <Example
                words={[chip(W('아니요', 'no')), chip(W('아직', 'yet, still')), chip(W('가', 'go', '가다')), chip(W('본', 'tried (past describing form)', '보다')), chip(W('적', 'time, occasion')), chip(W('없어요', 'there is not', '없다'))]}
                translation="No, I've never been yet."
            />
            <p>
                To answer &ldquo;yes&rdquo;, you can say <span lang="ko">네, 있어요</span> or{' '}
                <span lang="ko">네, 가 봤어요</span>. You will also hear <span lang="ko">간 적 있어요</span> without{' '}
                <span lang="ko">보다</span>. It means nearly the same thing. The <span lang="ko">보다</span> version
                just puts a little more weight on trying it out.
            </p>
            <p>
                You can even combine the pattern with{' '}
                <Link href="/learn/korean-go-sipda-want-to">고 싶다</Link>:
            </p>
            <Example
                words={[chip(W('떡볶이', 'tteokbokki (spicy rice cakes)'), P('를', 'object')), chip(W('먹', 'eat', '먹다'), P('어', 'connector before 보다')), chip(W('보', 'try (helper verb)', '보다'), P('고', 'connector for 싶다')), chip(W('싶어요', 'want', '싶다'))]}
                translation="I want to try tteokbokki."
            />

            <h2 id="spacing">5. A note on spacing: 먹어 보다 or 먹어보다?</h2>
            <p>
                Official Korean spelling says to write helper verbs like <span lang="ko">보다</span> with a space:{' '}
                <span lang="ko">먹어 보다</span>, <span lang="ko">가 봤어요</span>. Writing them together, as{' '}
                <span lang="ko">먹어보다</span>, is also officially allowed, and you will see it all the time in texts
                and lyrics. Both are correct, so don&rsquo;t worry if you see either one.
            </p>
            <Tutor>
                One thing to keep straight: <span lang="ko">영화를 봐요</span> is just &ldquo;I watch a
                movie&rdquo;. It only means &ldquo;try&rdquo; when another verb comes right before{' '}
                <span lang="ko">보다</span>.
            </Tutor>

            <TryIt placeholder="예: 저는 삼계탕을 먹어 봤어요." />

            <h2 id="next">Keep going</h2>
            <p>
                Songs love this pattern: &ldquo;try to forget&rdquo;, &ldquo;look at me&rdquo;, &ldquo;have you ever
                loved&rdquo;. Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line to spot{' '}
                <span lang="ko">보다</span> after another verb. Next, learn how to say what you plan to do with{' '}
                <Link href="/learn/korean-euryeogo-in-order-to">(으)려고 (in order to)</Link>, or practice wishes with{' '}
                <Link href="/learn/korean-go-sipda-want-to">고 싶다 (want to)</Link>.
            </p>
        </>
    );
}
