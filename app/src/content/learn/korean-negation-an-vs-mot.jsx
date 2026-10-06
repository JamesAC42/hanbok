import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-negation-an-vs-mot',
    language: 'ko',
    title: "Korean Negation: 안 vs 못 (Don't vs Can't) Explained",
    shortTitle: 'Saying no: 안 vs 못',
    description: 'Learn how to make any Korean sentence negative. When to use 안 (don\'t) and 못 (can\'t), the long forms -지 않아요 and -지 못해요, plus 아니에요 and 없어요.',
    level: 'Beginner',
    minutes: 8,
    published: '2026-10-07',
    color: 'read',
    grammar: [
        { form: '안', label: "not, don't (by choice)" },
        { form: '못', label: "can't (unable)" },
        { form: '-지 않다', label: 'not (long form)' },
        { form: '-지 못하다', label: 'cannot (long form)' },
        { form: '아니다', label: 'is not (with nouns)' },
        { form: '없다', label: "there isn't, don't have" },
    ],
};

export const faq = [
    {
        q: 'What is the difference between 안 and 못 in Korean?',
        a: '안 means you don\'t or won\'t do something, usually by choice. 못 means you can\'t, because something stops you. 안 가요 is "I\'m not going." 못 가요 is "I can\'t go."',
    },
    {
        q: 'Where does 안 go with 하다 verbs like 공부하다?',
        a: 'Between the noun and 하다: 공부 안 해요, not 안 공부해요. This only works when the front part is a noun, like 공부, 운동 or 요리. With words like 좋아하다, put 안 in front: 안 좋아해요.',
    },
    {
        q: 'What is the difference between 안 가요 and 가지 않아요?',
        a: 'They mean the same thing. The short form 안 가요 is more common in speech. The long form 가지 않아요 sounds a little more careful and is common in writing.',
    },
    {
        q: 'How do you say "is not" and "don\'t have" in Korean?',
        a: 'For "is not" with a noun, use 아니에요: 학생이 아니에요 (I\'m not a student). For "there isn\'t" or "don\'t have", use 없어요, the opposite of 있어요. Never say 안 있어요.',
    },
];

