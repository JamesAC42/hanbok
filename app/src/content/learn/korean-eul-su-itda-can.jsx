import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-eul-su-itda-can',
    language: 'ko',
    title: 'Korean "Can" and "Can\'t": -(으)ㄹ 수 있다 / 없다 Explained',
    shortTitle: 'Saying "can" (-(으)ㄹ 수 있다)',
    description: 'Learn how to say "can" and "can\'t" in Korean with -(으)ㄹ 수 있다 and 없다. Build 갈 수 있어요 and 먹을 수 있어요, compare it with 못, and meet 할 줄 알다.',
    level: 'Beginner',
    topic: 'expressing',
    minutes: 7,
    published: '2026-10-11',
    color: 'und',
    grammar: [
        { form: '-(으)ㄹ 수 있다', label: 'can, be able to' },
        { form: '-(으)ㄹ 수 없다', label: "can't, be unable to" },
        { form: '-(으)ㄹ 수도 있다', label: 'might, could (possibility)' },
        { form: '-(으)ㄹ 줄 알다/모르다', label: 'know / not know how to' },
    ],
};

export const faq = [
    {
        q: 'How do you say "can" in Korean?',
        a: 'Add ㄹ 수 있다 to a verb stem ending in a vowel, or 을 수 있다 after a consonant. In polite speech: 갈 수 있어요 (I can go), 먹을 수 있어요 (I can eat).',
    },
    {
        q: 'How do you say "can\'t" in Korean?',
        a: 'Swap 있다 for 없다: 갈 수 없어요 (I can\'t go). You can also put 못 in front of the verb: 못 가요. Both mean the same thing. 못 is shorter and very common in speech.',
    },
    {
        q: 'What is the difference between 할 수 있다 and 할 줄 알다?',
        a: '할 수 있다 means you are able to do something right now or in this situation. 할 줄 알다 means you know how, because you learned the skill: 운전할 줄 알아요 (I know how to drive).',
    },
    {
        q: 'Why is it 만들 수 있어요 and not 만들을 수 있어요?',
        a: 'Verbs whose stem ends in ㄹ, like 만들다, 살다 and 놀다, already have the ㄹ sound. You just add 수 있어요 straight after the stem: 만들 수 있어요, 살 수 있어요.',
    },
];

