'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Mascot from '@/components/Mascot';
import { loginHref } from '@/lib/anonSentences';
import { track } from '@/lib/analytics';
import styles from '@/styles/components/sentenceanalyzer/layers.module.scss';

// The lock at the end of a layer's free preview. Signed-out visitors are sent
// to sign up (new accounts start on a free Plus week); everyone else to plans.
const PlusGate = ({ layer, title, children }) => {
    const { user } = useAuth();
    const signedOut = !user;

    const onClick = () => track('layer_upgrade_click', { layer, plan: ['free', 'basic', 'plus'][user?.tier || 0] });

    return (
        <div className={styles.gate}>
            <Mascot pose="teach" size={64} />
            <div className={styles.gateBody}>
                <b>{title}</b>
                <p>{children}</p>
                {signedOut ? (
                    <Link href={loginHref(true)} className={styles.gateButton} onClick={onClick}>
                        Make a free account
                    </Link>
                ) : (
                    <Link href="/pricing" className={styles.gateButton} onClick={onClick}>
                        Get Plus
                    </Link>
                )}
                {signedOut && <small>New accounts get 7 days of Plus free. No card needed.</small>}
            </div>
        </div>
    );
};

export default PlusGate;
