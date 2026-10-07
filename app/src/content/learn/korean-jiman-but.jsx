import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-jiman-but',
    language: 'ko',
    title: 'Korean "But": -지만, 하지만 and 그렇지만 Explained',
    shortTitle: 'Saying "but" (-지만, 하지만)',
    description: 'Learn how to say "but" in Korean. Add 지만 to any verb or adjective, start a sentence with 하지만 or 그렇지만, and soften requests with 죄송하지만 and 실례지만.',
    level: 'Beginner',
    minutes: 7,
    published: '2026-10-08',
    color: 'keep',
    grammar: [
        { form: '-지만', label: 'but (joins two clauses)' },
        { form: '-았/었지만', label: 'but (past)' },
        { form: '이지만', label: 'is ..., but (with a noun)' },
        { form: '하지만/그렇지만', label: 'but (at the start of a sentence)' },
        { form: '죄송하지만/실례지만', label: 'excuse me, but (soft opener)' },
    ],
};

export const faq = [
    {
        q: 'How do you say "but" in Korean?',
        a: 'Inside one sentence, add 지만 to the verb or adjective stem: 비싸지만 맛있어요 (it is expensive, but tasty). To start a new sentence with "but", use 하지만 or 그렇지만.',
    },
    {
        q: 'What is the difference between 하지만 and 그렇지만?',
        a: 'They mean the same thing: "but" or "however" at the start of a sentence. 하지만 is the most common in both speech and writing. 그렇지만 is a little more formal and literally means "that is so, but".',
    },
    {
        q: 'How do you use 지만 with the past tense?',
        a: 'Put the past tense first, then 지만: 갔지만 (went, but), 먹었지만 (ate, but), 했지만 (did, but). The ending 지만 itself never changes.',
    },
    {
        q: 'What is the difference between 지만 and 는데?',
        a: '지만 is a clear "but" that shows contrast. 는데 is softer and more flexible: it can mean "but", "and" or "so", and often just sets up background for what comes next.',
    },
];

