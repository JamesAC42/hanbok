// What each plan gets. Flip-card review of saved grammar is always free;
// paid plans unlock the practice that's generated for you.
const FREE = {
    saves: 20,
    quizQuestionsPerDay: 5,
    lessonsPerWeek: 3,
};
const PAID = {
    saves: Infinity,
    quizQuestionsPerDay: Infinity,
    lessonsPerWeek: Infinity,
};

const DAY_MS = 24 * 60 * 60 * 1000;

const limitsFor = (tier) => (tier > 0 ? PAID : FREE);

const startOfToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

// Today's quiz questions and this week's lessons, counted from the practice log.
const usageFor = async (db, userId) => {
    const log = db.collection('grammar_practice_log');
    const [quizQuestionsToday, lessonsThisWeek, saves] = await Promise.all([
        log.countDocuments({ userId, kind: 'question', quiz: true, date: { $gte: startOfToday() } }),
        log.countDocuments({ userId, kind: 'lesson', date: { $gte: new Date(Date.now() - 7 * DAY_MS) } }),
        db.collection('saved_grammar').countDocuments({ userId }),
    ]);
    return { quizQuestionsToday, lessonsThisWeek, saves };
};

const finite = (n) => (Number.isFinite(n) ? n : null);

// The plan summary the browser shows: limits (null = unlimited), use and what's left.
const allowanceFor = async (db, user) => {
    const limits = limitsFor(user?.tier || 0);
    const usage = await usageFor(db, user.userId);
    return {
        paid: (user?.tier || 0) > 0,
        limits: {
            saves: finite(limits.saves),
            quizQuestionsPerDay: finite(limits.quizQuestionsPerDay),
            lessonsPerWeek: finite(limits.lessonsPerWeek),
        },
        usage,
        quizLeftToday: finite(Math.max(0, limits.quizQuestionsPerDay - usage.quizQuestionsToday)),
        lessonsLeftThisWeek: finite(Math.max(0, limits.lessonsPerWeek - usage.lessonsThisWeek)),
        savesLeft: finite(Math.max(0, limits.saves - usage.saves)),
    };
};

// How far along a saved point is, 0-4, shown as stars on the path:
// 0 new, 1 learned (lesson done or first right answer), 2 practiced,
// 3 strong (review interval a week or more), 4 mastered (three weeks or more).
const stageFor = (saved, card) => {
    const interval = card?.intervalDays || 0;
    if (interval >= 21) return 4;
    if (interval >= 7) return 3;
    if ((saved.correct || 0) >= 3) return 2;
    if (saved.lessonDone || (saved.correct || 0) >= 1) return 1;
    return 0;
};

module.exports = { FREE, PAID, limitsFor, usageFor, allowanceFor, stageFor, startOfToday };
