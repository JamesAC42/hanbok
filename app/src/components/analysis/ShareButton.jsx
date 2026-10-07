'use client';
import { useState, useRef, useEffect } from 'react';
import { MaterialSymbolsShare } from '@/components/icons/Share';
import saveStyles from '@/styles/components/sentenceanalyzer/savebutton.module.scss';
import styles from '@/styles/components/sentenceanalyzer/sharebutton.module.scss';
import { track } from '@/lib/analytics';

// Shares a breakdown. The link unfurls as a card with the sentence (see
// app/sentence/[id]/opengraph-image.jsx) and is tagged so signups from shared
// links show up as utm_source=share in the admin dashboard.
const ShareButton = ({ sentenceId, sentence }) => {
    const [copied, setCopied] = useState(false);
    const timer = useRef(null);

    useEffect(() => () => clearTimeout(timer.current), []);

    if (!sentenceId) return null;

    const share = async () => {
        const url = `${window.location.origin}/sentence/${sentenceId}?utm_source=share&utm_medium=referral&utm_campaign=sentence`;
        const canNativeShare = typeof navigator.share === 'function'
            && window.matchMedia?.('(pointer: coarse)').matches;

        if (canNativeShare) {
            try {
                await navigator.share({ title: 'Hanbok', text: sentence ? `What does "${sentence}" mean?` : undefined, url });
                track('sentence_share', { method: 'native' });
            } catch {
                // Closing the share sheet throws; nothing to do.
            }
            return;
        }

        try {
            await navigator.clipboard.writeText(url);
        } catch {
            window.prompt('Copy this link', url);
        }
        track('sentence_share', { method: 'copy' });
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
    };

    return (
        <span className={styles.wrap}>
            <button
                type="button"
                className={saveStyles.saveButton}
                onClick={share}
                title="Share this breakdown"
                aria-label="Share this breakdown"
            >
                <MaterialSymbolsShare />
            </button>
            {copied && <span className={styles.copied} role="status">Link copied</span>}
        </span>
    );
};

export default ShareButton;
