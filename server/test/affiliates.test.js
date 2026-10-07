const test = require('node:test');
const assert = require('node:assert');
const { normalizeCode, newStatsToken, commissionForInvoices } = require('../lib/affiliates');
const { sanitizeAttribution } = require('../utils/attribution');

const at = (iso) => Math.floor(new Date(iso).getTime() / 1000);

test('normalizes affiliate codes', () => {
    assert.strictEqual(normalizeCode(' KoreanWithMina '), 'koreanwithmina');
    assert.strictEqual(normalizeCode('mina_kr-2'), 'mina_kr-2');
    assert.strictEqual(normalizeCode('a'), null);
    assert.strictEqual(normalizeCode('has space'), null);
    assert.strictEqual(normalizeCode('-leading'), null);
    assert.strictEqual(normalizeCode(42), null);
});

test('stats tokens are long and unique', () => {
    const a = newStatsToken();
    assert.ok(a.length >= 20);
    assert.notStrictEqual(a, newStatsToken());
});

test('commission covers invoices within the window from the first payment', () => {
    const invoices = [
        { amount_paid: 400, created: at('2026-02-01') },
        { amount_paid: 400, created: at('2026-01-01') },
        { amount_paid: 0, created: at('2026-03-01') },
        { amount_paid: 400, created: at('2026-12-31') },
        { amount_paid: 400, created: at('2027-01-02') },
    ];
    const result = commissionForInvoices(invoices, { rate: 0.3, months: 12 });
    assert.strictEqual(result.revenue, 1200);
    assert.strictEqual(result.commission, 360);
    assert.strictEqual(result.firstPaidAt.toISOString(), '2026-01-01T00:00:00.000Z');
});

test('no paid invoices means no commission', () => {
    assert.deepStrictEqual(commissionForInvoices([], {}), { revenue: 0, commission: 0, firstPaidAt: null });
});

test('signup attribution keeps a valid ref code', () => {
    assert.strictEqual(sanitizeAttribution({ ref: 'MinaKR' }).ref, 'minakr');
    assert.strictEqual(sanitizeAttribution({ ref: 'bad code!', utm_source: 'tiktok' }).ref, undefined);
});
