import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-question-words',
    language: 'ko',
    title: 'Korean Question Words: 뭐, 누구, 어디, 언제, 왜, 어떻게',
    shortTitle: 'Question words (뭐, 어디, 왜)',
    description: 'Learn the Korean question words for what, who, where, when, why, how, how many and how much, where they go in a sentence, and how to ask yes/no questions.',
    level: 'Beginner',
    topic: 'basics',
    minutes: 7,
    published: '2026-10-11',
    color: 'read',
    grammar: [
        { form: '뭐/무엇', label: 'what' },
        { form: '누구/누가', label: 'who' },
        { form: '어디', label: 'where' },
        { form: '언제', label: 'when' },
        { form: '왜', label: 'why' },
        { form: '어떻게', label: 'how' },
        { form: '몇', label: 'how many, what (number)' },
        { form: '얼마', label: 'how much (price)' },
        { form: '어느/무슨', label: 'which, what kind of' },
    ],
};

export const faq = [
    {
        q: 'How do you say "what" in Korean?',
        a: 'In everyday speech, say 뭐: 뭐 해요? (What are you doing?). 무엇 is the full, more formal form you see in writing. Before a noun, use 무슨: 무슨 음식 (what food).',
    },
    {
        q: 'What is the difference between 누구 and 누가?',
        a: 'Both mean "who". When "who" is the subject of the sentence, 누구 + 가 shortens to 누가: 누가 왔어요? (Who came?). Everywhere else you use 누구: 누구예요? (Who is it?), 누구를 만났어요? (Who did you meet?).',
    },
    {
        q: 'Where does the question word go in a Korean sentence?',
        a: 'Right where the answer would go. You do not move it to the front like in English. 어디에 살아요? (Where do you live?) is answered 서울에 살아요 (I live in Seoul).',
    },
    {
        q: 'How do you ask a yes/no question in Korean?',
        a: 'Say the same sentence as a statement, but raise your voice at the end. 커피 마셔요. (I drink coffee.) becomes 커피 마셔요? (Do you drink coffee?). In writing, just add a question mark.',
    },
];

