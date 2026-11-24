// Who pays, and how they got there: one row per person who ever paid for a
// subscription, next to how the recent signups behave, so the snapshot can
// answer "what do our payers have in common". No names, emails or ids leave
// here: rows carry months, counts and categories only.
const { getStripe, listAll, payingAt, NEVER_PAYING, planOf } = require('./revenue');

const DAY = 24 * 60 * 60 * 1000;
const MAX_SUBSCRIPTIONS = 3000;
const COHORT_MONTHS = 18;

const monthOf = (date) => (date ? new Date(date).toISOString().slice(0, 7) : null);
const customerIdOf = (customer) => (typeof customer === 'string' ? customer : customer?.id);
const hostOf = (url) => {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return null;
    }
};

// A subscription that got past any trial and was billed at least once.
const everPaid = (sub, now) => {
    if (NEVER_PAYING.has(sub.status)) return false;
    const start = (sub.start_date || sub.created) * 1000;
    const end = sub.ended_at ? sub.ended_at * 1000 : now;
    const trialEnd = sub.trial_end ? sub.trial_end * 1000 : 0;
    return start <= now && trialEnd < end;
};

const firstPaidAt = (sub) => Math.max((sub.start_date || sub.created) * 1000, sub.trial_end ? sub.trial_end * 1000 : 0);

const SENTENCE_BUCKETS = [['0', 0, 0], ['1-2', 1, 2], ['3-9', 3, 9], ['10-29', 10, 29], ['30+', 30, Infinity]];
const DAYS_BUCKETS = [['same day', 0, 0], ['1-7 days', 1, 7], ['8-30 days', 8, 30], ['1-6 months', 31, 182], ['6+ months', 183, Infinity]];
const bucketOf = (n, buckets) => (n === null || n === undefined ? 'unknown' : buckets.find(([, lo, hi]) => n >= lo && n <= hi)[0]);
const countBy = (rows, key) => {
    const counts = {};
    for (const row of rows) {
        const value = typeof key === 'function' ? key(row) : row[key];
        const label = value === null || value === undefined ? 'unknown' : String(value);
        counts[label] = (counts[label] || 0) + 1;
    }
    return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
};

// Pure part, for tests. people: one entry per payer with everything already
// looked up; recent: signups since `recentSince` with their first-week usage.
const payersFrom = ({ people, cohorts, recent, now }) => {
    const rows = people
        .map((p) => ({
            firstPaid: monthOf(p.firstPaidAt),
            payingNow: p.payingNow,
            plan: p.plan,
            signedUp: monthOf(p.signedUpAt),
            daysToPay: p.signedUpAt ? Math.max(0, Math.floor((p.firstPaidAt - new Date(p.signedUpAt).getTime()) / DAY)) : null,
            sentencesFirstWeek: p.sentencesFirstWeek,
            sentencesBeforePaying: p.sentencesBeforePaying,
            language: p.language || null,
            heardFrom: p.heardFrom || null,
            source: p.source || null,
            country: p.country || null,
            coupon: !!p.coupon,
        }))
        .sort((a, b) => String(a.firstPaid).localeCompare(String(b.firstPaid)));
    const current = rows.filter((r) => r.payingNow);
    const summary = (list) => ({
        count: list.length,
        daysToPay: countBy(list, (r) => bucketOf(r.daysToPay, DAYS_BUCKETS)),
        sentencesFirstWeek: countBy(list, (r) => bucketOf(r.sentencesFirstWeek, SENTENCE_BUCKETS)),
        language: countBy(list, 'language'),
        country: countBy(list, 'country'),
        heardFrom: countBy(list, 'heardFrom'),
        source: countBy(list, 'source'),
        plan: countBy(list, 'plan'),
    });
    return {
        generatedAt: new Date(now),
        payingNow: summary(current),
        everPaid: summary(rows),
        rows,
        // Signups per month and how many of them have paid at some point.
        cohorts,
        recentSignups: {
            since: recent.since,
            count: recent.users.length,
            sentencesFirstWeek: countBy(recent.users, (u) => bucketOf(u.sentencesFirstWeek, SENTENCE_BUCKETS)),
            language: countBy(recent.users, 'language'),
            heardFrom: countBy(recent.users, 'heardFrom'),
            source: countBy(recent.users, 'source'),
        },
    };
};

const sourceOf = (attribution) => attribution?.utm_source || hostOf(attribution?.referrer) || null;

