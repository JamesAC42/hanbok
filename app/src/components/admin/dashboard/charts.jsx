'use client';
import { useRef, useState } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';
import { fmt, fmtDate, delta } from './format';

// Rounds an axis maximum up to 1, 2, 2.5 or 5 times a power of ten.
const niceMax = (value) => {
    if (value <= 0) return 1;
    const power = 10 ** Math.floor(Math.log10(value));
    for (const step of [1, 2, 2.5, 5, 10]) {
        if (step * power >= value) return step * power;
    }
    return 10 * power;
};

// Single-series column chart with a hover/keyboard readout. Points are
// { key, value }; key is a date string unless xLabel says otherwise.
export function ColumnChart({ points, label, color = 'var(--bp-read)', format = fmt, xLabel = fmtDate, height = 200 }) {
    const plotRef = useRef(null);
    const [active, setActive] = useState(null);
    const n = points.length;
    const max = niceMax(Math.max(0, ...points.map((p) => p.value)));
    const ticks = [max, max / 2, 0];

    const indexAt = (clientX) => {
        const rect = plotRef.current.getBoundingClientRect();
        return Math.min(n - 1, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * n)));
    };

    const onKeyDown = (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            setActive((i) => {
                const start = i ?? (e.key === 'ArrowRight' ? -1 : n);
                return Math.min(n - 1, Math.max(0, start + (e.key === 'ArrowRight' ? 1 : -1)));
            });
        } else if (e.key === 'Escape') {
            setActive(null);
        }
    };

    const point = active !== null ? points[active] : null;
    const edge = active === null ? '' : active < n * 0.18 ? styles.tipStart : active > n * 0.82 ? styles.tipEnd : '';
    const xTicks = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : points.map((_, i) => i);

    return (
        <figure className={styles.columnChart}>
            <div className={styles.chartFrame}>
                <div className={styles.yAxis} aria-hidden="true">
                    {ticks.map((t) => <span key={t}>{format(t)}</span>)}
                </div>
                <div
                    ref={plotRef}
                    className={styles.plot}
                    style={{ height }}
                    tabIndex={0}
                    role="img"
                    aria-label={`${label}: ${n} points, highest ${format(Math.max(0, ...points.map((p) => p.value)))}. Use the arrow keys to read each value.`}
                    onPointerMove={(e) => setActive(indexAt(e.clientX))}
                    onPointerLeave={() => setActive(null)}
                    onBlur={() => setActive(null)}
                    onKeyDown={onKeyDown}
                >
                    <div className={styles.grid} aria-hidden="true"><i /><i /><i /></div>
                    <div className={styles.bars} style={{ gap: n > 120 ? 0 : n > 45 ? 1 : 3 }}>
                        {points.map((p, i) => (
                            <span key={p.key} className={i === active ? styles.barActive : undefined}>
                                <i style={{ height: p.value ? `max(3px, ${(p.value / max) * 100}%)` : 0, background: color }} />
                            </span>
                        ))}
                    </div>
                    {point && (
                        <div className={`${styles.tip} ${edge}`} style={{ left: `${((active + 0.5) / n) * 100}%` }} aria-live="polite">
                            <strong>{format(point.value)}</strong>
                            <span>{xLabel(point.key)}</span>
                            {point.note && <span>{point.note}</span>}
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.xAxis} aria-hidden="true">
                {xTicks.map((i) => (
                    <span key={i} style={{ left: `${((i + 0.5) / n) * 100}%` }}>{xLabel(points[i].key)}</span>
                ))}
            </div>
            <details className={styles.dataTable}>
                <summary>See the numbers</summary>
                <table>
                    <thead><tr><th>Date</th><th>{label}</th></tr></thead>
                    <tbody>
                        {[...points].reverse().map((p) => (
                            <tr key={p.key}><td>{xLabel(p.key)}</td><td>{format(p.value)}</td></tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </figure>
    );
}

// Horizontal bars, each labelled with its own value.
export function BarList({ rows, format = fmt, color = 'var(--bp-read)', max: forcedMax, empty = 'Nothing yet' }) {
    if (!rows.length) return <p className={styles.empty}>{empty}</p>;
    const max = forcedMax ?? Math.max(1, ...rows.map((r) => r.value));
    return (
        <ul className={styles.barList}>
            {rows.map((row) => (
                <li key={row.key}>
                    <div className={styles.barListHead}>
                        <span className={styles.barListLabel}>{row.label}</span>
                        <span className={styles.barListValue}>
                            {format(row.value)}
                            {row.note && <em>{row.note}</em>}
                        </span>
                    </div>
                    <div className={styles.barTrack}>
                        <i style={{ width: `${Math.max(row.value ? 1.5 : 0, (row.value / max) * 100)}%`, background: row.color || color }} />
                    </div>
                </li>
            ))}
        </ul>
    );
}

export function Delta({ value, prev, invert = false, suffix = 'vs last period' }) {
    const d = delta(value, prev);
    if (!d) return null;
    const good = d.dir === 'flat' ? 'flat' : (d.dir === 'up') !== invert ? 'good' : 'bad';
    return (
        <span className={`${styles.delta} ${styles[`delta_${good}`]}`} title={`Previous period: ${fmt(prev)}`}>
            {d.dir === 'up' ? '▲' : d.dir === 'down' ? '▼' : '•'} {d.text}
            {suffix && <span className={styles.deltaSuffix}> {suffix}</span>}
        </span>
    );
}

export function StatTile({ label, value, children, accent = 'var(--bp-read)', loading }) {
    return (
        <div className={`${styles.tile} ${loading ? styles.stale : ''}`} style={{ '--accent': accent }}>
            <span className={styles.tileLabel}>{label}</span>
            <strong className={styles.tileValue}>{value}</strong>
            {children && <div className={styles.tileFoot}>{children}</div>}
        </div>
    );
}

// Line chart with an optional dashed comparison line, like Stripe's
// "previous period". series: [{ label, values, color, dashed }]; every series
// shares the x positions 0..count-1 and a shorter one simply stops early.
// zeroBase=false zooms the y axis onto the data, for slow-moving lines like MRR.
export function LineChart({ series, count, label, format = fmt, xLabel, height = 180, zeroBase = true }) {
    const plotRef = useRef(null);
    const [active, setActive] = useState(null);
    const n = count ?? Math.max(...series.map((s) => s.values.length));
    const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
    const dataMax = Math.max(0, ...all);
    let lo = 0;
    let hi = niceMax(dataMax);
    if (!zeroBase && all.length) {
        const dataMin = Math.min(...all);
        const pad = Math.max((dataMax - dataMin) * 0.25, dataMax * 0.02, 1);
        lo = Math.max(0, dataMin - pad);
        hi = dataMax + pad;
    }
    const x = (i) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
    const y = (v) => 100 - ((v - lo) / (hi - lo || 1)) * 100;
    const ticks = [hi, (hi + lo) / 2, lo];

    const indexAt = (clientX) => {
        const rect = plotRef.current.getBoundingClientRect();
        return Math.min(n - 1, Math.max(0, Math.round(((clientX - rect.left) / rect.width) * (n - 1))));
    };
    const onKeyDown = (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            setActive((i) => {
                const start = i ?? (e.key === 'ArrowRight' ? -1 : n);
                return Math.min(n - 1, Math.max(0, start + (e.key === 'ArrowRight' ? 1 : -1)));
            });
        } else if (e.key === 'Escape') {
            setActive(null);
        }
    };

    const edge = active === null ? '' : active < n * 0.18 ? styles.tipStart : active > n * 0.82 ? styles.tipEnd : '';
    const xTicks = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : [...Array(n).keys()];
    const shown = active === null ? [] : series.filter((s) => s.values[active] !== undefined);

    return (
        <figure className={styles.columnChart}>
            <div className={styles.chartFrame}>
                <div className={styles.yAxis} aria-hidden="true">
                    {ticks.map((t, i) => <span key={i}>{format(t)}</span>)}
                </div>
                <div
                    ref={plotRef}
                    className={styles.plot}
                    style={{ height }}
                    tabIndex={0}
                    role="img"
                    aria-label={`${label}: ${series.map((s) => `${s.label} ${format(s.values[s.values.length - 1] ?? 0)}`).join(', ')}. Use the arrow keys to read each value.`}
                    onPointerMove={(e) => setActive(indexAt(e.clientX))}
                    onPointerLeave={() => setActive(null)}
                    onBlur={() => setActive(null)}
                    onKeyDown={onKeyDown}
                >
                    <div className={styles.grid} aria-hidden="true"><i /><i /><i /></div>
                    <svg className={styles.lines} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                        {[...series].reverse().map((s) => (
                            <polyline
                                key={s.label}
                                points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                                fill="none"
                                stroke={s.color}
                                strokeWidth={s.dashed ? 1.75 : 2.5}
                                strokeDasharray={s.dashed ? '4 4' : undefined}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}
                    </svg>
                    {series.filter((s) => !s.dashed && s.values.length).map((s) => (
                        <i key={s.label} className={styles.lineEnd} aria-hidden="true"
                            style={{ left: `${x(s.values.length - 1)}%`, top: `${y(s.values[s.values.length - 1])}%`, background: s.color }} />
                    ))}
                    {active !== null && (
                        <>
                            <i className={styles.lineGuide} style={{ left: `${x(active)}%` }} aria-hidden="true" />
                            {shown.map((s) => (
                                <i key={s.label} className={styles.lineDot} aria-hidden="true"
                                    style={{ left: `${x(active)}%`, top: `${y(s.values[active])}%`, borderColor: s.color }} />
                            ))}
                            <div className={`${styles.tip} ${edge}`} style={{ left: `${x(active)}%` }} aria-live="polite">
                                {shown.map((s, i) => (
                                    <span key={s.label} className={i === 0 ? styles.tipMain : undefined}>
                                        {i === 0 ? <strong>{format(s.values[active])}</strong> : format(s.values[active])}
                                        {' '}{s.pointLabel ? s.pointLabel(active) : s.label}
                                    </span>
                                ))}
                                {!shown.length && <span>{xLabel(active)}</span>}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className={styles.xAxis} aria-hidden="true">
                {xTicks.map((i) => (
                    <span key={i} style={{ left: `${x(i)}%` }}>{xLabel(i)}</span>
                ))}
            </div>
        </figure>
    );
}
