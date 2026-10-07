'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ContentPage from '@/components/ContentPage';
import Mascot from '@/components/Mascot';
import styles from '@/styles/pages/partners.module.scss';

const money = (cents) => `$${((cents || 0) / 100).toFixed(2)}`;

// A creator's private page: opened from the link we send them (?token=...).
function Stats() {
    const token = useSearchParams().get('token') || '';
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('This link is missing its key. Use the stats link we emailed you.');
            return;
        }
        fetch(`/api/partners/stats?token=${encodeURIComponent(token)}`)
            .then((res) => res.json())
            .then((json) => (json.success ? setData(json) : setError('We couldn\'t find stats for this link.')))
            .catch(() => setError('Stats are unavailable right now. Try again in a minute.'));
    }, [token]);

    if (error) return <p className={styles.lead}>{error}</p>;
    if (!data) return <p className={styles.lead}>Loading your numbers…</p>;

    const { affiliate, stats } = data;
    const link = `https://hanbokstudy.com/?ref=${affiliate.code}`;
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Copy your link', link);
        }
    };

    return (
        <>
            <header className={styles.hero}>
                <Mascot pose="wave" size={100} />
                <div>
                    <p className={styles.label}>Partner stats</p>
                    <h1 className={styles.title}>Hi {affiliate.name}</h1>
                    <p className={styles.lead}>
                        You earn {Math.round(affiliate.rate * 100)}% of what your referrals pay in their first {affiliate.months} months.
                    </p>
                    <div className={styles.linkRow}>
                        <code>{link}</code>
                        <button type="button" className={styles.copyButton} onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
                    </div>
                </div>
            </header>

            <div className={styles.tiles}>
                <div className={styles.tile}><span>Sign-ups</span><strong>{stats.signups}</strong></div>
                <div className={styles.tile}><span>Paying now</span><strong>{stats.paying}</strong></div>
                <div className={styles.tile}><span>Earned</span><strong>{stats.stripe ? money(stats.earned) : '—'}</strong></div>
                <div className={styles.tile}><span>Owed to you</span><strong>{stats.stripe ? money(stats.owed) : '—'}</strong></div>
            </div>

            {affiliate.payouts.length > 0 && (
                <section className={styles.faq}>
                    <h2>Payouts</h2>
                    {affiliate.payouts.slice().reverse().map((p) => (
                        <p key={p.at}>{new Date(p.at).toLocaleDateString()}: {money(p.amount)}{p.note ? ` (${p.note})` : ''}</p>
                    ))}
                </section>
            )}
            <p className={styles.footnote}>Numbers update every few minutes. Questions? Email admin@hanbokstudy.com.</p>
        </>
    );
}

export default function PartnerStats() {
    return (
        <ContentPage>
            <div className={styles.page}>
                <Suspense fallback={null}><Stats /></Suspense>
            </div>
        </ContentPage>
    );
}
