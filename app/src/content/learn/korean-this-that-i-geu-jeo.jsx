import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-this-that-i-geu-jeo',
    language: 'ko',
    title: 'Korean "This" and "That": 이, 그, 저 and 이거, 여기 Explained',
    shortTitle: 'This and that (이, 그, 저)',
    description: 'Learn how to say this, that and that over there in Korean with 이, 그 and 저, plus 이거/그거/저거 for things and 여기/거기/저기 for places, with easy examples.',
    level: 'Beginner',
    topic: 'basics',
    minutes: 7,
    published: '2026-10-11',
    color: 'und',
    grammar: [
        { form: '이/그/저', label: 'this / that / that over there' },
        { form: '이거/그거/저거', label: 'this thing / that thing' },
        { form: '이게/그게/저게', label: 'this thing / that thing (+ 이/가)' },
        { form: '여기/거기/저기', label: 'here / there / over there' },
    ],
};

export const faq = [
    {
        q: 'What is the difference between 이, 그 and 저 in Korean?',
        a: '이 means "this" (near me, the speaker). 그 means "that" near you, the listener, or something we already talked about. 저 means "that over there", far from both of us.',
    },
    {
        q: 'What does 이거 mean?',
        a: '이거 means "this thing" or "this one". It is the spoken form of 이것. In the same way, 그거 and 저거 come from 그것 and 저것. 이거 얼마예요? means "How much is this?"',
    },
    {
        q: 'What is the difference between 거기 and 저기?',
        a: '거기 is "there" near the listener, or a place you just mentioned, like on the phone: 거기 날씨 어때요? (How is the weather there?). 저기 is "over there", a place you can both see in the distance.',
    },
    {
        q: 'Why does 그 sometimes mean "the"?',
        a: 'Korean has no word for "the". When you mean "that thing we just talked about", Koreans use 그: 그 영화 봤어요? (Did you see that movie?). It often works like "the" in English.',
    },
];

