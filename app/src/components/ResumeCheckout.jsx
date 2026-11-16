'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { startCheckout, takePendingCheckout } from '@/lib/checkout';
import styles from '@/styles/components/pendingsaves.module.scss';

// Someone picked a plan on /pricing while signed out and was sent to sign up.
// As soon as they're signed in, carry on to Stripe Checkout with that plan.
// Skipped for accounts that already pay.
export default function ResumeCheckout() {
    const { user } = useAuth();
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!user?.userId) return;
        const priceId = takePendingCheckout();
        if (!priceId) return;
        const paying = user.tier > 0 && !user.plusTrialEndsAt;
        if (paying) return;
        setBusy(true);
        startCheckout(priceId, { resumed: true }).then((ok) => { if (!ok) setBusy(false); });
    }, [user?.userId]);

    if (!busy) return null;
    return <div className={styles.toast} role="status">Taking you to checkout…</div>;
}
