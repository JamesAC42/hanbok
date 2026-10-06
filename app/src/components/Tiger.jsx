import styles from '@/styles/components/mascot.module.scss';

// Horangi, the tutor tiger from the 까치호랑이 painting. Placeholder flat art
// until the final character is drawn.
const Tiger = ({ size = 56, className = '', motion = '', label = 'Horangi the tutor tiger' }) => (
    <svg
        className={`${styles.mascot} ${motion ? styles[motion] : ''} ${className}`}
        width={size}
        height={Math.round(size * 110 / 120)}
        viewBox="0 0 120 110"
        role="img"
        aria-label={label}
    >
        <circle cx="28" cy="26" r="15" fill="#E9852A" />
        <circle cx="92" cy="26" r="15" fill="#E9852A" />
        <circle cx="28" cy="27" r="7" fill="#FFE7C4" />
        <circle cx="92" cy="27" r="7" fill="#FFE7C4" />
        <ellipse cx="60" cy="60" rx="46" ry="41" fill="#F09A35" />
        <path d="M60 20v14M50 22l3 11M70 22l-3 11" stroke="#2A1E16" strokeWidth="4" strokeLinecap="round" />
        <path d="M15 56l13 3M14 68l13 0M105 56l-13 3M106 68l-13 0" stroke="#2A1E16" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="60" cy="78" rx="25" ry="18" fill="#FFF3DE" />
        <circle cx="44" cy="56" r="6" fill="#1F1712" />
        <circle cx="76" cy="56" r="6" fill="#1F1712" />
        <circle cx="46" cy="54" r="2" fill="#fff" />
        <circle cx="78" cy="54" r="2" fill="#fff" />
        <circle cx="44" cy="56" r="12" fill="none" stroke="#2A1E16" strokeWidth="2.6" />
        <circle cx="76" cy="56" r="12" fill="none" stroke="#2A1E16" strokeWidth="2.6" />
        <path d="M56 56h8" stroke="#2A1E16" strokeWidth="2.6" />
        <path d="M54 71q6-4 12 0l-6 6z" fill="#B5574A" />
        <path d="M60 77q-4 6-9 3M60 77q4 6 9 3" fill="none" stroke="#2A1E16" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
);

export default Tiger;
