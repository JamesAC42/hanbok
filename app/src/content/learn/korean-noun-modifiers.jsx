import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-noun-modifiers',
    language: 'ko',
    title: 'Korean Noun Modifiers -는, -(으)ㄴ, -(으)ㄹ: "The Person Who..."',
    shortTitle: 'Describing nouns (-는, -은, -을)',
    description: 'Learn to describe nouns in Korean: 예쁜 꽃, 먹는 사람, 어제 본 영화, 내일 할 일. See which ending to use for adjectives and verbs, and how to say "the person who...".',
    level: 'Intermediate',
    topic: 'linking',
    minutes: 9,
    published: '2026-10-11',
    color: 'pink',
    grammar: [
        { form: '-(으)ㄴ', label: 'adjective before a noun (예쁜 꽃); verb, past (본 영화)' },
        { form: '-는', label: 'verb before a noun, now (먹는 사람)' },
        { form: '-(으)ㄹ', label: 'verb before a noun, future (할 일)' },
        { form: '있는/없는', label: '있다 and 없다 before a noun (맛있는)' },
    ],
};

export const faq = [
    {
        q: 'How do you say "the person who" in Korean?',
        a: 'Put the whole description before 사람 (person) and change the verb ending. 커피를 마시는 사람 is "the person who is drinking coffee". 어제 만난 사람 is "the person I met yesterday". Korean has no separate word for "who" or "that".',
    },
    {
        q: 'What is the difference between 는, 은 and 을 before a noun?',
        a: 'With verbs, they show time. -는 is now (먹는 음식, food I eat), -(으)ㄴ is past (먹은 음식, food I ate) and -(으)ㄹ is future (먹을 음식, food I will eat). With adjectives, -(으)ㄴ simply describes: 작은 가방 (a small bag).',
    },
    {
        q: 'Why is it 맛있는 and not 맛있은?',
        a: '맛있다 feels like an adjective, but all words ending in 있다 or 없다 take -는 before a noun: 맛있는, 재미있는, 맛없는, 재미없는.',
    },
    {
        q: 'How do you turn a Korean adjective into a describing word?',
        a: 'Drop 다 and add ㄴ after a vowel or 은 after a consonant: 예쁘다 becomes 예쁜, 크다 becomes 큰, 작다 becomes 작은. Then put it right before the noun: 예쁜 꽃 (a pretty flower).',
    },
];

