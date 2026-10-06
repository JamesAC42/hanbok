// Revenue for the admin dashboard, read straight from Stripe so it matches what
// was actually billed. Cached for ten minutes; ?fresh=1 recomputes.
const { getDb } = require('../../database');
const { createTtlCache } = require('../../lib/ttlCache');

const DAY = 24 * 60 * 60 * 1000;
const RANGE_DAYS = [7, 30, 90, 365];
const MAX_SUBSCRIPTIONS = 3000;
const MAX_CHARGES = 5000;

// Same price ids the checkout and webhook code use.
const PLAN_BY_PRICE = {
    price_1R94kODv6kE7Gata9Zwzvvom: 'Basic',
    price_1Rjh9EDv6kE7GataEdXl4ICx: 'Basic',
    price_1QtBf2Dv6kE7Gatasq6pq1Tc: 'Plus',
    price_1RjhBODv6kE7GatajkAfu5cB: 'Plus',
};

let stripeClient;
const getStripe = () => {
    if (stripeClient === undefined) {
        stripeClient = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
    }
    return stripeClient;
};

// Monthly value of one subscription item, in the smallest currency unit.
const monthlyAmount = (item) => {
    const price = item.price || item.plan || {};
    const amount = (price.unit_amount ?? price.amount ?? 0) * (item.quantity || 1);
    const recurring = price.recurring || { interval: price.interval, interval_count: price.interval_count };
    const count = recurring.interval_count || 1;
    switch (recurring.interval) {
        case 'year': return amount / (12 * count);
        case 'week': return (amount * 52) / (12 * count);
        case 'day': return (amount * 365) / (12 * count);
        default: return amount / count;
    }
};

const planOf = (item) => {
    const price = item.price || {};
    const name = PLAN_BY_PRICE[price.id] || price.nickname || 'Other';
    const interval = price.recurring?.interval === 'year' ? 'yearly' : 'monthly';
    return { name, interval };
};

const subscriptionMonthly = (sub) => (sub.items?.data || []).reduce((sum, item) => sum + monthlyAmount(item), 0);

// A subscription counts toward MRR at time t when it had started, was past any
// trial, and had not ended.
const payingAt = (sub, t) => {
    const start = (sub.start_date || sub.created) * 1000;
    const trialEnd = sub.trial_end ? sub.trial_end * 1000 : 0;
    const ended = sub.ended_at ? sub.ended_at * 1000 : Infinity;
    return start <= t && trialEnd <= t && ended > t;
};

const listAll = async (list, max) => {
    const rows = [];
    for await (const row of list) {
        rows.push(row);
        if (rows.length >= max) break;
    }
    return rows;
};