export const quiz = [
    {
        prompt: '"Who came?" = ___ 왔어요?',
        hint: '"Who" is the subject here.',
        choices: ['누구가', '누가'],
        answer: 1,
        why: 'When "who" is the subject, 누구 + 가 always shortens to 누가. 누구가 is not used.',
    },
    {
        prompt: 'At a market, you want to ask "How much is this?"',
        choices: ['이거 얼마예요?', '이거 몇이에요?'],
        answer: 0,
        why: '얼마 asks about price or amount. 몇 needs a counter after it, like 몇 개 (how many items) or 몇 시 (what time).',
    },
    {
        prompt: 'Which is the natural way to say "Where do you live?"',
        choices: ['어디에 살아요?', '살아요 어디에?'],
        answer: 0,
        why: 'The question word sits where the answer would be, and the verb stays at the end: 어디에 살아요? / 서울에 살아요.',
    },
    {
        prompt: 'How do you turn 밥 먹었어요. (I ate.) into "Did you eat?"',
        choices: ['Add 뭐 at the start', 'Raise your voice at the end'],
        answer: 1,
        why: 'Yes/no questions use the same words as the statement. Only the rising tone (and the question mark) changes. Adding 뭐 would ask "What did you eat?"',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    The main Korean question words are <span lang="ko">뭐</span> (what), <span lang="ko">누구</span>{' '}
                    (who), <span lang="ko">어디</span> (where), <span lang="ko">언제</span> (when),{' '}
                    <span lang="ko">왜</span> (why) and <span lang="ko">어떻게</span> (how). Put the question word where
                    the answer would go, and keep the verb at the end. For a yes/no question, just raise your voice at
                    the end.
                </p>
            </section>

            <p>
                Questions are the fastest way to start a real conversation. The nice part about Korean: you
                don&rsquo;t need to flip the word order or add &ldquo;do&rdquo; or &ldquo;does&rdquo;. You swap in a
                question word, and that&rsquo;s it. Tap the chips below to see each part.
            </p>

            <h2 id="list">1. The question words at a glance</h2>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Korean</th><th>English</th><th>Example</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">뭐 / 무엇</td><td>what</td><td lang="ko">뭐 해요?</td></tr>
                        <tr><td lang="ko">누구 / 누가</td><td>who</td><td lang="ko">누구예요?</td></tr>
                        <tr><td lang="ko">어디</td><td>where</td><td lang="ko">어디 가요?</td></tr>
                        <tr><td lang="ko">언제</td><td>when</td><td lang="ko">언제 와요?</td></tr>
                        <tr><td lang="ko">왜</td><td>why</td><td lang="ko">왜요?</td></tr>
                        <tr><td lang="ko">어떻게</td><td>how</td><td lang="ko">어떻게 가요?</td></tr>
                        <tr><td lang="ko">몇</td><td>how many, what (number)</td><td lang="ko">몇 살이에요?</td></tr>
                        <tr><td lang="ko">얼마</td><td>how much (price)</td><td lang="ko">얼마예요?</td></tr>
                        <tr><td lang="ko">어느 / 무슨</td><td>which / what kind of</td><td lang="ko">무슨 음식?</td></tr>
                    </tbody>
                </table>
            </div>

            <h2 id="what">2. 뭐: what</h2>
            <p>
                <span lang="ko">뭐</span> is the everyday word for &ldquo;what&rdquo;. <span lang="ko">무엇</span> is
                the full form. You&rsquo;ll see it in writing and formal speech, but in conversation people say{' '}
                <span lang="ko">뭐</span>. With the object particle, <span lang="ko">뭐를</span> often shortens to{' '}
                <span lang="ko">뭘</span>.
            </p>
            <Example
                words={[chip(W('이름', 'name'), P('이', 'subject')), chip(W('뭐', 'what'), P('예요', '"is", polite (after a vowel)'))]}
                translation="What's your name?"
            />
            <Example
                words={[chip(W('주말', 'weekend'), P('에', 'on, at (time)')), chip(W('뭐', 'what')), chip(W('했어요', 'did (polite)', '하다'))]}
                translation="What did you do on the weekend?"
                note="In speech the object particle is often dropped: 뭐 했어요 instead of 뭐를 했어요."
            />

            <h2 id="who">3. 누구 and 누가: who</h2>
            <p>
                <span lang="ko">누구</span> means &ldquo;who&rdquo;. When &ldquo;who&rdquo; is the one doing the
                action (the subject), <span lang="ko">누구</span> + <span lang="ko">가</span> becomes{' '}
                <span lang="ko">누가</span>.
            </p>
            <Example
                words={[chip(W('저', 'that (over there)')), chip(W('사람', 'person'), P('은', 'topic')), chip(W('누구', 'who'), P('예요', '"is", polite (after a vowel)'))]}
                translation="Who is that person?"
            />
            <Example
                words={[chip(W('누가', 'who (as the subject: 누구 + 가)', '누구')), chip(W('전화했어요', 'called (polite)', '전화하다'))]}
                translation="Who called?"
            />

            <h2 id="where-when-why">4. 어디, 언제, 왜: where, when, why</h2>
            <p>
                These three work just like nouns. <span lang="ko">어디</span> takes the place particles{' '}
                <span lang="ko">에</span> and <span lang="ko">에서</span>, the same way a place name would.
            </p>
            <Example
                words={[chip(W('화장실', 'restroom'), P('이', 'subject')), chip(W('어디', 'where'), P('예요', '"is", polite (after a vowel)'))]}
                translation="Where is the restroom?"
            />
            <Example
                words={[chip(W('어디', 'where'), P('에서', 'at (where an action happens)')), chip(W('일해요', 'work (polite)', '일하다'))]}
                translation="Where do you work?"
            />
            <Example
                words={[chip(W('생일', 'birthday'), P('이', 'subject')), chip(W('언제', 'when'), P('예요', '"is", polite (after a vowel)'))]}
                translation="When is your birthday?"
            />
            <Example
                words={[chip(W('왜', 'why')), chip(W('늦었어요', 'were late (polite)', '늦다'))]}
                translation="Why were you late?"
                note="On its own, 왜요? means 'Why?' or 'What is it?' when someone calls your name."
            />

            <h2 id="how">5. 어떻게: how</h2>
            <p>
                <span lang="ko">어떻게</span> asks about the way something is done. It also shows up in the very
                common <span lang="ko">어떻게 해요?</span> (&ldquo;What do I do?&rdquo;).
            </p>
            <Example
                words={[chip(W('이거', 'this (thing)')), chip(W('어떻게', 'how')), chip(W('먹어요', 'eat (polite)', '먹다'))]}
                translation="How do you eat this?"
            />

            <h2 id="numbers">6. 몇 and 얼마: how many and how much</h2>
            <p>
                <span lang="ko">몇</span> asks for a number, so it comes before a counter word:{' '}
                <span lang="ko">몇 살</span> (how old), <span lang="ko">몇 시</span> (what time),{' '}
                <span lang="ko">몇 개</span> (how many things). <span lang="ko">얼마</span> asks about price.
            </p>
            <Example
                words={[chip(W('지금', 'now')), chip(W('몇', 'what (number)')), chip(W('시', "o'clock (counter)"), P('예요', '"is", polite (after a vowel)'))]}
                translation="What time is it now?"
            />
            <Example
                words={[chip(W('이거', 'this (thing)')), chip(W('얼마', 'how much'), P('예요', '"is", polite (after a vowel)'))]}
                translation="How much is this?"
            />
            <Tutor>
                <span lang="ko">이거 얼마예요?</span> is the one question every traveler needs. Point, smile, ask. It
                works in every shop and market in Korea!
            </Tutor>

            <h2 id="which">7. 어느 and 무슨: which and what kind of</h2>
            <p>
                Both go right before a noun. <span lang="ko">어느</span> means &ldquo;which (one of these)&rdquo;.{' '}
                <span lang="ko">무슨</span> means &ldquo;what kind of&rdquo;.
            </p>
            <Example
                words={[chip(W('어느', 'which')), chip(W('나라', 'country')), chip(W('사람', 'person'), P('이에요', '"is", polite (after a consonant)'))]}
                translation="Which country are you from?"
                note="Literally 'You are a person of which country?' This is the standard way to ask where someone is from."
            />
            <Example
                words={[chip(W('무슨', 'what kind of')), chip(W('음악', 'music'), P('을', 'object')), chip(W('좋아해요', 'like (polite)', '좋아하다'))]}
                translation="What kind of music do you like?"
            />

            <h2 id="word-order">8. Where the question word goes</h2>
            <p>
                In English, question words jump to the front: &ldquo;You live <em>in Seoul</em>&rdquo; becomes
                &ldquo;<em>Where</em> do you live?&rdquo;. Korean doesn&rsquo;t do that. The question word sits right
                where the answer will be, and the verb stays at the end.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Question</th><th>Answer</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">어디에 살아요?</td><td lang="ko">서울에 살아요.</td></tr>
                        <tr><td lang="ko">뭐 먹었어요?</td><td lang="ko">비빔밥 먹었어요.</td></tr>
                        <tr><td lang="ko">언제 와요?</td><td lang="ko">내일 와요.</td></tr>
                        <tr><td lang="ko">누구를 만났어요?</td><td lang="ko">친구를 만났어요.</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                This makes answering easy: copy the question, swap the question word for your answer, and you have a
                full sentence.
            </p>

            <h2 id="yes-no">9. Yes/no questions: just raise your voice</h2>
            <p>
                For a yes/no question, you don&rsquo;t need any question word at all. Say the same sentence as a
                statement, and let your voice rise at the end. In writing, add a question mark.
            </p>
            <Example
                words={[chip(W('밥', 'rice, a meal')), chip(W('먹었어요', 'ate (polite)', '먹다'))]}
                translation="Did you eat? (voice goes up) / I ate. (voice goes down)"
            />
            <Example
                words={[chip(W('한국', 'Korea')), chip(W('사람', 'person'), P('이에요', '"is", polite (after a consonant)'))]}
                translation="Are you Korean? (voice goes up) / I'm Korean. (voice goes down)"
            />
            <Tutor>
                Here&rsquo;s a fun one. <span lang="ko">어디 가요?</span> can mean &ldquo;Where are you
                going?&rdquo; or simply &ldquo;Are you going somewhere?&rdquo;. Neighbors often use it as a friendly
                hello, so a short <span lang="ko">네, 잠깐요</span> (&ldquo;Yes, just for a bit&rdquo;) is a fine
                answer.
            </Tutor>

            <TryIt placeholder="예: 이름이 뭐예요?" />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Songs ask questions all the time: <span lang="ko">왜</span> (why), <span lang="ko">어디</span>{' '}
                (where), <span lang="ko">언제</span> (when). Open a song in <Link href="/lyrics">Hanbok Lyrics</Link>{' '}
                and tap a line to see each word explained. Next, review{' '}
                <Link href="/learn/korean-sentence-structure">Korean sentence structure</Link>, learn{' '}
                <Link href="/learn/korean-this-that-i-geu-jeo">this and that (이, 그, 저)</Link>, or practice the
                numbers you need for <span lang="ko">몇</span> in{' '}
                <Link href="/learn/korean-numbers-native-vs-sino">Korean numbers</Link>.
            </p>
        </>
    );
}