export const quiz = [
    {
        prompt: '먹다 (eat) + "can" = ?',
        hint: 'The stem 먹 ends in a consonant.',
        choices: ['먹을 수 있어요', '먹 수 있어요'],
        answer: 0,
        why: 'After a consonant, add 을: 먹 + 을 수 있어요. After a vowel you add ㄹ instead, like 갈 수 있어요.',
    },
    {
        prompt: '만들다 (make) + "can" = ?',
        choices: ['만들을 수 있어요', '만들 수 있어요'],
        answer: 1,
        why: 'The stem 만들 already ends in ㄹ, so nothing is added: 만들 수 있어요.',
    },
    {
        prompt: 'Which one means the same as 못 가요?',
        hint: "I can't go.",
        choices: ['갈 수 없어요', '안 가요'],
        answer: 0,
        why: '갈 수 없어요 and 못 가요 both mean "I can\'t go." 안 가요 means "I\'m not going", by choice.',
    },
    {
        prompt: '"I know how to cook." = ?',
        hint: '요리하다 = to cook',
        choices: ['요리할 줄 알아요', '요리할 수 알아요'],
        answer: 0,
        why: 'For a skill you learned, use 줄 with 알다: 요리할 줄 알아요. 수 goes with 있다 and 없다, not 알다.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    To say &ldquo;can&rdquo;, add <span lang="ko">ㄹ 수 있어요</span> to a verb stem that ends in a
                    vowel, or <span lang="ko">을 수 있어요</span> after a consonant: <span lang="ko">갈 수 있어요</span>{' '}
                    (I can go), <span lang="ko">먹을 수 있어요</span> (I can eat). For &ldquo;can&rsquo;t&rdquo;, change{' '}
                    <span lang="ko">있어요</span> to <span lang="ko">없어요</span>: <span lang="ko">갈 수 없어요</span>.
                </p>
            </section>

            <p>
                The word <span lang="ko">수</span> means something like &ldquo;a way&rdquo; or &ldquo;a means&rdquo;.
                So <span lang="ko">갈 수 있어요</span> is literally &ldquo;there is a way to go&rdquo;, and{' '}
                <span lang="ko">갈 수 없어요</span> is &ldquo;there is no way to go&rdquo;. Once you see it like that,
                the pattern makes a lot of sense. Tap the chips below to see each part.
            </p>

            <h2 id="can">1. Verb + (으)ㄹ 수 있어요: can</h2>
            <p>
                Take the dictionary form and drop <span lang="ko">다</span>. Then look at the last sound of the stem:
            </p>
            <ul className={styles.list}>
                <li>Ends in a <strong>vowel</strong>: add <span lang="ko">ㄹ</span> under it. <span lang="ko">가다</span> becomes <span lang="ko">갈 수 있어요</span>.</li>
                <li>Ends in a <strong>consonant</strong>: add <span lang="ko">을</span>. <span lang="ko">먹다</span> becomes <span lang="ko">먹을 수 있어요</span>.</li>
            </ul>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('한글', 'Hangul, the Korean alphabet'), P('을', 'object')), chip(W('읽', 'read', '읽다'), P('을', '을 after a consonant, links to 수')), chip(P('수', 'way, means (part of 을 수 있다)')), chip(P('있어요', 'there is: together, "can" (polite)'))]}
                translation="I can read Hangul."
            />
            <Example
                words={[chip(W('내일', 'tomorrow')), chip(W('갈', 'go (ㄹ added after the vowel)', '가다')), chip(P('수', 'way, means (part of ㄹ 수 있다)')), chip(P('있어요', 'there is: together, "can" (polite)'))]}
                translation="I can go tomorrow."
                note="Raise your voice at the end and it becomes a question: 내일 갈 수 있어요? (Can you go tomorrow?)"
            />

            <h2 id="cant">2. (으)ㄹ 수 없어요: can&rsquo;t</h2>
            <p>
                For &ldquo;can&rsquo;t&rdquo;, keep everything the same and swap <span lang="ko">있어요</span> (there
                is) for <span lang="ko">없어요</span> (there isn&rsquo;t). &ldquo;There is no way to...&rdquo;
            </p>
            <Example
                words={[chip(W('오늘', 'today'), P('은', 'topic, contrast')), chip(W('바빠서', 'busy, so', '바쁘다')), chip(W('만날', 'meet (ㄹ added after the vowel)', '만나다')), chip(P('수', 'way, means')), chip(P('없어요', "there isn't: together, \"can't\" (polite)"))]}
                translation="I'm busy today, so I can't meet."
            />
            <p>
                For the past, put the past tense on <span lang="ko">있다</span> or <span lang="ko">없다</span> at
                the end: <span lang="ko">갈 수 있었어요</span> (I could go), <span lang="ko">갈 수 없었어요</span> (I
                couldn&rsquo;t go).
            </p>
            <Example
                words={[chip(W('어젯밤', 'last night'), P('에', 'at (time)')), chip(W('잠', 'sleep (noun)'), P('을', 'object')), chip(W('잘', 'sleep (ㄹ added after the vowel)', '자다')), chip(P('수', 'way, means')), chip(P('없었어요', "there wasn't: together, \"couldn't\" (polite, past)"))]}
                translation="I couldn't sleep last night."
                note="This 잘 is 자다 (to sleep), not the adverb 잘 (well). Context makes it clear."
            />

            <h2 id="rieul">3. ㄹ-stem verbs: 만들 수 있어요</h2>
            <p>
                Some verbs already end in <span lang="ko">ㄹ</span>, like <span lang="ko">만들다</span> (make),{' '}
                <span lang="ko">살다</span> (live) and <span lang="ko">놀다</span> (play, hang out). The{' '}
                <span lang="ko">ㄹ</span> is already there, so you add nothing. Just put{' '}
                <span lang="ko">수 있어요</span> after the stem.
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('김치찌개', 'kimchi stew'), P('를', 'object')), chip(W('만들', 'make (stem already ends in ㄹ)', '만들다')), chip(P('수', 'way, means')), chip(P('있어요', 'there is: together, "can" (polite)'))]}
                translation="I can make kimchi stew."
            />

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Dictionary form</th><th>Can</th><th>Can&rsquo;t</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다 (go)</td><td lang="ko">갈 수 있어요</td><td lang="ko">갈 수 없어요</td></tr>
                        <tr><td lang="ko">하다 (do)</td><td lang="ko">할 수 있어요</td><td lang="ko">할 수 없어요</td></tr>
                        <tr><td lang="ko">먹다 (eat)</td><td lang="ko">먹을 수 있어요</td><td lang="ko">먹을 수 없어요</td></tr>
                        <tr><td lang="ko">읽다 (read)</td><td lang="ko">읽을 수 있어요</td><td lang="ko">읽을 수 없어요</td></tr>
                        <tr><td lang="ko">만들다 (make)</td><td lang="ko">만들 수 있어요</td><td lang="ko">만들 수 없어요</td></tr>
                        <tr><td lang="ko">살다 (live)</td><td lang="ko">살 수 있어요</td><td lang="ko">살 수 없어요</td></tr>
                        <tr><td lang="ko">듣다 (listen)</td><td lang="ko">들을 수 있어요</td><td lang="ko">들을 수 없어요</td></tr>
                        <tr><td lang="ko">돕다 (help)</td><td lang="ko">도울 수 있어요</td><td lang="ko">도울 수 없어요</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                The last two are irregular verbs. Their stems change shape before a vowel, just like they do in{' '}
                <span lang="ko">들어요</span> and <span lang="ko">도와요</span>. Don&rsquo;t worry about them too much
                yet. Tapping a word always shows you its dictionary form.
            </p>
            <Tutor>
                Say <span lang="ko">할 수 있어요!</span> out loud. It means &ldquo;I can do it!&rdquo;, and Koreans
                cheer each other on with it all the time. You can do it too!
            </Tutor>

            <h2 id="maybe">4. Possibility: &ldquo;it could happen&rdquo;</h2>
            <p>
                The same pattern also talks about what is <strong>possible</strong>, not just what someone is able to
                do. Adding <span lang="ko">도</span> (also, even) to <span lang="ko">수</span> gives{' '}
                <span lang="ko">수도 있어요</span>: &ldquo;it might&rdquo; or &ldquo;it could&rdquo;.
            </p>
            <Example
                words={[chip(W('내일', 'tomorrow')), chip(W('비', 'rain'), P('가', 'subject')), chip(W('올', 'come, fall (ㄹ added after the vowel)', '오다')), chip(P('수도', 'way + 도 (also): "might"')), chip(P('있어요', 'there is (polite)'))]}
                translation="It might rain tomorrow."
            />
            <Example
                words={[chip(W('그럴', 'be like that', '그렇다')), chip(P('수', 'way, means')), chip(P('있어요', 'there is: together, "can be" (polite)'))]}
                translation="That can happen. / That's understandable."
                note="A very common, kind reply when someone explains a mistake or a feeling."
            />

            <h2 id="mot">5. 수 없어요 vs 못</h2>
            <p>
                You may already know <span lang="ko">못</span>, which goes in front of a verb: <span lang="ko">못
                가요</span> (I can&rsquo;t go). It means the same as <span lang="ko">갈 수 없어요</span>. In everyday
                talk, <span lang="ko">못</span> is shorter and more common. <span lang="ko">수 없어요</span> sounds a
                little firmer and more careful, and you will see it a lot in writing and on signs.
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('수영', 'swimming')), chip(W('못', "can't")), chip(W('해요', 'do', '하다'))]}
                translation="I can't swim."
                note="With 하다 verbs, 못 goes between the noun and 해요: 수영 못 해요. The 수 form is 수영할 수 없어요."
            />
            <p>
                For more on <span lang="ko">못</span> and its cousin <span lang="ko">안</span>, see{' '}
                <Link href="/learn/korean-negation-an-vs-mot">안 vs 못 (don&rsquo;t vs can&rsquo;t)</Link>.
            </p>

            <h2 id="jul">6. Knowing how: 할 줄 알아요</h2>
            <p>
                When &ldquo;can&rdquo; means a <strong>skill you learned</strong>, like driving or playing piano,
                Koreans often use <span lang="ko">줄 알다</span> (know the way) instead. For &ldquo;don&rsquo;t know
                how&rdquo;, use <span lang="ko">모르다</span>: <span lang="ko">할 줄 몰라요</span>.
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('운전할', 'drive (ㄹ added after the vowel)', '운전하다')), chip(P('줄', 'the way, how (part of ㄹ 줄 알다)')), chip(W('알아요', 'know', '알다'))]}
                translation="I know how to drive."
            />
            <Example
                words={[chip(W('피아노', 'piano'), P('는', 'topic, contrast')), chip(W('칠', 'play (an instrument)', '치다')), chip(P('줄', 'the way, how')), chip(W('몰라요', "don't know", '모르다'))]}
                translation="I don't know how to play the piano."
            />
            <Tutor>
                Easy test: if you could say &ldquo;know how to&rdquo; in English, <span lang="ko">줄 알다</span> fits.
                If it&rsquo;s about time, health or the situation, stick with <span lang="ko">수 있다</span>.
            </Tutor>

            <TryIt placeholder="예: 저는 한국 노래를 부를 수 있어요." />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Songs say &ldquo;I can&rsquo;t live without you&rdquo; a lot, and in Korean that is{' '}
                <span lang="ko">수 없어</span>. Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line
                to see every part explained. Next, learn how to say &ldquo;have to&rdquo; with{' '}
                <Link href="/learn/korean-aya-hada-have-to">아/어야 하다</Link>, or review wishes with{' '}
                <Link href="/learn/korean-go-sipda-want-to">-고 싶다 (want to)</Link>.
            </p>
        </>
    );
}
