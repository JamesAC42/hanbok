import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-go-and-then',
    language: 'ko',
    title: 'Korean -고: How to Say "And" and "And Then" with Verbs',
    shortTitle: '"And" and "and then" (-고)',
    description: 'Learn how to join verbs and adjectives with -고 in Korean, for "and" and "and then", why the tense goes only on the last verb, and when to use -아서/어서 instead.',
    level: 'Beginner',
    topic: 'linking',
    minutes: 7,
    published: '2026-10-11',
    color: 'und',
    grammar: [
        { form: '-고', label: 'and, and then (joins verbs and adjectives)' },
        { form: '이고', label: 'is ..., and (with a noun)' },
        { form: '그리고', label: 'and (at the start of a sentence)' },
    ],
};

export const faq = [
    {
        q: 'How do you say "and" between two verbs in Korean?',
        a: 'Add 고 to the first verb or adjective stem: 싸고 맛있어요 (it is cheap and tasty), 밥을 먹고 잤어요 (I ate and then slept). To join two nouns, use 하고 or 와/과 instead.',
    },
    {
        q: 'Do you use the past tense before 고?',
        a: 'Usually not. When both actions happen at the same time frame, put the tense only on the last verb: 영화를 보고 집에 갔어요 (I watched a movie and went home). 보고 already counts as past.',
    },
    {
        q: 'What is the difference between -고 and -아서/어서?',
        a: 'Both can mean "and then". Use -아서/어서 when the second action depends on the first, like going somewhere and doing something there: 시장에 가서 과일을 샀어요. Use -고 for steps that are simply one after another: 숙제를 하고 잤어요.',
    },
    {
        q: 'What does 그리고 mean?',
        a: '그리고 means "and" or "and also" at the start of a sentence. Inside one sentence, Koreans use -고 on the verb instead.',
    },
];

