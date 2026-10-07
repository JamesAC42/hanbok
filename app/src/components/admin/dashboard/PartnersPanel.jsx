'use client';
import { useState } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';
import useAdminData from './useAdminData';
import { SectionError, PanelSkeleton } from './OverviewPanel';
import { fmt, fmtDate, fmtMoney } from './format';

// Creator affiliates: who they are, what their links brought in, what we owe
// them. Payouts are sent by hand (PayPal or Wise) and recorded here.
export default function PartnersPanel({ onForbidden }) {
    const { data, error, loading, reload } = useAdminData('/api/admin/affiliates', { onForbidden });
    const [form, setForm] = useState({ code: '', name: '', email: '' });
    const [note, setNote] = useState(null);
    const [busy, setBusy] = useState(false);

    const post = async (url, body) => {
        setBusy(true);
        setNote(null);
        try {
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || 'Something went wrong');
            reload(true);
            return json;
        } catch (err) {
            setNote(err.message);
            return null;
        } finally {
            setBusy(false);
        }
    };

    const create = async (e) => {
        e.preventDefault();
        const json = await post('/api/admin/affiliates', form);
        if (json) {
            setForm({ code: '', name: '', email: '' });
            setNote(`Added ${json.affiliate.name}. Send them their link and stats page below.`);
        }
    };

    const payout = async (a) => {
        const dollars = window.prompt(`How much did you pay ${a.name}? (USD)`, ((a.stats?.owed || 0) / 100).toFixed(2));
        if (!dollars) return;
        const amount = Math.round(parseFloat(dollars) * 100);
        if (!(amount > 0)) return setNote('Enter an amount above zero.');
        const memo = window.prompt('Note (optional, e.g. "PayPal Oct")', '') || '';
        if (await post(`/api/admin/affiliates/${a.code}/payouts`, { amount, note: memo })) {
            setNote(`Recorded ${fmtMoney(amount, 'usd', { exact: true })} to ${a.name}.`);
        }
    };

    if (!data) return error ? <SectionError error={error} onRetry={reload} /> : <PanelSkeleton />;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hanbokstudy.com';

    return (
        <div className={`${styles.panel} ${loading ? styles.stale : ''}`}>
            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Partners</h2>
                        <p>Creators earn 30% of what their referrals pay in the first 12 months. Program page: <a href="/partners" target="_blank" rel="noreferrer">/partners</a></p>
                    </div>
                </header>

                <form className={styles.toolbar} onSubmit={create}>
                    <input className={styles.input} placeholder="Code (their handle)" value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })} aria-label="Code" required />
                    <input className={styles.input} placeholder="Name" value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Name" required />
                    <input className={styles.input} placeholder="Payout email" type="email" value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Payout email" />
                    <button type="submit" className={styles.ghostButton} disabled={busy}>Add partner</button>
                </form>
                {note && <p className={styles.muted} role="status">{note}</p>}

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr><th>Partner</th><th>Sign-ups</th><th>Paying</th><th>Earned</th><th>Owed</th><th>Links</th><th></th></tr>
                        </thead>
                        <tbody>
                            {data.affiliates.map((a) => (
                                <tr key={a.code}>
                                    <td><strong>{a.name}</strong><span className={styles.muted}>{a.code} · {a.email || 'no email'} · since {fmtDate(a.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</span></td>
                                    <td>{fmt(a.stats.signups)}</td>
                                    <td>{fmt(a.stats.paying)}</td>
                                    <td>{a.stats.stripe ? fmtMoney(a.stats.earned, 'usd', { exact: true }) : '–'}</td>
                                    <td><strong>{a.stats.stripe ? fmtMoney(a.stats.owed, 'usd', { exact: true }) : '–'}</strong></td>
                                    <td>
                                        <span className={styles.muted}>{`${origin}/?ref=${a.code}`}</span>
                                        <span className={styles.muted}>{`${origin}/partners/stats?token=${a.statsToken}`}</span>
                                    </td>
                                    <td><button type="button" className={styles.ghostButton} disabled={busy} onClick={() => payout(a)}>Record payout</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!data.affiliates.length && <p className={styles.empty}>No partners yet. Add the first one above.</p>}
                </div>
            </section>
        </div>
    );
}
