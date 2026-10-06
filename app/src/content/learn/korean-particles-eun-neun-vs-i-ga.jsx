import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-particles-eun-neun-vs-i-ga',
    language: 'ko',
    title: '은/는 vs 이/가: When to Use Each Korean Particle',
    shortTitle: '은/는 vs 이/가',
    description: 'The clear guide to Korean topic and subject particles. 은/는 says what you are talking about, 이/가 points at who or what. Six rules, tappable examples and a quick quiz.',
    level: 'Beginner',
    minutes: 8,
    published: '2026-10-06',
    color: 'und',
};

export const faq = [
    {
        q: 'What is the difference between 은/는 and 이/가?',
        a: '은/는 marks the topic: what the sentence is about, often something already known or being contrasted ("as for me..."). 이/가 marks the subject, and puts the focus on it: new information, the answer to "who?" or "what?", or the thing that exists, is liked or is described.',
    },
    {
        q: 'When do I use 은 vs 는, and 이 vs 가?',
        a: 'It depends only on the last sound of the noun. After a consonant use 은 or 이 (책은, 책이). After a vowel use 는 or 가 (커피는, 커피가).',
    },
    {
        q: 'Why is it 제가 and not 저가?',
        a: 'A few short words change shape before 가: 저 becomes 제가, 나 becomes 내가, 너 becomes 네가, and 누구 becomes 누가.',
    },
    {
        q: 'Can Korean speakers leave these particles out?',
        a: 'Yes. In casual speech both are often dropped when the meaning is clear, as in 나 학생이야 ("I\'m a student"). Learners should still know them, because they change the meaning when they are there.',
    },
];

