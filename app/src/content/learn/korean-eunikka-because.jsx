import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-eunikka-because',
    language: 'ko',
    title: 'Korean -(으)니까: "Because" Before Requests, and "When I..."',
    shortTitle: 'Because & so (-(으)니까)',
    description: 'Learn -(으)니까, the Korean "because" you can use before requests and suggestions. See how to build it, how it differs from -아서/어서, and its "when I did X" use.',
    level: 'Intermediate',
    topic: 'linking',
    minutes: 8,
    published: '2026-10-11',
    color: 'und',
    grammar: [
        { form: '-(으)니까', label: 'because, since (OK before requests); when I did ..., I found' },
        { form: '-았/었으니까', label: 'because (past)' },
        { form: '(이)니까', label: 'because it is (with a noun)' },
        { form: '-(으)니까요', label: 'because (as a short answer)' },
        { form: '그러니까', label: 'so, that\'s why; I mean' },
    ],
};

export const faq = [
    {
        q: 'What does 니까 mean in Korean?',
        a: '-(으)니까 means "because" or "since". It joins a reason to what comes next: 비가 오니까 우산을 가져가세요 (It is raining, so take an umbrella). It can also mean "when I did X, I found...": 집에 가니까 아무도 없었어요 (When I got home, nobody was there).',
    },
    {
        q: 'What is the difference between 아서/어서 and 니까?',
        a: 'Both give a reason. Only -(으)니까 can be followed by a request, command or suggestion, and only -(으)니까 can take the past tense (갔으니까). For apologies and thanks, use -아서/어서: 늦어서 죄송해요.',
    },
    {
        q: 'When do I use 으니까 and when 니까?',
        a: 'After a vowel, add 니까 (가니까, 바쁘니까). After a consonant, add 으니까 (먹으니까, 많으니까). Stems ending in ㄹ drop the ㄹ and add 니까: 살다 becomes 사니까, 열다 becomes 여니까.',
    },
    {
        q: 'What does 그러니까 mean?',
        a: '그러니까 means "so" or "that is why" at the start of a sentence. In conversation it also means "I mean" or "exactly", when you agree with someone or explain yourself again.',
    },
];

