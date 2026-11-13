import styles from '@/styles/components/grammar.module.scss';

export const STAGE_NAMES = ['New', 'Learned', 'Practiced', 'Strong', 'Mastered'];

// How a point earns each star (shown on the path and on a point's page).
export const LEVEL_STEPS = [
    { name: 'Learned', how: 'Do the lesson or get one question right' },
    { name: 'Practiced', how: 'Get 3 questions right' },
    { name: 'Strong', how: 'Remember it a week later' },
    { name: 'Mastered', how: 'Remember it three weeks later' },
];

// A saved point's level on the path: 0 new to 4 mastered.
const Stars = ({ stage }) => (
    <span className={styles.stars} aria-label={`${STAGE_NAMES[stage]}, ${stage} of 4`}>
        {[1, 2, 3, 4].map((i) => (i <= stage ? <b key={i}>★</b> : <span key={i}>★</span>))}
    </span>
);

export default Stars;
