import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-speech-levels',
    language: 'ko',
    title: 'Korean Speech Levels: 반말 vs 존댓말 Explained',
    shortTitle: 'Korean speech levels (반말 vs 존댓말)',
    description: 'Korean changes the end of every sentence depending on who you are talking to. Learn the three speech levels you actually need, when to use 반말 and 존댓말, and how 시 makes a sentence respectful.',
    level: 'Beginner',
    minutes: 8,
    published: '2026-10-07',
    color: 'pink',
    grammar: [{ form: '-아요/어요', label: 'polite ending' }, { form: '-습니다/ㅂ니다', label: 'formal ending' }, { form: '반말', label: 'casual speech' }, { form: '-(으)시-', label: 'honorific' }, { form: '께서', label: 'honorific subject particle' }],
};

export const faq = [
    {
        q: 'What is the difference between 반말 and 존댓말?',
        a: '반말 is casual speech for close friends, younger people and family. 존댓말 is respectful speech for everyone else. The difference is mostly at the end of the sentence: 먹어 (casual) vs 먹어요 (polite).',
    },
    {
        q: 'Which Korean speech level should I learn first?',
        a: 'The polite 요 form (해요체), like 먹어요 and 가요. It is safe with almost anyone you meet, from shop staff to new friends to coworkers.',
    },
    {
        q: 'When do Koreans use 습니다?',
        a: 'In formal settings: news broadcasts, announcements, presentations, the military and customer service. In everyday talk it sounds stiff, except in set phrases like 감사합니다.',
    },
    {
        q: 'Is it rude to use 반말 with a stranger?',
        a: 'Usually, yes. Use 반말 only after the other person suggests it, or with children and close friends your age. In dramas, 말 놓을까요? ("Shall we speak casually?") is the moment two characters get closer.',
    },
];

