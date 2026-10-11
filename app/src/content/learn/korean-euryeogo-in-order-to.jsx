import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-euryeogo-in-order-to',
    language: 'ko',
    title: 'Korean -(으)려고: "In Order To" and "Plan To" Explained',
    shortTitle: 'In order to (-(으)려고)',
    description: 'Learn -(으)려고 for "in order to", -(으)려고 하다 for "I plan to" and "I was going to", and when to use -(으)러 가다 instead. With clear examples.',
    level: 'Intermediate',
    topic: 'expressing',
    minutes: 8,
    published: '2026-10-11',
    color: 'und',
    grammar: [
        { form: '-(으)려고', label: 'in order to, intending to' },
        { form: '-(으)려고 하다', label: 'plan to, be about to' },
        { form: '-(으)려고 했다', label: 'was going to (but didn\'t)' },
        { form: '-(으)러 가다/오다', label: 'go / come to (do)' },
    ],
};

export const faq = [
    {
        q: 'What does 려고 mean in Korean?',
        a: '려고 means "in order to" or "intending to". It shows the purpose of an action: 살을 빼려고 운동해요 (I exercise to lose weight). After a consonant it becomes 으려고: 먹으려고.',
    },
    {
        q: 'What is the difference between 려고 and 러?',
        a: '러 is only used with movement verbs like 가다 and 오다: 밥 먹으러 가요 (I am going to eat). 려고 works with any verb. Also, 러 can be used in suggestions and requests (먹으러 갑시다), but 려고 cannot.',
    },
    {
        q: 'What does 려고 하다 mean?',
        a: 'It means "to plan to" or "to be going to": 내일 쉬려고 해요 (I plan to rest tomorrow). In the past, 려고 했어요 often means "I was going to, but it didn\'t happen."',
    },
    {
        q: 'Is 갈려고 correct?',
        a: 'You will hear 갈려고 and 먹을려고 a lot in speech, but they are not standard spelling. The correct forms are 가려고 and 먹으려고. Only verbs whose stem ends in ㄹ, like 만들다, get 려고 right after the ㄹ: 만들려고.',
    },
];

