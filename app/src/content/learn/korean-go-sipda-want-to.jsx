import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-go-sipda-want-to',
    language: 'ko',
    title: 'How to Say "Want To" in Korean: -고 싶다 (고 싶어요)',
    shortTitle: '"Want to" in Korean (-고 싶다)',
    description: 'Learn -고 싶다, the Korean pattern for "want to." See how to say 고 싶어요, the past and negative forms, talk about what others want, and why 보고 싶어요 means "I miss you."',
    level: 'Beginner',
    minutes: 7,
    published: '2026-10-07',
    color: 'keep',
    grammar: [
        { form: '-고 싶다', label: 'want to (do)' },
        { form: '-고 싶었다', label: 'wanted to (do)' },
        { form: '-고 싶지 않다', label: 'do not want to (do)' },
        { form: '-고 싶어하다', label: 'someone else wants to (do)' },
    ],
};

export const faq = [
    {
        q: 'How do you say "I want to" in Korean?',
        a: 'Take a verb, drop 다, and add 고 싶어요. 가다 (go) becomes 가고 싶어요 (I want to go). 먹다 (eat) becomes 먹고 싶어요 (I want to eat).',
    },
    {
        q: 'What does 보고 싶어 mean?',
        a: 'Word for word it is "I want to see (you)," but it is how Koreans say "I miss you." 보고 싶어 is casual, 보고 싶어요 is polite.',
    },
    {
        q: 'How do you say "I don\'t want to" in Korean?',
        a: 'Use 고 싶지 않아요, like 가고 싶지 않아요 (I don\'t want to go). In casual talk you will also hear 안 가고 싶어요.',
    },
    {
        q: 'Can I use 고 싶어요 for other people?',
        a: 'Only in questions to the listener, like 뭐 먹고 싶어요? (What do you want to eat?). To say what someone else wants, use 고 싶어해요: 친구가 자고 싶어해요 (My friend wants to sleep).',
    },
];

