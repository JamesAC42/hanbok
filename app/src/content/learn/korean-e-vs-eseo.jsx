import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-e-vs-eseo',
    language: 'ko',
    title: '에 vs 에서: Korean Location Particles Made Simple',
    shortTitle: '에 vs 에서',
    description: 'Both 에 and 에서 can mean "at" or "in", but they are not the same. Learn when to use each one, how to say "from" and "until", and the one verb that takes both.',
    level: 'Beginner',
    minutes: 7,
    published: '2026-10-07',
    color: 'und',
    grammar: [
        { form: '에', label: 'to, at, in (destination, location, time)' },
        { form: '에서', label: 'at (where an action happens), from' },
        { form: '부터', label: 'from (a starting point)' },
        { form: '까지', label: 'to, until' },
    ],
};

export const faq = [
    {
        q: 'What is the difference between 에 and 에서 in Korean?',
        a: '에 marks where you go and where something is (with 있다 and 없다). 에서 marks where an action happens. 학교에 가요 is "I go to school", but 학교에서 공부해요 is "I study at school".',
    },
    {
        q: 'Is it 서울에 살아요 or 서울에서 살아요?',
        a: 'Both are correct and mean "I live in Seoul". 살다 can be seen as a state (use 에) or as an activity (use 에서). In everyday talk 서울에 살아요 is a little more common.',
    },
    {
        q: 'Does 에서 mean "from"?',
        a: 'Yes, with places. 미국에서 왔어요 means "I came from America". With people, use 한테서 or 에게서 instead: 친구한테서 들었어요 ("I heard it from a friend").',
    },
    {
        q: 'Do you use 에 with time in Korean?',
        a: 'Yes. 에 marks clock times, days and seasons: 세 시에 ("at three"), 토요일에 ("on Saturday"). But words like 오늘, 내일, 어제 and 지금 never take 에.',
    },
];

