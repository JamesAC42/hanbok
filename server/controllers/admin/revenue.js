// Revenue for the admin dashboard, read straight from Stripe so it matches what
// was actually billed. MRR is net of coupons, like Stripe's own. Cached for
// five minutes per range and time zone; ?fresh=1 recomputes.
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

// STRIPE_ANALYTICS_KEY lets a server read revenue with a separate read-only
// key, e.g. staging showing live numbers while its checkout stays in test mode.
let stripeClient;
const getStripe = () => {
    if (stripeClient === undefined) {
        const key = process.env.STRIPE_ANALYTICS_KEY || process.env.STRIPE_SECRET_KEY;
        stripeClient = key ? require('stripe')(key) : null;
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
// trial, and had not been cancelled. Like Stripe, a subscription set to cancel
// at the end of its period leaves MRR when the cancellation is made, not when
// access ends. Unpaid, paused and never-completed subscriptions don't count.
const NEVER_PAYING = new Set(['incomplete', 'incomplete_expired', 'paused', 'unpaid']);
const payingAt = (sub, t) => {
    if (NEVER_PAYING.has(sub.status)) return false;
    const start = (sub.start_date || sub.created) * 1000;
    const trialEnd = sub.trial_end ? sub.trial_end * 1000 : 0;
    const ended = Math.min(sub.ended_at ? sub.ended_at * 1000 : Infinity, sub.canceled_at ? sub.canceled_at * 1000 : Infinity);
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

// ---------- Discounts ----------
// Stripe reports MRR net of ongoing coupons (forever or repeating) but not
// one-off ones: a "once" coupon like the yearly deal only lowers the first
// invoice, so that subscription still counts at its full price. The latest
// regular invoice shows what the current period cost after each discount;
// without one, fall back to the coupons still attached. Each subscription is
// rounded to whole cents, as Stripe does.

const SUBSCRIPTION_INVOICES = new Set(['subscription_create', 'subscription_cycle']);

const couponOf = (discount) => (discount && typeof discount === 'object' ? discount.coupon || discount.source?.coupon || null : null);

const attachedDiscounts = (sub) => {
    const list = (sub.discounts || []).filter((d) => d && typeof d === 'object');
    for (const extra of [sub.discount, sub.customer?.discount]) {
        if (extra && typeof extra === 'object' && !list.some((d) => d.id && d.id === extra.id)) list.push(extra);
    }
    return list;
};

const invoiceOf = (sub) => (sub.latest_invoice && typeof sub.latest_invoice === 'object' ? sub.latest_invoice : null);

// Share of the list price the latest regular invoice charged, counting only
// ongoing discounts, or null when there is no regular invoice to read.
const invoiceShare = (invoice) => {
    if (!invoice || !SUBSCRIPTION_INVOICES.has(invoice.billing_reason) || !(invoice.subtotal > 0)) return null;
    const duration = new Map((invoice.discounts || []).filter((d) => d && typeof d === 'object').map((d) => [d.id, couponOf(d)?.duration]));
    const off = (invoice.total_discount_amounts || [])
        .filter((d) => duration.get(typeof d.discount === 'string' ? d.discount : d.discount?.id) !== 'once')
        .reduce((sum, d) => sum + (d.amount || 0), 0);
    return Math.max(0, invoice.subtotal - off) / invoice.subtotal;
};

// Monthly value after discounts, in the smallest currency unit.
const netMonthly = (sub, now = Date.now()) => {
    const list = subscriptionMonthly(sub);
    const share = invoiceShare(invoiceOf(sub));
    if (share !== null) return Math.round(list * share);

    let factor = 1;
    let off = 0;
    const firstItem = sub.items?.data?.[0];
    for (const discount of attachedDiscounts(sub)) {
        const coupon = couponOf(discount);
        if (!coupon || coupon.valid === false || coupon.duration === 'once') continue;
        if (discount.end && discount.end * 1000 <= now) continue;
        if (coupon.percent_off) factor *= 1 - coupon.percent_off / 100;
        else if (coupon.amount_off && firstItem) off += monthlyAmount({ ...firstItem, quantity: 1, price: { ...(firstItem.price || {}), unit_amount: coupon.amount_off } });
    }
    return Math.round(Math.max(0, list * factor - off));
};

// The coupon a subscription was sold with, for the activity feed.
const couponFor = (sub) => {
    const fromInvoice = (invoiceOf(sub)?.discounts || []).map(couponOf).find(Boolean);
    const coupon = fromInvoice || attachedDiscounts(sub).map(couponOf).find(Boolean);
    if (!coupon) return null;
    return {
        id: coupon.id,
        name: coupon.name || coupon.id,
        percentOff: coupon.percent_off || null,
        amountOff: coupon.amount_off || null,
        duration: coupon.duration || null,
    };
};

// ---------- Time zones ----------

const HOUR = 60 * 60 * 1000;

const partsIn = (t, tz) => {
    const parts = {};
    for (const p of new Intl.DateTimeFormat('en-US', {
        timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(t))) parts[p.type] = p.value;
    return parts;
};

// Milliseconds the zone is ahead of UTC at time t.
const offsetAt = (t, tz) => {
    const p = partsIn(t, tz);
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - Math.floor(t / 1000) * 1000;
};

const dayKeyOf = (t, tz) => {
    const p = partsIn(t, tz);
    return `${p.year}-${p.month}-${p.day}`;
};

const shiftKey = (key, days) => new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

// The instant a local calendar day starts.
const dayStart = (key, tz) => {
    const guess = Date.parse(`${key}T00:00:00Z`);
    const first = guess - offsetAt(guess, tz);
    return guess - offsetAt(first, tz);
};

const parseTimeZone = (value) => {
    if (typeof value !== 'string' || !value || value.length > 64) return 'UTC';
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value });
        return value;
    } catch {
        return 'UTC';
    }
};

// ---------- Summary ----------

const summarize = (subs, charges, { days, now, users, tz = 'UTC' }) => {
    const from = now - days * DAY;
    const prevFrom = now - 2 * days * DAY;
    const sec = (ms) => ms / 1000;

    const live = subs.filter((sub) => ['active', 'past_due', 'trialing'].includes(sub.status));
    const paying = live.filter((sub) => sub.status !== 'trialing');
    const currency = (paying[0] || live[0] || charges[0])?.currency || 'usd';

    const value = new Map(subs.map((sub) => [sub, netMonthly(sub, now)]));
    const mrrAt = (t) => subs.reduce((sum, sub) => (payingAt(sub, t) ? sum + value.get(sub) : sum), 0);

    const counted = subs.filter((sub) => payingAt(sub, now));
    const plans = new Map();
    for (const sub of counted) {
        const items = sub.items?.data || [];
        const list = subscriptionMonthly(sub);
        for (const item of items) {
            const { name, interval } = planOf(item);
            const key = `${name} ${interval}`;
            const row = plans.get(key) || { plan: name, interval, count: 0, mrr: 0, discounted: 0 };
            const itemList = monthlyAmount(item);
            const itemNet = list ? (value.get(sub) * itemList) / list : 0;
            row.count += 1;
            row.mrr += itemNet;
            if (itemNet < itemList - 0.5) row.discounted += 1;
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
        mrr: mrrAt(t),
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
    // Gross volume is what Stripe's dashboard shows: successful payments before refunds.
    const gross = (a, b) => paid.reduce((sum, c) => (inWindow(c, a, b) ? sum + c.amount : sum), 0);

    const userOf = (customer) => users.get(typeof customer === 'string' ? customer : customer?.id) || null;
    const who = (customer, fallbackEmail) => {
        const user = userOf(customer);
        if (user) return { userId: user.userId, name: user.name, email: user.email };
        const expanded = customer && typeof customer === 'object' ? customer : {};
        return { name: expanded.name || null, email: expanded.email || fallbackEmail || null };
    };
    const customerId = (customer) => (typeof customer === 'string' ? customer : customer?.id);

    // Today against yesterday, hour by hour, in the admin's time zone.
    const todayKey = dayKeyOf(now, tz);
    const todayStart = dayStart(todayKey, tz);
    const yesterdayStart = dayStart(shiftKey(todayKey, -1), tz);
    const hourly = (start, hours) => {
        const buckets = new Array(hours).fill(0);
        for (const c of paid) {
            const i = Math.floor((c.created * 1000 - start) / HOUR);
            if (i >= 0 && i < hours) buckets[i] += c.amount;
        }
        let running = 0;
        return buckets.map((v) => (running += v));
    };
    const elapsedHours = Math.min(24, Math.floor((now - todayStart) / HOUR) + 1);
    const today = {
        date: todayKey,
        gross: gross(todayStart, now + 1),
        yesterday: gross(yesterdayStart, todayStart),
        yesterdaySoFar: gross(yesterdayStart, yesterdayStart + (now - todayStart)),
        hourly: hourly(todayStart, elapsedHours),
        yesterdayHourly: hourly(yesterdayStart, Math.max(1, Math.round((todayStart - yesterdayStart) / HOUR))),
        newSubscriptions: subs.filter((sub) => sub.created * 1000 >= todayStart).length,
    };

    // One row per local day in the range, with the matching day of the previous
    // period alongside so the charts can draw Stripe's dashed comparison line.
    const dayRow = (key) => {
        const start = dayStart(key, tz);
        const end = dayStart(shiftKey(key, 1), tz);
        return {
            date: key,
            gross: gross(start, end),
            mrr: mrrAt(Math.min(end - 1, now)),
            newSubscriptions: subs.filter((sub) => createdIn(sub, start, end)).length,
        };
    };
    const daily = [];
    for (let key = dayKeyOf(from + 1, tz); key <= todayKey; key = shiftKey(key, 1)) {
        const row = dayRow(key);
        const prev = dayRow(shiftKey(key, -days));
        daily.push({ ...row, prevDate: prev.date, prevGross: prev.gross, prevMrr: prev.mrr });
    }

    // How MRR moved over the range.
    const mrr = mrrAt(now);
    const mrrFrom = mrrAt(from);
    const startedPaying = subs.filter((sub) => payingAt(sub, now) && !payingAt(sub, from));
    const stoppedPaying = subs.filter((sub) => payingAt(sub, from) && !payingAt(sub, now));
    const movement = {
        from: mrrFrom,
        to: mrr,
        newMrr: startedPaying.reduce((sum, sub) => sum + value.get(sub), 0),
        newCount: startedPaying.length,
        churnedMrr: stoppedPaying.reduce((sum, sub) => sum + value.get(sub), 0),
        churnedCount: stoppedPaying.length,
    };
    movement.otherMrr = mrr - mrrFrom - movement.newMrr + movement.churnedMrr;

    // New subscriptions, cancellations and scheduled cancellations as events.
    const firstPayment = (sub) => {
        const invoice = invoiceOf(sub);
        if (invoice?.billing_reason === 'subscription_create') return invoice.amount_paid ?? invoice.total ?? null;
        const charge = paid
            .filter((c) => c.invoice && customerId(c.customer) === customerId(sub.customer) && c.created >= sub.created - 60)
            .sort((a, b) => a.created - b.created)[0];
        return charge ? charge.amount : null;
    };
    const describe = (sub) => {
        const item = sub.items?.data?.[0];
        const plan = item ? planOf(item) : { name: 'Other', interval: 'monthly' };
        const price = item?.price || {};
        return {
            subscriptionId: sub.id,
            plan: plan.name,
            interval: plan.interval,
            listPrice: (price.unit_amount ?? 0) * (item?.quantity || 1),
            monthly: value.get(sub),
            listMonthly: subscriptionMonthly(sub),
            currency: sub.currency || currency,
            ...who(sub.customer),
        };
    };
    const events = [];
    for (const sub of subs) {
        if (createdIn(sub, from, now + 1)) {
            const trial = !!sub.trial_end && sub.trial_end * 1000 > sub.created * 1000 + 60000;
            events.push({
                type: trial ? 'trial' : 'new',
                at: new Date(sub.created * 1000),
                status: sub.status,
                coupon: couponFor(sub),
                paid: trial ? 0 : firstPayment(sub),
                ...describe(sub),
            });
        }
        if (canceledIn(sub, from, now + 1)) {
            events.push({ type: 'cancelled', at: new Date(sub.ended_at * 1000), ...describe(sub) });
        } else if (sub.cancel_at_period_end && sub.status !== 'canceled' && sub.canceled_at && sub.canceled_at * 1000 >= from) {
            const ends = sub.cancel_at || sub.current_period_end || sub.items?.data?.[0]?.current_period_end;
            events.push({ type: 'cancelling', at: new Date(sub.canceled_at * 1000), endsAt: ends ? new Date(ends * 1000) : null, ...describe(sub) });
        }
    }
    events.sort((a, b) => b.at - a.at);

    return {
        available: true,
        currency,
        tz,
        mrr,
        mrrList: counted.reduce((sum, sub) => sum + Math.round(subscriptionMonthly(sub)), 0),
        // What the subscriptions set to cancel were worth; already left out of MRR.
        mrrCancelling: paying.filter((sub) => sub.cancel_at_period_end).reduce((sum, sub) => sum + value.get(sub), 0),
        // Every subscription in today's MRR, so it can be checked line by line
        // against Stripe's subscription list.
        mrrBreakdown: counted
            .map((sub) => ({
                status: sub.status,
                cancelAtPeriodEnd: !!sub.cancel_at_period_end,
                since: new Date(sub.created * 1000),
                coupon: couponFor(sub),
                ...describe(sub),
            }))
            .sort((a, b) => b.monthly - a.monthly),
        movement,
        today,
        daily,
        events: events.slice(0, 60),
        subscribers: {
            paying: paying.length,
            inMrr: counted.length,
            trialing: live.length - paying.length,
            pastDue: live.filter((sub) => sub.status === 'past_due').length,
            cancelling: live.filter((sub) => sub.cancel_at_period_end).length,
            discounted: counted.filter((sub) => value.get(sub) < subscriptionMonthly(sub) - 0.5).length,
            newInRange: subs.filter((sub) => createdIn(sub, from, now)).length,
            newPrev: subs.filter((sub) => createdIn(sub, prevFrom, from)).length,
            cancelledInRange: subs.filter((sub) => canceledIn(sub, from, now)).length,
            cancelledPrev: subs.filter((sub) => canceledIn(sub, prevFrom, from)).length,
        },
        plans: [...plans.values()].sort((a, b) => b.mrr - a.mrr),
        mrrHistory,
        revenue: { current: revenue(from, now), prev: revenue(prevFrom, from), gross: gross(from, now), grossPrev: gross(prevFrom, from) },
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
    };
};

const buildRevenue = async (db, { days, tz = 'UTC' }) => {
    const stripe = getStripe();
    if (!stripe) return { available: false, reason: 'Stripe is not configured on this server' };

    const now = Date.now();
    const chargesSince = Math.floor((now - Math.max(2 * days, 60) * DAY) / 1000);
    const [subs, charges] = await Promise.all([
        listAll(stripe.subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer', 'data.discounts', 'data.latest_invoice.discounts'] }), MAX_SUBSCRIPTIONS),
        listAll(stripe.charges.list({ created: { gte: chargesSince }, limit: 100, expand: ['data.customer'] }), MAX_CHARGES),
    ]);

    const customerIds = [...new Set([...subs, ...charges].map((row) => (typeof row.customer === 'string' ? row.customer : row.customer?.id)).filter(Boolean))];
    const users = await db.collection('users')
        .find({ 'subscription.customerId': { $in: customerIds } }, { projection: { _id: 0, userId: 1, name: 1, email: 1, 'subscription.customerId': 1 } })
        .toArray();

    return summarize(subs, charges, {
        days,
        now,
        tz,
        users: new Map(users.map((u) => [u.subscription.customerId, u])),
    });
};

const revenueCache = createTtlCache(5 * 60 * 1000);

const getRevenue = async (req, res) => {
    const days = RANGE_DAYS.includes(parseInt(req.query.days, 10)) ? parseInt(req.query.days, 10) : 30;
    const tz = parseTimeZone(req.query.tz);
    try {
        const { value, cachedAt } = await revenueCache.get(`${days}:${tz}`, () => buildRevenue(getDb(), { days, tz }), { fresh: req.query.fresh === '1' });
        res.json({ success: true, cachedAt: new Date(cachedAt), ...value });
    } catch (error) {
        console.error('Admin revenue failed:', error);
        res.json({ success: true, available: false, reason: 'Could not reach Stripe' });
    }
};

module.exports = { getRevenue, buildRevenue, summarize, monthlyAmount, netMonthly, dayStart };