export const quiz = [
    {
        prompt: 'You don\'t like coffee, so you never drink it. Which fits?',
        hint: 'I don\'t drink coffee.',
        choices: ['커피를 안 마셔요', '커피를 못 마셔요'],
        answer: 0,
        why: 'It is your choice, so use 안. 못 마셔요 would mean something stops you, like a doctor\'s order.',
    },
    {
        prompt: 'How do you say "I don\'t study today" with 공부하다?',
        choices: ['오늘은 안 공부해요', '오늘은 공부 안 해요'],
        answer: 1,
        why: 'With noun + 하다 verbs, 안 goes right before 하다: 공부 안 해요.',
    },
    {
        prompt: 'Which means "I\'m not a teacher"?',
        choices: ['저는 선생님이 아니에요', '저는 선생님이 없어요'],
        answer: 0,
        why: '아니에요 says what something is not. 선생님이 없어요 means "I don\'t have a teacher."',
    },
    {
        prompt: 'Which means "I don\'t have money"?',
        choices: ['돈이 안 있어요', '돈이 없어요'],
        answer: 1,
        why: '있어요 has its own opposite word, 없어요. Koreans don\'t say 안 있어요.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    Put <span lang="ko">안</span> before a verb for &ldquo;don&rsquo;t&rdquo; or &ldquo;won&rsquo;t&rdquo;:{' '}
                    <span lang="ko">안 가요</span> (I&rsquo;m not going). Put <span lang="ko">못</span> before it for
                    &ldquo;can&rsquo;t&rdquo;: <span lang="ko">못 가요</span> (I can&rsquo;t go). For nouns, use{' '}
                    <span lang="ko">아니에요</span> (is not). For &ldquo;don&rsquo;t have,&rdquo; use{' '}
                    <span lang="ko">없어요</span>.
                </p>
            </section>

            <p>
                Saying &ldquo;no&rdquo; in Korean is easier than it looks. Most of the time you add one small word in front of
                the verb. The trick is picking the right word, because <span lang="ko">안</span> and{' '}
                <span lang="ko">못</span> tell the listener two different stories. Tap any word below to see what it means.
            </p>

            <h2 id="an">1. 안: don&rsquo;t, won&rsquo;t</h2>
            <p>
                <span lang="ko">안</span> is the everyday &ldquo;not.&rdquo; It usually means you are choosing not to do
                something, or it simply isn&rsquo;t happening. Put it right before the verb, with a space.
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('오늘', 'today')), chip(W('학교', 'school'), P('에', 'to')), chip(P('안', 'not (choice)')), chip(W('가요', 'go (polite)', '가다'))]}
                translation="I'm not going to school today."
            />
            <p>
                <span lang="ko">안</span> also works with describing words (adjectives), like <span lang="ko">비싸다</span>{' '}
                (to be expensive).
            </p>
            <Example
                words={[chip(W('이', 'this')), chip(W('가방', 'bag'), P('은', 'topic')), chip(P('안', 'not')), chip(W('비싸요', 'expensive (polite)', '비싸다'))]}
                translation="This bag isn't expensive."
            />

            <h2 id="mot">2. 못: can&rsquo;t</h2>
            <p>
                <span lang="ko">못</span> means you want to, or you tried, but something stops you: no time, no skill, bad
                luck. It goes in the same spot as <span lang="ko">안</span>.
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('오늘', 'today')), chip(W('학교', 'school'), P('에', 'to')), chip(P('못', "can't")), chip(W('가요', 'go (polite)', '가다'))]}
                translation="I can't go to school today."
                note="Compare this with the 안 sentence above. Only one word changed, but now it sounds like you are sick or busy."
            />
            <Example
                words={[chip(W('어젯밤', 'last night'), P('에', 'time')), chip(W('잠', 'sleep (noun)'), P('을', 'object')), chip(P('못', "couldn't")), chip(W('잤어요', 'slept (polite)', '자다'))]}
                translation="I couldn't sleep last night."
            />
            <p>
                One rule to remember: <span lang="ko">못</span> goes with actions, not descriptions. You can say{' '}
                <span lang="ko">안 비싸요</span> (not expensive), but never <span lang="ko">못 비싸요</span>.
            </p>
            <Tutor>
                Turning down an invitation? Use <span lang="ko">못</span>. <span lang="ko">오늘은 못 가요</span> (I
                can&rsquo;t go today) sounds kind and a little sorry. <span lang="ko">안 가요</span> can sound like
                &ldquo;I don&rsquo;t want to come.&rdquo; Ouch!
            </Tutor>

            <h2 id="hada">3. 하다 verbs: 안 goes in the middle</h2>
            <p>
                Many Korean verbs are a noun plus <span lang="ko">하다</span> (to do): <span lang="ko">공부하다</span>{' '}
                (study), <span lang="ko">운동하다</span> (exercise), <span lang="ko">요리하다</span> (cook). With these,{' '}
                <span lang="ko">안</span> and <span lang="ko">못</span> slip in between the noun and{' '}
                <span lang="ko">하다</span>.
            </p>
            <Example
                words={[chip(W('오늘', 'today'), P('은', 'topic, contrast')), chip(W('공부', 'study (noun)')), chip(P('안', 'not')), chip(W('해요', 'do (polite)', '하다'))]}
                translation="I'm not studying today."
                note="Say 공부 안 해요, not 안 공부해요."
            />
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('수영', 'swimming'), P('을', 'object')), chip(P('못', "can't")), chip(W('해요', 'do (polite)', '하다'))]}
                translation="I can't swim."
            />
            <p>
                This only works when the front part is a real noun. Words like <span lang="ko">좋아하다</span> (to like)
                keep <span lang="ko">안</span> in front: <span lang="ko">안 좋아해요</span> (I don&rsquo;t like it).
            </p>

            <h2 id="long-form">4. The long forms: -지 않아요 and -지 못해요</h2>
            <p>
                There is a second way to say the same thing. Take the verb stem, add <span lang="ko">-지</span>, then add{' '}
                <span lang="ko">않아요</span> (don&rsquo;t) or <span lang="ko">못해요</span> (can&rsquo;t). The meaning is the
                same as the short form. The long form sounds a bit more careful, and you will see it a lot in writing.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Verb</th><th>안 (short)</th><th>못 (short)</th><th>-지 않아요</th><th>-지 못해요</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다 (go)</td><td lang="ko">안 가요</td><td lang="ko">못 가요</td><td lang="ko">가지 않아요</td><td lang="ko">가지 못해요</td></tr>
                        <tr><td lang="ko">먹다 (eat)</td><td lang="ko">안 먹어요</td><td lang="ko">못 먹어요</td><td lang="ko">먹지 않아요</td><td lang="ko">먹지 못해요</td></tr>
                        <tr><td lang="ko">자다 (sleep)</td><td lang="ko">안 자요</td><td lang="ko">못 자요</td><td lang="ko">자지 않아요</td><td lang="ko">자지 못해요</td></tr>
                        <tr><td lang="ko">공부하다 (study)</td><td lang="ko">공부 안 해요</td><td lang="ko">공부 못 해요</td><td lang="ko">공부하지 않아요</td><td lang="ko">공부하지 못해요</td></tr>
                    </tbody>
                </table>
            </div>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('고기', 'meat'), P('를', 'object')), chip(W('먹', 'eat', '먹다'), P('지', '-지, links the verb to 않다 or 못하다')), chip(W('않아요', "don't (polite)", '않다'))]}
                translation="I don't eat meat."
            />
            <Example
                words={[chip(W('너무', 'too, so')), chip(W('바빠서', 'busy, so', '바쁘다')), chip(W('전화하', 'call', '전화하다'), P('지', '-지, links the verb to 않다 or 못하다')), chip(W('못했어요', "couldn't (polite, past)", '못하다'))]}
                translation="I was so busy I couldn't call."
                note="In the long form, the whole 하다 verb stays together: 전화하지, not 전화 안."
            />

            <h2 id="nouns">5. Nouns: 아니에요</h2>
            <p>
                To say something <em>is not</em> something, you don&rsquo;t use <span lang="ko">안</span> at all. Use{' '}
                <span lang="ko">아니에요</span>, the opposite of <span lang="ko">이에요/예요</span>. The noun before it takes{' '}
                <span lang="ko">이</span> or <span lang="ko">가</span>.
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('학생', 'student'), P('이', 'subject marker, used with 아니다')), chip(W('아니에요', 'is not (polite)', '아니다'))]}
                translation="I'm not a student."
            />

            <h2 id="eopseoyo">6. 없어요, not 안 있어요</h2>
            <p>
                <span lang="ko">있어요</span> (there is, I have) has its own opposite word: <span lang="ko">없어요</span>{' '}
                (there isn&rsquo;t, I don&rsquo;t have). Koreans never say <span lang="ko">안 있어요</span>.
            </p>
            <Example
                words={[chip(W('오늘', 'today'), P('은', 'topic, contrast')), chip(W('시간', 'time'), P('이', 'subject')), chip(W('없어요', "don't have, there isn't (polite)", '없다'))]}
                translation="I don't have time today."
            />
            <p>
                One more word like this: <span lang="ko">알다</span> (to know) becomes <span lang="ko">몰라요</span> (I
                don&rsquo;t know), from <span lang="ko">모르다</span>. Say <span lang="ko">몰라요</span>, not{' '}
                <span lang="ko">안 알아요</span>.
            </p>
            <Tutor>
                Quick check before you speak: Is it a noun? Use <span lang="ko">아니에요</span>. Is it about having or being
                there? Use <span lang="ko">없어요</span>. Everything else: <span lang="ko">안</span> for won&rsquo;t,{' '}
                <span lang="ko">못</span> for can&rsquo;t.
            </Tutor>

            <TryIt placeholder="예: 오늘은 운동 못 해요." />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Love songs are full of <span lang="ko">못</span>: <span lang="ko">잊지 못해</span> (I can&rsquo;t forget),{' '}
                <span lang="ko">못 가</span> (I can&rsquo;t go). Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and
                tap through the lines to spot them. To keep going, read{' '}
                <Link href="/learn/korean-present-tense-a-yo-eo-yo">the Korean present tense</Link> or{' '}
                <Link href="/learn/korean-sentence-structure">Korean sentence structure</Link>.
            </p>
        </>
    );
}
