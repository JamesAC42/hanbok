import Example from '@/components/learn/Example';
import Tutor from '@/components/learn/Tutor';
import TryIt from '@/components/learn/TryIt';
import WordList from '@/components/learn/WordList';
import Link from 'next/link';
import { chip, W, P } from './parts';
import styles from '@/styles/pages/learn.module.scss';

export const meta = {
    slug: 'korean-numbers-native-vs-sino',
    language: 'ko',
    title: 'Korean Numbers: 하나 vs 일, Native vs Sino-Korean Made Easy',
    shortTitle: 'Korean numbers (하나 vs 일)',
    description: 'Korean has two sets of numbers. Learn when to use 하나, 둘, 셋 and when to use 일, 이, 삼, plus counters, age, telling time and prices in won.',
    level: 'Beginner',
    minutes: 9,
    published: '2026-10-08',
    color: 'keep',
    grammar: [
        { form: '일, 이, 삼', label: 'Sino-Korean numbers' },
        { form: '하나, 둘, 셋', label: 'native Korean numbers' },
        { form: '한/두/세/네/스무', label: 'short forms before a counter' },
        { form: '개', label: 'counter for things' },
        { form: '명', label: 'counter for people' },
        { form: '살', label: 'counter for age' },
        { form: '시/분', label: "o'clock / minutes" },
        { form: '원', label: 'won (money)' },
    ],
};

const COUNTERS = [
    { ko: '개', rom: 'gae', en: 'things, items (general)', note: 'Native numbers: 사과 한 개 (one apple). The safe choice when you forget the right counter.' },
    { ko: '명', rom: 'myeong', en: 'people', note: 'Native numbers: 두 명 (two people). For respect, use 분: 세 분 (three people, polite).' },
    { ko: '살', rom: 'sal', en: 'years of age', note: 'Native numbers: 스무 살 (20 years old).' },
    { ko: '시', rom: 'si', en: "o'clock (hour)", note: 'Native numbers: 한 시 (1:00), 열두 시 (12:00).' },
    { ko: '분', rom: 'bun', en: 'minutes', note: 'Sino-Korean numbers: 십 분 (ten minutes).' },
    { ko: '원', rom: 'won', en: 'won (Korean money)', note: 'Sino-Korean numbers: 천 원 (1,000 won).' },
    { ko: '잔', rom: 'jan', en: 'cups, glasses (drinks)', note: 'Native numbers: 커피 두 잔 (two coffees).' },
    { ko: '권', rom: 'gwon', en: 'books, volumes', note: 'Native numbers: 책 세 권 (three books).' },
    { ko: '층', rom: 'cheung', en: 'floor (of a building)', note: 'Sino-Korean numbers: 오 층 (5th floor).' },
];

export const faq = [
    {
        q: 'Why does Korean have two number systems?',
        a: 'Native Korean numbers (하나, 둘, 셋) are the original Korean words. Sino-Korean numbers (일, 이, 삼) came from Chinese long ago. Today both are used every day, each for different jobs.',
    },
    {
        q: 'When do you use Sino-Korean vs native Korean numbers?',
        a: 'Use native numbers for counting things and people, for age, and for the hour when telling time. Use Sino-Korean numbers for dates, money, minutes, phone numbers, floors and most big numbers.',
    },
    {
        q: 'How do you say your age in Korean?',
        a: 'Use a native number plus 살, then 이에요/예요. For example 스무 살이에요 (I am 20) or 서른다섯 살이에요 (I am 35). Note that 스물 becomes 스무 right before 살.',
    },
    {
        q: 'How do you tell time in Korean?',
        a: 'Hours use native numbers and minutes use Sino-Korean numbers: 세 시 삼십 분 is 3:30. You can also say 세 시 반 (half past three).',
    },
];

export const quiz = [
    {
        prompt: 'How do you say "I am 20 years old"?',
        choices: ['스물 살이에요', '스무 살이에요', '이십 살이에요'],
        answer: 1,
        why: 'Age uses native numbers, and 스물 shortens to 스무 right before a counter like 살.',
    },
    {
        prompt: 'It is 2 o\'clock. Which is right?',
        choices: ['두 시예요', '이 시예요'],
        answer: 0,
        why: 'Hours use native numbers. 둘 shortens to 두 before 시.',
    },
    {
        prompt: 'How do you say 10,000 won?',
        choices: ['만 원', '일만 원', '십천 원'],
        answer: 0,
        why: '만 (ten thousand) is its own unit, and you do not need 일 in front of it. Same with 천 원 (1,000 won).',
    },
    {
        prompt: 'At a café: "Two coffees, please."',
        choices: ['커피 둘 잔 주세요', '커피 두 잔 주세요', '커피 이 잔 주세요'],
        answer: 1,
        why: 'Cups use native numbers with the counter 잔, and 둘 becomes 두 before a counter.',
    },
];