export const quiz = [
    {
        prompt: '책 + topic particle = ?',
        hint: '책 ends in a consonant (ㄱ).',
        choices: ['책는', '책은'],
        answer: 1,
        why: 'After a consonant the topic particle is 은.',
    },
    {
        prompt: 'A: 누가 케이크를 먹었어요? B: 민수__ 먹었어요.',
        hint: 'Who ate the cake? Minsu ate it.',
        choices: ['는', '가'],
        answer: 1,
        why: 'The answer to "who?" is new information, so it takes 이/가.',
    },
    {
        prompt: '강아지는 좋아해요. 고양이__ 안 좋아해요.',
        hint: 'I like dogs. Cats, I don\'t.',
        choices: ['는', '가'],
        answer: 0,
        why: 'Setting cats against dogs is a contrast, and contrast uses 은/는.',
    },
    {
        prompt: '저 + 가 = ?',
        choices: ['저가', '제가', '저이'],
        answer: 1,
        why: '저 changes to 제 before 가, so "I" as a subject is 제가.',
    },
    {
        prompt: '"the song I like" = __ 좋아하는 노래',
        choices: ['저는', '제가'],
        answer: 1,
        why: 'Inside a phrase that describes a noun, the subject takes 이/가, never 은/는.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    <strong lang="ko">은/는</strong> marks the <strong>topic</strong>: what you are talking about, like
                    &ldquo;as for&nbsp;X.&rdquo; <strong lang="ko">이/가</strong> marks the <strong>subject</strong> and
                    puts the spotlight on it: new information, the answer to &ldquo;who?&rdquo; or &ldquo;what?&rdquo;, or the thing that exists, is liked or is described.
                </p>
                <p>Pick the form by the last sound of the noun: <strong lang="ko">은 / 이</strong> after a consonant, <strong lang="ko">는 / 가</strong> after a vowel.</p>
            </section>

            <p>
                These two pairs are the first thing that trips up almost every Korean learner, because English has nothing
                quite like them. The good news: six patterns cover nearly every sentence you will meet. Tap any word in the
                examples below to see what it means and save it to your flashcards.
            </p>

            <h2 id="forms">Which form: 은 or 는, 이 or 가?</h2>
            <p>This part is pure sound. Look at the last letter block of the noun: does it end in a consonant (a 받침), or a vowel?</p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Noun ends in</th><th>Topic</th><th>Subject</th><th>Examples</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>a consonant</td><td lang="ko">은</td><td lang="ko">이</td><td lang="ko">책은, 책이 · 선생님은, 선생님이</td></tr>
                        <tr><td>a vowel</td><td lang="ko">는</td><td lang="ko">가</td><td lang="ko">커피는, 커피가 · 친구는, 친구가</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                A few short words change shape before <span lang="ko">가</span>:
                <span lang="ko"> 저 → 제가</span>, <span lang="ko">나 → 내가</span>, <span lang="ko">너 → 네가</span>, and
                <span lang="ko"> 누구 → 누가</span>. You will hear <span lang="ko">네가</span> pronounced <span lang="ko">니가</span> in
                songs and dramas, so it doesn&rsquo;t sound like <span lang="ko">내가</span>.
            </p>

            <h2 id="topic">1. 은/는 sets the topic</h2>
            <p>
                Use <span lang="ko">은/는</span> to say what the sentence is about. Introducing yourself is the classic case:
                the topic is you, and the rest of the sentence tells us something about you.
            </p>
            <Example
                words={[chip(W('저', 'I (polite)'), P('는', 'topic: "as for me"')), chip(W('학생', 'student'), P('이에요', '"am / is" (polite, after a consonant)'))]}
                translation="I'm a student."
            />
            <Tutor>
                Think of <span lang="ko">는</span> as &ldquo;as for me&hellip;&rdquo;. You aren&rsquo;t answering
                &ldquo;who is a student?&rdquo;, you&rsquo;re telling people something about yourself.
            </Tutor>

            <h2 id="new-info">2. 이/가 answers &ldquo;who?&rdquo; and &ldquo;what?&rdquo;</h2>
            <p>
                When the subject is the new or important part of the sentence, use <span lang="ko">이/가</span>. Question words like
                <span lang="ko"> 누가</span> (who) and <span lang="ko">뭐가</span> (what) always take it, and so does the answer.
            </p>
            <Example
                words={[chip(W('누', 'who (누구 shortens before 가)', '누구'), P('가', 'subject')), chip(W('왔어요', 'came (past, polite)', '오다'))]}
                translation="Who came?"
            />
            <Example
                words={[chip(W('민수', 'Minsu (a name)'), P('가', 'subject: Minsu is the new information')), chip(W('왔어요', 'came (past, polite)', '오다'))]}
                translation="Minsu came."
                note="민수는 왔어요 would sound like &quot;Minsu came (but someone else didn't)&quot;, which is rule 3."
            />

            <h2 id="contrast">3. 은/는 compares and contrasts</h2>
            <p>
                Put <span lang="ko">은/는</span> on two things and you are setting them against each other, like stressing a word in
                English: &ldquo;Coffee I like. <em>Tea</em>, not so much.&rdquo;
            </p>
            <Example
                words={[
                    chip(W('커피', 'coffee'), P('는', 'contrast: "coffee, at least"')),
                    chip(W('좋아해요', 'like (polite)', '좋아하다')),
                ]}
                translation="I like coffee..."
            />
            <Example
                words={[
                    chip(W('차', 'tea'), P('는', 'contrast: "but tea"')),
                    chip(W('안', 'not')),
                    chip(W('좋아해요', 'like (polite)', '좋아하다')),
                ]}
                translation="...but I don't like tea."
            />

            <h2 id="exists">4. 이/가 for what exists, is liked or is described</h2>
            <p>
                With <span lang="ko">있다</span> (to have, to exist), <span lang="ko">없다</span> (to not have), and describing words
                like <span lang="ko">좋다</span> (to be good), the thing that exists or is described takes <span lang="ko">이/가</span>.
                This is how both particles end up in one sentence: the person is the topic, the thing is the subject.
            </p>
            <Example
                words={[chip(W('저', 'I (polite)'), P('는', 'topic: "as for me"')), chip(W('동생', 'younger sibling'), P('이', 'subject: what exists')), chip(W('있어요', 'there is / have (polite)', '있다'))]}
                translation="I have a younger brother or sister."
            />
            <Example
                words={[chip(W('날씨', 'weather'), P('가', 'subject: what is being described')), chip(W('좋아요', 'is good (polite)', '좋다'))]}
                translation="The weather is nice."
            />
            <Example
                words={[chip(W('나', 'I (casual)'), P('는', 'topic')), chip(W('네', 'you (너 changes before 가)', '너'), P('가', 'subject: the one who is liked')), chip(W('좋아', 'like (casual)', '좋다'))]}
                translation="I like you."
                note="Literally &quot;as for me, you are good.&quot; This is why 좋다 takes 이/가 on the thing you like."
            />

            <h2 id="become">5. 이/가 with &ldquo;not be&rdquo; and &ldquo;become&rdquo;</h2>
            <p>
                <span lang="ko">아니다</span> (to not be) and <span lang="ko">되다</span> (to become) take <span lang="ko">이/가</span> on the
                thing you are not, or are becoming. It looks like a second subject, and that is normal.
            </p>
            <Example
                words={[chip(W('저', 'I (polite)'), P('는', 'topic')), chip(W('학생', 'student'), P('이', 'marks what I am not')), chip(W('아니에요', 'am not (polite)', '아니다'))]}
                translation="I'm not a student."
            />
            <Example
                words={[chip(W('의사', 'doctor'), P('가', 'marks what I want to become')), chip(W('되고', 'become (되다 + 고)', '되다')), chip(W('싶어요', 'want to (polite)', '싶다'))]}
                translation="I want to become a doctor."
            />

            <h2 id="clauses">6. Inside a describing phrase, always 이/가</h2>
            <p>
                When a whole phrase describes a noun (&ldquo;the song <em>I like</em>&rdquo;, &ldquo;the day <em>we met</em>&rdquo;),
                the subject inside that phrase takes <span lang="ko">이/가</span>. <span lang="ko">은/는</span> belongs to the
                sentence as a whole, so it can&rsquo;t sit inside the phrase.
            </p>
            <Example
                words={[chip(W('제', 'I (저 changes before 가)', '저'), P('가', 'subject inside the phrase')), chip(W('좋아하', 'like', '좋아하다'), P('는', 'turns "like" into "that I like" (not the topic particle)')), chip(W('노래', 'song'), P('예요', '"is" (polite, after a vowel)'))]}
                translation="It's a song I like."
                note="Careful: the 는 in 좋아하는 is a verb ending meaning &quot;that ...&quot;, not the topic particle."
            />

            <TryIt placeholder="예: 저는 커피가 좋아요" />

            <h2 id="mistakes">Three mistakes to stop making</h2>
            <ul className={styles.list}>
                <li><strong lang="ko">누구는 왔어요?</strong> Question words take <span lang="ko">이/가</span>: <span lang="ko">누가 왔어요?</span></li>
                <li><strong lang="ko">저가</strong> is never right. Before <span lang="ko">가</span> it is <span lang="ko">제가</span>.</li>
                <li><strong lang="ko">저는 좋아하는 노래</strong> breaks rule 6. Say <span lang="ko">제가 좋아하는 노래</span>.</li>
            </ul>

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Once you know the six rules, you will notice <span lang="ko">나는</span>, <span lang="ko">내가</span> and
                <span lang="ko"> 네가</span> in almost every K-pop chorus. Open any song in <Link href="/lyrics">Hanbok Lyrics</Link>,
                tap a line, and the breakdown marks each particle for you.
            </p>
        </>
    );
}
