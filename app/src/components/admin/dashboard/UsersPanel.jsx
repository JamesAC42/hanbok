'use client';
import { useEffect, useState } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';
import useAdminData from './useAdminData';
import { SectionError } from './OverviewPanel';
import { fmt, fmtDate, sourceLabel, TIERS } from './format';

const SORTS = [
    ['dateCreated', 'Newest'],
    ['name', 'Name'],
    ['tier', 'Plan'],
];

export default function UsersPanel({ refreshKey, onForbidden, onOpenUser, usersVersion }) {
    const [query, setQuery] = useState('');
    const [search, setSearch] = useState('');
    const [tier, setTier] = useState('');
    const [sortBy, setSortBy] = useState('dateCreated');
    const [page, setPage] = useState(1);

    // Search after the person stops typing.
    useEffect(() => {
        const timer = setTimeout(() => { setSearch(query.trim()); setPage(1); }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const params = new URLSearchParams({
        page, limit: 25, sortBy, sortOrder: sortBy === 'name' ? 'asc' : 'desc',
        ...(search && { search }),
        ...(tier !== '' && { tier }),
        v: usersVersion || 0,
    });
    const { data, error, loading, reload } = useAdminData(`/api/admin/users?${params}`, { onForbidden });

    useEffect(() => {
        if (refreshKey) reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    const totals = Object.fromEntries((data?.summaryStats || []).map((s) => [s._id, s.count]));
    const allUsers = Object.values(totals).reduce((a, b) => a + b, 0);
    const totalPages = data?.pagination?.totalPages || 1;

    return (
        <div className={styles.panel}>
            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Users</h2>
                        <p>{fmt(allUsers)} accounts. Click anyone to see their activity or change their plan.</p>
                    </div>
                </header>

                <div className={styles.toolbar}>
                    <input
                        type="search"
                        className={styles.input}
                        placeholder="Search by name or email"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search users"
                    />
                    <div className={styles.segmented} role="group" aria-label="Plan">
                        {[['', 'All', allUsers], ['0', 'Free', totals[0]], ['1', 'Basic', totals[1]], ['2', 'Plus', totals[2]]].map(([value, label, count]) => (
                            <button key={label} type="button" aria-pressed={tier === value}
                                className={tier === value ? styles.segOn : ''} onClick={() => { setTier(value); setPage(1); }}>
                                {label}{count !== undefined && <span className={styles.segCount}>{fmt(count)}</span>}
                            </button>
                        ))}
                    </div>
                    <label className={styles.inlineSelect}>
                        <span>Sort</span>
                        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
                            {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </label>
                </div>

                {error && <SectionError error={error} onRetry={reload} />}

                <div className={`${styles.tableWrap} ${loading ? styles.stale : ''}`}>
                    <table className={styles.table}>
                        <thead>
                            <tr><th>Learner</th><th>Plan</th><th>Sign-in</th><th>Came from</th><th>Joined</th></tr>
                        </thead>
                        <tbody>
                            {(data?.users || []).map((u) => (
                                <tr key={u.userId} className={styles.clickRow} tabIndex={0}
                                    onClick={() => onOpenUser(u.userId)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') onOpenUser(u.userId); }}>
                                    <td><strong>{u.name}</strong><span className={styles.muted}>{u.email}</span></td>
                                    <td><span className={`${styles.chip} ${u.tier ? styles.chipPaid : ''}`}>{TIERS[u.tier] || 'Free'}</span></td>
                                    <td>{u.googleId ? 'Google' : u.verified ? 'Email' : 'Email (unverified)'}</td>
                                    <td>{u.attribution?.heardFrom ? sourceLabel(u.attribution.heardFrom) : u.attribution?.utm_source || '–'}</td>
                                    <td>{fmtDate(u.dateCreated, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data && !data.users.length && <p className={styles.empty}>Nobody matches that search.</p>}
                </div>

                <div className={styles.pager}>
                    <button type="button" className={styles.ghostButton} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                    <span>Page {fmt(page)} of {fmt(totalPages)}</span>
                    <button type="button" className={styles.ghostButton} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
            </section>
        </div>
    );
}
