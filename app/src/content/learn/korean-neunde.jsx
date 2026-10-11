import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-neunde',
    language: 'ko',
    title: 'Korean -는데 Explained: "And", "But" and Soft -는데요',
    shortTitle: '-는데: background, "but" and -는데요',
    description: 'Learn Korean -는데: set up background, add a soft "but", and end with -는데요 to sound gentle. Includes forms after verbs, adjectives, nouns and the past.',
    level: 'Intermediate',
    topic: 'linking',
    minutes: 9,
    published: '2026-10-11',
    color: 'read',
    grammar: [
        { form: '-는데', label: 'and / but (after verbs, 있다, 없다)' },
        { form: '-(으)ㄴ데', label: 'and / but (after adjectives)' },
        { form: '인데', label: 'is ..., and / but (with a noun)' },
        { form: '-았/었는데', label: 'and / but (past)' },
        { form: '-는데요', label: 'soft sentence ending' },
    ],
};

export const faq = [
    {
        q: 'What does 는데 mean in Korean?',
        a: '는데 links two parts of a sentence. Most often it gives background ("I went to the market, and...") or a soft contrast ("it is pretty, but..."). It can be translated as "and", "but", "so" or not at all.',
    },
    {
        q: 'When do you use 는데, 은데 and ㄴ데?',
        a: 'Use 는데 after action verbs, after 있다 and 없다, and after any past tense (갔는데). Use 은데 after an adjective stem ending in a consonant (작은데) and ㄴ데 after a vowel (비싼데). After a noun, use 인데 (학생인데).',
    },
    {
        q: 'What does 는데요 mean at the end of a sentence?',
        a: 'Ending with 는데요 leaves the sentence a little open. It softens what you say and invites the other person to react: 내일은 좀 바쁜데요... (I am a bit busy tomorrow...) is a gentle way to say no.',
    },
    {
        q: 'What is the difference between 는데 and 지만?',
        a: '지만 is a clear "but" that always shows contrast. 는데 is softer and wider: it can be "but", but it is also used just to set the scene before the main point.',
    },
];

