import styles from '@/styles/components/grammar.module.scss';

export const STAGE_NAMES = ['New', 'Learned', 'Practiced', 'Strong', 'Mastered'];

// A saved point's level on the path: 0 new to 4 mastered.
const Stars = ({ stage }) => (
    <span className={styles.stars} aria-label={`${STAGE_NAMES[stage]}, ${stage} of 4`}>
        {[1, 2, 3, 4].map((i) => (i <= stage ? <b key={i}>★</b> : <span key={i}>★</span>))}
    </span>
);

export default Stars;
