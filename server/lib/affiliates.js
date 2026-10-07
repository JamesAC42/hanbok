// Creator affiliate program: pure helpers (codes, tokens, commission maths).
// Creators share hanbokstudy.com/?ref=<code>; the code is stored on the account
// at signup (attribution.ref) and earns a share of that account's paid invoices.
const crypto = require('crypto');

const DEFAULT_RATE = 0.3;
const DEFAULT_MONTHS = 12;
const CODE_PATTERN = /^[a-z0-9][a-z0-9_-]{1,29}$/;

const normalizeCode = (raw) => {
    if (typeof raw !== 'string') return null;
    const code = raw.trim().toLowerCase();
    return CODE_PATTERN.test(code) ? code : null;
};

// Secret for a creator's own stats page; the code itself is public.
const newStatsToken = () => crypto.randomBytes(18).toString('base64url');

// Commission on a referred customer's paid invoices: `rate` of every invoice
// paid within `months` of their first paid invoice. Amounts are in cents.
const commissionForInvoices = (invoices, { rate = DEFAULT_RATE, months = DEFAULT_MONTHS } = {}) => {
    const paid = (invoices || [])
        .filter((inv) => inv && inv.amount_paid > 0 && inv.created)
        .sort((a, b) => a.created - b.created);
    if (!paid.length) return { revenue: 0, commission: 0, firstPaidAt: null };

    const first = new Date(paid[0].created * 1000);
    const end = new Date(first);
    end.setMonth(end.getMonth() + months);

    const revenue = paid
        .filter((inv) => new Date(inv.created * 1000) < end)
        .reduce((sum, inv) => sum + inv.amount_paid, 0);
    return { revenue, commission: Math.round(revenue * rate), firstPaidAt: first };
};

module.exports = { DEFAULT_RATE, DEFAULT_MONTHS, normalizeCode, newStatsToken, commissionForInvoices };