export function Body() {
    return (
        <>
            <section className={styles.answerBox}>
                <p className={styles.label}>The short answer</p>
                <p>
                    Korean has two sets of numbers. <strong>Native numbers</strong> (<span lang="ko">하나, 둘, 셋</span>) are
                    for counting things and people, age, and the hour. <strong>Sino-Korean numbers</strong>{' '}
                    (<span lang="ko">일, 이, 삼</span>) are for dates, money, minutes, phone numbers and floors.
                </p>
            </section>

            <p>
                Two number systems sounds scary, but each one has its own jobs, and those jobs rarely overlap. Once you know
                which job you are doing, the right number follows. Tap any number in the examples below to see what it is.
            </p>

            <h2 id="one-to-ten">1. One to ten in both systems</h2>
            <p>
                Here are the first ten numbers. The last column shows the short form native numbers take right before a
                counter word. Only the first four (and 20) change.
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Number</th><th>Sino-Korean</th><th>Native</th><th>Native, before a counter</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>1</td><td lang="ko">일 (il)</td><td lang="ko">하나 (hana)</td><td lang="ko">한</td></tr>
                        <tr><td>2</td><td lang="ko">이 (i)</td><td lang="ko">둘 (dul)</td><td lang="ko">두</td></tr>
                        <tr><td>3</td><td lang="ko">삼 (sam)</td><td lang="ko">셋 (set)</td><td lang="ko">세</td></tr>
                        <tr><td>4</td><td lang="ko">사 (sa)</td><td lang="ko">넷 (net)</td><td lang="ko">네</td></tr>
                        <tr><td>5</td><td lang="ko">오 (o)</td><td lang="ko">다섯 (daseot)</td><td lang="ko">다섯</td></tr>
                        <tr><td>6</td><td lang="ko">육 (yuk)</td><td lang="ko">여섯 (yeoseot)</td><td lang="ko">여섯</td></tr>
                        <tr><td>7</td><td lang="ko">칠 (chil)</td><td lang="ko">일곱 (ilgop)</td><td lang="ko">일곱</td></tr>
                        <tr><td>8</td><td lang="ko">팔 (pal)</td><td lang="ko">여덟 (yeodeol)</td><td lang="ko">여덟</td></tr>
                        <tr><td>9</td><td lang="ko">구 (gu)</td><td lang="ko">아홉 (ahop)</td><td lang="ko">아홉</td></tr>
                        <tr><td>10</td><td lang="ko">십 (sip)</td><td lang="ko">열 (yeol)</td><td lang="ko">열</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                Zero is <span lang="ko">영</span> in math and <span lang="ko">공</span> when reading out phone numbers.
            </p>

            <h2 id="tens">2. Tens and bigger numbers</h2>
            <p>
                Sino-Korean numbers are built like a calculator: <span lang="ko">이십</span> is &ldquo;two ten&rdquo; (20),
                and <span lang="ko">이십오</span> is &ldquo;two ten five&rdquo; (25). Native numbers have their own word for
                each ten, and you add the ones after it: <span lang="ko">스물다섯</span> (25).
            </p>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Number</th><th>Sino-Korean</th><th>Native</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>10</td><td lang="ko">십</td><td lang="ko">열</td></tr>
                        <tr><td>20</td><td lang="ko">이십</td><td lang="ko">스물 (스무 before a counter)</td></tr>
                        <tr><td>30</td><td lang="ko">삼십</td><td lang="ko">서른</td></tr>
                        <tr><td>40</td><td lang="ko">사십</td><td lang="ko">마흔</td></tr>
                        <tr><td>50</td><td lang="ko">오십</td><td lang="ko">쉰</td></tr>
                        <tr><td>60</td><td lang="ko">육십</td><td lang="ko">예순</td></tr>
                        <tr><td>70</td><td lang="ko">칠십</td><td lang="ko">일흔</td></tr>
                        <tr><td>80</td><td lang="ko">팔십</td><td lang="ko">여든</td></tr>
                        <tr><td>90</td><td lang="ko">구십</td><td lang="ko">아흔</td></tr>
                        <tr><td>100</td><td lang="ko">백</td><td>(none, use Sino-Korean)</td></tr>
                        <tr><td>1,000</td><td lang="ko">천</td><td>(none)</td></tr>
                        <tr><td>10,000</td><td lang="ko">만</td><td>(none)</td></tr>
                    </tbody>
                </table>
            </div>
            <p>
                Native numbers stop at 99. For anything bigger, Korean switches to Sino-Korean. Also notice that you say{' '}
                <span lang="ko">백</span>, <span lang="ko">천</span> and <span lang="ko">만</span> on their own, not
                &ldquo;one hundred&rdquo; with an <span lang="ko">일</span> in front.
            </p>

            <h2 id="counters">3. Counting things: number + counter</h2>
            <p>
                In English you can say &ldquo;three apples.&rdquo; Korean usually adds a <strong>counter</strong>, a small
                word for the kind of thing you are counting. The order is: <strong>thing, number, counter</strong>. Most
                counters take native numbers, in their short form.
            </p>
            <Example
                words={[chip(W('사과', 'apple')), chip(W('세', 'three (native, short form)', '셋')), chip(W('개', 'counter for things')), chip(W('주세요', 'please give', '주다'))]}
                translation="Three apples, please."
            />
            <Example
                words={[chip(W('우리', 'our')), chip(W('가족', 'family'), P('은', 'topic')), chip(W('네', 'four (native, short form)', '넷')), chip(W('명', 'counter for people'), P('이에요', '"is", polite (after a consonant)'))]}
                translation="There are four people in my family."
            />
            <Example
                words={[chip(W('맥주', 'beer')), chip(W('두', 'two (native, short form)', '둘')), chip(W('잔', 'counter for cups, glasses')), chip(W('주세요', 'please give', '주다'))]}
                translation="Two beers, please."
            />
            <Example
                words={[chip(W('책', 'book')), chip(W('한', 'one (native, short form)', '하나')), chip(W('권', 'counter for books')), chip(W('샀어요', 'bought', '사다'))]}
                translation="I bought one book."
            />
            <p>Here are the counters you will use most. Tap Save to add any of them to your flashcards.</p>
            <WordList items={COUNTERS} />
            <Tutor>
                Forgot the right counter? Use <span lang="ko">개</span>. It is not perfect for everything, but people will
                understand you. And for people, <span lang="ko">명</span> always works.
            </Tutor>

            <h2 id="age">4. Saying your age</h2>
            <p>
                Age uses native numbers and the counter <span lang="ko">살</span>. Watch for 20: <span lang="ko">스물</span>{' '}
                becomes <span lang="ko">스무</span> before <span lang="ko">살</span>, but <span lang="ko">스물한 살</span>{' '}
                (21) keeps its full form.
            </p>
            <Example
                words={[chip(W('저', 'I (humble)'), P('는', 'topic')), chip(W('스물다섯', 'twenty-five (native)')), chip(W('살', 'years old (counter)'), P('이에요', '"am", polite (after a consonant)'))]}
                translation="I'm twenty-five."
            />
            <p>
                On forms and in the news you may see the Sino-Korean <span lang="ko">세</span> instead:{' '}
                <span lang="ko">오십 세</span> (50 years old). In conversation, stick with <span lang="ko">살</span>.
            </p>

            <h2 id="time">5. Telling time: a mix of both</h2>
            <p>
                This is where the two systems meet. <strong>Hours are native</strong>, <strong>minutes are
                Sino-Korean</strong>. For half past, you can say <span lang="ko">반</span> (half).
            </p>
            <Example
                words={[chip(W('지금', 'now')), chip(W('세', 'three (native, short form)', '셋')), chip(W('시', "o'clock")), chip(W('삼십', 'thirty (Sino-Korean)')), chip(W('분', 'minute'), P('이에요', '"is", polite (after a consonant)'))]}
                translation="It's 3:30 now."
                note="You can also say 세 시 반이에요 (It's half past three)."
            />
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Time</th><th>Korean</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>1:00</td><td lang="ko">한 시</td></tr>
                        <tr><td>2:15</td><td lang="ko">두 시 십오 분</td></tr>
                        <tr><td>4:30</td><td lang="ko">네 시 삼십 분 / 네 시 반</td></tr>
                        <tr><td>7:45</td><td lang="ko">일곱 시 사십오 분</td></tr>
                        <tr><td>12:05</td><td lang="ko">열두 시 오 분</td></tr>
                    </tbody>
                </table>
            </div>

            <h2 id="money">6. Money, dates and floors: Sino-Korean</h2>
            <p>
                Prices use Sino-Korean numbers with <span lang="ko">원</span>. The big unit to know is{' '}
                <span lang="ko">만</span> (10,000). Korean groups big numbers by ten-thousands, not thousands, so 50,000 won
                is <span lang="ko">오만 원</span> (&ldquo;five ten-thousands&rdquo;) and 100,000 won is{' '}
                <span lang="ko">십만 원</span>.
            </p>
            <Example
                words={[chip(W('이', 'this')), chip(W('가방', 'bag')), chip(W('얼마', 'how much'), P('예요', '"is", polite (after a vowel)'))]}
                translation="How much is this bag?"
            />
            <Example
                words={[chip(W('만', 'ten thousand')), chip(W('오천', 'five thousand')), chip(W('원', 'won (Korean money)'), P('이에요', '"is", polite (after a consonant)'))]}
                translation="It's 15,000 won."
                note="Not 일만. Just like 천 (1,000) and 백 (100), 만 stands on its own."
            />
            <p>
                Dates are Sino-Korean too: the month is the number plus <span lang="ko">월</span>, the day is the number plus{' '}
                <span lang="ko">일</span>. Two months are a little irregular: June is <span lang="ko">유월</span> and October
                is <span lang="ko">시월</span>.
            </p>
            <Example
                words={[chip(W('제', 'my (humble)')), chip(W('생일', 'birthday'), P('은', 'topic')), chip(W('오월', 'May')), chip(W('오', 'five (Sino-Korean)')), chip(W('일', 'day (of the month)'), P('이에요', '"is", polite (after a consonant)'))]}
                translation="My birthday is May 5th."
            />
            <Example
                words={[chip(W('사무실', 'office'), P('은', 'topic')), chip(W('칠', 'seven (Sino-Korean)')), chip(W('층', 'floor'), P('에', 'at, in (location)')), chip(W('있어요', 'is (located)', '있다'))]}
                translation="The office is on the 7th floor."
            />
            <p>
                Phone numbers are read digit by digit in Sino-Korean, with <span lang="ko">공</span> for zero: 010-1234-5678
                is <span lang="ko">공일공, 일이삼사, 오육칠팔</span>.
            </p>
            <Tutor>
                One word, two meanings: <span lang="ko">번</span> with a native number means &ldquo;times&rdquo;
                (<span lang="ko">한 번</span>, once). With a Sino-Korean number it means &ldquo;number&rdquo;
                (<span lang="ko">일 번</span>, number one, like a bus or an exit).
            </Tutor>

            <h2 id="cheat-sheet">Quick cheat sheet</h2>
            <ul className={styles.list}>
                <li><strong>Native (<span lang="ko">하나, 둘, 셋</span>)</strong>: counting things and people, age, hours, cups and glasses, how many times.</li>
                <li><strong>Sino-Korean (<span lang="ko">일, 이, 삼</span>)</strong>: money, dates, minutes, phone numbers, floors, numbers over 99.</li>
                <li><strong>Before a counter</strong>, use the short native forms: <span lang="ko">한, 두, 세, 네, 스무</span>.</li>
                <li><strong>Big money</strong>: think in <span lang="ko">만</span> (10,000).</li>
            </ul>

            <TryIt placeholder="예: 커피 두 잔 주세요." />

            <h2 id="songs">Hear it in songs</h2>
            <p>
                Numbers pop up in K-pop all the time, from <span lang="ko">하나, 둘, 셋</span> count-ins to lines about
                being <span lang="ko">스무 살</span>. Open a song in <Link href="/lyrics">Hanbok Lyrics</Link> and tap a
                line to see each number explained. To keep building, read{' '}
                <Link href="/learn/korean-sentence-structure">Korean sentence structure</Link> and{' '}
                <Link href="/learn/korean-present-tense-a-yo-eo-yo">the present tense with <span lang="ko">아요/어요</span></Link>.
            </p>
        </>
    );
}
