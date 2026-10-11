import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-aya-hada-have-to',
    language: 'ko',
    title: 'Korean "Have To": -아/어야 하다 and 해야 돼요 Explained',
    shortTitle: 'Saying "have to" (-아/어야 하다)',
    description: 'Learn how to say "have to" and "must" in Korean with -아/어야 하다 and -아/어야 되다, from 가야 해요 to 해야 했어요, plus how to say "you don\'t have to".',
    level: 'Beginner',
    topic: 'expressing',
    minutes: 7,
    published: '2026-10-11',
    color: 'keep',
    grammar: [
        { form: '-아/어야 하다', label: 'have to, must' },
        { form: '-아/어야 되다', label: 'have to, must (very common in speech)' },
        { form: '-아/어야 했다', label: 'had to' },
        { form: '-지 않아도 되다', label: "don't have to" },
    ],
};

export const faq = [
    {
        q: 'How do you say "have to" or "must" in Korean?',
        a: 'Add 아야 or 어야 to the verb stem, then 해요 or 돼요: 가야 해요 (I have to go), 먹어야 해요 (I have to eat). For 하다 verbs it becomes 해야 해요 (I have to do it).',
    },
    {
        q: 'What is the difference between 해야 해요 and 해야 돼요?',
        a: 'They mean the same thing: "I have to do it." 해야 돼요 is very common in everyday speech. 해야 해요 is just as correct and a little more common in writing. Use whichever you like.',
    },
    {
        q: 'How do you say "you don\'t have to" in Korean?',
        a: 'Use -지 않아도 돼요, or the short form 안 -아/어도 돼요. Both mean "it\'s okay not to": 안 가도 돼요 (you don\'t have to go), 걱정하지 않아도 돼요 (you don\'t have to worry).',
    },
    {
        q: 'How do you say "must not" in Korean?',
        a: 'Not with 아/어야. Use -(으)면 안 돼요, which literally means "if you do it, it is not okay": 여기서 사진 찍으면 안 돼요 (You must not take photos here).',
    },
];

