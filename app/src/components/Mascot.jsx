import styles from '@/styles/components/mascot.module.scss';

// Kkachi, the Hanbok magpie. Art lives in public/images/mascot, cut from
// the flat mascot sheet (art/magpie/magpie-flat-sheet.png in project files).
// Older pose names map onto the closest drawing: point → teach,
// cheer → celebrate, cards → study. There is no sleeping drawing yet, so
// sleep uses think. `motion` adds a gentle idle: 'bob' or 'hop'.
const POSES = {
    wave: 'wave',
    teach: 'teach',
    point: 'teach',
    celebrate: 'celebrate',
    cheer: 'celebrate',
    study: 'study',
    cards: 'study',
    think: 'think',
    sleep: 'think',
    speak: 'speak',
    hero: 'hero',
    head: 'head-1',
    wink: 'head-2',
    happy: 'head-3',
    curious: 'head-4',
    side: 'head-5',
};

// Natural width / height of each drawing, so the box is reserved before load.
const RATIO = {
    wave: 256 / 289,
    teach: 266 / 314,
    celebrate: 268 / 288,
    study: 230 / 289,
    think: 213 / 285,
    speak: 300 / 271,
    hero: 485 / 592,
    'head-1': 71 / 75,
    'head-2': 72 / 74,
    'head-3': 71 / 74,
    'head-4': 72 / 74,
    'head-5': 76 / 74,
};

const Mascot = ({ pose = 'wave', size = 72, className = '', motion = '', label = 'Kkachi the magpie' }) => {
    const art = POSES[pose] || 'wave';
    const height = Math.round(size * 1.05);
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            className={`${styles.mascot} ${motion ? styles[motion] : ''} ${className}`}
            src={`/images/mascot/magpie-${art}.webp`}
            width={Math.round(height * RATIO[art])}
            height={height}
            alt={label}
            data-pose={pose}
            draggable={false}
        />
    );
};

export default Mascot;
