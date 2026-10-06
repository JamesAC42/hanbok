'use client';
import { useEffect, useState } from 'react';
import styles from '@/styles/components/emailauth.module.scss';
import { getAttribution, setHeardFrom } from '@/lib/analytics';

const OPTIONS = [
    { value: 'tiktok', label: 'TikTok' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'search', label: 'Google or another search engine' },
    { value: 'friend', label: 'A friend' },
    { value: 'discord', label: 'Discord' },
    { value: 'other', label: 'Somewhere else' }
];

const HeardFromSelect = ({ disabled }) => {
    const [value, setValue] = useState('');

    useEffect(() => {
        setValue(getAttribution()?.heardFrom || '');
    }, []);

    const handleChange = (e) => {
        setValue(e.target.value);
        setHeardFrom(e.target.value);
    };

    return (
        <div className={styles.formGroup}>
            <label htmlFor="heardFrom">How did you hear about Hanbok? (optional)</label>
            <select id="heardFrom" name="heardFrom" value={value} onChange={handleChange} disabled={disabled}>
                <option value="">Choose one</option>
                {OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
    );
};

export default HeardFromSelect;