export const quiz = [
    {
        prompt: '맛있다 (tasty) + 지만 = ?',
        hint: 'It is tasty, but...',
        choices: ['맛있지만', '맛있어지만'],
        answer: 0,
        why: 'Drop 다 and add 지만 straight to the stem: 맛있 + 지만. No 아/어 in between.',
    },
    {
        prompt: 'Which one means "I went, but..."?',
        hint: '가다 = to go',
        choices: ['가지만', '갔지만'],
        answer: 1,
        why: 'Past tense comes first (갔), then 지만. 가지만 means "goes, but" in the present.',
    },
    {
        prompt: '"I am a student, but..." = 저는 ___',
        choices: ['학생지만', '학생이지만'],
        answer: 1,
        why: '학생 ends in a consonant, so you need 이: 학생이지만. After a vowel you can drop it: 의사지만.',
    },
    {
        prompt: 'You want to ask a stranger for directions. How do you start?',
        hint: 'Excuse me, but...',
        choices: ['죄송하지만', '하지만'],
        answer: 0,
        why: '죄송하지만 ("I am sorry, but") softens a request. 하지만 alone just means "but" and needs something before it.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    To say &ldquo;but&rdquo; inside one sentence, add <span lang="ko">지만</span> to a verb or adjective
                    stem: <span lang="ko">비싸지만 맛있어요</span> (it&rsquo;s expensive, but tasty). To start a new
                    sentence with &ldquo;but&rdquo;, use <span lang="ko">하지만</span> or <span lang="ko">그렇지만</span>.
                </p>
            </section>

            <p>
                English has one little word for &ldquo;but&rdquo;. Korean usually builds it into the verb instead. The
                good news: <span lang="ko">지만</span> is one of the easiest endings in Korean. It never changes shape,
                and it attaches straight to the stem. Tap the chips below to see each part.
            </p>

            <h2 id="jiman">1. Verb or adjective + 지만</h2>
            <p>
                Take the dictionary form, drop <span lang="ko">다</span>, and add <span lang="ko">지만</span>. The
                first half is the part you are contrasting. The second half finishes the sentence as usual.
            </p>
            <Example
                words={[chip(W('이', 'this')), chip(W('식당', 'restaurant'), P('은', 'topic')), chip(W('비싸', 'expensive', '비싸다'), P('지만', 'but')), chip(W('맛있어요', 'is delicious', '맛있다'))]}
                translation="This restaurant is expensive, but the food is delicious."
            />
            <Example
                words={[chip(W('한국어', 'Korean (language)'), P('는', 'topic')), chip(W('어렵', 'difficult', '어렵다'), P('지만', 'but')), chip(W('재미있어요', 'is fun', '재미있다'))]}
                translation="Korean is hard, but it's fun."
                note="어렵다 is irregular in the 요 form (어려워요), but with 지만 nothing changes: 어렵지만."
            />
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('고기', 'meat'), P('를', 'object')), chip(W('좋아하', 'like', '좋아하다'), P('지만', 'but')), chip(W('생선', 'fish'), P('은', 'topic, here showing contrast')), chip(W('안', 'not')), chip(W('먹어요', 'eat', '먹다'))]}
                translation="I like meat, but I don't eat fish."
            />

            <h2 id="past">2. Past tense: 았/었 + 지만</h2>
            <p>
                For something that already happened, make the past tense first, then add <span lang="ko">지만</span>.
                The ending stays exactly the same.
            </p>
            <Example
                words={[chip(W('어제', 'yesterday')), chip(W('학교', 'school'), P('에', 'to')), chip(W('갔', 'went', '가다'), P('지만', 'but (after past 았)')), chip(W('수업', 'class'), P('이', 'subject')), chip(W('없었어요', 'there was not', '없다'))]}
                translation="I went to school yesterday, but there was no class."
            />
            <Example
                words={[chip(W('열심히', 'hard, diligently')), chip(W('공부했', 'studied', '공부하다'), P('지만', 'but (after past 했)')), chip(W('시험', 'exam'), P('이', 'subject')), chip(W('어려웠어요', 'was difficult', '어렵다'))]}
                translation="I studied hard, but the exam was difficult."
            />

            <h2 id="nouns">3. Nouns: 이지만</h2>
            <p>
                With a noun, you use <span lang="ko">이다</span> (&ldquo;to be&rdquo;), so you get{' '}
                <span lang="ko">이지만</span>. After a vowel, Koreans usually shorten it to <span lang="ko">지만</span>.
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('학생', 'student'), P('이지만', '"am", but (이다 + 지만)')), chip(W('일', 'work'), P('도', 'also')), chip(W('해요', 'do', '하다'))]}
                translation="I'm a student, but I also work."
            />

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Dictionary form</th><th>Present + 지만</th><th>Past + 지만</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다 (go)</td><td lang="ko">가지만</td><td lang="ko">갔지만</td></tr>
                        <tr><td lang="ko">먹다 (eat)</td><td lang="ko">먹지만</td><td lang="ko">먹었지만</td></tr>
                        <tr><td lang="ko">하다 (do)</td><td lang="ko">하지만</td><td lang="ko">했지만</td></tr>
                        <tr><td lang="ko">좋다 (good)</td><td lang="ko">좋지만</td><td lang="ko">좋았지만</td></tr>
                        <tr><td lang="ko">학생이다 (be a student)</td><td lang="ko">학생이지만</td><td lang="ko">학생이었지만</td></tr>
                        <tr><td lang="ko">의사이다 (be a doctor)</td><td lang="ko">의사지만</td><td lang="ko">의사였지만</td></tr>
                    </tbody>
                </table>
            </div>
            <Tutor>
                <span lang="ko">지만</span> is my favorite lazy ending. No vowel rules, no irregulars to worry about.
                Just stem + <span lang="ko">지만</span>, every time!
            </Tutor>

            <h2 id="hajiman">4. Starting a sentence: 하지만 and 그렇지만</h2>
            <p>
                Sometimes you finish one sentence and want to start the next with &ldquo;But&rdquo; or
                &ldquo;However&rdquo;. Use <span lang="ko">하지만</span> or <span lang="ko">그렇지만</span> at the
                front.
            </p>
            <Example
                words={[chip(W('하지만', 'but, however')), chip(W('정말', 'really')), chip(W('재미있어요', 'is fun', '재미있다'))]}
                translation="(Korean is hard.) But it's really fun."
            />
            <Example
                words={[chip(W('그렇지만', 'but, however (a little more formal)')), chip(W('포기하', 'give up', '포기하다'), P('지', 'part of 지 않다 (not)')), chip(W('않을', 'not (will)', '않다')), chip(W('거예요', 'will (polite)'))]}
                translation="(It's not easy.) But I won't give up."
            />
            <ul className={styles.list}>
                <li><strong><span lang="ko">하지만</span></strong>: the everyday choice. Fine in speech and writing.</li>
                <li><strong><span lang="ko">그렇지만</span></strong>: a bit more formal. Literally &ldquo;that is so, but&rdquo;, so it agrees a little before turning.</li>
                <li><strong><span lang="ko">그런데</span> / <span lang="ko">근데</span></strong>: very common in conversation, softer, also means &ldquo;by the way&rdquo;. <span lang="ko">근데</span> is casual.</li>
            </ul>

            <h2 id="soft">5. Soft openers: 죄송하지만 and 실례지만</h2>
            <p>
                Koreans often start a request or a personal question with an apology plus <span lang="ko">지만</span>.
                It works like &ldquo;Excuse me, but...&rdquo; or &ldquo;Sorry to bother you, but...&rdquo; in English.
            </p>
            <Example
                words={[chip(W('죄송하', 'be sorry', '죄송하다'), P('지만', 'but (softens a request)')), chip(W('사진', 'photo')), chip(W('좀', 'please, a little')), chip(W('찍어', 'take (a photo)', '찍다')), chip(W('주세요', 'please (do for me)', '주다'))]}
                translation="Excuse me, could you take a photo for me?"
            />
            <Example
                words={[chip(W('실례', 'rudeness, imposition'), P('지만', 'is ..., but (이지만 shortened after a vowel)')), chip(W('성함', 'name (respectful)'), P('이', 'subject')), chip(W('어떻게', 'how')), chip(W('되세요', 'is it (respectful)', '되다'))]}
                translation="Excuse me, may I ask your name?"
                note="실례지만 literally means 'it is rude, but'. It is a polite way to ask something personal."
            />

            <h2 id="neunde">6. 지만 vs 는데: clear &ldquo;but&rdquo; vs soft &ldquo;but/and&rdquo;</h2>
            <p>
                You will also hear <span lang="ko">는데</span> (<span lang="ko">은데/ㄴ데</span> after adjectives) a
                lot. It can mean &ldquo;but&rdquo;, but it is softer and more flexible. It often just gives background
                before the main point.
            </p>
            <Example
                words={[chip(W('이', 'this')), chip(W('가방', 'bag'), P('은', 'topic')), chip(W('예쁜', 'pretty', '예쁘다'), P('데', 'but / and (softer, after an adjective: ㄴ데)')), chip(W('좀', 'a bit')), chip(W('비싸요', 'is expensive', '비싸다'))]}
                translation="This bag is pretty, but it's a bit expensive."
            />
            <Example
                words={[chip(W('비', 'rain'), P('가', 'subject')), chip(W('오', 'come, fall', '오다'), P('는데', 'and (background, not contrast)')), chip(W('우산', 'umbrella'), P('이', 'subject')), chip(W('없어요', 'there is not', '없다'))]}
                translation="It's raining, and I don't have an umbrella."
                note="Here 는데 is not 'but' at all. 지만 would sound odd, because there is no contrast."
            />
            <Tutor>
                Rule of thumb: if you could say &ldquo;on the other hand&rdquo; in English, <span lang="ko">지만</span>{' '}
                fits. If you are just setting the scene, reach for <span lang="ko">는데</span>.
            </Tutor>

            <TryIt placeholder="예: 김치는 맵지만 맛있어요." />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Love songs are full of <span lang="ko">지만</span>: &ldquo;I miss you, but...&rdquo;, &ldquo;it hurts,
                but...&rdquo;. Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line to see every
                ending explained. Next, learn how to give reasons with{' '}
                <Link href="/learn/korean-aseo-eoseo-because">아서/어서 (because)</Link>, or review the{' '}
                <Link href="/learn/korean-past-tense">Korean past tense</Link>.
            </p>
        </>
    );
}