export const quiz = [
    {
        prompt: 'You are ordering at a café. Which is best?',
        hint: 'Coffee, please.',
        choices: ['커피 줘', '커피 주세요'],
        answer: 1,
        why: '주세요 is polite. 줘 is 반말 and would sound rude to staff.',
    },
    {
        prompt: '먹다 (to eat) in the polite 요 form = ?',
        choices: ['먹어요', '먹습니다'],
        answer: 0,
        why: '먹어요 is everyday polite speech. 먹습니다 is correct too, but formal, like a news reader.',
    },
    {
        prompt: 'Your close friend asks 뭐 해? How do you answer?',
        hint: 'I\'m studying.',
        choices: ['공부해', '공부합니다'],
        answer: 0,
        why: 'Match your friend\'s 반말. 공부합니다 would sound like a soldier reporting in.',
    },
    {
        prompt: 'Which sentence shows respect to the teacher?',
        hint: 'The teacher is coming.',
        choices: ['선생님이 와요', '선생님이 오세요'],
        answer: 1,
        why: 'The 시 in 오세요 raises the person doing the action. 와요 is polite to the listener but not respectful to the teacher.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    Korean changes the <strong>end of the sentence</strong> to match who you are talking to. Learn the polite
                    <span lang="ko"> 요</span> form first: it works with almost everyone. Save <span lang="ko">반말</span>{' '}
                    (casual) for close friends, and <span lang="ko">습니다</span> (formal) for announcements and set phrases.
                </p>
            </section>

            <p>
                In English, you sound polite by adding words like &ldquo;please&rdquo; or &ldquo;would you mind.&rdquo; In
                Korean, the verb ending itself carries the politeness, so every single sentence makes a choice. Tap the endings
                below to see how the same verb changes.
            </p>

            <h2 id="three-levels">The three levels you will actually hear</h2>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Level</th><th>Who it&rsquo;s for</th><th>to eat</th><th>to go</th><th>thank you</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Formal <span lang="ko">(합쇼체)</span></td><td>news, speeches, service</td><td lang="ko">먹습니다</td><td lang="ko">갑니다</td><td lang="ko">감사합니다</td></tr>
                        <tr><td>Polite <span lang="ko">(해요체)</span></td><td>most people, most of the time</td><td lang="ko">먹어요</td><td lang="ko">가요</td><td lang="ko">고마워요</td></tr>
                        <tr><td>Casual <span lang="ko">(반말)</span></td><td>close friends, younger people</td><td lang="ko">먹어</td><td lang="ko">가</td><td lang="ko">고마워</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                The first two together are called <span lang="ko">존댓말</span> (respectful speech). The good news: the polite
                and casual forms are almost the same. Take the casual form and add <span lang="ko">요</span>.
            </p>

            <h2 id="polite">1. Polite 요: your default</h2>
            <p>
                This is the level textbooks teach first and the one you should use with anyone you don&rsquo;t know well:
                shop staff, coworkers, a friend&rsquo;s parents, people online.
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('김치', 'kimchi'), P('를', 'object')), chip(W('좋아해요', 'like (polite)', '좋아하다'))]}
                translation="I like kimchi."
            />
            <Example
                words={[chip(W('어디', 'where'), P('에', 'to')), chip(W('가요', 'go (polite)', '가다'))]}
                translation="Where are you going?"
                note="Same ending for questions and answers. Your voice goes up for a question."
            />

            <h2 id="banmal">2. 반말: drop the 요</h2>
            <p>
                Between close friends, siblings, and when talking to children, Koreans drop <span lang="ko">요</span>. Notice
                that <span lang="ko">저</span> (humble &ldquo;I&rdquo;) becomes <span lang="ko">나</span>, and{' '}
                <span lang="ko">이에요/예요</span> (&ldquo;am, is&rdquo;) becomes <span lang="ko">이야/야</span>.
            </p>
            <Example
                words={[chip(W('나', 'I (casual)')), chip(W('배고파', 'hungry (casual)', '배고프다'))]}
                translation="I'm hungry."
            />
            <Example
                words={[chip(W('밥', 'rice, a meal')), chip(W('먹었어', 'ate (casual)', '먹다'))]}
                translation="Did you eat?"
                note='A classic way to say hi to a friend. It is less about food and more like "how are you?"'
            />
            <Example
                words={[chip(W('내', 'my (casual)', '나')), chip(W('친구', 'friend'), P('야', '"is", casual: 이야 after a consonant, 야 after a vowel'))]}
                translation="(He's) my friend."
            />
            <Tutor>
                Never start with <span lang="ko">반말</span> yourself. Wait for the other person to say{' '}
                <span lang="ko">말 편하게 하세요</span> (&ldquo;speak comfortably&rdquo;) or{' '}
                <span lang="ko">말 놓을까요?</span> (&ldquo;shall we drop the formality?&rdquo;). In K-dramas, that line is a
                big moment.
            </Tutor>

            <h2 id="formal">3. 습니다: formal and set phrases</h2>
            <p>
                The formal level ends in <span lang="ko">습니다</span> after a consonant and <span lang="ko">ㅂ니다</span> after
                a vowel. You will hear it from newsreaders, flight attendants and in presentations. Questions end in{' '}
                <span lang="ko">습니까/ㅂ니까</span>.
            </p>
            <Example
                words={[chip(W('처음', 'first time')), chip(W('뵙겠습니다', 'to see you (humble, formal)', '뵙다'))]}
                translation="Nice to meet you."
                note="A formal greeting you can use at a first meeting, even if you switch to 요 afterwards."
            />
            <Example
                words={[chip(W('잠시', 'a moment')), chip(W('후', 'after')), chip(W('도착합니다', 'arrive (formal)', '도착하다'))]}
                translation="We will be arriving shortly."
            />
            <p>
                Some phrases are almost always formal, even in casual-ish situations: <span lang="ko">감사합니다</span> (thank
                you), <span lang="ko">죄송합니다</span> (I&rsquo;m sorry), <span lang="ko">수고하셨습니다</span> (thanks for
                your hard work).
            </p>

            <h2 id="honorific">Bonus: 시 shows respect to the person doing it</h2>
            <p>
                Speech level is about the <em>listener</em>. Korean has a second tool for respecting the person you are
                talking <em>about</em>: add <span lang="ko">시</span> to the verb. In the polite form, <span lang="ko">시 + 어요</span>{' '}
                becomes <span lang="ko">세요</span>.
            </p>
            <Example
                words={[chip(W('할머니', 'grandmother'), P('께서', 'subject, respectful (instead of 이/가)')), chip(W('오세요', 'come (respectful, polite)', '오다'))]}
                translation="Grandma is coming."
            />
            <Example
                words={[chip(W('여기', 'here')), chip(W('앉으세요', 'please sit (respectful)', '앉다'))]}
                translation="Please have a seat."
                note="세요 also makes a polite request: 주세요 (please give), 들어오세요 (come in)."
            />
            <p>
                A few verbs swap for a different word entirely: <span lang="ko">먹다 → 드시다</span> (eat),{' '}
                <span lang="ko">자다 → 주무시다</span> (sleep), <span lang="ko">있다 → 계시다</span> (be somewhere). You
                never use these about yourself.
            </p>

            <h2 id="which">Which one should I use?</h2>
            <ul className={styles.list}>
                <li><strong>Not sure?</strong> Use the polite <span lang="ko">요</span> form. Nobody is offended by it.</li>
                <li><strong>Talking to someone older or senior</strong>, add <span lang="ko">시</span> when they are the one doing something.</li>
                <li><strong>Close friend your age</strong> who already uses <span lang="ko">반말</span> with you? Match them.</li>
                <li><strong>Giving a presentation or writing a formal email?</strong> Use <span lang="ko">습니다</span>.</li>
            </ul>

            <TryIt placeholder="예: 선생님, 어디 가세요?" />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Most K-pop lyrics are in <span lang="ko">반말</span>, because a song talks to someone close. Open a song in{' '}
                <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line: the breakdown explains every ending.
                For how the rest of the sentence fits together, see{' '}
                <Link href="/learn/korean-sentence-structure">Korean sentence structure</Link>.
            </p>
        </>
    );
}
