import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-sentence-structure',
    language: 'ko',
    title: 'Korean Sentence Structure: Word Order Made Simple',
    shortTitle: 'Korean sentence structure',
    description: 'Korean puts the verb last and uses particles to show who does what. Learn the basic word order, where time and place go, and why the subject often disappears, with tappable examples.',
    level: 'Beginner',
    minutes: 7,
    published: '2026-10-06',
    color: 'read',
    grammar: [{ form: '을/를', label: 'object particle' }, { form: '에', label: 'time, destination' }, { form: '에서', label: 'place of an action' }],
};

export const faq = [
    {
        q: 'What is the basic word order in Korean?',
        a: 'Subject, object, verb (SOV). "I drink coffee" is 저는 커피를 마셔요: I, coffee, drink. The verb or describing word comes at the end of the sentence.',
    },
    {
        q: 'Can you change the word order in Korean?',
        a: 'Yes, more than in English, because particles show each word\'s job. 커피를 저는 마셔요 still means "I drink coffee". The one firm rule is that the verb stays at the end.',
    },
    {
        q: 'Why do Korean sentences leave out "I" and "you"?',
        a: 'When it is clear from context who you mean, Korean simply drops the subject. 뭐 먹어요? ("What are you eating?") has no "you" at all.',
    },
];

export const quiz = [
    {
        prompt: 'Which sentence is natural Korean?',
        hint: 'I drink coffee.',
        choices: ['저는 마셔요 커피를', '저는 커피를 마셔요'],
        answer: 1,
        why: 'The verb goes at the end: subject, object, verb.',
    },
    {
        prompt: '사과 + object particle = ?',
        hint: '사과 (apple) ends in a vowel.',
        choices: ['사과을', '사과를'],
        answer: 1,
        why: 'After a vowel the object particle is 를. After a consonant it is 을.',
    },
    {
        prompt: '카페__ 공부해요.',
        hint: 'I study at a café.',
        choices: ['에', '에서'],
        answer: 1,
        why: 'The place where an action happens takes 에서. 에 is for where you go, and for time.',
    },
    {
        prompt: '"the book I bought" = ?',
        choices: ['책 제가 산', '제가 산 책'],
        answer: 1,
        why: 'Anything that describes a noun comes before it, so the noun 책 goes last.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    Korean is <strong>subject, object, verb</strong>. The verb always comes last, and small particles after
                    each word show its job, so the rest of the order can move around. When the subject is obvious, Korean drops it.
                </p>
            </section>

            <p>
                English relies on word order to show who did what: &ldquo;the cat chased the dog&rdquo; and &ldquo;the dog
                chased the cat&rdquo; mean different things. Korean labels each word with a particle instead, then saves the
                verb for the end. Tap any word below to see its job.
            </p>

            <h2 id="sov">1. The verb goes last</h2>
            <Example
                words={[chip(W('저', 'I (polite)'), P('는', 'topic')), chip(W('커피', 'coffee'), P('를', 'object: the thing being drunk')), chip(W('마셔요', 'drink (polite)', '마시다'))]}
                translation="I drink coffee."
                note="Word for word: I, coffee, drink."
            />
            <p>
                The object particle is <span lang="ko">을</span> after a consonant and <span lang="ko">를</span> after a vowel:
                <span lang="ko"> 밥을 먹어요</span> (I eat rice), <span lang="ko">커피를 마셔요</span> (I drink coffee). For the
                topic particle <span lang="ko">은/는</span> and the subject particle <span lang="ko">이/가</span>, see{' '}
                <Link href="/learn/korean-particles-eun-neun-vs-i-ga">은/는 vs 이/가</Link>.
            </p>

            <h2 id="time-place">2. Time and place come early</h2>
            <p>
                A comfortable default order is <strong>topic, time, place, object, verb</strong>. Time takes
                <span lang="ko"> 에</span>, and the place where something happens takes <span lang="ko">에서</span>.
            </p>
            <Example
                words={[
                    chip(W('저', 'I (polite)'), P('는', 'topic')),
                    chip(W('아침', 'morning'), P('에', 'time: "in the morning"')),
                    chip(W('카페', 'café'), P('에서', 'place where it happens: "at"')),
                    chip(W('커피', 'coffee'), P('를', 'object')),
                    chip(W('마셔요', 'drink (polite)', '마시다')),
                ]}
                translation="I drink coffee at a café in the morning."
            />
            <Tutor>
                <span lang="ko">에</span> or <span lang="ko">에서</span>? Use <span lang="ko">에</span> for where you are
                going (<span lang="ko">학교에 가요</span>, I go to school) and <span lang="ko">에서</span> for where you
                are doing something (<span lang="ko">학교에서 공부해요</span>, I study at school).
            </Tutor>

            <h2 id="flexible">3. The middle can move</h2>
            <p>
                Because the particles carry the meaning, you can move words around for emphasis and the sentence still makes
                sense. Whatever comes first tends to feel like the thing you are talking about.
            </p>
            <Example
                words={[chip(W('커피', 'coffee'), P('는', 'topic: "coffee, though..."')), chip(W('저', 'I (polite)'), P('도', '"too, also"')), chip(W('좋아해요', 'like (polite)', '좋아하다'))]}
                translation="Coffee, I like too."
            />

            <h2 id="drop">4. The subject disappears</h2>
            <p>
                If everyone knows who you mean, you don&rsquo;t say it. Questions between friends almost never include
                &ldquo;you,&rdquo; and answers rarely include &ldquo;I.&rdquo; In casual speech the particles drop too.
            </p>
            <Example
                words={[chip(W('뭐', 'what')), chip(W('먹어요', 'eat (polite)', '먹다'))]}
                translation="What are you eating?"
            />
            <Example
                words={[chip(W('김밥', 'gimbap (rice rolls)')), chip(W('먹어요', 'eat (polite)', '먹다'))]}
                translation="I'm eating gimbap."
            />

            <h2 id="describe">5. Describing words go before the noun</h2>
            <p>
                In English, &ldquo;the book <em>I bought</em>&rdquo; puts the description after the noun. Korean always puts
                it before, so the noun lands at the end of the phrase.
            </p>
            <Example
                words={[chip(W('제', 'I (저 changes before 가)', '저'), P('가', 'subject inside the phrase')), chip(W('산', 'bought (describing the noun)', '사다')), chip(W('책', 'book'))]}
                translation="the book I bought"
            />

            <h2 id="questions">6. Questions keep the same order</h2>
            <p>
                To ask a question, keep the order, put the question word where the answer will go, and raise your voice at
                the end. In polite speech the verb ending often stays the same.
            </p>
            <Example
                words={[chip(W('어디', 'where'), P('에', 'to')), chip(W('가요', 'go (polite)', '가다'))]}
                translation="Where are you going?"
            />
            <Example
                words={[chip(W('학교', 'school'), P('에', 'to')), chip(W('가요', 'go (polite)', '가다'))]}
                translation="I'm going to school."
            />

            <TryIt placeholder="예: 저는 주말에 친구를 만나요" />

            <h2 id="songs">See it in songs</h2>
            <p>
                Song lyrics bend these rules for rhythm, which makes them great practice. Open a song in{' '}
                <Link href="/lyrics">Hanbok Lyrics</Link>, tap a line, and look for where the verb landed.
            </p>
        </>
    );
}
