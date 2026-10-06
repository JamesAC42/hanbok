import styles from '@/styles/components/mascot.module.scss';

// Horangi, the tutor tiger (from the 까치호랑이 folk painting). Art lives in
// public/images/mascot, cut from the flat tiger sheet
// (art/tiger/tiger-flat-sheet.png in project files). Full-body poses take
// `size` as their height; head poses take it as their width, so they sit
// neatly in avatar slots. `motion` adds a gentle idle: 'bob' or 'hop'.
const POSES = {
    wave: 'wave',
    teach: 'teach',
    celebrate: 'celebrate',
    study: 'study',
    think: 'think',
    speak: 'speak',
    hero: 'hero',
    head: 'head-1',
    wink: 'head-2',
    happy: 'head-3',
    surprised: 'head-4',
    side: 'head-5',
};

// Natural width / height of each drawing, so the box is reserved before load.
const RATIO = {
    wave: 253 / 272,
    teach: 300 / 307,
    celebrate: 275 / 300,
    study: 243 / 273,
    think: 230 / 291,
    speak: 296 / 281,
    hero: 469 / 550,
    'head-1': 93 / 83,
    'head-2': 93 / 83,
    'head-3': 89 / 83,
    'head-4': 90 / 83,
    'head-5': 85 / 85,
};

const Tiger = ({ pose = 'head', size = 56, className = '', motion = '', label = 'Horangi the tutor tiger' }) => {
    const art = POSES[pose] || 'head-1';
    const isHead = art.startsWith('head');
    const width = isHead ? size : Math.round(size * 1.05 * RATIO[art]);
    const height = isHead ? Math.round(size / RATIO[art]) : Math.round(size * 1.05);
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            className={`${styles.mascot} ${motion ? styles[motion] : ''} ${className}`}
            src={`/images/mascot/tiger-${art}.webp`}
            width={width}
            height={height}
            alt={label}
            data-pose={pose}
            draggable={false}
        />
    );
};

export default Tiger;
