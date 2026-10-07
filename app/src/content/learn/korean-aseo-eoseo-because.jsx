import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-aseo-eoseo-because',
    language: 'ko',
    title: 'Korean -아서/어서: How to Say "Because" and "And Then"',
    shortTitle: 'Because & and then (-아서/어서)',
    description: 'Learn -아서/어서, the everyday Korean ending for "because" and "and then." See how to build it, why 았어서 is wrong, and when to use -(으)니까 instead.',
    level: 'Beginner',
    minutes: 8,
    published: '2026-10-08',
    color: 'read',
    grammar: [
        { form: '-아서/어서', label: 'because, so; and then' },
        { form: '해서', label: '-아서/어서 for 하다 verbs' },
        { form: '그래서', label: 'so, that\'s why' },
        { form: '-(으)니까', label: 'because (before commands)' },
    ],
};

export const faq = [
    {
        q: 'How do you say "because" in Korean?',
        a: 'The most common way is to add -아서/어서 to the verb: 바빠서 (because I am busy), 비가 와서 (because it is raining). At the start of a sentence, use 그래서 ("so").',
    },
    {
        q: 'What is the difference between 아서/어서 and 니까?',
        a: 'Both give a reason. -아서/어서 is the neutral, everyday choice, but it cannot be followed by a command or a suggestion. -(으)니까 can: 추우니까 코트 입으세요 (It is cold, so wear a coat).',
    },
    {
        q: 'Can I say 았어서 for the past tense?',
        a: 'No. -아서/어서 never takes the past marker. The tense goes on the last verb only: 어제 아파서 학교에 못 갔어요 (I was sick yesterday, so I could not go to school).',
    },
    {
        q: 'When do I use 아서 and when 어서?',
        a: 'Use 아서 when the last vowel of the stem is ㅏ or ㅗ (가서, 와서, 많아서). Use 어서 for every other vowel (먹어서, 마셔서). For 하다 verbs, it is always 해서.',
    },
];

