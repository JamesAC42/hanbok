import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-myeon-if',
    language: 'ko',
    title: 'Korean -(으)면: How to Say "If" and "When" in Korean',
    shortTitle: 'Saying "if" in Korean (-(으)면)',
    description: 'Learn -(으)면, the Korean ending for "if" and "when": how to attach it to any verb, use it with nouns, and say "I hope" with 았/었으면 좋겠어요.',
    level: 'Beginner',
    minutes: 7,
    published: '2026-10-08',
    color: 'keep',
    grammar: [
        { form: '-(으)면', label: 'if, when' },
        { form: '이면/면', label: 'if (it) is, with nouns' },
        { form: '-았/었으면 좋겠다', label: 'I wish, I hope' },
        { form: '만약(에)', label: 'if (emphasis)' },
        { form: '-(으)면 안 되다', label: 'must not' },
        { form: '-아/어도 되다', label: 'may, it is okay to' },
    ],
};

export const faq = [
    {
        q: 'How do you say "if" in Korean?',
        a: 'Add -(으)면 to the verb: 가면 (if I go), 먹으면 (if I eat). Korean puts "if" at the end of the verb, not at the start of the sentence. 만약 can be added at the front for emphasis, but the 면 ending is what makes it "if".',
    },
    {
        q: 'When do you use 면 and when 으면?',
        a: 'Look at the verb stem. If it ends in a vowel, add 면 (가다 → 가면). If it ends in a consonant, add 으면 (먹다 → 먹으면). Stems ending in ㄹ just add 면 (살다 → 살면).',
    },
    {
        q: 'What does 았/었으면 좋겠다 mean?',
        a: 'It means "I wish" or "I hope". Literally "it would be good if (it) happened". For example, 비가 왔으면 좋겠어요 means "I hope it rains." The past tense here does not mean the past. It just makes the wish sound softer and more heartfelt.',
    },
    {
        q: 'Does -(으)면 mean "if" or "when"?',
        a: 'Both. It means "if" for things that may happen, and "when" or "whenever" for things that will surely happen, like 봄이 되면 (when spring comes). The context tells you which.',
    },
];

