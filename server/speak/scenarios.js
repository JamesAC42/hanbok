// Role-play scenes for Speak. Each scene gives Horang a role, a setting and
// two or three goals the learner works through out loud. Text here is in
// English; Horang plays the scene in whatever language the learner studies.
// `korea` adds local flavor when the learner studies Korean.

const SCENARIOS = [
    {
        id: 'cafe',
        title: 'Order at a café',
        blurb: 'Grab an iced americano from Horang, the barista.',
        level: 'beginner',
        background: 'cafe',
        role: 'a cheerful barista at a small neighborhood café',
        korea: 'The café is called 까치 카페, in a quiet Seoul alley. An iced americano is 4,000 won.',
        goals: ['Order a drink', 'Ask for it to go', 'Ask how much it costs'],
        phrases: { ko: ['아이스 아메리카노 하나 주세요', '포장해 주세요', '얼마예요?'] },
    },
    {
        id: 'store',
        title: 'Convenience store run',
        blurb: 'Find ramyeon, get a bag and pay at the counter.',
        level: 'beginner',
        background: 'store',
        role: 'a sleepy but friendly late-night convenience store clerk',
        korea: 'A Korean 편의점 at night. Bags cost 100 won. Cup ramyeon is in aisle 2.',
        goals: ['Ask where something is', 'Ask for a bag', 'Pay by card'],
        phrases: { ko: ['라면 어디 있어요?', '봉투 주세요', '카드로 할게요'] },
    },
    {
        id: 'taxi',
        title: 'Take a taxi',
        blurb: 'Tell the driver where to go without getting lost.',
        level: 'beginner',
        background: 'taxi',
        role: 'a chatty taxi driver who loves giving food recommendations',
        korea: 'A Seoul taxi at dusk. The learner wants to go to Myeongdong station.',
        goals: ['Say where you want to go', 'Ask how long it takes', 'Ask to stop here'],
        phrases: { ko: ['명동역으로 가 주세요', '얼마나 걸려요?', '여기서 세워 주세요'] },
    },
    {
        id: 'friend',
        title: 'Make a new friend',
        blurb: 'Meet Horang at a riverside picnic and make plans.',
        level: 'beginner',
        background: 'park',
        role: 'a friendly stranger sitting on the next picnic mat',
        korea: 'A sunny afternoon at a Han River park in Seoul.',
        goals: ['Introduce yourself', 'Ask what they like to do', 'Make plans to meet again'],
        phrases: { ko: ['저는 ___예요', '뭐 좋아해요?', '다음에 같이 ___ 할래요?'] },
    },
    {
        id: 'pocha',
        title: 'Dinner at a street tent',
        blurb: 'Ask for a recommendation, handle the spice, get the bill.',
        level: 'intermediate',
        background: 'pocha',
        role: 'the owner of a lively street tent restaurant who is proud of the food',
        korea: 'A 포장마차 at night. Tteokbokki is very spicy. The bill is paid at the end.',
        goals: ['Ask what is good here', 'Say how spicy you can handle', 'Ask for the bill'],
        phrases: { ko: ['뭐가 맛있어요?', '덜 맵게 해 주세요', '계산해 주세요'] },
    },
    {
        id: 'kdrama',
        title: 'K-drama rooftop confession',
        blurb: 'Horang overacts a K-drama scene. Can you keep up?',
        level: 'intermediate',
        background: 'rooftop',
        role: 'a hilariously over-the-top K-drama lead on a rooftop at night, playing the scene for laughs (keep it wholesome and comedic, never actually romantic or flirtatious toward the learner)',
        korea: 'Classic drama tropes: dramatic pauses, wind in the hair, a sudden plot twist (a secret twin, amnesia, or a long-lost chaebol family).',
        goals: ['Tell them how you feel', 'React to the plot twist', 'Deliver a dramatic last line'],
        phrases: { ko: ['할 말이 있어요', '말도 안 돼!', '가지 마세요!'] },
    },
    {
        id: 'free',
        title: 'Talk with Horang',
        blurb: 'Free conversation. Ask questions and practice your saved words.',
        level: 'any',
        background: 'study',
        role: 'yourself, Horang the tutor, chatting in your hanok study room',
        korea: '',
        goals: ['Use three of your saved words', 'Ask Horang a question about the language'],
        phrases: { ko: ['이거 무슨 뜻이에요?', '다시 한번 말해 주세요', '천천히 말해 주세요'] },
        free: true,
    },
];

const LEVELS = ['beginner', 'intermediate', 'advanced'];

const findScenario = (id) => SCENARIOS.find((s) => s.id === id) || null;

// What the browser needs to draw the scene picker.
const publicScenario = (s, language) => ({
    id: s.id,
    title: s.title,
    blurb: s.blurb,
    level: s.level,
    background: s.background,
    goals: s.goals,
    phrases: (s.phrases && s.phrases[language]) || [],
});

module.exports = { SCENARIOS, LEVELS, findScenario, publicScenario };
