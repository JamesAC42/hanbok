import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-hago-wa-gwa-and',
    language: 'ko',
    title: 'Korean "And" and "With": 하고, 와/과 and (이)랑 Explained',
    shortTitle: 'Saying "and" (하고, 와/과, 랑)',
    description: 'Learn three ways to say "and" between nouns in Korean: 하고, 와/과 and (이)랑. See which ones are spoken or written, and how to say "with" a friend or family member.',
    level: 'Beginner',
    topic: 'basics',
    minutes: 7,
    published: '2026-10-11',
    color: 'read',
    grammar: [
        { form: '하고', label: 'and / with (everyday)' },
        { form: '와/과', label: 'and / with (written, formal)' },
        { form: '(이)랑', label: 'and / with (casual, spoken)' },
        { form: '하고 같이', label: 'together with' },
    ],
};

export const faq = [
    {
        q: 'How do you say "and" in Korean?',
        a: 'Between two nouns, attach 하고 to the first one: 빵하고 우유 (bread and milk). You can also use 와/과 in writing or (이)랑 in casual speech. Between two verbs, use the ending 고 instead: 먹고 가요 (eat and go).',
    },
    {
        q: 'What is the difference between 하고, 와/과 and 랑?',
        a: 'They all mean "and" or "with" between nouns. 하고 is the everyday choice in speech. 와/과 sounds written or formal, like a textbook or the news. (이)랑 is friendly and casual, very common with friends and family.',
    },
    {
        q: 'When do you use 와 and when do you use 과?',
        a: 'Look at the last letter of the noun. After a vowel, use 와: 커피와 차. After a consonant (a final 받침), use 과: 서울과 부산. Rule for 랑 is the same idea: 친구랑, but 동생이랑.',
    },
    {
        q: 'How do you say "with someone" in Korean?',
        a: 'Use the same particles, often with 같이 (together): 친구하고 같이 가요 (I go with a friend). 친구랑 같이 is more casual. In writing, 친구와 함께 is common.',
    },
];

