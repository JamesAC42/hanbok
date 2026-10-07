// Creator affiliates: admin management, payouts, and each creator's own stats
// page. Earnings are read from Stripe invoices of the accounts each creator
// referred, so they always match what was actually billed.
const { getDb } = require('../database');
const { createTtlCache } = require('../lib/ttlCache');
const { DEFAULT_RATE, DEFAULT_MONTHS, normalizeCode, newStatsToken, commissionForInvoices } = require('../lib/affiliates');

const statsCache = createTtlCache(10 * 60 * 1000);

let stripeClient;
const getStripe = () => {
    if (stripeClient === undefined) {
        const key = process.env.STRIPE_ANALYTICS_KEY || process.env.STRIPE_SECRET_KEY;
        stripeClient = key ? require('stripe')(key) : null;
    }
    return stripeClient;
};

const paidInvoices = async (stripe, customerId) => {
    const invoices = [];
    for await (const invoice of stripe.invoices.list({ customer: customerId, status: 'paid', limit: 100 })) {
        invoices.push(invoice);
        if (invoices.length >= 200) break;
    }
    return invoices;
};

const computeStats = async (affiliate) => {
    const db = getDb();
    const referred = await db.collection('users')
        .find({ 'attribution.ref': affiliate.code }, { projection: { userId: 1, tier: 1, dateCreated: 1, 'subscription.customerId': 1 } })
        .toArray();

    const stats = {
        signups: referred.length,
        paying: referred.filter((u) => u.tier > 0).length,
        customers: 0,
        revenue: 0,
        earned: 0,
        stripe: false,
    };

    const stripe = getStripe();
    const customers = [...new Set(referred.map((u) => u.subscription?.customerId).filter(Boolean))];
    if (stripe) {
        stats.stripe = true;
        for (const customerId of customers) {
            const result = commissionForInvoices(await paidInvoices(stripe, customerId), affiliate);
            if (result.revenue > 0) stats.customers += 1;
            stats.revenue += result.revenue;
            stats.earned += result.commission;
        }
    }

    const paidOut = (affiliate.payouts || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    return { ...stats, paidOut, owed: Math.max(0, stats.earned - paidOut) };
};

const statsFor = (affiliate, fresh) => statsCache.get(affiliate.code, () => computeStats(affiliate), { fresh });

const publicFields = (a) => ({
    code: a.code,
    name: a.name,
    rate: a.rate,
    months: a.months,
    createdAt: a.createdAt,
    payouts: (a.payouts || []).map(({ amount, note, at }) => ({ amount, note, at })),
});

// GET /api/admin/affiliates
const listAffiliates = async (req, res) => {
    try {
        const fresh = req.query.fresh === '1';
        const affiliates = await getDb().collection('affiliates').find({}).sort({ createdAt: -1 }).toArray();
        const rows = [];
        for (const a of affiliates) {
            const { value } = await statsFor(a, fresh);
            rows.push({ ...publicFields(a), email: a.email, statsToken: a.statsToken, stats: value });
        }
        res.json({ success: true, affiliates: rows });
    } catch (error) {
        console.error('Error listing affiliates:', error);
        res.status(500).json({ success: false, error: 'Failed to load affiliates' });
    }
};

// POST /api/admin/affiliates  { code, name, email, rate?, months? }
const createAffiliate = async (req, res) => {
    const code = normalizeCode(req.body?.code);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 80) : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 200) : '';
    const rate = Number(req.body?.rate ?? DEFAULT_RATE);
    const months = parseInt(req.body?.months ?? DEFAULT_MONTHS, 10);

    if (!code) return res.status(400).json({ success: false, error: 'Code must be 2-30 letters, numbers, - or _' });
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });
    if (!(rate > 0 && rate <= 0.9)) return res.status(400).json({ success: false, error: 'Rate must be between 0 and 0.9' });
    if (!(months > 0 && months <= 120)) return res.status(400).json({ success: false, error: 'Months must be between 1 and 120' });

    try {
        const affiliates = getDb().collection('affiliates');
        if (await affiliates.findOne({ code })) {
            return res.status(409).json({ success: false, error: 'That code is taken' });
        }
        const affiliate = { code, name, email, rate, months, statsToken: newStatsToken(), payouts: [], createdAt: new Date() };
        await affiliates.insertOne(affiliate);
        res.status(201).json({ success: true, affiliate: { ...publicFields(affiliate), email, statsToken: affiliate.statsToken } });
    } catch (error) {
        console.error('Error creating affiliate:', error);
        res.status(500).json({ success: false, error: 'Failed to create affiliate' });
    }
};

// POST /api/admin/affiliates/:code/payouts  { amount (cents), note }
const recordPayout = async (req, res) => {
    const code = normalizeCode(req.params.code);
    const amount = parseInt(req.body?.amount, 10);
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 200) : '';
    if (!code || !(amount > 0)) return res.status(400).json({ success: false, error: 'A positive amount in cents is required' });

    try {
        const result = await getDb().collection('affiliates').updateOne(
            { code },
            { $push: { payouts: { amount, note, at: new Date() } } }
        );
        if (!result.matchedCount) return res.status(404).json({ success: false, error: 'No such affiliate' });
        statsCache.clear();
        res.json({ success: true });
    } catch (error) {
        console.error('Error recording payout:', error);
        res.status(500).json({ success: false, error: 'Failed to record payout' });
    }
};

// GET /api/partners/stats?token=...  A creator's own numbers, no user details.
const getPartnerStats = async (req, res) => {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (token.length < 16) return res.status(404).json({ success: false, error: 'Not found' });
    try {
        const affiliate = await getDb().collection('affiliates').findOne({ statsToken: token });
        if (!affiliate) return res.status(404).json({ success: false, error: 'Not found' });
        const { value, cachedAt } = await statsFor(affiliate, false);
        res.json({ success: true, affiliate: publicFields(affiliate), stats: value, cachedAt });
    } catch (error) {
        console.error('Error loading partner stats:', error);
        res.status(500).json({ success: false, error: 'Failed to load stats' });
    }
};

module.exports = { listAffiliates, createAffiliate, recordPayout, getPartnerStats };