export const quiz = [
    {
        prompt: 'You are holding a cup in a shop. "How much is ___?"',
        choices: ['이거 얼마예요?', '저거 얼마예요?'],
        answer: 0,
        why: 'The cup is in your hand, so it is near you: 이거. 저거 is for something far from both of you.',
    },
    {
        prompt: 'You point at a tall building far away. "What is ___ building?"',
        choices: ['그 건물은 뭐예요?', '저 건물은 뭐예요?'],
        answer: 1,
        why: 'It is far from both of you, so use 저. 그 would mean near the listener or already mentioned.',
    },
    {
        prompt: 'Your friend talked about a restaurant yesterday. "Let\'s go to that restaurant!"',
        hint: 'It is not in sight. You just mentioned it before.',
        choices: ['그 식당에 가요!', '저 식당에 가요!'],
        answer: 0,
        why: '그 points to something already mentioned. 저 is only for things you can see over there.',
    },
    {
        prompt: '"Please come here." = ___ 오세요.',
        choices: ['여기로', '이거로'],
        answer: 0,
        why: '여기 is a place (here). 이거 is a thing (this one), so it does not fit.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    Korean has three pointing words: <span lang="ko">이</span> (this, near me), <span lang="ko">그</span>{' '}
                    (that, near you or already mentioned) and <span lang="ko">저</span> (that over there). Put them
                    before a noun: <span lang="ko">이 책</span> (this book). For things, say <span lang="ko">이거/그거/저거</span>.
                    For places, say <span lang="ko">여기/거기/저기</span>.
                </p>
            </section>

            <p>
                English has two pointing words, &ldquo;this&rdquo; and &ldquo;that&rdquo;. Korean has three, and they
                follow one simple pattern. Once you know <span lang="ko">이</span>, <span lang="ko">그</span> and{' '}
                <span lang="ko">저</span>, you can point at people, things and places. Tap the chips below to see each
                part.
            </p>

            <h2 id="i-geu-jeo">1. 이, 그, 저 + a noun</h2>
            <p>
                Think about where the thing is. Is it close to me, close to you, or far from both of us?
            </p>
            <ul className={styles.list}>
                <li><strong><span lang="ko">이</span></strong>: this, close to me (the speaker).</li>
                <li><strong><span lang="ko">그</span></strong>: that, close to you (the listener).</li>
                <li><strong><span lang="ko">저</span></strong>: that over there, far from both of us.</li>
            </ul>
            <p>
                Each one is its own word, so put a space before the noun: <span lang="ko">이 책</span>,{' '}
                <span lang="ko">그 가방</span>, <span lang="ko">저 사람</span>.
            </p>
            <Example
                words={[chip(W('이', 'this')), chip(W('책', 'book'), P('은', 'topic')), chip(W('재미있어요', 'is interesting', '재미있다'))]}
                translation="This book is interesting."
            />
            <Example
                words={[chip(W('그', 'that (near you)')), chip(W('가방', 'bag'), P('이', 'subject')), chip(W('예뻐요', 'is pretty', '예쁘다'))]}
                translation="That bag (of yours) is pretty."
            />
            <Example
                words={[chip(W('저', 'that (over there)')), chip(W('사람', 'person'), P('은', 'topic')), chip(W('누구', 'who'), P('예요', 'is (after a vowel)'))]}
                translation="Who is that person over there?"
                note="Careful: 저 here means 'that over there'. 저 also means 'I' (humble). The context makes it clear."
            />
            <Example
                words={[chip(W('이', 'this')), chip(W('사람', 'person'), P('은', 'topic')), chip(W('제', 'my (humble)')), chip(W('친구', 'friend'), P('예요', 'is (after a vowel)'))]}
                translation="This is my friend."
                note="When introducing someone older or important, say 이분 (this person, respectful) instead of 이 사람."
            />

            <h2 id="igeo">2. Things: 이거, 그거, 저거</h2>
            <p>
                To say &ldquo;this one&rdquo; or &ldquo;that one&rdquo; without naming the thing, add{' '}
                <span lang="ko">것</span> (thing). In writing it is <span lang="ko">이것</span>,{' '}
                <span lang="ko">그것</span>, <span lang="ko">저것</span>. In speech, people almost always say the
                shorter <span lang="ko">이거</span>, <span lang="ko">그거</span>, <span lang="ko">저거</span>.
            </p>
            <Example
                words={[chip(W('이거', 'this (thing)', '이것')), chip(W('얼마', 'how much'), P('예요', 'is (after a vowel)'))]}
                translation="How much is this?"
            />
            <Example
                words={[chip(W('저거', 'that (thing) over there', '저것')), chip(W('주세요', 'please give', '주다'))]}
                translation="That one over there, please."
            />
            <p>
                With particles, these words shrink even more. You will hear the short forms all the time:
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Written</th><th>Spoken</th><th>+ 이/가</th><th>+ 은/는</th><th>+ 을/를</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">이것 (this)</td><td lang="ko">이거</td><td lang="ko">이게</td><td lang="ko">이건</td><td lang="ko">이걸</td></tr>
                        <tr><td lang="ko">그것 (that)</td><td lang="ko">그거</td><td lang="ko">그게</td><td lang="ko">그건</td><td lang="ko">그걸</td></tr>
                        <tr><td lang="ko">저것 (that over there)</td><td lang="ko">저거</td><td lang="ko">저게</td><td lang="ko">저건</td><td lang="ko">저걸</td></tr>
                    </tbody>
                </table>
            </div>
            <Example
                words={[chip(W('이게', 'this (thing) + subject 이', '이것')), chip(W('뭐', 'what'), P('예요', 'is (after a vowel)'))]}
                translation="What is this?"
                note="이게 is 이것이 squeezed together. It is the most natural way to ask about something in your hand."
            />
            <Tutor>
                Point and say <span lang="ko">이거 주세요!</span> (This one, please!) and you can order food anywhere in
                Korea. Honestly, it&rsquo;s my favorite sentence.
            </Tutor>

            <h2 id="yeogi">3. Places: 여기, 거기, 저기</h2>
            <p>
                Places follow the same pattern: <span lang="ko">여기</span> (here), <span lang="ko">거기</span>{' '}
                (there, near you) and <span lang="ko">저기</span> (over there).
            </p>
            <Example
                words={[chip(W('여기', 'here')), chip(W('앉', 'sit', '앉다'), P('으세요', 'please (polite request)'))]}
                translation="Please sit here."
            />
            <Example
                words={[chip(W('화장실', 'restroom'), P('은', 'topic')), chip(W('저기', 'over there')), chip(W('있어요', 'is (located)', '있다'))]}
                translation="The restroom is over there."
            />
            <Example
                words={[chip(W('거기', 'there (where you are)')), chip(W('날씨', 'weather'), P('는', 'topic')), chip(W('어때요', 'how is it', '어떻다'))]}
                translation="How's the weather there?"
                note="On the phone you cannot see the other place, but it is near the listener, so it is 거기."
            />

            <h2 id="geu-mentioned">4. 그 for &ldquo;that thing we talked about&rdquo;</h2>
            <p>
                <span lang="ko">그</span> has a second job. It points back to something already mentioned, even if it
                is nowhere in sight. This is often how Koreans say &ldquo;the&rdquo;.
            </p>
            <Example
                words={[chip(W('그', 'that (the one we mentioned)')), chip(W('영화', 'movie')), chip(W('봤어요', 'did you see', '보다'))]}
                translation="Did you see that movie?"
                note="In casual speech the object particle 를 is often dropped, so 영화 stands alone here."
            />
            <p>
                You will also hear <span lang="ko">그게</span> on its own at the start of a sentence, like
                &ldquo;Well, the thing is...&rdquo;: <span lang="ko">그게... 좀 어려워요.</span> (Well... it&rsquo;s a
                bit hard.)
            </p>
            <Tutor>
                Quick check: can you both see it far away? Use <span lang="ko">저</span>. Is it near your friend, or
                something you talked about? Use <span lang="ko">그</span>. Is it right here with you? Use{' '}
                <span lang="ko">이</span>.
            </Tutor>

            <TryIt placeholder="예: 이거 뭐예요?" />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                K-pop lyrics are full of <span lang="ko">이 밤</span> (this night), <span lang="ko">그날</span> (that
                day) and <span lang="ko">여기</span>. Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and tap
                a line to see every word. Next, learn to ask questions with{' '}
                <Link href="/learn/korean-question-words">Korean question words</Link>, or join nouns with{' '}
                <Link href="/learn/korean-hago-wa-gwa-and">하고, 와/과 and 랑 (and)</Link>.
            </p>
        </>
    );
}