export const quiz = [
    {
        prompt: '먹다 (eat) + "have to" = ?',
        hint: 'The last vowel in 먹 is ㅓ.',
        choices: ['먹어야 해요', '먹아야 해요'],
        answer: 0,
        why: '먹 has the vowel ㅓ, so it takes 어야, just like 먹어요. Only ㅏ and ㅗ take 아야.',
    },
    {
        prompt: '공부하다 (study) + "have to" = ?',
        choices: ['공부하야 해요', '공부해야 해요'],
        answer: 1,
        why: '하다 always becomes 해: 해야 해요. So 공부하다 becomes 공부해야 해요.',
    },
    {
        prompt: '"I had to wait." = ?',
        hint: '기다리다 = to wait',
        choices: ['기다려야 했어요', '기다려야 해요'],
        answer: 0,
        why: 'The past tense goes on 하다 at the end: 했어요. 기다려야 해요 means "I have to wait" now.',
    },
    {
        prompt: '"You don\'t have to come." = ?',
        choices: ['안 와도 돼요', '안 와야 해요'],
        answer: 0,
        why: '안 와도 돼요 means "it\'s okay if you don\'t come." 안 와야 해요 would mean "you have to not come", which is not what you want to say.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    To say &ldquo;have to&rdquo; or &ldquo;must&rdquo;, add <span lang="ko">아야 해요</span> or{' '}
                    <span lang="ko">어야 해요</span> to a verb stem: <span lang="ko">가야 해요</span> (I have to go),{' '}
                    <span lang="ko">먹어야 해요</span> (I have to eat). <span lang="ko">해요</span> can be swapped for{' '}
                    <span lang="ko">돼요</span> with no change in meaning: <span lang="ko">가야 돼요</span>.
                </p>
            </section>

            <p>
                The ending <span lang="ko">아/어야</span> means &ldquo;only if&rdquo;. So{' '}
                <span lang="ko">가야 해요</span> is literally &ldquo;only if I go, it works&rdquo;. In other words: I
                have to go. If you already know the present tense <span lang="ko">아요/어요</span>, you already know
                how to pick <span lang="ko">아</span> or <span lang="ko">어</span>. Tap the chips below to see each
                part.
            </p>

            <h2 id="aya">1. Verb + 아/어야 해요</h2>
            <p>
                Use the same vowel rule as the present tense. If you can say <span lang="ko">가요</span>, you can say{' '}
                <span lang="ko">가야 해요</span>. If you can say <span lang="ko">먹어요</span>, you can say{' '}
                <span lang="ko">먹어야 해요</span>. Just swap <span lang="ko">요</span> for{' '}
                <span lang="ko">야 해요</span>.
            </p>
            <ul className={styles.list}>
                <li>Last vowel is <strong>ㅏ or ㅗ</strong>: add <span lang="ko">아야</span>. <span lang="ko">가다</span> becomes <span lang="ko">가야 해요</span>.</li>
                <li><strong>Any other vowel</strong>: add <span lang="ko">어야</span>. <span lang="ko">먹다</span> becomes <span lang="ko">먹어야 해요</span>.</li>
                <li><strong>하다 verbs</strong>: <span lang="ko">하다</span> becomes <span lang="ko">해야</span>. <span lang="ko">공부하다</span> becomes <span lang="ko">공부해야 해요</span>.</li>
            </ul>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('지금', 'now')), chip(W('가', 'go', '가다'), P('야', 'have to: 아야 (아 merges into 가)')), chip(P('해요', 'part of 아/어야 하다 (polite)'))]}
                translation="I have to go now."
            />
            <Example
                words={[chip(W('하루', 'a day'), P('에', 'per')), chip(W('세', 'three (before a counter)')), chip(W('번', 'times')), chip(W('약', 'medicine'), P('을', 'object')), chip(W('먹', 'eat, take (medicine)', '먹다'), P('어야', 'have to: 어야 after ㅓ')), chip(P('해요', 'part of 아/어야 하다 (polite)'))]}
                translation="You have to take the medicine three times a day."
                note="Korean 'eats' medicine: 약을 먹다 means to take medicine."
            />
            <Example
                words={[chip(W('내일', 'tomorrow'), P('은', 'topic, contrast')), chip(W('일찍', 'early')), chip(W('일어나', 'get up', '일어나다'), P('야', 'have to: 아야 (아 merges into 나)')), chip(P('해요', 'part of 아/어야 하다 (polite)'))]}
                translation="I have to get up early tomorrow."
            />

            <h2 id="dwae">2. 해야 해요 or 해야 돼요?</h2>
            <p>
                You will hear <span lang="ko">돼요</span> (from <span lang="ko">되다</span>) in place of{' '}
                <span lang="ko">해요</span> all the time. The meaning is the same. In casual chat,{' '}
                <span lang="ko">돼요</span> is probably the more common one. Both are correct, so use whichever comes
                out first.
            </p>
            <Example
                words={[chip(W('오늘', 'today')), chip(W('숙제', 'homework'), P('를', 'object')), chip(W('해', 'do', '하다'), P('야', 'have to: 하다 becomes 해, then 야')), chip(P('돼요', 'part of 아/어야 되다 (polite)'))]}
                translation="I have to do my homework today."
            />
            <Example
                words={[chip(W('몇', 'what, how many')), chip(W('시', "o'clock"), P('까지', 'until, by')), chip(W('와', 'come', '오다'), P('야', 'have to: 오 + 아야 becomes 와야')), chip(P('돼요', 'part of 아/어야 되다 (polite)'))]}
                translation="What time do I have to be there by?"
                note="Literally 'By what time do I have to come?'"
            />

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Dictionary form</th><th>Have to</th><th>Had to</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다 (go)</td><td lang="ko">가야 해요</td><td lang="ko">가야 했어요</td></tr>
                        <tr><td lang="ko">오다 (come)</td><td lang="ko">와야 해요</td><td lang="ko">와야 했어요</td></tr>
                        <tr><td lang="ko">먹다 (eat)</td><td lang="ko">먹어야 해요</td><td lang="ko">먹어야 했어요</td></tr>
                        <tr><td lang="ko">마시다 (drink)</td><td lang="ko">마셔야 해요</td><td lang="ko">마셔야 했어요</td></tr>
                        <tr><td lang="ko">기다리다 (wait)</td><td lang="ko">기다려야 해요</td><td lang="ko">기다려야 했어요</td></tr>
                        <tr><td lang="ko">쓰다 (write)</td><td lang="ko">써야 해요</td><td lang="ko">써야 했어요</td></tr>
                        <tr><td lang="ko">하다 (do)</td><td lang="ko">해야 해요</td><td lang="ko">해야 했어요</td></tr>
                        <tr><td lang="ko">일하다 (work)</td><td lang="ko">일해야 해요</td><td lang="ko">일해야 했어요</td></tr>
                    </tbody>
                </table>
            </div>
            <Tutor>
                Shortcut: take the polite <span lang="ko">요</span> form, drop <span lang="ko">요</span>, add{' '}
                <span lang="ko">야 해요</span>. <span lang="ko">마셔요</span> becomes <span lang="ko">마셔야
                해요</span>. Same vowels, same shortcuts, nothing new to memorize!
            </Tutor>

            <h2 id="past">3. Had to: 아/어야 했어요</h2>
            <p>
                For the past, leave <span lang="ko">아/어야</span> alone and put the past tense on the last word:{' '}
                <span lang="ko">해요</span> becomes <span lang="ko">했어요</span>, and <span lang="ko">돼요</span>{' '}
                becomes <span lang="ko">됐어요</span>.
            </p>
            <Example
                words={[chip(W('어제', 'yesterday')), chip(W('늦게', 'late'), P('까지', 'until')), chip(W('일해', 'work', '일하다'), P('야', 'have to: 하다 becomes 해, then 야')), chip(P('했어요', 'past of 하다: "had to" (polite)'))]}
                translation="I had to work late yesterday."
            />
            <Example
                words={[chip(W('버스', 'bus'), P('가', 'subject')), chip(W('안', 'not')), chip(W('와서', 'come, so', '오다')), chip(W('한', 'one (before a counter)', '하나')), chip(W('시간', 'hour'), P('이나', 'as much as (surprise at the amount)')), chip(W('기다려', 'wait', '기다리다'), P('야', 'have to: 기다리 + 어야 becomes 기다려야')), chip(P('했어요', 'past of 하다: "had to" (polite)'))]}
                translation="The bus didn't come, so I had to wait a whole hour."
            />

            <h2 id="dont-have-to">4. Don&rsquo;t have to: 안 -아/어도 돼요</h2>
            <p>
                Careful here. &ldquo;Don&rsquo;t have to&rdquo; does <strong>not</strong> use{' '}
                <span lang="ko">아/어야</span>. Instead, Korean says &ldquo;it&rsquo;s okay even if you don&rsquo;t&rdquo;:
            </p>
            <ul className={styles.list}>
                <li>Short form: <span lang="ko">안</span> + verb + <span lang="ko">아/어도 돼요</span>. <span lang="ko">안 가도 돼요</span> (you don&rsquo;t have to go).</li>
                <li>Long form: stem + <span lang="ko">지 않아도 돼요</span>. <span lang="ko">가지 않아도 돼요</span>. Same meaning, a bit more careful.</li>
            </ul>
            <Example
                words={[chip(W('내일', 'tomorrow'), P('은', 'topic, contrast')), chip(W('학교', 'school'), P('에', 'to')), chip(W('안', 'not')), chip(W('가', 'go', '가다'), P('도', 'even if: 아/어도 (아 merges into 가)')), chip(W('돼요', 'it is okay', '되다'))]}
                translation="I don't have to go to school tomorrow."
            />
            <Example
                words={[chip(W('걱정하', 'worry', '걱정하다'), P('지', '-지, links the verb to 않다')), chip(W('않', 'not', '않다'), P('아도', 'even if: 아/어도')), chip(W('돼요', 'it is okay', '되다'))]}
                translation="You don't have to worry."
            />
            <Tutor>
                And for &ldquo;must <strong>not</strong>&rdquo;, Koreans say &ldquo;if you do it, it&rsquo;s not
                okay&rdquo;: <span lang="ko">여기서 사진 찍으면 안 돼요</span> (You must not take photos here). See{' '}
                <Link href="/learn/korean-myeon-if">-(으)면 (if)</Link> for how that works.
            </Tutor>

            <TryIt placeholder="예: 저는 오늘 청소해야 해요." />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Love songs are full of &ldquo;I have to let you go&rdquo; and &ldquo;I have to forget you&rdquo;. Look
                for <span lang="ko">야 해</span> at the end of a line. Open a song in{' '}
                <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line to see every ending explained. Next, learn how
                to say &ldquo;can&rdquo; with <Link href="/learn/korean-eul-su-itda-can">-(으)ㄹ 수 있다</Link>, or
                review the vowel rules in the{' '}
                <Link href="/learn/korean-present-tense-a-yo-eo-yo">Korean present tense</Link>.
            </p>
        </>
    );
}
