const test = require('node:test');
const assert = require('node:assert');

// database.js reads these when it is first required.
process.env.MONGODB_DB = process.env.MONGODB_DB || 'test';

const { summarizeTutor } = require('../controllers/admin/tutorStats');
const { cleanEvent } = require('../lib/tutorEvents');
const { ratingDue } = require('../controllers/conversations/tutorFeedback');

const from = new Date('2026-10-01T00:00:00Z');
const to = new Date('2026-10-08T00:00:00Z');
const at = (day, hour = 10) => new Date(`2026-10-0${day}T${String(hour).padStart(2, '0')}:00:00Z`);
let nextMessage = 1;
const msg = (conversationId, role, timestamp, fields = {}) => ({ messageId: nextMessage++, conversationId, role, timestamp, ...fields });

test('summarizeTutor counts chatters, follow-ups, votes, ratings and the message cap', () => {
    const conversations = [
        { conversationId: 1, userId: 1, sentenceId: 5, dateCreated: at(2), lastUpdated: at(4), userMessageCount: 3, messageCount: 6, targetLanguage: 'ko', tier: 0, ratingAsked: true, feedback: { rating: 4, ratedAt: at(2, 11), comment: 'clear' } },
        { conversationId: 2, userId: 1, sentenceId: null, dateCreated: at(4), lastUpdated: at(4), userMessageCount: 1, messageCount: 2, targetLanguage: 'ja', tier: 1 },
        { conversationId: 3, userId: 2, sentenceId: 9, dateCreated: at(3), lastUpdated: at(3), userMessageCount: 5, messageCount: 10, targetLanguage: 'ko', tier: 0 },
        { conversationId: 4, userId: 3, sentenceId: 7, dateCreated: at(5), lastUpdated: at(5), userMessageCount: 1, messageCount: 1, targetLanguage: 'ko', tier: 0 },
    ];
    const messages = [
        msg(1, 'user', at(2)), msg(1, 'assistant', at(2), { replyMs: 2000, feedback: { vote: 'up' } }),
        msg(1, 'user', at(2, 11)), msg(1, 'assistant', at(2, 11), { replyMs: 4000 }),
        msg(1, 'user', at(4)), msg(1, 'assistant', at(4), { replyMs: 3000, feedback: { vote: 'down', reasons: ['wrong', 'too_long'], note: 'nope', at: at(4) }, content: 'Bad answer' }),
        msg(2, 'user', at(4)), msg(2, 'assistant', at(4), { replyMs: 1000 }),
        ...[1, 2, 3, 4, 5].flatMap((h) => [msg(3, 'user', at(3, h)), msg(3, 'assistant', at(3, h), { replyMs: 5000 })]),
        msg(4, 'user', at(5)),
    ];
    const events = [
        { type: 'page_view', userId: 1, at: at(2) },
        { type: 'page_view', userId: 4, at: at(2), meta: { from: 'direct' } },
        { type: 'limit_hit', userId: 2, at: at(3), meta: { reason: 'messages' } },
        { type: 'reply_failed', userId: 3, conversationId: 4, at: at(5), meta: { reason: 'timeout' } },
    ];
    const downId = messages.find((m) => m.feedback?.vote === 'down').messageId;
    const s = summarizeTutor({
        conversations, messages, events, from, to,
        users: [{ userId: 1, name: 'A', tier: 1 }, { userId: 2, name: 'B', tier: 0 }, { userId: 3, name: 'C', tier: 0 }],
        firstChatTier: new Map([[1, 0], [2, 0]]),
        questionFor: new Map([[downId, 'What is 은?']]),
        firstQuestions: new Map([[1, 'What does this mean?']]),
    });

    assert.strictEqual(s.tiles.chatters.value, 3);
    assert.strictEqual(s.tiles.conversations.value, 4);
    assert.strictEqual(s.tiles.questions.value, 10);
    assert.strictEqual(s.tiles.followUpRate.value, 0.5);
    assert.strictEqual(s.tiles.upRate.value, 0.5);
    assert.strictEqual(s.tiles.rating.value, 4);
    assert.strictEqual(s.tiles.failures, 1);
    assert.strictEqual(s.tiles.returning, 1);
    const funnel = Object.fromEntries(s.funnel.map((f) => [f.key, f.people]));
    assert.deepStrictEqual(funnel, { opened: 4, started: 3, replied: 2, followup: 2, real: 2, feedback: 1, returned: 1 });
    // User 2 hit the free cap of 5 questions.
    assert.strictEqual(s.capped, 1);
    assert.deepStrictEqual(s.depth.map((d) => d.count), [2, 0, 2, 0, 0]);
    assert.strictEqual(s.money.upgradedAfterChatting, 1);
    assert.strictEqual(s.votes.down, 1);
    assert.deepStrictEqual(s.votes.list[0].reasons, ['wrong', 'too_long']);
    assert.strictEqual(s.votes.list[0].question, 'What is 은?');
    assert.strictEqual(s.votes.list[0].answer, 'Bad answer');
    assert.strictEqual(s.ratings.list[0].comment, 'clear');
    assert.strictEqual(s.recent.find((r) => r.conversationId === 1).question, 'What does this mean?');
    assert.strictEqual(s.health.noReply, 1);
    assert.strictEqual(s.splits.source.find((r) => r.key === 'sentence').conversations, 3);
    assert.strictEqual(s.limits.where[0].key, 'messages');
    assert.strictEqual(s.daily.reduce((n, d) => n + d.questions, 0), 10);
});

test('tutor events keep known types and clean their fields', () => {
    assert.strictEqual(cleanEvent({ type: 'nope' }), null);
    const e = cleanEvent({ type: 'page_view', userId: 3, conversationId: '12', meta: { from: 'sentence', junk: 'x' } });
    assert.strictEqual(e.conversationId, 12);
    assert.deepStrictEqual(e.meta, { from: 'sentence' });
    assert.strictEqual(cleanEvent({ type: 'page_view', conversationId: 'abc' }).conversationId, undefined);
});

test('the Tutor rating comes up on the first long-enough conversation, then every few', () => {
    assert.strictEqual(ratingDue({ conversationId: 1 }, 1, []), false);
    assert.strictEqual(ratingDue({ conversationId: 1 }, 2, []), true);
    assert.strictEqual(ratingDue({ conversationId: 3 }, 2, [{ ratingAsked: false }, { ratingAsked: true }]), false);
    assert.strictEqual(ratingDue({ conversationId: 4 }, 2, [{ ratingAsked: false }, { ratingAsked: false }, { ratingAsked: true }]), true);
    assert.strictEqual(ratingDue({ conversationId: 5, ratingAsked: true }, 0, []), true);
});