const summarize = (subs, charges, { days, now, users }) => {
    const from = now - days * DAY;
    const prevFrom = now - 2 * days * DAY;
    const sec = (ms) => ms / 1000;

    const live = subs.filter((sub) => ['active', 'past_due', 'trialing'].includes(sub.status));
    const paying = live.filter((sub) => sub.status !== 'trialing');
    const currency = (paying[0] || live[0] || charges[0])?.currency || 'usd';

    const plans = new Map();
    for (const sub of paying) {
        for (const item of sub.items?.data || []) {
            const { name, interval } = planOf(item);
            const key = `${name} ${interval}`;
            const row = plans.get(key) || { plan: name, interval, count: 0, mrr: 0 };
            row.count += 1;
            row.mrr += monthlyAmount(item);
            plans.set(key, row);
        }
    }

    // MRR at the end of each of the last 12 months, plus today.
    const monthEnds = [];
    const cursor = new Date(now);
    for (let i = 0; i < 12; i++) {
        const end = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1));
        monthEnds.unshift(end.getTime());
    }
    monthEnds.push(now);
    const mrrHistory = monthEnds.map((t) => ({
        date: new Date(t),
        mrr: subs.filter((sub) => payingAt(sub, t)).reduce((sum, sub) => sum + subscriptionMonthly(sub), 0),
        subscribers: subs.filter((sub) => payingAt(sub, t)).length,
    }));

    const createdIn = (sub, a, b) => sub.created >= sec(a) && sub.created < sec(b);
    const canceledIn = (sub, a, b) => sub.ended_at && sub.ended_at >= sec(a) && sub.ended_at < sec(b);

    const paid = charges.filter((c) => c.paid && c.status === 'succeeded');
    const net = (c) => c.amount - (c.amount_refunded || 0);
    const inWindow = (c, a, b) => c.created >= sec(a) && c.created < sec(b);
    const revenue = (a, b) => {
        const rows = paid.filter((c) => inWindow(c, a, b));
        return {
            total: rows.reduce((sum, c) => sum + net(c), 0),
            subscriptions: rows.filter((c) => c.invoice).reduce((sum, c) => sum + net(c), 0),
            oneTime: rows.filter((c) => !c.invoice).reduce((sum, c) => sum + net(c), 0),
            count: rows.length,
        };
    };

    const userOf = (customer) => users.get(typeof customer === 'string' ? customer : customer?.id) || null;
    const who = (customer, fallbackEmail) => {
        const user = userOf(customer);
        if (user) return { userId: user.userId, name: user.name, email: user.email };
        const expanded = customer && typeof customer === 'object' ? customer : {};
        return { name: expanded.name || null, email: expanded.email || fallbackEmail || null };
    };

    return {
        available: true,
        currency,
        mrr: paying.reduce((sum, sub) => sum + subscriptionMonthly(sub), 0),
        subscribers: {
            paying: paying.length,
            trialing: live.length - paying.length,
            pastDue: live.filter((sub) => sub.status === 'past_due').length,
            cancelling: live.filter((sub) => sub.cancel_at_period_end).length,
            newInRange: subs.filter((sub) => createdIn(sub, from, now)).length,
            newPrev: subs.filter((sub) => createdIn(sub, prevFrom, from)).length,
            cancelledInRange: subs.filter((sub) => canceledIn(sub, from, now)).length,
            cancelledPrev: subs.filter((sub) => canceledIn(sub, prevFrom, from)).length,
        },
        plans: [...plans.values()].sort((a, b) => b.mrr - a.mrr),
        mrrHistory,
        revenue: { current: revenue(from, now), prev: revenue(prevFrom, from) },
        recentPayments: paid.slice(0, 12).map((c) => ({
            id: c.id,
            amount: net(c),
            currency: c.currency,
            date: new Date(c.created * 1000),
            kind: c.invoice ? 'subscription' : 'one-time',
            description: c.description || null,
            refunded: !!c.refunded,
            ...who(c.customer, c.billing_details?.email || c.receipt_email),
        })),
        recentSubscriptions: [...subs].sort((a, b) => b.created - a.created).slice(0, 10).map((sub) => {
            const item = sub.items?.data?.[0];
            return {
                id: sub.id,
                status: sub.status,
                cancelAtPeriodEnd: !!sub.cancel_at_period_end,
                created: new Date(sub.created * 1000),
                endedAt: sub.ended_at ? new Date(sub.ended_at * 1000) : null,
                monthly: subscriptionMonthly(sub),
                plan: item ? planOf(item).name : 'Other',
                interval: item ? planOf(item).interval : 'monthly',
                ...who(sub.customer),
            };
        }),
    };
};

const buildRevenue = async (db, { days }) => {
    const stripe = getStripe();
    if (!stripe) return { available: false, reason: 'Stripe is not configured on this server' };

    const now = Date.now();
    const chargesSince = Math.floor((now - Math.max(2 * days, 60) * DAY) / 1000);
    const [subs, charges] = await Promise.all([
        listAll(stripe.subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer'] }), MAX_SUBSCRIPTIONS),
        listAll(stripe.charges.list({ created: { gte: chargesSince }, limit: 100, expand: ['data.customer'] }), MAX_CHARGES),
    ]);

    const customerIds = [...new Set([...subs, ...charges].map((row) => (typeof row.customer === 'string' ? row.customer : row.customer?.id)).filter(Boolean))];
    const users = await db.collection('users')
        .find({ 'subscription.customerId': { $in: customerIds } }, { projection: { _id: 0, userId: 1, name: 1, email: 1, 'subscription.customerId': 1 } })
        .toArray();

    return summarize(subs, charges, {
        days,
        now,
        users: new Map(users.map((u) => [u.subscription.customerId, u])),
    });
};

const revenueCache = createTtlCache(10 * 60 * 1000);

const getRevenue = async (req, res) => {
    const days = RANGE_DAYS.includes(parseInt(req.query.days, 10)) ? parseInt(req.query.days, 10) : 30;
    try {
        const { value, cachedAt } = await revenueCache.get(String(days), () => buildRevenue(getDb(), { days }), { fresh: req.query.fresh === '1' });
        res.json({ success: true, cachedAt: new Date(cachedAt), ...value });
    } catch (error) {
        console.error('Admin revenue failed:', error);
        res.json({ success: true, available: false, reason: 'Could not reach Stripe' });
    }
};

module.exports = { getRevenue, summarize, monthlyAmount };
