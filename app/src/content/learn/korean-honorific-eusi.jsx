import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-honorific-eusi',
    language: 'ko',
    title: 'Korean Honorific -(으)시-: 가세요, 드세요, 계세요 Explained',
    shortTitle: 'Showing respect with -(으)시-',
    description: 'Learn the Korean honorific -(으)시- in 가세요, 읽으세요 and 하셨어요: who it respects, why you never use it about yourself, and special verbs like 드시다, 주무시다 and 계시다.',
    level: 'Intermediate',
    topic: 'politeness',
    minutes: 9,
    published: '2026-10-11',
    color: 'pink',
    grammar: [
        { form: '-(으)시-', label: 'honorific (respects the person doing the action)' },
        { form: '-(으)세요', label: 'honorific polite present, or a polite request' },
        { form: '-(으)셨어요', label: 'honorific polite past' },
        { form: '드시다/주무시다/계시다', label: 'special honorific verbs' },
        { form: '말씀하시다', label: 'speak, say (honorific)' },
        { form: '께서', label: 'honorific subject particle' },
        { form: '께', label: 'to (someone respected)' },
    ],
};

export const faq = [
    {
        q: 'What does 세요 mean in Korean?',
        a: '세요 is the honorific 시 plus the polite ending 어요. It shows respect to the person doing the action: 어디 가세요? (Where are you going?). It is also a polite way to ask someone to do something: 앉으세요 (please sit).',
    },
    {
        q: 'When do you use the honorific 시 in Korean?',
        a: 'Use it when the person doing the action deserves respect: someone older, your boss, a teacher, a customer, or a stranger you are asking about. It respects the person you talk about, not just the person you talk to.',
    },
    {
        q: 'Can you use 시 to talk about yourself?',
        a: 'No. Adding 시 to your own actions sounds like you are praising yourself. If someone asks 어디 가세요?, you answer 학교에 가요, not 학교에 가세요.',
    },
    {
        q: 'What is the difference between 계세요 and 있으세요?',
        a: '계세요 is the honorific of 있다 when it means "to be somewhere": 사장님이 사무실에 계세요. 있으세요 is used when 있다 means "to have": 시간 있으세요? (Do you have time?).',
    },
];

