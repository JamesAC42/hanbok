'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import Dashboard from '@/components/Dashboard';
import Mascot from '@/components/Mascot';
import styles from '@/styles/components/admin/dashboard.module.scss';
import OverviewPanel from '@/components/admin/dashboard/OverviewPanel';
import LearnersPanel from '@/components/admin/dashboard/LearnersPanel';
import MoneyPanel from '@/components/admin/dashboard/MoneyPanel';
import UsersPanel from '@/components/admin/dashboard/UsersPanel';
import VisitorsPanel from '@/components/admin/dashboard/VisitorsPanel';
import ToolsPanel from '@/components/admin/dashboard/ToolsPanel';
import UserDrawer from '@/components/admin/dashboard/UserDrawer';
import { RANGES, timeAgo } from '@/components/admin/dashboard/format';

const TABS = [
    { key: 'overview', label: 'Overview', color: 'var(--bp-read)' },
    { key: 'learners', label: 'Learners', color: 'var(--bp-und)' },
    { key: 'money', label: 'Money', color: 'var(--bp-purple)' },
    { key: 'users', label: 'Users', color: 'var(--bp-keep)' },
    { key: 'visitors', label: 'Visitors', color: 'var(--bp-gray)' },
    { key: 'tools', label: 'Tools', color: 'var(--bp-rev)' },
];
const RANGED = ['overview', 'learners', 'money', 'visitors'];

const readTab = () => {
    if (typeof window === 'undefined') return 'overview';
    const tab = new URLSearchParams(window.location.search).get('tab');
    return TABS.some((t) => t.key === tab) ? tab : 'overview';
};

const readDays = () => {
    try {
        const days = parseInt(window.localStorage.getItem('adminRangeDays'), 10);
        return RANGES.some((r) => r.days === days) ? days : 30;
    } catch {
        return 30;
    }
};

export default function Admin() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { isAdmin, loading: adminLoading } = useAdmin();
    const [tab, setTab] = useState('overview');
    const [visited, setVisited] = useState(() => new Set(['overview']));
    const [days, setDays] = useState(30);
    const [tz, setTz] = useState('UTC');
    const [refreshKey, setRefreshKey] = useState(0);
    const [updatedAt, setUpdatedAt] = useState(null);
    const [openUser, setOpenUser] = useState(null);
    const [usersVersion, setUsersVersion] = useState(0);
    const [, setTick] = useState(0);

    useEffect(() => {
        const initial = readTab();
        setTab(initial);
        setVisited(new Set([initial]));
        setDays(readDays());
        try {
            setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
        } catch { /* keep UTC */ }
    }, []);

    useEffect(() => {
        if (authLoading || adminLoading) return;
        if (!isAuthenticated) router.replace('/login');
        else if (!isAdmin(user?.email)) router.replace('/');
    }, [authLoading, adminLoading, isAuthenticated, isAdmin, user, router]);

    // Keep "updated 3m ago" honest.
    useEffect(() => {
        const timer = setInterval(() => setTick((n) => n + 1), 30000);
        return () => clearInterval(timer);
    }, []);

    const goTab = useCallback((key) => {
        setTab(key);
        setVisited((prev) => (prev.has(key) ? prev : new Set([...prev, key])));
        const url = new URL(window.location.href);
        if (key === 'overview') url.searchParams.delete('tab'); else url.searchParams.set('tab', key);
        window.history.replaceState(null, '', url);
    }, []);

    const chooseDays = (value) => {
        setDays(value);
        try { window.localStorage.setItem('adminRangeDays', String(value)); } catch { /* fine */ }
    };

    const onForbidden = useCallback(() => router.replace('/'), [router]);
    const onLoaded = useCallback((at) => setUpdatedAt(at), []);

    if (authLoading || adminLoading || !isAuthenticated || !isAdmin(user?.email)) return null;

    const panelProps = { days, tz, refreshKey, onForbidden, onLoaded, onOpenUser: setOpenUser, onGoTab: goTab };

    return (
        <Dashboard>
            <div className={styles.page}>
                <header className={styles.pageHead}>
                    <div className={styles.titleBlock}>
                        <Mascot pose="head" size={46} label="" />
                        <div>
                            <h1 className={styles.pageTitle}>Admin</h1>
                            <p className={styles.updated}>
                                {updatedAt && `Numbers from ${timeAgo(updatedAt)}`}
                                <button type="button" className={styles.linkButton} onClick={() => setRefreshKey((n) => n + 1)}>Refresh</button>
                            </p>
                        </div>
                    </div>
                    {RANGED.includes(tab) && (
                        <div className={styles.segmented} role="group" aria-label="Time range">
                            {RANGES.map((r) => (
                                <button key={r.days} type="button" aria-pressed={days === r.days}
                                    className={days === r.days ? styles.segOn : ''} onClick={() => chooseDays(r.days)}>
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    )}
                </header>

                <nav className={styles.tabs} role="tablist" aria-label="Admin sections">
                    {TABS.map((t) => (
                        <button key={t.key} type="button" role="tab" aria-selected={tab === t.key}
                            className={`${styles.tab} ${tab === t.key ? styles.tabOn : ''}`}
                            style={{ '--tab': t.color }} onClick={() => goTab(t.key)}>
                            {t.label}
                        </button>
                    ))}
                </nav>

                {/* Panels stay mounted once opened, so switching back is instant. */}
                {visited.has('overview') && <div hidden={tab !== 'overview'}><OverviewPanel {...panelProps} /></div>}
                {visited.has('learners') && <div hidden={tab !== 'learners'}><LearnersPanel {...panelProps} /></div>}
                {visited.has('money') && <div hidden={tab !== 'money'}><MoneyPanel {...panelProps} /></div>}
                {visited.has('users') && <div hidden={tab !== 'users'}><UsersPanel {...panelProps} usersVersion={usersVersion} /></div>}
                {visited.has('visitors') && <div hidden={tab !== 'visitors'}><VisitorsPanel {...panelProps} /></div>}
                {visited.has('tools') && <div hidden={tab !== 'tools'}><ToolsPanel /></div>}
            </div>

            {openUser !== null && (
                <UserDrawer
                    key={openUser}
                    userId={openUser}
                    onClose={() => setOpenUser(null)}
                    onForbidden={onForbidden}
                    onUserUpdated={() => setUsersVersion((n) => n + 1)}
                />
            )}
        </Dashboard>
    );
}