// Sentences in the first week, before paying, and the language studied most.
const usageOf = async (sentences, userId, signedUpAt, paidAt) => {
    const signed = signedUpAt ? new Date(signedUpAt) : null;
    const [firstWeek, beforePaying, languages] = await Promise.all([
        signed ? sentences.countDocuments({ userId, dateCreated: { $gte: signed, $lt: new Date(signed.getTime() + 7 * DAY) } }) : null,
        paidAt ? sentences.countDocuments({ userId, dateCreated: { $lt: new Date(paidAt) } }) : null,
        sentences.aggregate([
            { $match: { userId } },
            { $group: { _id: '$originalLanguage', n: { $sum: 1 } } },
            { $sort: { n: -1 } },
            { $limit: 1 },
        ]).toArray(),
    ]);
    return { firstWeek, beforePaying, language: languages[0]?._id || null };
};

const buildPayers = async (db, { now = Date.now(), recentSince = new Date('2026-10-01T00:00:00Z') } = {}) => {
    const stripe = getStripe();
    if (!stripe) return { available: false, reason: 'Stripe is not configured on this server' };
    const subs = (await listAll(
        stripe.subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer', 'data.default_payment_method'] }),
        MAX_SUBSCRIPTIONS,
    )).filter((sub) => everPaid(sub, now));

    // One person per Stripe customer: their first paid subscription, and
    // whether any of theirs is paying today.
    const byCustomer = new Map();
    for (const sub of subs) {
        const id = customerIdOf(sub.customer);
        if (!id) continue;
        const entry = byCustomer.get(id) || { subs: [] };
        entry.subs.push(sub);
        byCustomer.set(id, entry);
    }
    const users = db.collection('users');
    const sentences = db.collection('sentences');
    const docs = await users.find(
        { 'subscription.customerId': { $in: [...byCustomer.keys()] } },
        { projection: { _id: 0, userId: 1, dateCreated: 1, attribution: 1, 'subscription.customerId': 1 } },
    ).toArray();
    const userByCustomer = new Map(docs.map((u) => [u.subscription.customerId, u]));

    const people = await Promise.all([...byCustomer.entries()].map(async ([customerId, { subs: own }]) => {
        const first = own.reduce((a, b) => (firstPaidAt(a) <= firstPaidAt(b) ? a : b));
        const paidAt = firstPaidAt(first);
        const user = userByCustomer.get(customerId) || null;
        const usage = user ? await usageOf(sentences, user.userId, user.dateCreated, paidAt) : {};
        const customer = typeof first.customer === 'object' ? first.customer : {};
        const card = first.default_payment_method?.card;
        const item = first.items?.data?.[0];
        const plan = item ? planOf(item) : null;
        return {
            firstPaidAt: paidAt,
            payingNow: own.some((sub) => payingAt(sub, now)),
            plan: plan ? `${plan.name} ${plan.interval}` : null,
            signedUpAt: user?.dateCreated || null,
            sentencesFirstWeek: usage.firstWeek ?? null,
            sentencesBeforePaying: usage.beforePaying ?? null,
            language: usage.language || null,
            heardFrom: user?.attribution?.heardFrom || null,
            source: sourceOf(user?.attribution),
            country: card?.country || customer.address?.country || null,
            coupon: !!(first.discount || first.discounts?.length),
        };
    }));

    // Signup cohorts by month, with how many of each ever paid.
    const cohortStart = new Date(Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth() - (COHORT_MONTHS - 1), 1));
    const signupsByMonth = await users.aggregate([
        { $match: { dateCreated: { $gte: cohortStart } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$dateCreated' } }, signups: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]).toArray();
    const paidByMonth = countBy(people.filter((p) => p.signedUpAt), (p) => monthOf(p.signedUpAt));
    const cohorts = signupsByMonth.map((row) => ({ month: row._id, signups: row.signups, everPaid: paidByMonth[row._id] || 0 }));

    const recentDocs = await users.find(
        { dateCreated: { $gte: recentSince, $lt: new Date(now - 7 * DAY) } },
        { projection: { _id: 0, userId: 1, dateCreated: 1, attribution: 1 } },
    ).toArray();
    const recentUsers = await Promise.all(recentDocs.map(async (u) => {
        const usage = await usageOf(sentences, u.userId, u.dateCreated, null);
        return { sentencesFirstWeek: usage.firstWeek, language: usage.language, heardFrom: u.attribution?.heardFrom || null, source: sourceOf(u.attribution) };
    }));

    return { available: true, ...payersFrom({ people, cohorts, recent: { since: recentSince, users: recentUsers }, now }) };
};

module.exports = { buildPayers, payersFrom, everPaid };