export const quiz = [
    {
        prompt: '먹다 (eat) + (으)려고 = ?',
        hint: 'The stem ends in a consonant.',
        choices: ['먹려고', '먹으려고', '먹을려고'],
        answer: 1,
        why: '먹 ends in a consonant, so add 으 first: 먹으려고. 먹을려고 is common in speech but not standard.',
    },
    {
        prompt: '"Let\'s go eat together!" = 같이 ___',
        choices: ['먹으려고 가요', '먹으러 가요'],
        answer: 1,
        why: 'Suggestions and requests need 러. 려고 cannot be followed by "let\'s" or "please".',
    },
    {
        prompt: '만들다 (make) + (으)려고 = ?',
        hint: 'The stem ends in ㄹ.',
        choices: ['만들려고', '만들으려고'],
        answer: 0,
        why: 'Stems ending in ㄹ act like vowel stems here: 만들 + 려고. No 으.',
    },
    {
        prompt: '"I was going to call you, but I forgot." = 전화___ 잊어버렸어요.',
        choices: ['하려고 했는데', '하러 했는데'],
        answer: 0,
        why: '려고 했다 is "was going to". 러 only goes with movement verbs like 가다 and 오다.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    Add <span lang="ko">(으)려고</span> to a verb to say why you do something: <span lang="ko">살을 빼려고
                    운동해요</span> (I exercise <em>to lose weight</em>). Add <span lang="ko">하다</span> to say what you plan
                    to do: <span lang="ko">내일 쉬려고 해요</span> (I plan to rest tomorrow). With <span lang="ko">가다</span>{' '}
                    and <span lang="ko">오다</span>, you can also use <span lang="ko">(으)러</span>: <span lang="ko">밥 먹으러
                    가요</span> (I&rsquo;m going to eat).
                </p>
            </section>

            <p>
                English says &ldquo;to&rdquo; or &ldquo;so that&rdquo; to give a purpose. Korean puts the purpose first and
                adds an ending to it. You already know the main verb goes last. The purpose comes before it, ending in{' '}
                <span lang="ko">려고</span>. Tap the chips to see each part.
            </p>

            <h2 id="form">1. How to make -(으)려고</h2>
            <p>
                Take the verb stem (drop <span lang="ko">다</span>). If it ends in a vowel, add <span lang="ko">려고</span>.
                If it ends in a consonant, add <span lang="ko">으려고</span>. Stems that end in <span lang="ko">ㄹ</span>{' '}
                act like vowel stems and just add <span lang="ko">려고</span>.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Dictionary form</th><th>+ (으)려고</th><th>+ (으)러</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다 (go)</td><td lang="ko">가려고</td><td lang="ko">가러</td></tr>
                        <tr><td lang="ko">보다 (see, watch)</td><td lang="ko">보려고</td><td lang="ko">보러</td></tr>
                        <tr><td lang="ko">하다 (do)</td><td lang="ko">하려고</td><td lang="ko">하러</td></tr>
                        <tr><td lang="ko">먹다 (eat)</td><td lang="ko">먹으려고</td><td lang="ko">먹으러</td></tr>
                        <tr><td lang="ko">만들다 (make)</td><td lang="ko">만들려고</td><td lang="ko">만들러</td></tr>
                        <tr><td lang="ko">듣다 (listen)</td><td lang="ko">들으려고</td><td lang="ko">들으러</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                <span lang="ko">듣다</span> is irregular: its <span lang="ko">ㄷ</span> turns into <span lang="ko">ㄹ</span>{' '}
                before a vowel, just like in <span lang="ko">들어요</span>.
            </p>

            <h2 id="purpose">2. -(으)려고: in order to</h2>
            <p>
                Put the purpose first, then the action you take for it. The person doing both parts is the same.
            </p>
            <Example
                words={[chip(W('한국', 'Korea')), chip(W('드라마', 'drama, TV series'), P('를', 'object')), chip(W('보', 'watch', '보다'), P('려고', 'in order to')), chip(W('한국어', 'Korean (language)'), P('를', 'object')), chip(W('배워요', 'learn', '배우다'))]}
                translation="I'm learning Korean so I can watch Korean dramas."
            />
            <Example
                words={[chip(W('살', 'flesh, weight'), P('을', 'object')), chip(W('빼', 'take out, lose', '빼다'), P('려고', 'in order to')), chip(W('매일', 'every day')), chip(W('걸어요', 'walk', '걷다'))]}
                translation="I walk every day to lose weight."
                note="살을 빼다 is the everyday way to say 'lose weight'."
            />
            <Example
                words={[chip(W('친구', 'friend'), P('한테', 'to (a person)')), chip(W('주', 'give', '주다'), P('려고', 'in order to')), chip(W('케이크', 'cake'), P('를', 'object')), chip(W('만들었어요', 'made', '만들다'))]}
                translation="I made a cake to give to my friend."
            />
            <Example
                words={[chip(W('일찍', 'early')), chip(W('일어나', 'get up', '일어나다'), P('려고', 'in order to')), chip(W('알람', 'alarm'), P('을', 'object')), chip(W('맞췄어요', 'set', '맞추다'))]}
                translation="I set an alarm so I could get up early."
                note="The tense goes on the last verb only. 려고 itself never takes the past."
            />

            <h2 id="plan">3. -(으)려고 하다: plan to, about to</h2>
            <p>
                Add <span lang="ko">하다</span> after <span lang="ko">려고</span> and it becomes a whole verb:
                &ldquo;to intend to&rdquo;, &ldquo;to plan to&rdquo;. It is softer and less certain than the future{' '}
                <span lang="ko">(으)ㄹ 거예요</span>.
            </p>
            <Example
                words={[chip(W('이번', 'this (time)')), chip(W('주말', 'weekend'), P('에', 'on, at (time)')), chip(W('집', 'home'), P('에서', 'at (place of action)')), chip(W('쉬', 'rest', '쉬다'), P('려고', 'intending to')), chip(W('해요', 'do', '하다'))]}
                translation="I'm planning to rest at home this weekend."
            />
            <p>
                In the past, <span lang="ko">려고 했어요</span> usually means &ldquo;I was going to&rdquo;, and often
                hints that it didn&rsquo;t happen.
            </p>
            <Example
                words={[chip(W('전화하', 'call', '전화하다'), P('려고', 'intending to')), chip(W('했', 'did', '하다'), P('는데', 'but (background)')), chip(W('잊어버렸어요', 'forgot completely', '잊어버리다'))]}
                translation="I was going to call you, but I forgot."
            />
            <p>
                With things that are not people, like the weather, it means &ldquo;about to&rdquo;.
            </p>
            <Example
                words={[chip(W('비', 'rain'), P('가', 'subject')), chip(W('오', 'come, fall', '오다'), P('려고', 'about to')), chip(W('해요', 'do', '하다'))]}
                translation="It looks like it's about to rain."
            />
            <Tutor>
                Someone asks why you are up so early? You can answer with just <span lang="ko">려고요</span>:{' '}
                <span lang="ko">운동하려고요</span> (&ldquo;To work out.&rdquo;). Very natural in conversation!
            </Tutor>

            <h2 id="reo">4. -(으)러 가다/오다: go to do</h2>
            <p>
                When the main verb is a movement verb, like <span lang="ko">가다</span> (go),{' '}
                <span lang="ko">오다</span> (come) or <span lang="ko">다니다</span> (go regularly), Koreans usually
                use <span lang="ko">(으)러</span>. It means &ldquo;go somewhere to do something&rdquo;.
            </p>
            <Example
                words={[chip(W('빵', 'bread')), chip(W('사', 'buy', '사다'), P('러', 'to (do), with a movement verb')), chip(W('빵집', 'bakery'), P('에', 'to')), chip(W('가요', 'go', '가다'))]}
                translation="I'm going to the bakery to buy bread."
            />
            <Example
                words={[chip(W('같이', 'together')), chip(W('점심', 'lunch')), chip(W('먹', 'eat', '먹다'), P('으러', 'to (do), with a movement verb')), chip(W('갈까요', 'shall we go', '가다'))]}
                translation="Shall we go eat lunch together?"
            />

            <h2 id="compare">5. 려고 or 러?</h2>
            <ul className={styles.list}>
                <li><strong><span lang="ko">(으)러</span></strong> only goes with movement verbs: <span lang="ko">가다, 오다, 다니다, 나가다</span>.</li>
                <li><strong><span lang="ko">(으)려고</span></strong> works with any verb: <span lang="ko">배워요, 만들었어요, 걸어요</span>.</li>
                <li><strong>Suggestions and requests</strong> (&ldquo;let&rsquo;s&rdquo;, &ldquo;please&rdquo;, &ldquo;shall we&rdquo;) need <span lang="ko">(으)러</span>. <span lang="ko">먹으러 가요!</span> is fine. <span lang="ko">먹으려고 가요</span> cannot mean &ldquo;let&rsquo;s go eat&rdquo;.</li>
                <li>With <span lang="ko">가다</span> and <span lang="ko">오다</span> in a plain statement, both work. <span lang="ko">러</span> sounds more natural in everyday talk.</li>
            </ul>
            <Tutor>
                Quick test: is the last verb &ldquo;go&rdquo; or &ldquo;come&rdquo;? Then <span lang="ko">러</span> is
                your friend. Anything else? Use <span lang="ko">려고</span>.
            </Tutor>

            <TryIt placeholder="예: 한국 노래를 이해하려고 한국어를 공부해요." />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Songs often sing about what someone tried or meant to do: <span lang="ko">잊으려고 했지만</span> (I tried
                to forget, but...). Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line to see every
                ending explained. Next, review the future with{' '}
                <Link href="/learn/korean-future-tense-eul-geoyeyo">-(으)ㄹ 거예요</Link>, or learn{' '}
                <Link href="/learn/korean-go-sipda-want-to">-고 싶다 (want to)</Link>.
            </p>
        </>
    );
}
