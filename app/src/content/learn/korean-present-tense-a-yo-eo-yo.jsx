import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-present-tense-a-yo-eo-yo',
    language: 'ko',
    title: 'Korean Present Tense: The 아요/어요 Rule Made Easy',
    shortTitle: 'Present tense (아요/어요)',
    description: 'One simple rule decides between 아요 and 어요 for every Korean verb. Learn it, plus why 하다 becomes 해요, the vowel shortcuts behind 가요 and 봐요, and 이에요/예요.',
    level: 'Beginner',
    minutes: 8,
    published: '2026-10-07',
    color: 'keep',
    grammar: [
        { form: '-아요/어요', label: 'present tense, polite' },
        { form: '-해요', label: 'polite present of 하다 verbs' },
        { form: '-이에요/예요', label: 'am / is (polite)' },
    ],
};

export const faq = [
    {
        q: 'How do you conjugate Korean verbs in the present tense?',
        a: 'Remove 다 to get the stem. If the last vowel of the stem is ㅏ or ㅗ, add 아요. For any other vowel, add 어요. Verbs ending in 하다 become 해요. So 살다 is 살아요, 먹다 is 먹어요 and 공부하다 is 공부해요.',
    },
    {
        q: 'What is the 아요/어요 rule?',
        a: 'It is the rule for the polite present tense. Look only at the last vowel of the verb stem: ㅏ or ㅗ takes 아요 (좋아요), everything else takes 어요 (읽어요). When the stem ends in a vowel, the two vowels usually merge: 가 + 아요 = 가요, 보 + 아요 = 봐요.',
    },
    {
        q: 'Why does 하다 become 해요?',
        a: '하다 is a special verb with its own form: it always becomes 해요, never 하아요. Because thousands of verbs end in 하다, like 공부하다 (study) and 일하다 (work), this one form covers a huge part of the language.',
    },
    {
        q: 'Does the Korean present tense also mean "I am doing" or "I will do"?',
        a: 'Yes. 가요 can mean "I go", "I am going" or, with a time word like 내일 (tomorrow), "I am going tomorrow". Context and time words do the work that English does with extra verb forms.',
    },
];

