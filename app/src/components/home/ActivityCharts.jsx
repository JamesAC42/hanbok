'use client';
import { useMemo, useState } from 'react';
import styles from '@/styles/home/dashboardhome.module.scss';

export const METRICS = [
    { key: 'analyzed', label: 'Sentences analyzed', color: 'var(--chart-analyzed)' },
    { key: 'wordsSaved', label: 'Words saved', color: 'var(--chart-words)' },
    { key: 'reviews', label: 'Cards reviewed', color: 'var(--chart-reviews)' },
];

const total = (day) => day.analyzed + day.wordsSaved + day.reviews;

// Parse YYYY-MM-DD as a local calendar date (no time zone shift).
const toDate = (key) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const formatDay = (key, options = { weekday: 'short', month: 'short', day: 'numeric' }) =>
    toDate(key).toLocaleDateString(undefined, options);

const describe = (day) => {
    const parts = METRICS
        .filter(m => day[m.key] > 0)
        .map(m => `${day[m.key]} ${m.label.toLowerCase()}`);
    return parts.length ? parts.join(', ') : 'No activity';
};

// Last seven days with a mark on each active day.
export const WeekStrip = ({ days }) => {
    const week = days.slice(-7);
    return (
        <ol className={styles.weekStrip} aria-label="Activity this week">
            {week.map((day, i) => {
                const active = total(day) > 0;
                const isToday = i === week.length - 1;
                return (
                    <li
                        key={day.date}
                        className={`${styles.weekDay} ${active ? styles.weekDayActive : ''} ${isToday ? styles.weekDayToday : ''}`}
                        title={`${formatDay(day.date)}: ${describe(day)}`}
                    >
                        <span className={styles.weekDayMark} aria-hidden="true">{active ? '✓' : ''}</span>
                        <span className={styles.weekDayLabel}>
                            {formatDay(day.date, { weekday: 'narrow' })}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
};

// GitHub-style calendar: one column per week, one cell per day.
export const ActivityHeatmap = ({ days }) => {
    const [hovered, setHovered] = useState(null);

    const { weeks, max } = useMemo(() => {
        if (!days.length) return { weeks: [], max: 0 };
        // Pad the start so each column begins on Sunday.
        const firstWeekday = toDate(days[0].date).getDay();
        const cells = [...Array(firstWeekday).fill(null), ...days];
        const weeks = [];
        for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
        return { weeks, max: Math.max(1, ...days.map(total)) };
    }, [days]);

    const level = (day) => {
        const value = total(day);
        if (value === 0) return 0;
        return Math.min(4, Math.ceil((value / max) * 4));
    };

    const activeDays = days.filter(d => total(d) > 0).length;

    return (
        <div className={styles.heatmapWrap}>
            <div className={styles.heatmap} role="img" aria-label={`Active on ${activeDays} of the last ${days.length} days`}>
                {weeks.map((week, w) => (
                    <div key={w} className={styles.heatmapWeek}>
                        {week.map((day, d) => day ? (
                            <span
                                key={day.date}
                                className={`${styles.heatmapCell} ${styles[`level${level(day)}`]}`}
                                onMouseEnter={() => setHovered(day)}
                                onMouseLeave={() => setHovered(null)}
                                title={`${formatDay(day.date)}: ${describe(day)}`}
                            />
                        ) : (
                            <span key={`pad-${d}`} className={styles.heatmapPad} />
                        ))}
                    </div>
                ))}
            </div>
            <div className={styles.chartCaption}>
                {hovered
                    ? <><strong>{formatDay(hovered.date)}</strong> · {describe(hovered)}</>
                    : <>Active on <strong>{activeDays}</strong> of the last {days.length} days</>}
            </div>
        </div>
    );
};

// Stacked daily bars for the last few weeks.
export const TrendChart = ({ days }) => {
    const [hovered, setHovered] = useState(null);
    const width = 600;
    const height = 160;
    const gap = 3;
    const barWidth = days.length ? (width - gap * (days.length - 1)) / days.length : 0;
    const max = Math.max(1, ...days.map(total));
    const totals = METRICS.map(m => days.reduce((sum, d) => sum + d[m.key], 0));

    return (
        <div className={styles.trend}>
            <ul className={styles.legend}>
                {METRICS.map((m, i) => (
                    <li key={m.key}>
                        <span className={styles.legendSwatch} style={{ background: m.color }} />
                        {m.label} <strong>{totals[i]}</strong>
                    </li>
                ))}
            </ul>
            <svg
                className={styles.trendSvg}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`Daily activity for the last ${days.length} days`}
                onMouseLeave={() => setHovered(null)}
            >
                {days.map((day, i) => {
                    const x = i * (barWidth + gap);
                    let y = height;
                    return (
                        <g key={day.date} onMouseEnter={() => setHovered(day)} onClick={() => setHovered(day)}>
                            <rect x={x} y={0} width={barWidth} height={height} fill="transparent" />
                            {total(day) === 0 && (
                                <rect x={x} y={height - 2} width={barWidth} height={2} rx={1} className={styles.trendEmpty} />
                            )}
                            {METRICS.map(m => {
                                const h = (day[m.key] / max) * (height - 4);
                                if (h <= 0) return null;
                                y -= h;
                                return (
                                    <rect
                                        key={m.key}
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={h}
                                        rx={Math.min(3, barWidth / 3)}
                                        fill={m.color}
                                        opacity={hovered && hovered.date !== day.date ? 0.45 : 1}
                                    />
                                );
                            })}
                        </g>
                    );
                })}
            </svg>
            <div className={styles.trendAxis}>
                <span>{days[0] && formatDay(days[0].date, { month: 'short', day: 'numeric' })}</span>
                <span>Today</span>
            </div>
            <div className={styles.chartCaption}>
                {hovered
                    ? <><strong>{formatDay(hovered.date)}</strong> · {describe(hovered)}</>
                    : 'Tap or hover a day to see what you did'}
            </div>
        </div>
    );
};
