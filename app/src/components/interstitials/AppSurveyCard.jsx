'use client';
import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics';
import Mascot from '@/components/Mascot';
import styles from '@/styles/components/appSurvey.module.scss';

// "If Hanbok were an app on your phone, would you use it?" A one-tap corner
// card, picked by Interstitials.jsx once per person, to see whether an iPhone
// app is worth building. Yes or Maybe asks which phone they have. Answers go
// to /api/app-survey and show on the admin Surveys tab.
const ANSWERS = [
    { value: 'yes', label: 'Yes!' },
    { value: 'maybe', label: 'Maybe' },
    { value: 'no', label: 'No' },
];
const PHONES = [
    { value: 'iphone', label: 'iPhone' },
    { value: 'android', label: 'Android' },
];
const VISITOR_KEY = 'hanbokVisitorId';

// A random id for this browser, so a signed-out visitor's answer and phone land
// on the same row.
const visitorId = () => {
    try {
        let id = localStorage.getItem(VISITOR_KEY);
        if (!id) {
            id = crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
            localStorage.setItem(VISITOR_KEY, id);
        }
        return id;
    } catch {
        return null;
    }
};

const send = (body) => fetch('/api/app-survey', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, visitorId: visitorId() }),
}).catch(() => {});

const AppSurveyCard = ({ onClose }) => {
    const [step, setStep] = useState('ask'); // ask | phone | thanks

    useEffect(() => {
        send({ step: 'seen' });
    }, []);

    useEffect(() => {
        if (step !== 'thanks') return;
        const timer = setTimeout(onClose, 2200);
        return () => clearTimeout(timer);
    }, [step, onClose]);

    const answer = (value) => {
        send({ step: 'answer', answer: value });
        track('app_survey_answer', { answer: value });
        setStep(value === 'no' ? 'thanks' : 'phone');
    };

    const phone = (value) => {
        send({ step: 'platform', platform: value });
        track('app_survey_phone', { platform: value });
        setStep('thanks');
    };

    const dismiss = () => {
        if (step === 'ask') {
            send({ step: 'dismiss' });
            track('app_survey_dismiss');
        }
        onClose();
    };

    const title = step === 'thanks' ? 'Thank you!' : step === 'phone' ? 'One more' : 'Quick question';
    const text = step === 'thanks'
        ? 'That really helps us decide what to build next.'
        : step === 'phone'
            ? 'Which phone do you have?'
            : 'If Hanbok were an app on your phone, would you use it?';

    return (
        <aside className={styles.card} role="dialog" aria-labelledby="app-survey-title" aria-describedby="app-survey-text" data-corner-card="">
            <div className={styles.head}>
                <Mascot pose={step === 'thanks' ? 'celebrate' : 'think'} size={52} />
                <div>
                    <h2 id="app-survey-title">{title}</h2>
                    <p id="app-survey-text">{text}</p>
                </div>
                {step !== 'thanks' && (
                    <button type="button" className={styles.close} onClick={dismiss} aria-label="Close">×</button>
                )}
            </div>
            {step === 'ask' && (
                <div className={styles.choices}>
                    {ANSWERS.map((a) => (
                        <button key={a.value} type="button" className={a.value === 'yes' ? styles.primary : ''} onClick={() => answer(a.value)}>
                            {a.label}
                        </button>
                    ))}
                </div>
            )}
            {step === 'phone' && (
                <>
                    <div className={styles.choices}>
                        {PHONES.map((p) => (
                            <button key={p.value} type="button" onClick={() => phone(p.value)}>{p.label}</button>
                        ))}
                    </div>
                    <button type="button" className={styles.skip} onClick={() => setStep('thanks')}>Skip</button>
                </>
            )}
        </aside>
    );
};

export default AppSurveyCard;