export const quiz = [
    {
        prompt: '크다 (big) + 집 (house) = "a big house"',
        choices: ['큰 집', '크는 집'],
        answer: 0,
        why: '크다 is an adjective and ends in a vowel, so it takes ㄴ: 큰. Adjectives never take -는.',
    },
    {
        prompt: '"delicious food" = ___ 음식',
        hint: '맛있다 = to be delicious',
        choices: ['맛있은', '맛있는'],
        answer: 1,
        why: 'Words ending in 있다 or 없다 always take -는: 맛있는 음식, 재미없는 영화.',
    },
    {
        prompt: '"the movie I saw yesterday"',
        hint: '보다 = to see, watch',
        choices: ['어제 보는 영화', '어제 본 영화', '어제 볼 영화'],
        answer: 1,
        why: 'For a finished action, verbs take -(으)ㄴ: 보다 becomes 본. 보는 is now and 볼 is future.',
    },
    {
        prompt: '"something to eat" (food for later)',
        choices: ['먹을 거', '먹은 거'],
        answer: 0,
        why: '-(으)ㄹ looks ahead: 먹을 거 is something you will eat. 먹은 거 is something you already ate.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    In Korean, the describing words go <strong>before</strong> the noun, and the verb or adjective
                    changes its ending. Adjectives take <span lang="ko">-(으)ㄴ</span> (<span lang="ko">예쁜 꽃</span>,
                    a pretty flower). Verbs take <span lang="ko">-는</span> for now (<span lang="ko">먹는 사람</span>),{' '}
                    <span lang="ko">-(으)ㄴ</span> for the past (<span lang="ko">어제 본 영화</span>) and{' '}
                    <span lang="ko">-(으)ㄹ</span> for the future (<span lang="ko">내일 할 일</span>).
                </p>
            </section>

            <p>
                In English, we say &ldquo;the person <em>who</em> is eating&rdquo; or &ldquo;the movie <em>that</em>{' '}
                I saw&rdquo;. Korean has no word for &ldquo;who&rdquo; or &ldquo;that&rdquo; here. Instead, the whole
                description comes first, and a small ending on the verb ties it to the noun. Once you see the pattern,
                you will spot it in almost every sentence. Tap the chips to see each part.
            </p>

            <h2 id="adjectives">1. Adjectives: -(으)ㄴ</h2>
            <p>
                In Korean, adjectives like &ldquo;pretty&rdquo; and &ldquo;small&rdquo; work like verbs: they end in{' '}
                <span lang="ko">다</span>. To put one in front of a noun, drop <span lang="ko">다</span> and:
            </p>
            <ul className={styles.list}>
                <li>After a vowel, add <span lang="ko">ㄴ</span> under the last letter: <span lang="ko">예쁘다</span> to <span lang="ko">예쁜</span>, <span lang="ko">크다</span> to <span lang="ko">큰</span></li>
                <li>After a consonant, add <span lang="ko">은</span>: <span lang="ko">작다</span> to <span lang="ko">작은</span>, <span lang="ko">좋다</span> to <span lang="ko">좋은</span></li>
                <li>Stems ending in <span lang="ko">ㄹ</span> drop it: <span lang="ko">길다</span> to <span lang="ko">긴</span>, <span lang="ko">멀다</span> to <span lang="ko">먼</span></li>
                <li><span lang="ko">ㅂ</span> irregulars change to <span lang="ko">운</span>: <span lang="ko">맵다</span> to <span lang="ko">매운</span>, <span lang="ko">춥다</span> to <span lang="ko">추운</span></li>
            </ul>
            <Example
                words={[chip(W('예쁜', 'pretty (describing)', '예쁘다')), chip(W('꽃', 'flower'), P('을', 'object')), chip(W('샀어요', 'bought (polite)', '사다'))]}
                translation="I bought some pretty flowers."
                note="예쁘 ends in a vowel, so ㄴ joins the last syllable: 예쁜."
            />
            <Example
                words={[chip(W('작', 'small', '작다'), P('은', 'describes the noun (after a consonant)')), chip(W('가방', 'bag'), P('이', 'subject')), chip(W('있어요', 'is there, have', '있다'))]}
                translation="I have a small bag."
            />
            <Example
                words={[chip(W('매운', 'spicy (describing)', '맵다')), chip(W('음식', 'food'), P('을', 'object')), chip(W('좋아해요', 'like (polite)', '좋아하다'))]}
                translation="I like spicy food."
            />

            <h2 id="present">2. Verbs happening now: -는</h2>
            <p>
                For an action that happens now or regularly, add <span lang="ko">-는</span> to the verb stem. It is
                the same after a vowel or a consonant. Stems ending in <span lang="ko">ㄹ</span> drop it:{' '}
                <span lang="ko">살다</span> becomes <span lang="ko">사는</span>.
            </p>
            <Example
                words={[chip(W('커피', 'coffee'), P('를', 'object')), chip(W('마시', 'drink', '마시다'), P('는', 'who is (doing), describes the noun')), chip(W('사람', 'person'), P('이', 'subject')), chip(W('제', 'my (humble)')), chip(W('친구', 'friend'), P('예요', 'is (polite, after a vowel)'))]}
                translation="The person drinking coffee is my friend."
            />
            <Example
                words={[chip(W('서울', 'Seoul'), P('에', 'in')), chip(W('사는', 'who lives (describing)', '살다')), chip(W('친구', 'friend'), P('가', 'subject')), chip(W('있어요', 'have, there is', '있다'))]}
                translation="I have a friend who lives in Seoul."
                note="살다 drops its ㄹ before 는: 사는."
            />

            <h2 id="itda-eopda">3. The 있다 / 없다 exception</h2>
            <p>
                Words that end in <span lang="ko">있다</span> or <span lang="ko">없다</span> always take{' '}
                <span lang="ko">-는</span>, even when they mean something like an adjective. This catches almost every
                learner at first.
            </p>
            <Example
                words={[chip(W('맛있', 'delicious', '맛있다'), P('는', 'describes the noun (있다 words take 는)')), chip(W('식당', 'restaurant'), P('을', 'object')), chip(W('알아요', 'know (polite)', '알다'))]}
                translation="I know a good restaurant."
            />
            <ul className={styles.list}>
                <li><span lang="ko">맛있다</span> to <span lang="ko">맛있는</span> (delicious), <span lang="ko">맛없다</span> to <span lang="ko">맛없는</span> (not tasty)</li>
                <li><span lang="ko">재미있다</span> to <span lang="ko">재미있는</span> (fun), <span lang="ko">재미없다</span> to <span lang="ko">재미없는</span> (boring)</li>
                <li><span lang="ko">멋있다</span> to <span lang="ko">멋있는</span> (cool, stylish)</li>
            </ul>
            <Tutor>
                Quick test: does the word end in <span lang="ko">있다</span> or <span lang="ko">없다</span>? Then
                it&rsquo;s <span lang="ko">는</span>. No exceptions, no thinking. I like rules like that!
            </Tutor>

            <h2 id="past">4. Verbs in the past: -(으)ㄴ</h2>
            <p>
                For an action that already happened, verbs use the same ending as adjectives:{' '}
                <span lang="ko">ㄴ</span> after a vowel, <span lang="ko">은</span> after a consonant.
            </p>
            <Example
                words={[chip(W('어제', 'yesterday')), chip(W('본', 'watched (describing, past)', '보다')), chip(W('영화', 'movie'), P('가', 'subject')), chip(W('정말', 'really')), chip(W('재미있었어요', 'was fun (polite)', '재미있다'))]}
                translation="The movie I saw yesterday was really fun."
            />
            <Example
                words={[chip(W('제', 'I (humble form of 저 before 가)'), P('가', 'subject')), chip(W('어제', 'yesterday')), chip(W('만난', 'met (describing, past)', '만나다')), chip(W('사람', 'person'), P('은', 'topic')), chip(W('의사', 'doctor'), P('예요', 'is (polite, after a vowel)'))]}
                translation="The person I met yesterday is a doctor."
                note="Inside the description, the person who did the action takes 가 (here 제가), not 는."
            />
            <Example
                words={[chip(W('제', 'I (humble form of 저 before 가)'), P('가', 'subject')), chip(W('만든', 'made (describing, past)', '만들다')), chip(W('김치', 'kimchi'), P('예요', 'is (polite, after a vowel)'))]}
                translation="This is kimchi I made."
                note="만들다 drops its ㄹ: 만든."
            />

            <h2 id="future">5. Verbs in the future: -(으)ㄹ</h2>
            <p>
                For something that has not happened yet, add <span lang="ko">ㄹ</span> after a vowel or{' '}
                <span lang="ko">을</span> after a consonant. It often means &ldquo;to do&rdquo; or &ldquo;to
                eat&rdquo;, as in &ldquo;things to do&rdquo;.
            </p>
            <Example
                words={[chip(W('내일', 'tomorrow')), chip(W('할', 'to do (describing, future)', '하다')), chip(W('일', 'work, task'), P('이', 'subject')), chip(W('많아요', 'is a lot (polite)', '많다'))]}
                translation="I have a lot to do tomorrow."
            />
            <Example
                words={[chip(W('먹', 'eat', '먹다'), P('을', 'to (do), future, describes the noun')), chip(W('거', 'thing (short for 것)')), chip(W('있어요', 'is there', '있다'))]}
                translation="Is there anything to eat?"
            />

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Verb</th><th>Past (did)</th><th>Now (does)</th><th>Future (will do)</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">보다 (see)</td><td lang="ko">본</td><td lang="ko">보는</td><td lang="ko">볼</td></tr>
                        <tr><td lang="ko">하다 (do)</td><td lang="ko">한</td><td lang="ko">하는</td><td lang="ko">할</td></tr>
                        <tr><td lang="ko">먹다 (eat)</td><td lang="ko">먹은</td><td lang="ko">먹는</td><td lang="ko">먹을</td></tr>
                        <tr><td lang="ko">만들다 (make)</td><td lang="ko">만든</td><td lang="ko">만드는</td><td lang="ko">만들</td></tr>
                        <tr><td lang="ko">듣다 (listen)</td><td lang="ko">들은</td><td lang="ko">듣는</td><td lang="ko">들을</td></tr>
                        <tr><td lang="ko">있다 (be, have)</td><td lang="ko">있던</td><td lang="ko">있는</td><td lang="ko">있을</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                <span lang="ko">듣다</span> is irregular: its <span lang="ko">ㄷ</span> turns into{' '}
                <span lang="ko">ㄹ</span> before a vowel, so you get <span lang="ko">들은</span> and{' '}
                <span lang="ko">들을</span>. For <span lang="ko">있다</span> in the past, Koreans use{' '}
                <span lang="ko">있던</span> (&ldquo;that used to be there&rdquo;).
            </p>

            <h2 id="person-who">6. Building &ldquo;the person who...&rdquo;</h2>
            <p>
                Now you can describe anything. Build the little sentence first, change its last verb, and put the noun
                at the end. Compare these two:
            </p>
            <ul className={styles.list}>
                <li><span lang="ko">저를 도와준 사람</span>: the person who helped <strong>me</strong></li>
                <li><span lang="ko">제가 도와준 사람</span>: the person <strong>I</strong> helped</li>
            </ul>
            <p>
                The verb is the same. Only the particle tells you who did what: <span lang="ko">를</span> marks the
                object, <span lang="ko">가</span> marks the subject. You can swap <span lang="ko">사람</span> for any
                noun: <span lang="ko">우리가 처음 만난 곳</span> (the place where we first met),{' '}
                <span lang="ko">제가 좋아하는 노래</span> (a song I like).
            </p>
            <Tutor>
                Read Korean descriptions from the end. Find the noun first (<span lang="ko">사람</span>,{' '}
                <span lang="ko">영화</span>, <span lang="ko">곳</span>), then everything before it tells you
                &ldquo;which one&rdquo;. It&rsquo;s like reading English backwards, and it gets easy fast.
            </Tutor>

            <TryIt placeholder="예: 제가 좋아하는 음식은 김치찌개예요." />

            <h2 id="keep-going">Keep going</h2>
            <p>
                Song titles and lyrics are packed with these: &ldquo;the person I love&rdquo;, &ldquo;the day we
                met&rdquo;, &ldquo;the words I couldn&rsquo;t say&rdquo;. Open a song in{' '}
                <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line to see every ending explained. For the vowel
                and <span lang="ko">ㄹ</span> rules behind these endings, see{' '}
                <Link href="/learn/korean-present-tense-a-yo-eo-yo">the present tense</Link>. The future{' '}
                <span lang="ko">-(으)ㄹ</span> is also the first half of{' '}
                <Link href="/learn/korean-future-tense-eul-geoyeyo">-(으)ㄹ 거예요 (will)</Link> and{' '}
                <Link href="/learn/korean-eul-su-itda-can">-(으)ㄹ 수 있다 (can)</Link>.
            </p>
        </>
    );
}
