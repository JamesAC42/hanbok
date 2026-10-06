import Tiger from '@/components/Tiger';
import styles from '@/styles/pages/learn.module.scss';

// Horangi explaining something in a speech bubble.
const Tutor = ({ children, pose = 'teach' }) => (
    <aside className={styles.tutor}>
        <Tiger pose={pose} size={76} />
        <div className={styles.tutorBubble}>{children}</div>
    </aside>
);

export default Tutor;
