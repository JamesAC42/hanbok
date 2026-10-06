import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-past-tense',
    language: 'ko',
    title: 'Korean Past Tense: 았어요 / 었어요 Made Simple',
    shortTitle: 'Korean past tense (았어요 / 었어요)',
    description: 'Learn how to say what happened in Korean. One simple vowel rule picks 았어요 or 었어요, plus 했어요 for 하다, common contractions like 갔어요, and "was" with 였어요.',
    level: 'Beginner',
    minutes: 7,
    published: '2026-10-07',
    color: 'und',
    grammar: [
        { form: '-았/었-', label: 'past tense' },
        { form: '했어요', label: 'did (past of 하다)' },
        { form: '이었어요/였어요', label: 'was (with a noun)' },
    ],
};

export const faq = [
    {
        q: 'How do you make the past tense in Korean?',
        a: 'Take the verb stem and add 았 or 었, then the ending. For polite speech that is 았어요 or 었어요: 받다 becomes 받았어요 (received), 먹다 becomes 먹었어요 (ate).',
    },
    {
        q: 'When do you use 았어요 and when 었어요?',
        a: 'Look at the last vowel of the stem. If it is ㅏ or ㅗ, use 았어요 (받았어요, 갔어요, 봤어요). With any other vowel, use 었어요 (먹었어요, 마셨어요). Verbs ending in 하다 always become 했어요.',
    },
    {
        q: 'What is the past tense of 하다?',
        a: '했어요 in polite speech and 했어 in casual speech. Every 하다 verb follows it: 공부하다 becomes 공부했어요 (studied), 일하다 becomes 일했어요 (worked).',
    },
    {
        q: 'How do you say "was" in Korean?',
        a: 'After a noun, use 이었어요 if the noun ends in a consonant and 였어요 if it ends in a vowel: 학생이었어요 (was a student), 가수였어요 (was a singer).',
    },
];