export const quiz = [
    {
        prompt: 'Which one is correct?',
        hint: 'It rained, so I bought an umbrella.',
        choices: ['비가 왔어서 우산을 샀어요', '비가 와서 우산을 샀어요'],
        answer: 1,
        why: 'Never put the past tense before -아서/어서. The past tense goes only on the last verb, 샀어요.',
    },
    {
        prompt: '공부하다 (to study) + -아서/어서 = ?',
        choices: ['공부하아서', '공부해서', '공부하어서'],
        answer: 1,
        why: '하다 verbs always become 해서: 공부해서, 일해서, 피곤해서.',
    },
    {
        prompt: 'It is cold, so wear a coat. Which ending fits?',
        choices: ['추워서 코트를 입으세요', '추우니까 코트를 입으세요'],
        answer: 1,
        why: 'The second half is a command (입으세요), so the reason needs -(으)니까, not -아서/어서.',
    },
    {
        prompt: 'I went to the market and bought fruit (there). Which is natural?',
        choices: ['시장에 가서 과일을 샀어요', '시장에 가고 과일을 샀어요'],
        answer: 0,
        why: 'Use -아서/어서 when the second action happens because of, or at the place of, the first one. You went there, then bought fruit there.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    Add <span lang="ko">-아서/어서</span> to a verb to mean <strong>&ldquo;because&rdquo;</strong> or{' '}
                    <strong>&ldquo;and then.&rdquo;</strong> <span lang="ko">바빠서 못 가요</span> means &ldquo;I&rsquo;m busy,
                    so I can&rsquo;t go.&rdquo; Two rules: no past tense before it, and no commands or suggestions after it.
                </p>
            </section>

            <p>
                English uses separate words for &ldquo;because&rdquo; and &ldquo;so.&rdquo; Korean often just changes the end
                of the first verb and keeps going. You will hear <span lang="ko">-아서/어서</span> in almost every
                conversation, from apologies to excuses to stories about your weekend. Tap the endings below to see how it
                works.
            </p>

            <h2 id="how-to-make">1. How to make it</h2>
            <p>
                It follows the same vowel rule as the polite present tense. If you know <span lang="ko">가요</span> and{' '}
                <span lang="ko">먹어요</span>, just swap <span lang="ko">요</span> for <span lang="ko">서</span>.
            </p>
            <ul className={styles.list}>
                <li>Last vowel <span lang="ko">ㅏ</span> or <span lang="ko">ㅗ</span>: add <span lang="ko">아서</span></li>
                <li>Any other vowel: add <span lang="ko">어서</span></li>
                <li><span lang="ko">하다</span> verbs: always <span lang="ko">해서</span></li>
            </ul>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Verb</th><th>Meaning</th><th>Polite present</th><th>Because / and then</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다</td><td>to go</td><td lang="ko">가요</td><td lang="ko">가서</td></tr>
                        <tr><td lang="ko">오다</td><td>to come</td><td lang="ko">와요</td><td lang="ko">와서</td></tr>
                        <tr><td lang="ko">많다</td><td>to be many, a lot</td><td lang="ko">많아요</td><td lang="ko">많아서</td></tr>
                        <tr><td lang="ko">먹다</td><td>to eat</td><td lang="ko">먹어요</td><td lang="ko">먹어서</td></tr>
                        <tr><td lang="ko">마시다</td><td>to drink</td><td lang="ko">마셔요</td><td lang="ko">마셔서</td></tr>
                        <tr><td lang="ko">바쁘다</td><td>to be busy</td><td lang="ko">바빠요</td><td lang="ko">바빠서</td></tr>
                        <tr><td lang="ko">춥다</td><td>to be cold</td><td lang="ko">추워요</td><td lang="ko">추워서</td></tr>
                        <tr><td lang="ko">공부하다</td><td>to study</td><td lang="ko">공부해요</td><td lang="ko">공부해서</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                With a noun, use <span lang="ko">이라서</span> after a consonant and <span lang="ko">라서</span> after a
                vowel: <span lang="ko">학생이라서</span> (because I&rsquo;m a student), <span lang="ko">친구라서</span>{' '}
                (because he&rsquo;s a friend).
            </p>

            <h2 id="because">2. &ldquo;Because&rdquo;: giving a reason</h2>
            <p>
                Put the reason first and the result second. The English word &ldquo;so&rdquo; is built into the ending.
            </p>
            <Example
                words={[chip(W('배고파', 'hungry', '배고프다'), P('서', 'because, so')), chip(W('밥', 'rice, a meal'), P('을', 'object')), chip(W('먹었어요', 'ate (polite)', '먹다'))]}
                translation="I was hungry, so I ate."
                note="The past tense is only on the last verb. 배고파서 takes its time from 먹었어요."
            />
            <Example
                words={[chip(W('비', 'rain'), P('가', 'subject')), chip(W('와', 'come (rain falls)', '오다'), P('서', 'because, so')), chip(W('집', 'home'), P('에', 'at')), chip(W('있었어요', 'stayed, was (polite)', '있다'))]}
                translation="It rained, so I stayed home."
            />
            <Example
                words={[chip(W('요즘', 'these days')), chip(W('일', 'work'), P('이', 'subject')), chip(W('많', 'a lot', '많다'), P('아서', 'because, so (ㅏ vowel)')), chip(W('피곤해요', 'tired (polite)', '피곤하다'))]}
                translation="I have a lot of work these days, so I'm tired."
            />

            <h2 id="sorry-thanks">3. Sorry and thank you</h2>
            <p>
                Koreans use <span lang="ko">-아서/어서</span> every day to say what they are sorry or thankful for. Learn these
                as set phrases.
            </p>
            <Example
                words={[chip(W('늦', 'late', '늦다'), P('어서', 'because')), chip(W('미안해요', 'I\'m sorry (polite)', '미안하다'))]}
                translation="Sorry I'm late."
                note="For more respect, say 늦어서 죄송해요."
            />
            <Example
                words={[chip(W('도와줘', 'help (me)', '도와주다'), P('서', 'because')), chip(W('고마워요', 'thank you (polite)', '고맙다'))]}
                translation="Thanks for helping me."
            />
            <Example
                words={[chip(W('와', 'come', '오다')), chip(W('주셔', 'do for us (respectful)', '주다'), P('서', 'because')), chip(W('감사합니다', 'thank you (formal)', '감사하다'))]}
                translation="Thank you for coming."
                note="You will hear this at the start of every event, show and speech."
            />

            <h2 id="sequence">4. &ldquo;And then&rdquo;: one action leads to the next</h2>
            <p>
                The same ending also links two actions in order, when the first one sets up the second. Usually you go
                somewhere and then do something there, or you make something and then use it.
            </p>
            <Example
                words={[chip(W('시장', 'market'), P('에', 'to')), chip(W('가', 'go', '가다'), P('서', 'and then (there)')), chip(W('과일', 'fruit'), P('을', 'object')), chip(W('샀어요', 'bought (polite)', '사다'))]}
                translation="I went to the market and bought fruit."
            />
            <Example
                words={[chip(W('친구', 'friend'), P('를', 'object')), chip(W('만나', 'meet', '만나다'), P('서', 'and then (together)')), chip(W('커피', 'coffee'), P('를', 'object')), chip(W('마셨어요', 'drank (polite)', '마시다'))]}
                translation="I met a friend and we had coffee."
                note="With 서, you drank the coffee with that friend. With 만나고, the two things could be unrelated."
            />
            <Tutor>
                Here&rsquo;s a handy trick: in the &ldquo;and then&rdquo; meaning, you <em>can</em> use a request.{' '}
                <span lang="ko">여기 앉아서 기다리세요</span> (&ldquo;Sit here and wait&rdquo;) is perfectly fine. The
                no-commands rule is only for the &ldquo;because&rdquo; meaning.
            </Tutor>

            <h2 id="two-rules">5. The two rules learners break</h2>
            <p>
                <strong>Rule 1: no past tense before it.</strong> Even when the reason happened yesterday, the first verb stays
                plain. Korean puts the tense only at the end of the sentence.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Wrong</th><th>Right</th><th>Meaning</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">어제 아팠어서 학교에 못 갔어요</td><td lang="ko">어제 아파서 학교에 못 갔어요</td><td>I was sick yesterday, so I couldn&rsquo;t go to school.</td></tr>
                        <tr><td lang="ko">비가 와서 우산을 가져가세요</td><td lang="ko">비가 오니까 우산을 가져가세요</td><td>It&rsquo;s raining, so take an umbrella.</td></tr>
                        <tr><td lang="ko">피곤해서 집에 갈까요?</td><td lang="ko">피곤하니까 집에 갈까요?</td><td>We&rsquo;re tired, so shall we go home?</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                <strong>Rule 2: no commands or suggestions after the &ldquo;because.&rdquo;</strong> If the second half says
                &ldquo;please do,&rdquo; &ldquo;let&rsquo;s&rdquo; or &ldquo;shall we,&rdquo; switch to{' '}
                <span lang="ko">-(으)니까</span>. It also gives a reason, but it points at the listener a bit more, like
                &ldquo;since, you know...&rdquo;
            </p>
            <Example
                words={[chip(W('추우', 'cold', '춥다'), P('니까', 'because (OK before a request)')), chip(W('코트', 'coat'), P('를', 'object')), chip(W('입으세요', 'please wear', '입다'))]}
                translation="It's cold, so wear a coat."
            />

            <h2 id="geuraeseo">6. 그래서 at the start of a sentence</h2>
            <p>
                <span lang="ko">그래서</span> is simply <span lang="ko">그렇다</span> (to be so) plus <span lang="ko">-아서/어서</span>.
                Use it to begin a new sentence with &ldquo;so&rdquo; or &ldquo;that&rsquo;s why.&rdquo;
            </p>
            <Example
                words={[chip(W('오늘', 'today')), chip(W('너무', 'very, too')), chip(W('피곤해요', 'tired (polite)', '피곤하다'), P('.', 'end of the first sentence')), chip(W('그래서', 'so, that\'s why')), chip(W('일찍', 'early')), chip(W('잘', 'will sleep', '자다')), chip(W('거예요', 'going to (polite)'))]}
                translation="I'm really tired today. So I'm going to bed early."
            />
            <Tutor>
                In conversation, <span lang="ko">그래서요?</span> means &ldquo;And then? So what happened?&rdquo; Say it when a
                friend is telling a story and you want to hear more.
            </Tutor>

            <TryIt placeholder="예: 바빠서 전화 못 했어요." />

            <h2 id="keep-going">Keep going</h2>
            <p>
                Song lyrics are full of reasons: <span lang="ko">보고 싶어서</span> (because I miss you),{' '}
                <span lang="ko">사랑해서</span> (because I love you). Open a song in <Link href="/lyrics">Hanbok Lyrics</Link>{' '}
                and tap through the lines to spot them. To link ideas with &ldquo;but&rdquo; instead, read{' '}
                <Link href="/learn/korean-jiman-but">Korean -지만 (but)</Link>, and for the vowel rule behind{' '}
                <span lang="ko">아서/어서</span>, see <Link href="/learn/korean-present-tense-a-yo-eo-yo">the present tense</Link>.
            </p>
        </>
    );
}