export const quiz = [
    {
        prompt: '저는 도서관__ 공부해요.',
        hint: 'I study at the library.',
        choices: ['에', '에서'],
        answer: 1,
        why: 'Studying is an action, so the place where it happens takes 에서.',
    },
    {
        prompt: '화장실이 어디__ 있어요?',
        hint: 'Where is the bathroom?',
        choices: ['에', '에서'],
        answer: 0,
        why: 'With 있다 (to be somewhere), the location takes 에.',
    },
    {
        prompt: '세 시__ 만나요.',
        hint: 'Let\'s meet at three.',
        choices: ['에', '에서', '(nothing)'],
        answer: 0,
        why: 'Clock times take 에. Only words like 오늘, 내일 and 지금 go without it.',
    },
    {
        prompt: '어디__ 왔어요?',
        hint: 'Where are you from?',
        choices: ['에', '에서'],
        answer: 1,
        why: '에서 with 오다 means "from". 어디에 왔어요? would sound like "Where did you come to?"',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    Use <span lang="ko">에</span> for <strong>where you go</strong>, <strong>where something is</strong>, and{' '}
                    <strong>when</strong> something happens. Use <span lang="ko">에서</span> for <strong>where you do
                    something</strong>, and for <strong>&ldquo;from&rdquo;</strong> a place. Ask yourself: is there an action
                    happening in that place? If yes, it is usually <span lang="ko">에서</span>.
                </p>
            </section>

            <p>
                English uses &ldquo;at&rdquo;, &ldquo;in&rdquo;, &ldquo;to&rdquo; and &ldquo;from&rdquo;. Korean sorts places a
                different way: it looks at the verb. Is someone moving toward the place, just being there, or doing something
                there? Once you see that, the choice gets easy. Tap any particle below for a reminder of its job.
            </p>

            <h2 id="at-a-glance">At a glance</h2>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Particle</th><th>Job</th><th>Typical verbs</th><th>Example</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">에</td><td>destination (to)</td><td lang="ko">가다, 오다, 다니다</td><td lang="ko">학교에 가요</td></tr>
                        <tr><td lang="ko">에</td><td>where something is</td><td lang="ko">있다, 없다</td><td lang="ko">집에 있어요</td></tr>
                        <tr><td lang="ko">에</td><td>time (at, on, in)</td><td>any verb</td><td lang="ko">세 시에 만나요</td></tr>
                        <tr><td lang="ko">에서</td><td>where an action happens</td><td lang="ko">먹다, 일하다, 공부하다</td><td lang="ko">카페에서 일해요</td></tr>
                        <tr><td lang="ko">에서</td><td>from a place</td><td lang="ko">오다, 출발하다</td><td lang="ko">미국에서 왔어요</td></tr>
                    </tbody>
                </table>
            </div>

            <h2 id="e-destination">1. 에: where you are going</h2>
            <p>
                With verbs of movement like <span lang="ko">가다</span> (go), <span lang="ko">오다</span> (come) and{' '}
                <span lang="ko">다니다</span> (attend, go regularly), <span lang="ko">에</span> means &ldquo;to&rdquo;.
            </p>
            <Example
                words={[chip(W('학교', 'school'), P('에', 'to (destination)')), chip(W('가요', 'go (polite)', '가다'))]}
                translation="I'm going to school."
            />
            <Example
                words={[chip(W('주말', 'weekend'), P('에', 'time: on, at')), chip(W('부산', 'Busan'), P('에', 'to (destination)')), chip(W('가요', 'go (polite)', '가다'))]}
                translation="I'm going to Busan this weekend."
                note="Two 에 in one sentence: the first marks time, the second marks where you are going."
            />

            <h2 id="e-existence">2. 에: where something is</h2>
            <p>
                With <span lang="ko">있다</span> (to be there, to have) and <span lang="ko">없다</span> (not to be there),{' '}
                <span lang="ko">에</span> marks the location. Nothing is being done there. Something simply exists there.
            </p>
            <Example
                words={[chip(W('고양이', 'cat'), P('가', 'subject')), chip(W('소파', 'sofa')), chip(W('위', 'top, on'), P('에', 'location (with 있다)')), chip(W('있어요', 'is there (polite)', '있다'))]}
                translation="The cat is on the sofa."
                note="Korean says 소파 위에, literally 'at the sofa's top'. 안 (inside), 밑 (under) and 옆 (next to) work the same way."
            />
            <Example
                words={[chip(W('지갑', 'wallet'), P('에', 'location (with 없다)')), chip(W('돈', 'money'), P('이', 'subject')), chip(W('없어요', 'there is none (polite)', '없다'))]}
                translation="There's no money in my wallet."
            />

            <h2 id="e-time">3. 에: when it happens</h2>
            <p>
                <span lang="ko">에</span> also marks time, like English &ldquo;at&rdquo;, &ldquo;on&rdquo; or &ldquo;in&rdquo;:
                clock times, days of the week, months and seasons.
            </p>
            <Example
                words={[chip(W('아침', 'morning')), chip(W('일곱', 'seven')), chip(W('시', 'o\'clock'), P('에', 'time: at')), chip(W('일어나요', 'get up (polite)', '일어나다'))]}
                translation="I get up at seven in the morning."
            />
            <Tutor>
                Some time words never take <span lang="ko">에</span>: <span lang="ko">오늘</span> (today),{' '}
                <span lang="ko">내일</span> (tomorrow), <span lang="ko">어제</span> (yesterday) and{' '}
                <span lang="ko">지금</span> (now). Say <span lang="ko">내일 만나요</span>, not{' '}
                <span lang="ko">내일에 만나요</span>. Rawr, that one trips up everybody!
            </Tutor>

            <h2 id="eseo-action">4. 에서: where you do something</h2>
            <p>
                When someone is <em>doing</em> something in a place (eating, working, studying, meeting a friend), the place
                takes <span lang="ko">에서</span>.
            </p>
            <Example
                words={[chip(W('카페', 'café'), P('에서', 'at (place of an action)')), chip(W('커피', 'coffee'), P('를', 'object')), chip(W('마셔요', 'drink (polite)', '마시다'))]}
                translation="I drink coffee at a café."
            />
            <p>
                Compare the same place with two particles. <span lang="ko">집에 있어요</span> means &ldquo;I&rsquo;m at
                home&rdquo; (just being there). <span lang="ko">집에서 쉬어요</span> means &ldquo;I&rsquo;m resting at
                home&rdquo; (doing something there).
            </p>

            <h2 id="eseo-from">5. 에서: from a place</h2>
            <p>
                With movement verbs, <span lang="ko">에서</span> marks the starting point. This is how you say where you
                are from.
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('미국', 'America, the US'), P('에서', 'from (a place)')), chip(W('왔어요', 'came (polite)', '오다'))]}
                translation="I'm from the US."
                note="Literally 'I came from America'. Koreans use this to say where you are from."
            />

            <h2 id="buteo-kkaji">6. From here to there: 에서 and 까지</h2>
            <p>
                Add <span lang="ko">까지</span> (to, until) for the end point. For places, pair it with{' '}
                <span lang="ko">에서</span>. For times, pair it with <span lang="ko">부터</span> (from).
            </p>
            <Example
                words={[chip(W('집', 'home, house'), P('에서', 'from (a place)')), chip(W('회사', 'office, company'), P('까지', 'to, until (end point)')), chip(W('삼십', 'thirty')), chip(W('분', 'minutes')), chip(W('걸려요', 'takes (time, polite)', '걸리다'))]}
                translation="It takes thirty minutes from home to the office."
            />
            <Example
                words={[chip(W('아홉', 'nine')), chip(W('시', 'o\'clock'), P('부터', 'from (a starting time)')), chip(W('여섯', 'six')), chip(W('시', 'o\'clock'), P('까지', 'to, until (end point)')), chip(W('일해요', 'work (polite)', '일하다'))]}
                translation="I work from nine to six."
            />
            <p>
                You may also see <span lang="ko">에서부터</span>, written as one word: <span lang="ko">서울에서부터</span>{' '}
                (&ldquo;all the way from Seoul&rdquo;). It just stresses the starting point a little more.
            </p>

            <h2 id="salda">7. The verb that takes both: 살다</h2>
            <p>
                <span lang="ko">살다</span> (to live) works with either particle, and the meaning barely changes.
            </p>
            <Example
                words={[chip(W('서울', 'Seoul'), P('에', 'location (living there as a state)')), chip(W('살아요', 'live (polite)', '살다'))]}
                translation="I live in Seoul."
                note="서울에서 살아요 is also correct. 에서 makes it feel a little more like an activity, as in 'I'm living my life in Seoul'."
            />
            <Tutor>
                When in doubt, look at the verb. <span lang="ko">있다</span>, <span lang="ko">없다</span>,{' '}
                <span lang="ko">가다</span> and <span lang="ko">오다</span> want <span lang="ko">에</span>. Almost every
                other action verb wants <span lang="ko">에서</span>.
            </Tutor>

            <TryIt placeholder="예: 저는 주말에 공원에서 운동해요" />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Song lyrics are full of places: streets, rooms, cities, &ldquo;by your side&rdquo;. Open a song in{' '}
                <Link href="/lyrics">Hanbok Lyrics</Link>, tap a line, and check whether the place takes{' '}
                <span lang="ko">에</span> or <span lang="ko">에서</span>. For where places sit in a sentence, see{' '}
                <Link href="/learn/korean-sentence-structure">Korean sentence structure</Link>, and for the other particles
                beginners mix up, see <Link href="/learn/korean-particles-eun-neun-vs-i-ga">은/는 vs 이/가</Link>.
            </p>
        </>
    );
}