export const quiz = [
    {
        prompt: '가다 (to go) in the polite past = ?',
        hint: 'I went.',
        choices: ['갔어요', '가었어요', '가요'],
        answer: 0,
        why: '가 ends in ㅏ, so it takes 았. 가 + 았어요 squeezes together into 갔어요. 가요 is present tense.',
    },
    {
        prompt: '먹다 (to eat) in the polite past = ?',
        choices: ['먹았어요', '먹었어요'],
        answer: 1,
        why: 'The vowel in 먹 is ㅓ, not ㅏ or ㅗ, so it takes 었: 먹었어요.',
    },
    {
        prompt: '공부하다 (to study) in the polite past = ?',
        hint: 'I studied.',
        choices: ['공부하었어요', '공부했어요'],
        answer: 1,
        why: 'Every 하다 verb becomes 했어요 in the past. No exceptions.',
    },
    {
        prompt: 'I was an office worker: 저는 회사원___',
        choices: ['이었어요', '였어요'],
        answer: 0,
        why: '회사원 ends in a consonant (ㄴ), so it takes 이었어요. After a vowel, like 가수, you use 였어요.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    To talk about the past, add <span lang="ko">았</span> or <span lang="ko">었</span> to the verb stem. If
                    the last vowel is <span lang="ko">ㅏ</span> or <span lang="ko">ㅗ</span>, use{' '}
                    <span lang="ko">았어요</span>. Otherwise use <span lang="ko">었어요</span>. Verbs ending in{' '}
                    <span lang="ko">하다</span> become <span lang="ko">했어요</span>.
                </p>
            </section>

            <p>
                The good news: Korean past tense is very regular. There is one vowel rule, one special case for{' '}
                <span lang="ko">하다</span>, and a few spots where sounds squeeze together. Once you see the pattern, you
                will spot it in every drama and song. Tap the endings below to see each part.
            </p>

            <h2 id="rule">1. The vowel rule: 았 or 었</h2>
            <p>
                Start with the dictionary form, like <span lang="ko">먹다</span> (to eat). Drop <span lang="ko">다</span> to
                get the stem: <span lang="ko">먹</span>. Now look at the last vowel in that stem.
            </p>
            <ul className={styles.list}>
                <li><strong>ㅏ or ㅗ</strong>: add <span lang="ko">았어요</span>. <span lang="ko">받다 → 받았어요</span> (received)</li>
                <li><strong>Any other vowel</strong>: add <span lang="ko">었어요</span>. <span lang="ko">먹다 → 먹었어요</span> (ate)</li>
            </ul>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('아침', 'morning'), P('에', 'at (time)')), chip(W('빵', 'bread'), P('을', 'object')), chip(W('먹', 'eat', '먹다'), P('었어요', 'past, polite: 었 because the vowel is ㅓ'))]}
                translation="I ate bread in the morning."
            />
            <Example
                words={[chip(W('친구', 'friend'), P('한테서', 'from (a person)')), chip(W('선물', 'present, gift'), P('을', 'object')), chip(W('받', 'receive', '받다'), P('았어요', 'past, polite: 았 because the vowel is ㅏ'))]}
                translation="I got a present from a friend."
            />
            <Tutor>
                Here is my trick: <span lang="ko">ㅏ</span> and <span lang="ko">ㅗ</span> are &ldquo;bright&rdquo; vowels,
                so they get the bright <span lang="ko">았</span>. Everything else gets <span lang="ko">었</span>. And if you
                guess wrong, people will still understand you!
            </Tutor>

            <h2 id="hada">2. 하다 always becomes 했어요</h2>
            <p>
                Many Korean verbs end in <span lang="ko">하다</span>: <span lang="ko">공부하다</span> (study),{' '}
                <span lang="ko">일하다</span> (work), <span lang="ko">좋아하다</span> (like). In the past, the{' '}
                <span lang="ko">하</span> part always turns into <span lang="ko">했어요</span>. You don&rsquo;t need the
                vowel rule at all.
            </p>
            <Example
                words={[chip(W('어제', 'yesterday')), chip(W('도서관', 'library'), P('에서', 'at (place of action)')), chip(W('공부', 'study'), P('했어요', 'did, polite: 하다 becomes 했어요'))]}
                translation="I studied at the library yesterday."
            />

            <h2 id="contractions">3. When sounds squeeze together</h2>
            <p>
                If the stem ends in a vowel, the past ending often merges into it. This is why you rarely see the full{' '}
                <span lang="ko">았</span> or <span lang="ko">었</span> spelled out.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Verb</th><th>Meaning</th><th>What happens</th><th>Past (polite)</th><th>Past (casual)</th></tr>
                    </thead>
                    <tbody>
                        <tr><td lang="ko">가다</td><td>go</td><td><span lang="ko">가 + 았 → 갔</span></td><td lang="ko">갔어요</td><td lang="ko">갔어</td></tr>
                        <tr><td lang="ko">만나다</td><td>meet</td><td><span lang="ko">나 + 았 → 났</span></td><td lang="ko">만났어요</td><td lang="ko">만났어</td></tr>
                        <tr><td lang="ko">보다</td><td>see, watch</td><td><span lang="ko">보 + 았 → 봤</span></td><td lang="ko">봤어요</td><td lang="ko">봤어</td></tr>
                        <tr><td lang="ko">오다</td><td>come</td><td><span lang="ko">오 + 았 → 왔</span></td><td lang="ko">왔어요</td><td lang="ko">왔어</td></tr>
                        <tr><td lang="ko">마시다</td><td>drink</td><td><span lang="ko">시 + 었 → 셨</span></td><td lang="ko">마셨어요</td><td lang="ko">마셨어</td></tr>
                        <tr><td lang="ko">배우다</td><td>learn</td><td><span lang="ko">우 + 었 → 웠</span></td><td lang="ko">배웠어요</td><td lang="ko">배웠어</td></tr>
                        <tr><td lang="ko">하다</td><td>do</td><td><span lang="ko">하 → 했</span></td><td lang="ko">했어요</td><td lang="ko">했어</td></tr>
                    </tbody>
                </table>
            </div>
            <Example
                words={[chip(W('주말', 'weekend'), P('에', 'on (time)')), chip(W('부산', 'Busan'), P('에', 'to')), chip(W('갔어요', 'went (polite)', '가다'))]}
                translation="I went to Busan on the weekend."
                note="가 + 았어요 becomes 갔어요. The two ㅏ sounds merge into one."
            />
            <Example
                words={[chip(W('그', 'that')), chip(W('영화', 'movie')), chip(W('봤어요', 'saw, watched (polite)', '보다'))]}
                translation="Did you see that movie?"
                note="보 + 았어요 becomes 봤어요. Same ending for questions and answers. Your voice goes up for a question."
            />
            <Example
                words={[chip(W('커피', 'coffee'), P('를', 'object')), chip(W('너무', 'too (much)')), chip(W('많이', 'a lot')), chip(W('마셨어요', 'drank (polite)', '마시다'))]}
                translation="I drank too much coffee."
                note="마시 + 었어요 becomes 마셨어요. ㅣ and ㅓ blend into ㅕ."
            />

            <h2 id="was">4. &ldquo;Was&rdquo; with a noun: 이었어요 / 였어요</h2>
            <p>
                To say someone or something <em>was</em> a noun, attach the ending straight to the noun. Use{' '}
                <span lang="ko">이었어요</span> after a consonant and <span lang="ko">였어요</span> after a vowel. It is the
                past of <span lang="ko">이에요/예요</span> (&ldquo;am, is&rdquo;).
            </p>
            <Example
                words={[chip(W('그때', 'back then')), chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('학생', 'student'), P('이었어요', 'was, polite: after a consonant'))]}
                translation="Back then, I was a student."
            />
            <Example
                words={[chip(W('제', 'my (humble)', '저')), chip(W('꿈', 'dream'), P('은', 'topic')), chip(W('가수', 'singer'), P('였어요', 'was, polite: after a vowel'))]}
                translation="My dream was to be a singer."
            />

            <h2 id="casual">5. Casual past: just drop 요</h2>
            <p>
                With close friends, drop <span lang="ko">요</span>, just like in the present tense. You get{' '}
                <span lang="ko">먹었어</span>, <span lang="ko">갔어</span>, <span lang="ko">했어</span>. For nouns,{' '}
                <span lang="ko">이었어요/였어요</span> becomes <span lang="ko">이었어/였어</span>.
            </p>
            <Example
                words={[chip(W('밥', 'rice, a meal')), chip(W('먹', 'eat', '먹다'), P('었어', 'past, casual'))]}
                translation="Did you eat?"
                note='A friendly way to say hi to someone close. It means something like "how are you doing?"'
            />
            <Example
                words={[chip(W('나', 'I (casual)')), chip(W('어제', 'yesterday')), chip(W('진짜', 'really')), chip(W('피곤', 'tiredness'), P('했어', 'was, casual: 하다 becomes 했어'))]}
                translation="I was really tired yesterday."
            />
            <Tutor>
                In formal speech, like a presentation, the past ends in <span lang="ko">었습니다</span> or{' '}
                <span lang="ko">았습니다</span>: <span lang="ko">감사했습니다</span> (thank you, for something that is
                over). The <span lang="ko">았/었</span> part never changes. Only the ending after it does.
            </Tutor>

            <TryIt placeholder="예: 어제 친구를 만났어요" />

            <h2 id="next">Keep going</h2>
            <p>
                K-pop lyrics are full of the past tense, because so many songs look back on love and memories. Open a song
                in <Link href="/lyrics">Hanbok Lyrics</Link> and tap a line: the breakdown points out every{' '}
                <span lang="ko">았</span> and <span lang="ko">었</span>. To review the present tense this builds on, see{' '}
                <Link href="/learn/korean-present-tense-a-yo-eo-yo">Korean present tense (아요 / 어요)</Link>. Ready to talk
                about plans? Try{' '}
                <Link href="/learn/korean-future-tense-eul-geoyeyo">Korean future tense (을 거예요)</Link>.
            </p>
        </>
    );
}
