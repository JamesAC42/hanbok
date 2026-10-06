'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import StatusScreen from '@/components/StatusScreen';
import styles from '@/styles/components/statusscreen.module.scss';

// Shown when a page crashes while rendering. "Try again" re-renders the page.
export default function Error({ error, reset }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <StatusScreen
            pose="think"
            title="Something went wrong"
            text="This page hit a problem, so please try again."
        >
            <button type="button" onClick={() => reset()} className={styles.primary}>Try again</button>
            <Link href="/" className={styles.secondary}>Go home</Link>
        </StatusScreen>
    );
}