export const quiz = [
    {
        prompt: '비싸다 (expensive) + 는데 = ?',
        hint: 'It is an adjective.',
        choices: ['비싸는데', '비싼데'],
        answer: 1,
        why: 'Adjectives take (으)ㄴ데. 비싸 ends in a vowel, so ㄴ joins it: 비싼데.',
    },
    {
        prompt: '"I went yesterday, and..." = 어제 ___',
        choices: ['갔는데', '갔은데'],
        answer: 0,
        why: 'After the past tense 았/었, it is always 는데, even for adjectives: 갔는데, 좋았는데.',
    },
    {
        prompt: 'On the phone: "Hello, this is Minsu." = 여보세요, 저 민수___',
        choices: ['는데요', '인데요'],
        answer: 1,
        why: '민수 is a noun (a name), so you need 이다: 민수인데요. The soft 요 ending sounds friendly, as if waiting for a reply.',
    },
    {
        prompt: 'Which sentence uses 는데 to give background, not contrast?',
        choices: ['비가 오는데 우산 있어요?', '형은 키가 큰데 저는 작아요.'],
        answer: 0,
        why: '"It is raining. Do you have an umbrella?" sets the scene. The second one is a contrast: "my brother is tall, but I am short".',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    <span lang="ko">는데</span> joins two parts of a sentence. It sets up background (&ldquo;I went to
                    the market, and...&rdquo;) or a soft &ldquo;but&rdquo;. Use <span lang="ko">는데</span> after verbs
                    and the past, <span lang="ko">(으)ㄴ데</span> after adjectives, and <span lang="ko">인데</span> after
                    nouns. At the end of a sentence, <span lang="ko">는데요</span> makes you sound gentle.
                </p>
            </section>

            <p>
                Listen to any Korean conversation and you will hear <span lang="ko">는데</span> again and again. It is
                a small ending that does a lot of work. Think of it as saying &ldquo;so here&rsquo;s the
                situation...&rdquo; before the main point. If you have read the guide to{' '}
                <span lang="ko">지만</span> (but), this one is its softer, more flexible cousin.
            </p>

            <h2 id="forms">1. The forms: 는데, 은데/ㄴ데, 인데</h2>
            <p>
                The shape depends on the kind of word in front of it. An <strong>action verb</strong> is a doing
                word, like go or eat. An <strong>adjective</strong> in Korean is a describing word that works like a
                verb, like &ldquo;is expensive&rdquo; or &ldquo;is small&rdquo;.
            </p>
            <ul className={styles.list}>
                <li><strong>Action verbs, 있다, 없다:</strong> stem + <span lang="ko">는데</span> (<span lang="ko">가는데, 먹는데, 맛있는데</span>)</li>
                <li><strong>Adjectives ending in a vowel:</strong> stem + <span lang="ko">ㄴ데</span> (<span lang="ko">비싼데, 바쁜데</span>)</li>
                <li><strong>Adjectives ending in a consonant:</strong> stem + <span lang="ko">은데</span> (<span lang="ko">작은데, 좋은데</span>)</li>
                <li><strong>Nouns:</strong> noun + <span lang="ko">인데</span> (<span lang="ko">학생인데, 친구인데</span>)</li>
                <li><strong>Any past tense:</strong> <span lang="ko">았/었</span> + <span lang="ko">는데</span> (<span lang="ko">갔는데, 좋았는데</span>)</li>
            </ul>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Dictionary form</th><th>Present</th><th>Past</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다 (go)</td><td lang="ko">가는데</td><td lang="ko">갔는데</td></tr>
                        <tr><td lang="ko">먹다 (eat)</td><td lang="ko">먹는데</td><td lang="ko">먹었는데</td></tr>
                        <tr><td lang="ko">살다 (live)</td><td lang="ko">사는데</td><td lang="ko">살았는데</td></tr>
                        <tr><td lang="ko">맛있다 (tasty)</td><td lang="ko">맛있는데</td><td lang="ko">맛있었는데</td></tr>
                        <tr><td lang="ko">비싸다 (expensive)</td><td lang="ko">비싼데</td><td lang="ko">비쌌는데</td></tr>
                        <tr><td lang="ko">작다 (small)</td><td lang="ko">작은데</td><td lang="ko">작았는데</td></tr>
                        <tr><td lang="ko">춥다 (cold)</td><td lang="ko">추운데</td><td lang="ko">추웠는데</td></tr>
                        <tr><td lang="ko">멀다 (far)</td><td lang="ko">먼데</td><td lang="ko">멀었는데</td></tr>
                        <tr><td lang="ko">학생이다 (be a student)</td><td lang="ko">학생인데</td><td lang="ko">학생이었는데</td></tr>
                        <tr><td lang="ko">친구이다 (be a friend)</td><td lang="ko">친구인데</td><td lang="ko">친구였는데</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                Two small surprises: a stem ending in <span lang="ko">ㄹ</span> drops it (<span lang="ko">살다</span> to{' '}
                <span lang="ko">사는데</span>, <span lang="ko">멀다</span> to <span lang="ko">먼데</span>), and{' '}
                <span lang="ko">ㅂ</span> adjectives like <span lang="ko">춥다</span> become <span lang="ko">추운데</span>.
            </p>
            <Tutor>
                The past is the easy part. Once you add <span lang="ko">았/었</span>, it is always{' '}
                <span lang="ko">는데</span>. Verb or adjective, it does not matter!
            </Tutor>

            <h2 id="background">2. Giving background: &ldquo;..., and&rdquo;</h2>
            <p>
                This is the most common use. The first half sets the scene. The second half is what you really want
                to say: a fact, a question or a request. English often uses &ldquo;and&rdquo;, &ldquo;so&rdquo;, or
                two separate sentences.
            </p>
            <Example
                words={[chip(W('어제', 'yesterday')), chip(W('시장', 'market'), P('에', 'to')), chip(W('갔', 'went', '가다'), P('는데', 'and (background, after past 았)')), chip(W('사람', 'people'), P('이', 'subject')), chip(W('정말', 'really')), chip(W('많았어요', 'there were many', '많다'))]}
                translation="I went to the market yesterday, and it was really crowded."
            />
            <Example
                words={[chip(W('비', 'rain'), P('가', 'subject')), chip(W('오', 'come, fall', '오다'), P('는데', 'and (background)')), chip(W('우산', 'umbrella')), chip(W('있어요', 'do you have', '있다'))]}
                translation="It's raining. Do you have an umbrella?"
            />
            <Example
                words={[chip(W('제', 'I (humble, before 가)'), P('가', 'subject')), chip(W('지금', 'now')), chip(W('바쁜', 'busy', '바쁘다'), P('데', 'so (background, after an adjective: ㄴ데)')), chip(W('나중', 'later'), P('에', 'at (time)')), chip(W('전화할게요', 'I will call (promise)', '전화하다'))]}
                translation="I'm busy right now, so I'll call you later."
            />

            <h2 id="contrast">3. A soft &ldquo;but&rdquo;</h2>
            <p>
                When the two halves pull in different directions, <span lang="ko">는데</span> works as a gentle
                &ldquo;but&rdquo;. It sounds a little softer and more conversational than <span lang="ko">지만</span>.
            </p>
            <Example
                words={[chip(W('이', 'this')), chip(W('옷', 'clothes'), P('은', 'topic')), chip(W('예쁜', 'pretty', '예쁘다'), P('데', 'but (soft, after an adjective: ㄴ데)')), chip(W('너무', 'too')), chip(W('비싸요', 'is expensive', '비싸다'))]}
                translation="These clothes are pretty, but they're too expensive."
            />
            <Example
                words={[chip(W('형', 'older brother (said by a male)'), P('은', 'topic, contrast')), chip(W('키', 'height'), P('가', 'subject')), chip(W('큰', 'big, tall', '크다'), P('데', 'but (soft, after an adjective: ㄴ데)')), chip(W('저', 'I (humble)'), P('는', 'topic, contrast')), chip(W('작아요', 'am small, short', '작다'))]}
                translation="My older brother is tall, but I'm short."
            />
            <Example
                words={[chip(W('열심히', 'hard, diligently')), chip(W('공부했', 'studied', '공부하다'), P('는데', 'but (after past 했)')), chip(W('시험', 'exam'), P('을', 'object')), chip(W('못', 'could not, badly')), chip(W('봤어요', 'took (an exam)', '보다'))]}
                translation="I studied hard, but I did badly on the exam."
                note="시험을 보다 means to take an exam. 시험을 못 보다 means to do badly on it."
            />

            <h2 id="neundeyo">4. Ending with 는데요: soft and open</h2>
            <p>
                You can also stop right after <span lang="ko">는데</span> and add <span lang="ko">요</span>. The
                sentence feels unfinished on purpose. It softens what you say and leaves room for the other person to
                answer. Koreans use it to refuse gently, to point out a problem politely, or to introduce themselves
                on the phone.
            </p>
            <Example
                words={[chip(W('내일', 'tomorrow'), P('은', 'topic, contrast')), chip(W('좀', 'a bit')), chip(W('바쁜', 'busy', '바쁘다'), P('데요', 'soft ending: leaves the sentence open'))]}
                translation="I'm a bit busy tomorrow..."
                note="An answer to 'Are you free tomorrow?'. It is a polite way to say no without saying no."
            />
            <Example
                words={[chip(W('저기요', 'excuse me (to get attention)')), chip(W('이거', 'this (thing)')), chip(W('주문', 'order')), chip(W('안', 'not')), chip(W('했', 'did', '하다'), P('는데요', 'soft ending: points out a problem politely'))]}
                translation="Excuse me, I didn't order this."
            />
            <Example
                words={[chip(W('여보세요', 'hello (on the phone)')), chip(W('저', 'I (humble)')), chip(W('민수', 'Minsu (a name)'), P('인데요', 'it is ... (이다 + ㄴ데요, soft)'))]}
                translation="Hello, it's Minsu."
            />
            <Tutor>
                Ending with <span lang="ko">는데요</span> is like trailing off with &ldquo;...&rdquo; and a little
                smile. It says &ldquo;over to you&rdquo; without being pushy. Very handy when you need to say no!
            </Tutor>

            <TryIt placeholder="예: 어제 영화를 봤는데 정말 재미있었어요." />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Song lyrics and drama lines are full of <span lang="ko">는데</span>, especially the trailing{' '}
                <span lang="ko">는데</span> at the end of a line. Open a song in{' '}
                <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line to see every ending explained. Next, compare
                it with the clear contrast of <Link href="/learn/korean-jiman-but">지만 (but)</Link>, or learn to give
                reasons with <Link href="/learn/korean-aseo-eoseo-because">아서/어서 (because)</Link> and{' '}
                <Link href="/learn/korean-eunikka-because">(으)니까</Link>.
            </p>
        </>
    );
}