export const quiz = [
    {
        prompt: 'Book and notebook = 책___ 공책',
        hint: '책 ends in a consonant (ㄱ).',
        choices: ['책와', '책과'],
        answer: 1,
        why: 'After a consonant, use 과: 책과 공책. 와 is only for nouns ending in a vowel, like 커피와.',
    },
    {
        prompt: 'Chatting with a friend: "I went with my friend." Which sounds most natural?',
        choices: ['친구랑 갔어', '친구와 갔어'],
        answer: 0,
        why: '랑 is relaxed and spoken. 와 is correct, but it sounds like writing, which is odd in a casual chat.',
    },
    {
        prompt: '동생 (younger sibling) + (이)랑 = ?',
        choices: ['동생랑', '동생이랑'],
        answer: 1,
        why: '동생 ends in a consonant (ㅇ), so it needs 이: 동생이랑. After a vowel, just 랑: 친구랑.',
    },
    {
        prompt: '"I eat and go to school." 밥을 ___ 학교에 가요.',
        hint: 'This "and" joins two verbs, not two nouns.',
        choices: ['먹고', '먹하고'],
        answer: 0,
        why: '하고 only joins nouns. To join verbs, add 고 to the stem: 먹고.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    To say &ldquo;and&rdquo; between two nouns, attach <span lang="ko">하고</span> to the first one:{' '}
                    <span lang="ko">빵하고 우유</span> (bread and milk). <span lang="ko">와/과</span> means the same
                    but sounds written, and <span lang="ko">(이)랑</span> sounds casual. All three also mean
                    &ldquo;with&rdquo;: <span lang="ko">친구하고 같이</span> (together with a friend).
                </p>
            </section>

            <p>
                In English, &ldquo;and&rdquo; is a separate word. In Korean, it is a little particle stuck to the end
                of the first noun. There are three of them, and the only real difference is the feel: everyday,
                written or casual. Tap the chips below to see each part.
            </p>

            <h2 id="hago">1. 하고: the everyday &ldquo;and&rdquo;</h2>
            <p>
                <span lang="ko">하고</span> is the easiest one. It never changes shape, so it works after any noun.
                Put it on the first noun, then say the second noun as usual.
            </p>
            <Example
                words={[chip(W('빵', 'bread'), P('하고', 'and')), chip(W('우유', 'milk'), P('를', 'object')), chip(W('샀어요', 'bought', '사다'))]}
                translation="I bought bread and milk."
            />
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('김치찌개', 'kimchi stew'), P('하고', 'and')), chip(W('비빔밥', 'bibimbap'), P('을', 'object')), chip(W('좋아해요', 'like', '좋아하다'))]}
                translation="I like kimchi stew and bibimbap."
                note="The particle for the whole sentence (을, 를, 이, 가) goes only on the last noun."
            />

            <h2 id="wa-gwa">2. 와/과: the written &ldquo;and&rdquo;</h2>
            <p>
                <span lang="ko">와/과</span> means exactly the same thing, but it sounds like writing. You see it in
                books, signs, news and formal speeches. Pick the form by the last sound of the noun:
            </p>
            <ul className={styles.list}>
                <li>After a vowel: <strong><span lang="ko">와</span></strong>, as in <span lang="ko">커피와 차</span> (coffee and tea).</li>
                <li>After a consonant: <strong><span lang="ko">과</span></strong>, as in <span lang="ko">서울과 부산</span> (Seoul and Busan).</li>
            </ul>
            <Example
                words={[chip(W('서울', 'Seoul'), P('과', 'and (after a consonant)')), chip(W('부산', 'Busan'), P('은', 'topic')), chip(W('큰', 'big', '크다')), chip(W('도시', 'city'), P('예요', 'is (after a vowel)'))]}
                translation="Seoul and Busan are big cities."
            />
            <Example
                words={[chip(W('커피', 'coffee'), P('와', 'and (after a vowel)')), chip(W('케이크', 'cake'), P('를', 'object')), chip(W('주문했어요', 'ordered', '주문하다'))]}
                translation="I ordered coffee and cake."
            />

            <h2 id="rang">3. (이)랑: the casual &ldquo;and&rdquo;</h2>
            <p>
                <span lang="ko">(이)랑</span> is warm and relaxed. You hear it all the time with friends and family,
                and in K-dramas. After a vowel it is <span lang="ko">랑</span>. After a consonant, add{' '}
                <span lang="ko">이</span> first: <span lang="ko">이랑</span>.
            </p>
            <Example
                words={[chip(W('떡볶이', 'tteokbokki (spicy rice cakes)'), P('랑', 'and (after a vowel)')), chip(W('김밥', 'gimbap (seaweed rice rolls)')), chip(W('주세요', 'please give', '주다'))]}
                translation="Tteokbokki and gimbap, please."
                note="When ordering, people often drop the object particle, so 김밥 has none here."
            />

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Noun</th><th>하고 (everyday)</th><th>와/과 (written)</th><th>(이)랑 (casual)</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">친구 (friend)</td><td lang="ko">친구하고</td><td lang="ko">친구와</td><td lang="ko">친구랑</td></tr>
                        <tr><td lang="ko">학교 (school)</td><td lang="ko">학교하고</td><td lang="ko">학교와</td><td lang="ko">학교랑</td></tr>
                        <tr><td lang="ko">동생 (younger sibling)</td><td lang="ko">동생하고</td><td lang="ko">동생과</td><td lang="ko">동생이랑</td></tr>
                        <tr><td lang="ko">물 (water)</td><td lang="ko">물하고</td><td lang="ko">물과</td><td lang="ko">물이랑</td></tr>
                    </tbody>
                </table>
            </div>
            <Tutor>
                Not sure which one to use? Say <span lang="ko">하고</span>. It fits almost every conversation, and you
                never have to check for a vowel or consonant. Easy!
            </Tutor>

            <h2 id="with">4. &ldquo;With&rdquo; a person: 하고 같이</h2>
            <p>
                The same three particles also mean &ldquo;with&rdquo;. Koreans often add <span lang="ko">같이</span>{' '}
                (together) after them to make it clear. In writing, <span lang="ko">함께</span> is a more formal word
                for &ldquo;together&rdquo;.
            </p>
            <Example
                words={[chip(W('친구', 'friend'), P('하고', 'with')), chip(W('같이', 'together')), chip(W('점심', 'lunch'), P('을', 'object')), chip(W('먹었어요', 'ate', '먹다'))]}
                translation="I had lunch with a friend."
            />
            <Example
                words={[chip(W('어제', 'yesterday')), chip(W('동생', 'younger sibling'), P('이랑', 'with (casual, after a consonant)')), chip(W('영화', 'movie'), P('를', 'object')), chip(W('봤어요', 'watched', '보다'))]}
                translation="I watched a movie with my younger sibling yesterday."
            />
            <Example
                words={[chip(W('누구', 'who'), P('랑', 'with (casual)')), chip(W('같이', 'together')), chip(W('가요', 'go', '가다'))]}
                translation="Who are you going with?"
            />
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('가족', 'family'), P('과', 'with (written, after a consonant)')), chip(W('함께', 'together (formal)')), chip(W('살아요', 'live', '살다'))]}
                translation="I live with my family."
                note="가족과 함께 sounds a little formal, like something you would write in a self-introduction."
            />

            <h2 id="verbs">5. &ldquo;And&rdquo; between verbs is different</h2>
            <p>
                <span lang="ko">하고</span>, <span lang="ko">와/과</span> and <span lang="ko">(이)랑</span> only join
                nouns. To join two actions, like &ldquo;I ate and went to school&rdquo;, you add the ending{' '}
                <span lang="ko">고</span> to the verb stem instead: <span lang="ko">밥을 먹고 학교에 갔어요</span>. Learn
                how it works in <Link href="/learn/korean-go-and-then">-고: and, and then</Link>.
            </p>
            <p>
                And what about <span lang="ko">그리고</span>? It also means &ldquo;and&rdquo;, but it usually starts a
                new sentence: <span lang="ko">빵을 샀어요. 그리고 우유도 샀어요.</span> (I bought bread. And I bought
                milk too.)
            </p>
            <Tutor>
                One more tip: in casual speech you may hear the particle on every item, like{' '}
                <span lang="ko">빵이랑 우유랑 샀어</span>. That is normal. Just don&rsquo;t mix the styles in one
                list, like <span lang="ko">빵과 우유랑</span>.
            </Tutor>

            <TryIt placeholder="예: 저는 친구하고 같이 커피를 마셨어요." />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Song lyrics love <span lang="ko">너랑 나</span> (you and me) and <span lang="ko">너와 나</span>, the
                more poetic version. Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line to see
                each particle explained. Next, learn how to join verbs with{' '}
                <Link href="/learn/korean-go-and-then">-고 (and, and then)</Link>, or review the basics in{' '}
                <Link href="/learn/korean-particles-eun-neun-vs-i-ga">은/는 vs 이/가</Link>.
            </p>
        </>
    );
}