export const quiz = [
    {
        prompt: '먹다 (to eat) + "if" = ?',
        choices: ['먹면', '먹으면'],
        answer: 1,
        why: '먹 ends in a consonant (ㄱ), so you add 으면.',
    },
    {
        prompt: '살다 (to live) + "if" = ?',
        choices: ['살으면', '살면'],
        answer: 1,
        why: 'Stems ending in ㄹ act like vowel stems and just take 면: 살면, 만들면, 놀면.',
    },
    {
        prompt: 'Which one means "I hope I pass the exam"?',
        choices: ['시험에 합격했으면 좋겠어요', '시험에 합격하면 안 돼요'],
        answer: 0,
        why: '았/었으면 좋겠어요 is "I hope". 면 안 돼요 means "must not", so the second one says "You must not pass the exam."',
    },
    {
        prompt: 'A sign in a museum says: "No photos." Which fits?',
        choices: ['사진을 찍어도 돼요', '사진을 찍으면 안 돼요'],
        answer: 1,
        why: '면 안 돼요 = "if you do it, it is not okay", so "you must not". 찍어도 돼요 means "you may take photos".',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    To say &ldquo;if&rdquo; or &ldquo;when&rdquo; in Korean, add <strong><span lang="ko">-(으)면</span></strong>{' '}
                    to the verb. After a vowel add <span lang="ko">면</span> (<span lang="ko">가면</span>, if I go). After a
                    consonant add <span lang="ko">으면</span> (<span lang="ko">먹으면</span>, if I eat). To say &ldquo;I
                    hope,&rdquo; use <span lang="ko">-았/었으면 좋겠어요</span>.
                </p>
            </section>

            <p>
                In English, &ldquo;if&rdquo; comes at the start: &ldquo;<em>If</em> it rains, I&rsquo;ll stay home.&rdquo;
                In Korean, the &ldquo;if&rdquo; is glued to the end of the first verb. You hear the condition, then the
                result. Tap the chips below to see where the <span lang="ko">면</span> sits.
            </p>

            <h2 id="how-to-make">1. How to attach -(으)면</h2>
            <p>
                Take the dictionary form, drop <span lang="ko">다</span>, and look at the last sound of what&rsquo;s left.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Stem ends in</th><th>Add</th><th>Verb</th><th>&ldquo;if&rdquo; form</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>a vowel</td><td lang="ko">면</td><td lang="ko">가다 (go)</td><td lang="ko">가면</td></tr>
                        <tr><td>a vowel</td><td lang="ko">면</td><td lang="ko">보다 (see)</td><td lang="ko">보면</td></tr>
                        <tr><td>a consonant</td><td lang="ko">으면</td><td lang="ko">먹다 (eat)</td><td lang="ko">먹으면</td></tr>
                        <tr><td>a consonant</td><td lang="ko">으면</td><td lang="ko">있다 (have, be)</td><td lang="ko">있으면</td></tr>
                        <tr><td>ㄹ</td><td lang="ko">면</td><td lang="ko">살다 (live)</td><td lang="ko">살면</td></tr>
                        <tr><td>하다 verbs</td><td lang="ko">면</td><td lang="ko">공부하다 (study)</td><td lang="ko">공부하면</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                A few common irregular verbs change a little: <span lang="ko">듣다 → 들으면</span> (if I listen),{' '}
                <span lang="ko">덥다 → 더우면</span> (if it&rsquo;s hot). You will pick these up as you go.
            </p>
            <Example
                words={[chip(W('비', 'rain'), P('가', 'subject')), chip(W('오', 'come', '오다'), P('면', 'if (after a vowel)')), chip(W('집', 'home'), P('에', 'at')), chip(W('있을', 'will stay', '있다')), chip(W('거예요', 'will (future)'))]}
                translation="If it rains, I'll stay home."
                note="In Korean, rain 'comes': 비가 오다."
            />
            <Example
                words={[chip(W('시간', 'time'), P('이', 'subject')), chip(W('있', 'have', '있다'), P('으면', 'if (after a consonant)')), chip(W('같이', 'together')), chip(W('가요', "let's go", '가다'))]}
                translation="If you have time, let's go together."
            />
            <Example
                words={[chip(W('서울', 'Seoul'), P('에', 'in')), chip(W('살', 'live', '살다'), P('면', 'if (ㄹ stem: no 으)')), chip(W('지하철', 'subway'), P('을', 'object')), chip(W('많이', 'a lot')), chip(W('타요', 'ride', '타다'))]}
                translation="If you live in Seoul, you take the subway a lot."
            />

            <h2 id="when">2. &ldquo;If&rdquo; or &ldquo;when&rdquo;?</h2>
            <p>
                The same ending covers both. For something that may or may not happen, it means &ldquo;if.&rdquo; For
                something that will surely happen, it means &ldquo;when&rdquo; or &ldquo;once.&rdquo;
            </p>
            <Example
                words={[chip(W('집', 'home'), P('에', 'to')), chip(W('도착하', 'arrive', '도착하다'), P('면', 'when, once')), chip(W('전화하세요', 'please call', '전화하다'))]}
                translation="Call me when you get home."
            />
            <Example
                words={[chip(W('봄', 'spring'), P('이', 'subject')), chip(W('되', 'become', '되다'), P('면', 'when')), chip(W('꽃', 'flower'), P('이', 'subject')), chip(W('피어요', 'bloom', '피다'))]}
                translation="When spring comes, the flowers bloom."
            />

            <h2 id="nouns">3. With nouns: 이면 and 면</h2>
            <p>
                To say &ldquo;if it is (a noun),&rdquo; add <span lang="ko">이면</span> after a consonant and{' '}
                <span lang="ko">면</span> after a vowel. It is the &ldquo;if&rdquo; version of{' '}
                <span lang="ko">이에요/예요</span>.
            </p>
            <Example
                words={[chip(W('학생', 'student'), P('이면', 'if (you) are, after a consonant')), chip(W('할인돼요', 'get a discount', '할인되다'))]}
                translation="If you're a student, you get a discount."
            />
            <p>
                So it&rsquo;s <span lang="ko">토요일이면</span> (if it&rsquo;s Saturday), but{' '}
                <span lang="ko">친구면</span> (if it&rsquo;s a friend).
            </p>

            <h2 id="hope">4. &ldquo;I hope&rdquo; with -았/었으면 좋겠어요</h2>
            <p>
                This is one of the most useful patterns in Korean. Put the verb in the past, add{' '}
                <span lang="ko">으면</span>, then <span lang="ko">좋겠어요</span>. Literally, &ldquo;it would be nice if it
                happened.&rdquo; It means &ldquo;I hope&rdquo; or &ldquo;I wish.&rdquo;
            </p>
            <Example
                words={[chip(W('주말', 'weekend'), P('에', 'on')), chip(W('날씨', 'weather'), P('가', 'subject')), chip(W('좋', 'good', '좋다'), P('았으면', 'past + if: a wish')), chip(W('좋겠어요', 'would be nice', '좋다'))]}
                translation="I hope the weather is nice this weekend."
            />
            <Example
                words={[chip(W('한국어', 'Korean'), P('를', 'object')), chip(W('잘했', 'did well', '잘하다'), P('으면', 'if')), chip(W('좋겠어요', 'would be nice', '좋다'))]}
                translation="I wish I were good at Korean."
            />
            <Tutor>
                Don&rsquo;t worry about the past tense here. It doesn&rsquo;t mean the past. It just makes the wish sound
                warmer. You will also hear <span lang="ko">-(으)면 좋겠어요</span> without the past, like{' '}
                <span lang="ko">비가 오면 좋겠어요</span>. Both are fine. K-pop lyrics are full of{' '}
                <span lang="ko">했으면 좋겠어</span>!
            </Tutor>

            <h2 id="manyak">5. 만약 for a bigger &ldquo;if&rdquo;</h2>
            <p>
                You can put <span lang="ko">만약</span> or <span lang="ko">만약에</span> at the start of the sentence. It
                stresses that this is a &ldquo;what if.&rdquo; It never replaces <span lang="ko">면</span>: you still need
                the ending.
            </p>
            <Example
                words={[chip(W('만약', 'if, suppose')), chip(W('복권', 'lottery'), P('에', 'in')), chip(W('당첨되', 'win (a prize)', '당첨되다'), P('면', 'if')), chip(W('뭐', 'what')), chip(W('할', 'will do', '하다')), chip(W('거예요', 'will (future)'))]}
                translation="If you won the lottery, what would you do?"
            />

            <h2 id="must-not">6. &ldquo;Must not&rdquo; and &ldquo;may&rdquo;</h2>
            <p>
                Add <span lang="ko">안 돼요</span> (&ldquo;it&rsquo;s not okay&rdquo;) after <span lang="ko">-(으)면</span>{' '}
                and you get &ldquo;you must not.&rdquo; Its friendly opposite is <span lang="ko">-아/어도 돼요</span>,
                &ldquo;even if you do, it&rsquo;s okay,&rdquo; which means &ldquo;you may.&rdquo;
            </p>
            <Example
                words={[chip(W('여기', 'here'), P('서', 'at (action)')), chip(W('사진', 'photo'), P('을', 'object')), chip(W('찍', 'take (a photo)', '찍다'), P('으면', 'if')), chip(W('안', 'not')), chip(W('돼요', 'is okay', '되다'))]}
                translation="You must not take photos here."
            />
            <Example
                words={[chip(W('사진', 'photo')), chip(W('찍', 'take (a photo)', '찍다'), P('어도', 'even if')), chip(W('돼요', 'is okay', '되다'))]}
                translation="You may take photos."
                note="Raise your voice at the end and it becomes a question: 사진 찍어도 돼요? (Can I take a photo?) The answer is often just 네, 돼요 (yes, it's okay) or 안 돼요 (no, you can't)."
            />
            <Tutor>
                <span lang="ko">안 돼!</span> on its own is what Koreans shout when something goes wrong. It&rsquo;s the
                &ldquo;Nooo!&rdquo; you hear in every drama.
            </Tutor>

            <TryIt placeholder="예: 시간이 있으면 같이 영화 봐요." />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Wishes and &ldquo;what ifs&rdquo; are everywhere in K-pop. Open a song in{' '}
                <Link href="/lyrics">Hanbok Lyrics</Link> and look for <span lang="ko">면</span> at the end of a verb. Tap
                the line and the breakdown will show you the condition and the result. To review the past tense used in{' '}
                <span lang="ko">했으면</span>, see <Link href="/learn/korean-past-tense">the Korean past tense</Link>, and
                for another way to join two ideas, read{' '}
                <Link href="/learn/korean-aseo-eoseo-because">-아서/어서 (because)</Link>.
            </p>
        </>
    );
}
