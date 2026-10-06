import Link from 'next/link';
import StatusScreen from '@/components/StatusScreen';
import styles from '@/styles/components/statusscreen.module.scss';

export const metadata = {
    title: 'Hanbok - Page not found',
};

export default function NotFound() {
    return (
        <StatusScreen
            pose="think"
            title="Page not found"
            text="This page doesn't exist, or it has moved."
        >
            <Link href="/" className={styles.primary}>Go home</Link>
        </StatusScreen>
    );
}