export const quiz = [
    {
        prompt: '먹다 (to eat) + -(으)니까 = ?',
        hint: '먹 ends in a consonant.',
        choices: ['먹니까', '먹으니까'],
        answer: 1,
        why: 'After a consonant, add 으니까: 먹으니까. After a vowel, just 니까: 가니까.',
    },
    {
        prompt: 'It is cold, so please close the window. Which is correct?',
        choices: ['추워서 창문 좀 닫아 주세요', '추우니까 창문 좀 닫아 주세요'],
        answer: 1,
        why: 'The second half is a request (주세요), so the reason needs -(으)니까. -아서/어서 cannot come before a request.',
    },
    {
        prompt: 'How do you say "Sorry I\'m late"?',
        choices: ['늦어서 죄송해요', '늦으니까 죄송해요'],
        answer: 0,
        why: 'For apologies and thanks, Koreans use -아서/어서. With 니까 it sounds like you are making an excuse.',
    },
    {
        prompt: 'What does 집에 가니까 아무도 없었어요 mean?',
        choices: ['When I got home, nobody was there.', 'Nobody was home, so I went.'],
        answer: 0,
        why: 'Here 니까 is the "discovery" use: you did something (went home) and found something (nobody there). The last verb is in the past.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    Add <span lang="ko">-(으)니까</span> to a verb to say <strong>&ldquo;because&rdquo;</strong> or{' '}
                    <strong>&ldquo;since&rdquo;</strong>. Unlike <span lang="ko">-아서/어서</span>, it can come before a
                    request or a suggestion: <span lang="ko">추우니까 코트 입으세요</span> (It&rsquo;s cold, so wear a
                    coat). It also has a second meaning: &ldquo;when I did X, I found...&rdquo;
                </p>
            </section>

            <p>
                If you have read about <Link href="/learn/korean-aseo-eoseo-because">-아서/어서</Link>, you already know
                one way to say &ldquo;because&rdquo;. But that ending has a rule: no commands or suggestions after it. So
                how do you say &ldquo;It&rsquo;s raining, so take an umbrella&rdquo;? That is the job of{' '}
                <span lang="ko">-(으)니까</span>. Tap the chips below to see each part.
            </p>

            <h2 id="how-to-make">1. How to make it</h2>
            <p>
                Take the dictionary form, drop <span lang="ko">다</span>, and look at the last sound of the stem.
            </p>
            <ul className={styles.list}>
                <li>Ends in a vowel: add <span lang="ko">니까</span> (<span lang="ko">가니까</span>, <span lang="ko">바쁘니까</span>)</li>
                <li>Ends in a consonant: add <span lang="ko">으니까</span> (<span lang="ko">먹으니까</span>, <span lang="ko">많으니까</span>)</li>
                <li>Ends in <span lang="ko">ㄹ</span>: drop the <span lang="ko">ㄹ</span>, add <span lang="ko">니까</span> (<span lang="ko">사니까</span>, <span lang="ko">머니까</span>)</li>
            </ul>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Dictionary form</th><th>Meaning</th><th>Because (now)</th><th>Because (past)</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다</td><td>to go</td><td lang="ko">가니까</td><td lang="ko">갔으니까</td></tr>
                        <tr><td lang="ko">바쁘다</td><td>to be busy</td><td lang="ko">바쁘니까</td><td lang="ko">바빴으니까</td></tr>
                        <tr><td lang="ko">먹다</td><td>to eat</td><td lang="ko">먹으니까</td><td lang="ko">먹었으니까</td></tr>
                        <tr><td lang="ko">없다</td><td>to not have</td><td lang="ko">없으니까</td><td lang="ko">없었으니까</td></tr>
                        <tr><td lang="ko">살다</td><td>to live</td><td lang="ko">사니까</td><td lang="ko">살았으니까</td></tr>
                        <tr><td lang="ko">춥다</td><td>to be cold</td><td lang="ko">추우니까</td><td lang="ko">추웠으니까</td></tr>
                        <tr><td lang="ko">듣다</td><td>to listen</td><td lang="ko">들으니까</td><td lang="ko">들었으니까</td></tr>
                        <tr><td lang="ko">하다</td><td>to do</td><td lang="ko">하니까</td><td lang="ko">했으니까</td></tr>
                        <tr><td lang="ko">학생이다</td><td>to be a student</td><td lang="ko">학생이니까</td><td lang="ko">학생이었으니까</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                <span lang="ko">춥다</span> and <span lang="ko">듣다</span> are irregular, just like in the polite form
                (<span lang="ko">추워요</span>, <span lang="ko">들어요</span>). With a noun, use{' '}
                <span lang="ko">이니까</span> after a consonant and <span lang="ko">니까</span> after a vowel:{' '}
                <span lang="ko">시험이니까</span>, <span lang="ko">친구니까</span>.
            </p>

            <h2 id="requests">2. A reason, then a request or suggestion</h2>
            <p>
                This is the main reason to learn <span lang="ko">-(으)니까</span>. When the second half says
                &ldquo;please do&rdquo;, &ldquo;let&rsquo;s&rdquo; or &ldquo;shall we&rdquo;, this is the
                &ldquo;because&rdquo; to use.
            </p>
            <Example
                words={[chip(W('비', 'rain'), P('가', 'subject')), chip(W('오', 'come (rain falls)', '오다'), P('니까', 'because, so (after a vowel)')), chip(W('우산', 'umbrella'), P('을', 'object')), chip(W('가져가세요', 'please take (with you)', '가져가다'))]}
                translation="It's raining, so take an umbrella."
            />
            <Example
                words={[chip(W('추우', 'cold', '춥다'), P('니까', 'because, so')), chip(W('창문', 'window')), chip(W('좀', 'please, a little')), chip(W('닫아', 'close', '닫다')), chip(W('주세요', 'please (do for me)', '주다'))]}
                translation="It's cold, so could you close the window, please?"
                note="춥다 is a ㅂ irregular: the ㅂ turns into 우, so you get 추우니까."
            />
            <Example
                words={[chip(W('시간', 'time'), P('이', 'subject')), chip(W('없', 'not have', '없다'), P('으니까', 'because, so (after a consonant)')), chip(W('택시', 'taxi'), P('를', 'object')), chip(W('탈까요', 'shall we take (ride)?', '타다'))]}
                translation="We don't have time, so shall we take a taxi?"
            />
            <Example
                words={[chip(W('내일', 'tomorrow')), chip(W('시험', 'exam'), P('이니까', 'is, so (이다 + 니까)')), chip(W('오늘', 'today'), P('은', 'topic, here showing contrast')), chip(W('일찍', 'early')), chip(W('자세요', 'please sleep', '자다'))]}
                translation="You have an exam tomorrow, so go to bed early tonight."
            />

            <h2 id="past">3. The past tense is allowed</h2>
            <p>
                With <span lang="ko">-아서/어서</span>, the past tense goes only on the last verb. With{' '}
                <span lang="ko">-(으)니까</span>, you can put the past tense right on the reason:{' '}
                <span lang="ko">았/었</span> + <span lang="ko">으니까</span>.
            </p>
            <Example
                words={[chip(W('어제', 'yesterday')), chip(W('많이', 'a lot')), chip(W('먹었', 'ate', '먹다'), P('으니까', 'because (after past 었)')), chip(W('오늘', 'today'), P('은', 'topic, here showing contrast')), chip(W('조금', 'a little'), P('만', 'only')), chip(W('먹을게요', 'I will eat (polite)', '먹다'))]}
                translation="I ate a lot yesterday, so I'll eat just a little today."
            />
            <Tutor>
                An easy way to remember it: <span lang="ko">아서/어서</span> is shy and never shows its tense or bosses
                anyone around. <span lang="ko">니까</span> is bold. It does both!
            </Tutor>

            <h2 id="discovery">4. &ldquo;When I did X, I found...&rdquo;</h2>
            <p>
                <span lang="ko">-(으)니까</span> has a second meaning that surprises many learners. It can mean
                &ldquo;when I did this, I found out that...&rdquo; The first half is what you did. The second half is
                what you saw or discovered, and it is in the past tense.
            </p>
            <Example
                words={[chip(W('집', 'home'), P('에', 'to')), chip(W('가', 'go', '가다'), P('니까', 'when I (did it), I found')), chip(W('아무도', 'nobody (with a negative)')), chip(W('없었어요', 'there was not', '없다'))]}
                translation="When I got home, nobody was there."
                note="The first verb stays in the present form (가니까). 갔으니까 would mean 'because I went'."
            />
            <Example
                words={[chip(W('창문', 'window'), P('을', 'object')), chip(W('여', 'open', '열다'), P('니까', 'when I (did it), I found')), chip(W('밖', 'outside'), P('에', 'at')), chip(W('눈', 'snow'), P('이', 'subject')), chip(W('오', 'come (snow falls)', '오다'), P('고', 'part of 고 있다 (-ing)')), chip(W('있었어요', 'was (-ing)', '있다'))]}
                translation="When I opened the window, it was snowing outside."
                note="열다 drops its ㄹ before 니까: 여니까."
            />
            <p>
                You will often hear this with <span lang="ko">보다</span> (to try):{' '}
                <span lang="ko">먹어 보니까</span> means &ldquo;when I tried eating it, I found...&rdquo;
            </p>
            <Example
                words={[chip(W('김치', 'kimchi'), P('를', 'object')), chip(W('먹', 'eat', '먹다'), P('어', 'connector before 보다')), chip(W('보', 'try', '보다'), P('니까', 'when I (did it), I found')), chip(W('생각', 'thought'), P('보다', 'than')), chip(W('안', 'not')), chip(W('매웠어요', 'was spicy', '맵다'))]}
                translation="When I tried the kimchi, it wasn't as spicy as I thought."
            />

            <h2 id="vs-aseo">5. -(으)니까 vs -아서/어서</h2>
            <p>
                Both mean &ldquo;because&rdquo;, and in a plain statement you can often use either one. Here is where
                they part ways.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Situation</th><th><span lang="ko">-아서/어서</span></th><th><span lang="ko">-(으)니까</span></th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Plain reason</td><td lang="ko">바빠서 못 가요</td><td lang="ko">바쁘니까 못 가요</td></tr>
                        <tr><td>Before a request or suggestion</td><td>No</td><td lang="ko">바쁘니까 나중에 만나요</td></tr>
                        <tr><td>Past tense on the reason</td><td>No</td><td lang="ko">비가 왔으니까</td></tr>
                        <tr><td>Sorry and thank you</td><td lang="ko">늦어서 죄송해요</td><td>No</td></tr>
                        <tr><td>&ldquo;When I did X, I found...&rdquo;</td><td>No</td><td lang="ko">가니까 없었어요</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                There is also a difference in feeling. <span lang="ko">-아서/어서</span> just reports a cause.{' '}
                <span lang="ko">-(으)니까</span> points at the listener a little, like &ldquo;since, you see...&rdquo;
                That is why it sounds wrong in an apology: <span lang="ko">늦었으니까 죄송해요</span> sounds like an
                excuse, not a real &ldquo;sorry&rdquo;.
            </p>

            <h2 id="short-answers">6. 니까요 and 그러니까 in conversation</h2>
            <p>
                Add <span lang="ko">요</span> and you can use <span lang="ko">-(으)니까</span> on its own, as a short
                answer to &ldquo;why?&rdquo;
            </p>
            <Example
                words={[chip(W('바쁘', 'busy', '바쁘다'), P('니까요', 'because (as a short answer, polite)'))]}
                translation="(Why aren't you coming?) Because I'm busy."
                note="Said with a sharp tone, 니까요 can sound like 'I already told you!' Keep your voice soft."
            />
            <p>
                <span lang="ko">그러니까</span> starts a sentence with &ldquo;so&rdquo; or &ldquo;that&rsquo;s
                why&rdquo;. In everyday talk it also means &ldquo;I mean...&rdquo; or &ldquo;Exactly!&rdquo; You will
                hear it constantly in dramas.
            </p>
            <Tutor>
                When a friend complains and you totally agree, try <span lang="ko">그러니까요!</span> It means
                &ldquo;I know, right?&rdquo; Koreans will smile when you use it.
            </Tutor>

            <TryIt placeholder="예: 추우니까 따뜻하게 입으세요." />

            <h2 id="keep-going">Keep going</h2>
            <p>
                Song lyrics love <span lang="ko">니까</span>, often in lines like &ldquo;since you&rsquo;re here&rdquo;
                or &ldquo;because I love you&rdquo;. Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and tap a
                line to see each ending explained. Compare with{' '}
                <Link href="/learn/korean-aseo-eoseo-because">-아서/어서 (because, and then)</Link>, learn the{' '}
                <Link href="/learn/korean-a-eo-boda-try">-아/어 보다 (try doing)</Link> pattern, or see how{' '}
                <Link href="/learn/korean-myeon-if">-(으)면 (if)</Link> uses the same <span lang="ko">으</span> rule.
            </p>
        </>
    );
}