export const quiz = [
    {
        prompt: '싸다 (cheap) + 고 = ?',
        hint: 'It is cheap and...',
        choices: ['싸고', '싸서고'],
        answer: 0,
        why: 'Drop 다 and add 고 straight to the stem: 싸 + 고. No vowel rules at all.',
    },
    {
        prompt: '"I ate and then went home." Which sounds natural?',
        choices: ['밥을 먹었고 집에 갔어요', '밥을 먹고 집에 갔어요'],
        answer: 1,
        why: 'The past tense goes only on the last verb (갔어요). 먹고 is already understood as past.',
    },
    {
        prompt: '"I went to a café and drank coffee (there)."',
        choices: ['카페에 가서 커피를 마셨어요', '카페에 가고 커피를 마셨어요'],
        answer: 0,
        why: 'You drank the coffee at the café you went to, so the two actions are connected. With 가다 in this meaning, use 가서.',
    },
    {
        prompt: '"bread and milk" = ?',
        choices: ['빵하고 우유', '빵고 우유'],
        answer: 0,
        why: '고 joins verbs and adjectives. To join two nouns, use 하고 (or 와/과): 빵하고 우유.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    To say &ldquo;and&rdquo; or &ldquo;and then&rdquo; between two verbs or adjectives, add{' '}
                    <span lang="ko">고</span> to the first stem: <span lang="ko">싸고 맛있어요</span> (it&rsquo;s cheap
                    and tasty), <span lang="ko">밥을 먹고 잤어요</span> (I ate and then slept). The tense goes on the
                    last verb only.
                </p>
            </section>

            <p>
                In English, &ldquo;and&rdquo; is a separate word. In Korean, it is usually a tiny ending on the first
                verb. Like <span lang="ko">지만</span> (but), <span lang="ko">고</span> never changes shape and
                attaches straight to the stem. Tap the chips below to see each part.
            </p>

            <h2 id="how-to-make">1. How to make it</h2>
            <p>
                Take the dictionary form, drop <span lang="ko">다</span>, and add <span lang="ko">고</span>. It works
                the same for every verb and adjective, even the irregular ones.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Dictionary form</th><th>Meaning</th><th>+ 고</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다</td><td>to go</td><td lang="ko">가고</td></tr>
                        <tr><td lang="ko">먹다</td><td>to eat</td><td lang="ko">먹고</td></tr>
                        <tr><td lang="ko">하다</td><td>to do</td><td lang="ko">하고</td></tr>
                        <tr><td lang="ko">좋다</td><td>to be good</td><td lang="ko">좋고</td></tr>
                        <tr><td lang="ko">맵다</td><td>to be spicy</td><td lang="ko">맵고</td></tr>
                        <tr><td lang="ko">듣다</td><td>to listen</td><td lang="ko">듣고</td></tr>
                        <tr><td lang="ko">학생이다</td><td>to be a student</td><td lang="ko">학생이고</td></tr>
                        <tr><td lang="ko">의사이다</td><td>to be a doctor</td><td lang="ko">의사이고 / 의사고</td></tr>
                    </tbody>
                </table>
            </div>
            <Tutor>
                Notice <span lang="ko">맵다</span> and <span lang="ko">듣다</span>. They change in the{' '}
                <span lang="ko">요</span> form (<span lang="ko">매워요</span>, <span lang="ko">들어요</span>), but
                with <span lang="ko">고</span> they stay put: <span lang="ko">맵고</span>, <span lang="ko">듣고</span>.
                Easy!
            </Tutor>

            <h2 id="and">2. &ldquo;And&rdquo;: listing descriptions and actions</h2>
            <p>
                Use <span lang="ko">고</span> to describe something with two adjectives, or to list two things
                people do. The order doesn&rsquo;t matter much here: you could swap the two halves.
            </p>
            <Example
                words={[chip(W('이', 'this')), chip(W('식당', 'restaurant'), P('은', 'topic')), chip(W('싸', 'cheap', '싸다'), P('고', 'and')), chip(W('맛있어요', 'is delicious (polite)', '맛있다'))]}
                translation="This restaurant is cheap and the food is good."
            />
            <Example
                words={[chip(W('제', 'my (humble)')), chip(W('동생', 'younger sibling'), P('은', 'topic')), chip(W('키', 'height'), P('가', 'subject')), chip(W('크', 'tall, big', '크다'), P('고', 'and')), chip(W('착해요', 'is kind (polite)', '착하다'))]}
                translation="My younger sibling is tall and kind."
            />
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('커피', 'coffee'), P('를', 'object')), chip(W('마시', 'drink', '마시다'), P('고', 'and')), chip(W('친구', 'friend'), P('는', 'topic, here showing contrast')), chip(W('녹차', 'green tea'), P('를', 'object')), chip(W('마셔요', 'drinks (polite)', '마시다'))]}
                translation="I drink coffee, and my friend drinks green tea."
                note="The two halves can have different people doing the action."
            />

            <h2 id="and-then">3. &ldquo;And then&rdquo;: one step after another</h2>
            <p>
                <span lang="ko">고</span> also puts actions in order: first this, then that. It is how you talk
                through your day.
            </p>
            <Example
                words={[chip(W('밥', 'rice, a meal'), P('을', 'object')), chip(W('먹', 'eat', '먹다'), P('고', 'and then')), chip(W('이', 'teeth'), P('를', 'object')), chip(W('닦아요', 'brush (polite)', '닦다'))]}
                translation="I eat and then brush my teeth."
            />
            <Example
                words={[chip(W('숙제', 'homework'), P('를', 'object')), chip(W('하', 'do', '하다'), P('고', 'and then')), chip(W('잤어요', 'slept (polite)', '자다'))]}
                translation="I did my homework and then went to bed."
            />

            <h2 id="tense">4. The tense goes on the last verb</h2>
            <p>
                This is the rule English speakers forget. When both actions happened in the same time frame, only the
                last verb shows the tense. The first verb stays as plain stem + <span lang="ko">고</span>, and
                listeners understand it as past too.
            </p>
            <Example
                words={[chip(W('어제', 'yesterday')), chip(W('영화', 'movie'), P('를', 'object')), chip(W('보', 'watch, see', '보다'), P('고', 'and then (no past tense needed)')), chip(W('집', 'home'), P('에', 'to')), chip(W('갔어요', 'went (polite)', '가다'))]}
                translation="Yesterday I watched a movie and then went home."
            />
            <p>
                You will sometimes see <span lang="ko">았/었</span> before <span lang="ko">고</span>, as in{' '}
                <span lang="ko">어제는 비가 왔고 오늘은 맑아요</span> (it rained yesterday, and today it&rsquo;s
                clear). That is for two facts in <em>different</em> time frames. For a simple sequence of events, keep
                the first verb plain.
            </p>

            <h2 id="aseo">5. -고 vs -아서/어서 for &ldquo;and then&rdquo;</h2>
            <p>
                Korean has a second &ldquo;and then&rdquo;: <span lang="ko">아서/어서</span>. Use it when the
                second action depends on the first. The classic case is going somewhere and doing something{' '}
                <em>there</em>, or meeting someone and doing something <em>with them</em>. Verbs like{' '}
                <span lang="ko">가다</span> (go), <span lang="ko">오다</span> (come), <span lang="ko">만나다</span>{' '}
                (meet), <span lang="ko">앉다</span> (sit) and <span lang="ko">일어나다</span> (get up) almost always
                take <span lang="ko">아서/어서</span> in this meaning.
            </p>
            <Example
                words={[chip(W('도서관', 'library'), P('에', 'to')), chip(W('가', 'go', '가다'), P('서', 'and then (there)')), chip(W('공부했어요', 'studied (polite)', '공부하다'))]}
                translation="I went to the library and studied (there)."
            />
            <Example
                words={[chip(W('친구', 'friend'), P('를', 'object')), chip(W('만나', 'meet', '만나다'), P('서', 'and then (together)')), chip(W('밥', 'rice, a meal'), P('을', 'object')), chip(W('먹었어요', 'ate (polite)', '먹다'))]}
                translation="I met a friend and we ate together."
                note="With 만나고, it would sound like two separate events: you met a friend, and later you ate (maybe alone)."
            />
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Use 아서/어서</th><th>Use 고</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>The second action happens <em>there</em> or <em>with</em> the result of the first</td><td>Two separate steps, one after the other</td></tr>
                        <tr><td lang="ko">학교에 가서 공부해요</td><td lang="ko">샤워하고 자요</td></tr>
                        <tr><td lang="ko">의자에 앉아서 기다리세요</td><td lang="ko">숙제를 하고 놀아요</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                One twist: for getting on a vehicle or putting on clothes, Korean uses <span lang="ko">고</span>:{' '}
                <span lang="ko">버스를 타고 가요</span> (I go by bus), <span lang="ko">코트를 입고 나갔어요</span>{' '}
                (I put on a coat and went out). Learn these as set patterns. For more on the other ending, see{' '}
                <Link href="/learn/korean-aseo-eoseo-because">아서/어서 (because, and then)</Link>.
            </p>
            <Tutor>
                Quick test: can you add &ldquo;there&rdquo; or &ldquo;together&rdquo; to the English? Then reach for{' '}
                <span lang="ko">아서/어서</span>. If not, <span lang="ko">고</span> is your friend.
            </Tutor>

            <h2 id="nouns">6. Nouns: 이고, and 그리고 at the start</h2>
            <p>
                With a noun, use <span lang="ko">이다</span> (&ldquo;to be&rdquo;) + <span lang="ko">고</span>:{' '}
                <span lang="ko">이고</span>. This joins two whole sentences, not two nouns. To say &ldquo;bread and
                milk&rdquo;, use <span lang="ko">하고</span> or <span lang="ko">와/과</span> instead (see{' '}
                <Link href="/learn/korean-hago-wa-gwa-and">하고, 와/과 (and)</Link>).
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('학생', 'student'), P('이고', '"am", and (이다 + 고)')), chip(W('언니', "older sister (said by a woman)"), P('는', 'topic, here showing contrast')), chip(W('회사원', 'office worker'), P('이에요', '"is", polite (after a consonant)'))]}
                translation="I'm a student, and my older sister is an office worker."
            />
            <p>
                To start a new sentence with &ldquo;And&rdquo; or &ldquo;Also&rdquo;, use{' '}
                <span lang="ko">그리고</span>: <span lang="ko">한국어를 공부해요. 그리고 일본어도 공부해요.</span>{' '}
                (I study Korean. And I study Japanese too.)
            </p>

            <TryIt placeholder="예: 저는 아침을 먹고 회사에 가요." />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Lyrics string feelings together with <span lang="ko">고</span> all the time:{' '}
                &ldquo;I wait and wait&rdquo;, &ldquo;I cry and laugh&rdquo;. Open a song in{' '}
                <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line to see every ending explained. Next, learn
                to say &ldquo;but&rdquo; with <Link href="/learn/korean-jiman-but">지만</Link>, or review the{' '}
                <Link href="/learn/korean-past-tense">Korean past tense</Link>.
            </p>
        </>
    );
}