export const quiz = [
    {
        prompt: '읽다 (to read) with the honorific, polite present = ?',
        hint: 'The stem ends in a consonant.',
        choices: ['읽세요', '읽으세요'],
        answer: 1,
        why: 'After a consonant you need 으: 읽 + 으세요. After a vowel it is just 세요, like 가세요.',
    },
    {
        prompt: 'Your teacher asks 지금 뭐 하세요? How do you answer?',
        hint: 'I am studying.',
        choices: ['공부해요', '공부하세요'],
        answer: 0,
        why: 'You never add 시 to your own actions. The teacher used 시 to respect you; you answer with plain polite 공부해요.',
    },
    {
        prompt: 'Grandma is sleeping. 할머니께서 ___',
        choices: ['자세요', '주무세요', '자요'],
        answer: 1,
        why: '자다 (sleep) has its own honorific verb, 주무시다. With 께서 in the sentence, 주무세요 is the natural choice.',
    },
    {
        prompt: 'The boss is in the office. 사장님이 사무실에 ___',
        choices: ['계세요', '있으세요'],
        answer: 0,
        why: '있다 meaning "to be somewhere" becomes 계시다 for a respected person. 있으세요 is for "to have": 시간 있으세요?',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    Add <span lang="ko">시</span> (<span lang="ko">으시</span> after a consonant) to a verb to show
                    respect to <strong>the person doing the action</strong>: <span lang="ko">가요 → 가세요</span>,{' '}
                    <span lang="ko">읽어요 → 읽으세요</span>, <span lang="ko">했어요 → 하셨어요</span>. Use it for older
                    people, bosses and strangers. Never use it for yourself.
                </p>
            </section>

            <p>
                In the <Link href="/learn/korean-speech-levels">speech levels guide</Link>, you learned that the{' '}
                <span lang="ko">요</span> ending is polite to the person you are talking <em>to</em>. Korean has a
                second, separate tool: <span lang="ko">시</span>, which respects the person you are talking{' '}
                <em>about</em>. Tap the chips below to see where it hides in each verb.
            </p>

            <h2 id="how">1. How to add -(으)시-</h2>
            <p>
                Drop <span lang="ko">다</span> from the dictionary form. If the stem ends in a vowel, add{' '}
                <span lang="ko">시</span>. If it ends in a consonant, add <span lang="ko">으시</span>. Then add your
                usual ending. Two shortcuts happen every time:
            </p>
            <ul className={styles.list}>
                <li><span lang="ko">시 + 어요</span> becomes <strong><span lang="ko">세요</span></strong> (present)</li>
                <li><span lang="ko">시 + 었어요</span> becomes <strong><span lang="ko">셨어요</span></strong> (past)</li>
            </ul>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Dictionary form</th><th>Plain polite</th><th>Honorific present</th><th>Honorific past</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다 (go)</td><td lang="ko">가요</td><td lang="ko">가세요</td><td lang="ko">가셨어요</td></tr>
                        <tr><td lang="ko">오다 (come)</td><td lang="ko">와요</td><td lang="ko">오세요</td><td lang="ko">오셨어요</td></tr>
                        <tr><td lang="ko">하다 (do)</td><td lang="ko">해요</td><td lang="ko">하세요</td><td lang="ko">하셨어요</td></tr>
                        <tr><td lang="ko">읽다 (read)</td><td lang="ko">읽어요</td><td lang="ko">읽으세요</td><td lang="ko">읽으셨어요</td></tr>
                        <tr><td lang="ko">앉다 (sit)</td><td lang="ko">앉아요</td><td lang="ko">앉으세요</td><td lang="ko">앉으셨어요</td></tr>
                        <tr><td lang="ko">바쁘다 (busy)</td><td lang="ko">바빠요</td><td lang="ko">바쁘세요</td><td lang="ko">바쁘셨어요</td></tr>
                        <tr><td lang="ko">살다 (live)</td><td lang="ko">살아요</td><td lang="ko">사세요</td><td lang="ko">사셨어요</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                Notice that the honorific form is often <em>easier</em> than the plain one. There is no{' '}
                <span lang="ko">아/어</span> choice to make: <span lang="ko">오세요</span>, not{' '}
                <span lang="ko">와세요</span>. One small catch: verbs ending in <span lang="ko">ㄹ</span> drop it, so{' '}
                <span lang="ko">살다</span> becomes <span lang="ko">사세요</span>.
            </p>
            <Example
                words={[chip(W('선생님', 'teacher'), P('이', 'subject')), chip(W('책', 'book'), P('을', 'object')), chip(W('읽', 'read', '읽다'), P('으세요', 'honorific 으시 + polite 어요'))]}
                translation="The teacher is reading a book."
            />
            <Example
                words={[chip(W('어머니', 'mother'), P('가', 'subject')), chip(W('시장', 'market'), P('에', 'to')), chip(W('가', 'go', '가다'), P('셨어요', 'honorific 시 + past 었 + 요'))]}
                translation="My mother went to the market."
            />
            <Example
                words={[chip(W('아버지', 'father'), P('는', 'topic')), chip(W('회사', 'company, office'), P('에서', 'at')), chip(W('일하', 'work', '일하다'), P('세요', 'honorific 시 + polite 어요'))]}
                translation="My father works at a company."
            />

            <h2 id="who">2. Who gets 시, and who doesn&rsquo;t</h2>
            <p>
                Ask yourself one question: <strong>who is doing this?</strong> If it is someone older, someone senior
                at work, a teacher, a customer, or a stranger, add <span lang="ko">시</span>. If it is you, a younger
                sibling, a child or a close friend, leave it out.
            </p>
            <p>
                Since Korean usually drops &ldquo;you&rdquo;, the <span lang="ko">시</span> often tells you the
                question is about the listener. <span lang="ko">바쁘세요?</span> means &ldquo;Are you busy?&rdquo; to
                someone you respect.
            </p>
            <Example
                words={[chip(W('어디', 'where')), chip(W('가', 'go', '가다'), P('세요', 'honorific 시 + polite 어요'))]}
                translation="Where are you going?"
                note="A friendly everyday greeting to a neighbor or an older person. The 시 shows the question is about them."
            />
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('병원', 'hospital'), P('에', 'to')), chip(W('가', 'go', '가다'), P('요', 'plain polite: no 시 for yourself'))]}
                translation="I'm going to the hospital."
                note="The answer to 어디 가세요? Same verb, but no 시, because you are talking about yourself."
            />
            <Tutor>
                Using <span lang="ko">시</span> for yourself is like saying &ldquo;His Majesty, me, is going to
                lunch.&rdquo; Keep the respect for others, and keep your own verbs plain and polite!
            </Tutor>
            <p>
                Speech level and <span lang="ko">시</span> work separately. Talking to a close friend about your
                grandmother, you might say <span lang="ko">할머니 오셨어</span> (&ldquo;Grandma&rsquo;s here&rdquo;):
                casual to your friend, respectful to Grandma.
            </p>

            <h2 id="request">3. 세요 as a polite request</h2>
            <p>
                The same <span lang="ko">(으)세요</span> form is also the standard polite way to ask someone to do
                something. Shop staff, doctors and hosts use it all day.
            </p>
            <Example
                words={[chip(W('여기', 'here')), chip(W('앉', 'sit', '앉다'), P('으세요', 'please (polite request with 으시)'))]}
                translation="Please have a seat here."
            />
            <p>
                You already know a few: <span lang="ko">안녕히 가세요</span> (goodbye, to someone leaving),{' '}
                <span lang="ko">어서 오세요</span> (welcome), <span lang="ko">주세요</span> (please give).
            </p>

            <h2 id="special">4. Special honorific verbs</h2>
            <p>
                A few very common verbs don&rsquo;t just add <span lang="ko">시</span>. They switch to a different
                word. You will hear these constantly, so they are worth learning as a set.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Plain verb</th><th>Honorific verb</th><th>Polite present</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">먹다 / 마시다 (eat / drink)</td><td lang="ko">드시다</td><td lang="ko">드세요</td></tr>
                        <tr><td lang="ko">자다 (sleep)</td><td lang="ko">주무시다</td><td lang="ko">주무세요</td></tr>
                        <tr><td lang="ko">있다 (be somewhere)</td><td lang="ko">계시다</td><td lang="ko">계세요</td></tr>
                        <tr><td lang="ko">말하다 (speak, say)</td><td lang="ko">말씀하시다</td><td lang="ko">말씀하세요</td></tr>
                    </tbody>
                </table>
            </div>
            <Example
                words={[chip(W('맛있게', 'deliciously', '맛있다')), chip(W('드세요', 'eat (honorific, polite)', '드시다'))]}
                translation="Enjoy your meal."
                note="Said to anyone you serve food to. Literally 'eat it deliciously'."
            />
            <Example
                words={[chip(W('할머니', 'grandmother'), P('께서', 'subject, respectful (instead of 이/가)')), chip(W('주무세요', 'sleep (honorific, polite)', '주무시다'))]}
                translation="Grandma is sleeping."
            />
            <Example
                words={[chip(W('사장님', 'company president, boss'), P('은', 'topic')), chip(W('지금', 'now')), chip(W('사무실', 'office'), P('에', 'at, in')), chip(W('계세요', 'is (somewhere), honorific', '계시다'))]}
                translation="The boss is in the office right now."
            />
            <Example
                words={[chip(W('선생님', 'teacher'), P('께서', 'subject, respectful')), chip(W('말씀하셨어요', 'said (honorific, past)', '말씀하시다'))]}
                translation="The teacher said so."
            />
            <p>
                Watch out for <span lang="ko">있다</span>. When it means &ldquo;to be somewhere&rdquo;, use{' '}
                <span lang="ko">계시다</span>. When it means &ldquo;to have&rdquo;, just add{' '}
                <span lang="ko">으시</span>: <span lang="ko">시간 있으세요?</span> (Do you have time?). That is why
                a shop says <span lang="ko">안녕히 계세요</span> (stay well) to the person staying behind.
            </p>

            <h2 id="kkeseo">5. 께서 and 께: respectful particles</h2>
            <p>
                For extra respect, particles can change too. In everyday talk, many people simply use{' '}
                <span lang="ko">이/가</span> with a <span lang="ko">시</span> verb, and that is fine. In more careful
                speech and writing, you will see:
            </p>
            <ul className={styles.list}>
                <li><strong><span lang="ko">께서</span></strong> instead of <span lang="ko">이/가</span> (subject). With a topic, <span lang="ko">께서는</span>.</li>
                <li><strong><span lang="ko">께</span></strong> instead of <span lang="ko">에게/한테</span> (to someone).</li>
            </ul>
            <Example
                words={[chip(W('할머니', 'grandmother'), P('께', 'to, respectful (instead of 에게/한테)')), chip(W('선물', 'present, gift'), P('을', 'object')), chip(W('드렸어요', 'gave (humble, to someone respected)', '드리다'))]}
                translation="I gave Grandma a present."
                note="I am the one giving, so there is no 시. Instead, 주다 becomes the humble 드리다 to lift Grandma up."
            />
            <Tutor>
                Not sure? Start with just <span lang="ko">세요</span> and <span lang="ko">셨어요</span>. Add{' '}
                <span lang="ko">드세요</span> and <span lang="ko">계세요</span> next. That covers most of real life!
            </Tutor>

            <TryIt placeholder="예: 할아버지께서 신문을 읽으세요." />

            <h2 id="next">Keep going</h2>
            <p>
                Ballads and dramas are full of <span lang="ko">시</span>, especially when characters talk about
                parents. Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line to see every ending
                explained. For the bigger picture, review{' '}
                <Link href="/learn/korean-speech-levels">Korean speech levels</Link>, or brush up on the{' '}
                <Link href="/learn/korean-past-tense">Korean past tense</Link> behind <span lang="ko">셨어요</span>.
            </p>
        </>
    );
}