export const quiz = [
    {
        prompt: 'Which sentence is correct?',
        hint: 'I want to eat bibimbap.',
        choices: ['비빔밥을 먹고 싶어요', '비빔밥을 먹어 싶어요'],
        answer: 0,
        why: 'The verb stem 먹 takes 고, then 싶어요. The 어요 ending goes on 싶다, not on 먹다.',
    },
    {
        prompt: 'How do you say "I wanted to go"?',
        choices: ['갔고 싶어요', '가고 싶었어요'],
        answer: 1,
        why: 'The past tense goes on 싶다 at the end: 싶어요 becomes 싶었어요. The first verb stays as 가고.',
    },
    {
        prompt: 'Which sentence is right for talking about your friend?',
        hint: 'My friend wants to sleep.',
        choices: ['친구가 자고 싶어요', '친구가 자고 싶어해요'],
        answer: 1,
        why: 'You cannot see inside someone else\'s head, so Korean uses 싶어해요 ("seems to want") for other people.',
    },
    {
        prompt: 'Your friend texts you 보고 싶어! What do they mean?',
        choices: ['I miss you!', 'I want to watch TV!'],
        answer: 0,
        why: '보고 싶어 is the everyday way to say "I miss you." With no object, it means you.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    To say you <strong>want to do something</strong>, take a verb, drop <span lang="ko">다</span>, and add{' '}
                    <span lang="ko">고 싶어요</span>. <span lang="ko">가다</span> (to go) becomes{' '}
                    <span lang="ko">가고 싶어요</span> (I want to go). And <span lang="ko">보고 싶어요</span>, &ldquo;I want to
                    see you,&rdquo; is how Koreans say &ldquo;I miss you.&rdquo;
                </p>
            </section>

            <p>
                This is one of the most useful patterns in Korean. Once you know it, you can order food, make plans and
                share your feelings with just a handful of verbs. Tap any word below to see what it means.
            </p>

            <h2 id="how-it-works">1. How -고 싶다 works</h2>
            <p>
                Every Korean verb ends in <span lang="ko">다</span> in the dictionary. Take that off and you have the stem.
                Add <span lang="ko">고</span>, a space, and then <span lang="ko">싶어요</span>. The stem never changes, so
                there is nothing tricky to remember.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Verb</th><th>Want to</th><th>Wanted to</th><th>Don&rsquo;t want to</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><span lang="ko">가다</span> (go)</td><td lang="ko">가고 싶어요</td><td lang="ko">가고 싶었어요</td><td lang="ko">가고 싶지 않아요</td></tr>
                        <tr><td><span lang="ko">먹다</span> (eat)</td><td lang="ko">먹고 싶어요</td><td lang="ko">먹고 싶었어요</td><td lang="ko">먹고 싶지 않아요</td></tr>
                        <tr><td><span lang="ko">보다</span> (see, watch)</td><td lang="ko">보고 싶어요</td><td lang="ko">보고 싶었어요</td><td lang="ko">보고 싶지 않아요</td></tr>
                        <tr><td><span lang="ko">쉬다</span> (rest)</td><td lang="ko">쉬고 싶어요</td><td lang="ko">쉬고 싶었어요</td><td lang="ko">쉬고 싶지 않아요</td></tr>
                        <tr><td><span lang="ko">공부하다</span> (study)</td><td lang="ko">공부하고 싶어요</td><td lang="ko">공부하고 싶었어요</td><td lang="ko">공부하고 싶지 않아요</td></tr>
                    </tbody>
                </table>
            </div>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('한국', 'Korea'), P('에', 'to')), chip(W('가', 'go', '가다'), P('고', 'links the verb to 싶다')), chip(P('싶어요', 'want to, polite'))]}
                translation="I want to go to Korea."
            />
            <Example
                words={[chip(W('뭐', 'what')), chip(W('먹', 'eat', '먹다'), P('고', 'links the verb to 싶다')), chip(P('싶어요', 'want to, polite'))]}
                translation="What do you want to eat?"
                note="Same words for the question and the answer. Raise your voice at the end to ask."
            />
            <Example
                words={[chip(W('주말', 'weekend'), P('에', 'on, at (time)')), chip(W('집', 'home'), P('에서', 'at (place of action)')), chip(W('쉬', 'rest', '쉬다'), P('고', 'links the verb to 싶다')), chip(P('싶어요', 'want to, polite'))]}
                translation="I want to rest at home this weekend."
            />

            <h2 id="past">2. Wanted to: 고 싶었어요</h2>
            <p>
                To talk about the past, change only the last part. <span lang="ko">싶어요</span> becomes{' '}
                <span lang="ko">싶었어요</span>. The first verb stays exactly the same.
            </p>
            <Example
                words={[chip(W('어제', 'yesterday')), chip(W('그', 'that')), chip(W('영화', 'movie'), P('를', 'object')), chip(W('보', 'see, watch', '보다'), P('고', 'links the verb to 싶다')), chip(P('싶었어요', 'wanted to, polite past'))]}
                translation="I wanted to see that movie yesterday."
            />
            <Tutor>
                A common slip: putting the past tense on the first verb, like <span lang="ko">갔고 싶어요</span>. Keep the
                first verb plain and let <span lang="ko">싶다</span> carry the time: <span lang="ko">가고 싶었어요</span>.
            </Tutor>

            <h2 id="negative">3. Don&rsquo;t want to: 고 싶지 않아요</h2>
            <p>
                The standard way is to add <span lang="ko">지 않아요</span> to <span lang="ko">싶다</span>, giving{' '}
                <span lang="ko">싶지 않아요</span>. In everyday talk you will also hear the short way: put{' '}
                <span lang="ko">안</span> in front of the first verb.
            </p>
            <Example
                words={[chip(W('오늘', 'today'), P('은', 'topic, contrast')), chip(W('일하', 'work', '일하다'), P('고', 'links the verb to 싶다')), chip(P('싶지', 'want to + 지, before 않다')), chip(P('않아요', 'not, polite'))]}
                translation="I don't want to work today."
            />
            <Example
                words={[chip(W('안', 'not')), chip(W('가', 'go', '가다'), P('고', 'links the verb to 싶다')), chip(P('싶어요', 'want to, polite'))]}
                translation="I don't want to go."
                note="Short and casual. With 하다 verbs, 안 goes before 하다: 공부 안 하고 싶어요."
            />

            <h2 id="others">4. What other people want: 고 싶어해요</h2>
            <p>
                In Korean, you can say what <em>you</em> want, and you can ask what <em>the listener</em> wants. But for a
                third person, you only see how they act. So Korean adds <span lang="ko">하다</span>:{' '}
                <span lang="ko">싶어하다</span>, &ldquo;to show that one wants to.&rdquo;
            </p>
            <Example
                words={[chip(W('동생', 'younger sibling'), P('이', 'subject')), chip(W('강아지', 'puppy'), P('를', 'object')), chip(W('키우', 'raise (a pet)', '키우다'), P('고', 'links the verb to 싶다')), chip(P('싶어해요', 'wants to (someone else), polite'))]}
                translation="My little brother wants to get a dog."
            />

            <h2 id="miss-you">5. 보고 싶어요: I miss you</h2>
            <p>
                <span lang="ko">보다</span> means &ldquo;to see.&rdquo; So <span lang="ko">보고 싶어요</span> is literally
                &ldquo;I want to see (you).&rdquo; Korean doesn&rsquo;t have a separate verb for missing someone, so this is the
                phrase everyone uses, from text messages to love songs.
            </p>
            <Example
                words={[chip(W('보', 'see', '보다'), P('고', 'links the verb to 싶다')), chip(P('싶어', 'want to, casual'))]}
                translation="I miss you."
                note="Casual form for close friends, family and partners. Add 요 to make it polite: 보고 싶어요."
            />
            <Example
                words={[chip(W('엄마', 'mom'), P('가', 'marks who you miss')), chip(W('보', 'see', '보다'), P('고', 'links the verb to 싶다')), chip(P('싶어요', 'want to, polite'))]}
                translation="I miss my mom."
                note="With 싶다, the thing you want often takes 이/가 instead of 을/를. Both are heard: 엄마를 보고 싶어요 is fine too."
            />
            <Tutor>
                One more tip from me: <span lang="ko">싶다</span> works with action verbs, not with describing words. For
                &ldquo;I want to be pretty,&rdquo; Koreans say <span lang="ko">예뻐지고 싶어요</span>, &ldquo;I want to
                become pretty.&rdquo; Save that one for later!
            </Tutor>

            <TryIt placeholder="예: 저는 한국어를 잘하고 싶어요." />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                <span lang="ko">보고 싶어</span> and <span lang="ko">~고 싶어</span> show up in countless K-pop choruses.
                Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line to see the pattern break down. To
                build the rest of the sentence, see{' '}
                <Link href="/learn/korean-present-tense-a-yo-eo-yo">the polite present tense</Link> and{' '}
                <Link href="/learn/korean-negation-an-vs-mot">saying &ldquo;not&rdquo; with <span lang="ko">안</span> and <span lang="ko">못</span></Link>.
            </p>
        </>
    );
}