export const quiz = [
    {
        prompt: '앉다 (to sit) in the polite present = ?',
        choices: ['앉어요', '앉아요'],
        answer: 1,
        why: 'The last vowel of the stem 앉 is ㅏ, so it takes 아요.',
    },
    {
        prompt: '마시다 (to drink) in the polite present = ?',
        choices: ['마셔요', '마시요', '마시아요'],
        answer: 0,
        why: 'ㅣ is not ㅏ or ㅗ, so add 어요. Then 시 + 어 squeezes into 셔: 마셔요.',
    },
    {
        prompt: '일하다 (to work) in the polite present = ?',
        choices: ['일하아요', '일해요'],
        answer: 1,
        why: 'Every 하다 verb ends in 해요 in the polite present.',
    },
    {
        prompt: 'Fill the gap: 저는 의사___.',
        hint: 'I am a doctor.',
        choices: ['이에요', '예요'],
        answer: 1,
        why: '의사 ends in a vowel, so it takes 예요. After a consonant you use 이에요, as in 학생이에요.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    Take the verb, drop <span lang="ko">다</span>, and look at the <strong>last vowel</strong> that is left.
                    If it is <span lang="ko">ㅏ</span> or <span lang="ko">ㅗ</span>, add <span lang="ko">아요</span>. For
                    anything else, add <span lang="ko">어요</span>. Verbs ending in <span lang="ko">하다</span> always become{' '}
                    <span lang="ko">해요</span>.
                </p>
            </section>

            <p>
                The polite present tense is the most useful verb form in Korean. You will use it to order food, ask
                directions and chat with new friends. It also covers more ground than the English present: one form means
                &ldquo;I eat,&rdquo; &ldquo;I am eating&rdquo; and, with a time word, &ldquo;I will eat.&rdquo; Tap the
                endings in the examples below to see how each one was built.
            </p>

            <h2 id="stem">1. Find the stem</h2>
            <p>
                Every Korean verb in the dictionary ends in <span lang="ko">다</span>. Remove it and you have the stem:{' '}
                <span lang="ko">먹다 → 먹</span> (eat), <span lang="ko">가다 → 가</span> (go),{' '}
                <span lang="ko">마시다 → 마시</span> (drink). Describing words like <span lang="ko">좋다</span> (to be good)
                work exactly the same way.
            </p>
            <p>
                Now look at the last vowel of the stem. In <span lang="ko">먹</span> it is <span lang="ko">ㅓ</span>. In{' '}
                <span lang="ko">살</span> it is <span lang="ko">ㅏ</span>. In <span lang="ko">마시</span> it is{' '}
                <span lang="ko">ㅣ</span>. That one vowel decides everything.
            </p>

            <h2 id="rule">2. ㅏ or ㅗ? Add 아요. Anything else? Add 어요.</h2>
            <p>
                Korean likes vowels that sound alike to stay together. The &ldquo;bright&rdquo; vowels{' '}
                <span lang="ko">ㅏ</span> and <span lang="ko">ㅗ</span> pair with <span lang="ko">아요</span>. All the others
                pair with <span lang="ko">어요</span>.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Verb</th><th>Stem</th><th>Last vowel</th><th>Polite present</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><span lang="ko">살다</span> (live)</td><td lang="ko">살</td><td lang="ko">ㅏ</td><td lang="ko">살아요</td></tr>
                        <tr><td><span lang="ko">좋다</span> (be good)</td><td lang="ko">좋</td><td lang="ko">ㅗ</td><td lang="ko">좋아요</td></tr>
                        <tr><td><span lang="ko">앉다</span> (sit)</td><td lang="ko">앉</td><td lang="ko">ㅏ</td><td lang="ko">앉아요</td></tr>
                        <tr><td><span lang="ko">먹다</span> (eat)</td><td lang="ko">먹</td><td lang="ko">ㅓ</td><td lang="ko">먹어요</td></tr>
                        <tr><td><span lang="ko">읽다</span> (read)</td><td lang="ko">읽</td><td lang="ko">ㅣ</td><td lang="ko">읽어요</td></tr>
                        <tr><td><span lang="ko">있다</span> (have, be there)</td><td lang="ko">있</td><td lang="ko">ㅣ</td><td lang="ko">있어요</td></tr>
                    </tbody>
                </table>
            </div>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('서울', 'Seoul'), P('에', 'in (where you live)')), chip(W('살', 'live', '살다'), P('아요', 'present, polite: ㅏ stem takes 아요'))]}
                translation="I live in Seoul."
            />
            <Example
                words={[chip(W('동생', 'younger sibling'), P('이', 'subject')), chip(W('빵', 'bread'), P('을', 'object')), chip(W('먹', 'eat', '먹다'), P('어요', 'present, polite: ㅓ stem takes 어요'))]}
                translation="My little brother is eating bread."
                note="Same form for 'eats' and 'is eating'. Context tells you which."
            />
            <Example
                words={[chip(W('오늘', 'today')), chip(W('날씨', 'weather'), P('가', 'subject')), chip(W('좋', 'good', '좋다'), P('아요', 'present, polite: ㅗ stem takes 아요'))]}
                translation="The weather is nice today."
            />
            <Tutor>
                Only the <strong>last</strong> vowel counts. <span lang="ko">기다리다</span> (wait) has{' '}
                <span lang="ko">ㅣ</span> at the end, so it becomes <span lang="ko">기다려요</span>. The{' '}
                <span lang="ko">ㅏ</span> in the middle does not matter.
            </Tutor>

            <h2 id="hada">3. 하다 always becomes 해요</h2>
            <p>
                <span lang="ko">하다</span> means &ldquo;to do,&rdquo; and it breaks the rule: it becomes{' '}
                <span lang="ko">해요</span>, never <span lang="ko">하아요</span>. This is great news. Thousands of verbs are a
                noun plus <span lang="ko">하다</span>: <span lang="ko">공부하다</span> (study), <span lang="ko">일하다</span>{' '}
                (work), <span lang="ko">운동하다</span> (exercise), <span lang="ko">좋아하다</span> (like). Learn one ending
                and you can use all of them.
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('한국어', 'Korean (language)'), P('를', 'object')), chip(W('공부', 'study'), P('해요', 'do, polite: 하다 always becomes 해요'))]}
                translation="I study Korean."
            />
            <Example
                words={[chip(W('지금', 'now')), chip(W('뭐', 'what')), chip(W('해요', 'do (polite)', '하다'))]}
                translation="What are you doing now?"
                note="Questions use the same form. Just raise your voice at the end."
            />

            <h2 id="contractions">4. When the stem ends in a vowel, they merge</h2>
            <p>
                If the stem ends in a vowel, the two vowels usually squeeze together into one syllable. It sounds more
                natural and it is how everyone speaks. These are the patterns you will meet most:
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Vowels</th><th>Verb</th><th>Becomes</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">ㅏ + 아 → ㅏ</td><td><span lang="ko">가다</span> (go)</td><td lang="ko">가요</td></tr>
                        <tr><td lang="ko">ㅓ + 어 → ㅓ</td><td><span lang="ko">서다</span> (stand)</td><td lang="ko">서요</td></tr>
                        <tr><td lang="ko">ㅗ + 아 → ㅘ</td><td><span lang="ko">오다</span> (come), <span lang="ko">보다</span> (see)</td><td lang="ko">와요, 봐요</td></tr>
                        <tr><td lang="ko">ㅜ + 어 → ㅝ</td><td><span lang="ko">배우다</span> (learn), <span lang="ko">주다</span> (give)</td><td lang="ko">배워요, 줘요</td></tr>
                        <tr><td lang="ko">ㅣ + 어 → ㅕ</td><td><span lang="ko">마시다</span> (drink)</td><td lang="ko">마셔요</td></tr>
                        <tr><td lang="ko">ㅐ + 어 → ㅐ</td><td><span lang="ko">보내다</span> (send)</td><td lang="ko">보내요</td></tr>
                        <tr><td lang="ko">ㅚ + 어 → ㅙ</td><td><span lang="ko">되다</span> (become)</td><td lang="ko">돼요</td></tr>
                    </tbody>
                </table>
            </div>
            <Example
                words={[chip(W('지금', 'now')), chip(W('학교', 'school'), P('에', 'to')), chip(W('가', 'go', '가다'), P('요', 'polite present: 가 + 아요 merges into 가요'))]}
                translation="I'm going to school now."
            />
            <Example
                words={[chip(W('친구', 'friend'), P('가', 'subject')), chip(W('우리', 'our')), chip(W('집', 'house, home'), P('에', 'to')), chip(W('와요', 'come (polite)', '오다'))]}
                translation="My friend is coming to our place."
                note="오 + 아요 always becomes 와요. If you hear 와요, look up 오다."
            />
            <Example
                words={[chip(W('주말', 'weekend'), P('에', 'on (time)')), chip(W('영화', 'movie'), P('를', 'object')), chip(W('봐요', 'watch, see (polite)', '보다'))]}
                translation="I watch movies on weekends."
            />
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('매일', 'every day')), chip(W('커피', 'coffee'), P('를', 'object')), chip(W('마셔요', 'drink (polite)', '마시다'))]}
                translation="I drink coffee every day."
                note="마시 + 어요 shrinks to 마셔요. The same thing happens in 기다려요 (wait)."
            />
            <Tutor>
                When you hear a word like <span lang="ko">봐요</span> or <span lang="ko">마셔요</span>, work backwards to
                find the dictionary form. <span lang="ko">ㅘ</span> usually hides an <span lang="ko">ㅗ</span>, and{' '}
                <span lang="ko">ㅕ</span> usually hides an <span lang="ko">ㅣ</span>. Or just tap the word on Hanbok: it
                shows the meaning and you can save it to your flashcards.
            </Tutor>
            <p>
                A small group of verbs are irregular and change their stem first, like <span lang="ko">듣다 → 들어요</span>{' '}
                (listen) and <span lang="ko">덥다 → 더워요</span> (be hot). Learn the main rule first. These are easier once
                the rule feels automatic.
            </p>

            <h2 id="ieyo">5. &ldquo;Am, is, are&rdquo; with nouns: 이에요/예요</h2>
            <p>
                To say &ldquo;X is Y&rdquo; with a noun, Korean uses <span lang="ko">이에요</span> after a consonant and{' '}
                <span lang="ko">예요</span> after a vowel. The negative is <span lang="ko">아니에요</span> (&ldquo;is
                not&rdquo;).
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('학생', 'student'), P('이에요', 'am / is, polite: after a consonant'))]}
                translation="I'm a student."
            />
            <Example
                words={[chip(W('이', 'this')), chip(W('사람', 'person'), P('은', 'topic')), chip(W('제', 'my (humble)', '저')), chip(W('친구', 'friend'), P('예요', 'am / is, polite: after a vowel'))]}
                translation="This is my friend."
            />

            <h2 id="cheat-sheet">Quick cheat sheet</h2>
            <ul className={styles.list}>
                <li><strong>Drop <span lang="ko">다</span></strong> and find the last vowel of the stem.</li>
                <li><strong><span lang="ko">ㅏ</span> or <span lang="ko">ㅗ</span></strong>: add <span lang="ko">아요</span> (<span lang="ko">살아요</span>, <span lang="ko">좋아요</span>).</li>
                <li><strong>Any other vowel</strong>: add <span lang="ko">어요</span> (<span lang="ko">먹어요</span>, <span lang="ko">읽어요</span>).</li>
                <li><strong><span lang="ko">하다</span></strong>: always <span lang="ko">해요</span>.</li>
                <li><strong>Stem ends in a vowel?</strong> Let them merge: <span lang="ko">가요</span>, <span lang="ko">와요</span>, <span lang="ko">마셔요</span>.</li>
            </ul>

            <TryIt placeholder="예: 저는 아침에 빵을 먹어요" />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Song lyrics are full of present tense verbs, often without the <span lang="ko">요</span>. Open a song in{' '}
                <Link href="/lyrics">Hanbok Lyrics</Link> and tap through a line: the breakdown shows the dictionary form of
                every verb. Ready for more? See how the same rule builds the{' '}
                <Link href="/learn/korean-past-tense">Korean past tense</Link>, or read about{' '}
                <Link href="/learn/korean-speech-levels">Korean speech levels</Link> to learn when to drop the{' '}
                <span lang="ko">요</span>.
            </p>
        </>
    );
}
