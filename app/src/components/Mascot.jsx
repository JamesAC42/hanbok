import styles from '@/styles/components/mascot.module.scss';

// Kkachi, the Hanbok magpie (from the 까치호랑이 folk painting), drawn flat
// so it reads at any size and on every theme. Poses: wave, cards, point,
// sleep, cheer. `motion` adds a gentle idle: 'bob' or 'hop'.
const Mascot = ({ pose = 'wave', size = 72, className = '', motion = '', label = 'Kkachi the magpie' }) => {
    const sleeping = pose === 'sleep';
    return (
        <svg
            className={`${styles.mascot} ${motion ? styles[motion] : ''} ${className}`}
            width={size}
            height={Math.round(size * 120 / 140)}
            viewBox="0 0 140 120"
            role="img"
            aria-label={label}
            data-pose={pose}
        >
            {/* tail */}
            <path d="M96 78c14 6 28 16 38 30-16-2-32-8-44-18z" fill="#2F55D4" />
            <path d="M96 78c14 6 28 16 38 30-10-1-19-4-27-8z" fill="#1E3DA6" />
            {/* body and belly */}
            <ellipse cx="62" cy="64" rx="40" ry="44" fill="#16161C" />
            <ellipse cx="56" cy="80" rx="27" ry="27" fill="#FFFFFF" />
            {/* wing */}
            {pose === 'point' ? (
                <g>
                    <path d="M80 58c14-2 30 2 46 10-12 4-28 6-44 4-2-5-3-10-2-14z" fill="#2F55D4" />
                    <path d="M84 60c10-1 22 1 33 6-9 1-20 1-31-1z" fill="#FFFFFF" />
                </g>
            ) : (
                <g className={pose === 'cheer' ? styles.flap : undefined}>
                    <path d="M78 56c16 2 26 14 26 30-8 6-20 6-28-2-2-10-1-20 2-28z" fill="#2F55D4" />
                    <path d="M80 56c10 1 17 6 21 13-7 2-16 1-22-3z" fill="#FFFFFF" />
                </g>
            )}
            {/* near wing */}
            {pose === 'wave' || pose === 'cheer' ? (
                <path className={styles.wave} d="M28 62c-10-4-17-14-18-27 9 3 17 11 21 20z" fill="#2F55D4" />
            ) : (
                <path d="M26 66c-8 2-13 9-14 18 7-1 13-5 16-10z" fill="#2F55D4" />
            )}
            {/* eyes */}
            {sleeping ? (
                <g fill="none" stroke="#D9DAE3" strokeWidth="2.6" strokeLinecap="round">
                    <path d="M40 47q6 4 12 0" />
                    <path d="M66 49q6 4 12 0" />
                </g>
            ) : (
                <g>
                    <circle cx="46" cy="46" r="7.2" fill="#0B0B0F" stroke="#D9DAE3" strokeWidth="1.8" />
                    <circle cx="72" cy="48" r="7.7" fill="#0B0B0F" stroke="#D9DAE3" strokeWidth="1.8" />
                    <circle cx="48.5" cy="43.5" r="2.4" fill="#fff" />
                    <circle cx="74.5" cy="45.5" r="2.5" fill="#fff" />
                </g>
            )}
            {/* cheeks and beak */}
            <ellipse cx="38" cy="57" rx="5" ry="3.4" fill="#E06A6A" opacity=".55" />
            <ellipse cx="80" cy="59" rx="5" ry="3.4" fill="#E06A6A" opacity=".55" />
            <path d="M55 52l9-1-4 7z" fill="#7A7F8C" />
            {/* norigae cord and tassel */}
            <path d="M38 63q20 12 40-1" fill="none" stroke="#C2363F" strokeWidth="2" />
            <circle cx="58" cy="70" r="3.2" fill="#C2363F" />
            <path d="M58 72l-3 14M58 72v15M58 72l3 14" stroke="#C2363F" strokeWidth="2.2" strokeLinecap="round" />
            {/* feet */}
            <path d="M50 106l-4 6M50 106l2 6M70 106l-2 6M70 106l4 6" stroke="#3A3A44" strokeWidth="2.6" strokeLinecap="round" />
            {pose === 'cards' && (
                <g transform="rotate(-8 56 84)">
                    <rect x="36" y="70" width="40" height="30" rx="5" fill="#FFB020" />
                    <rect x="40" y="66" width="40" height="30" rx="5" fill="#FFFFFF" stroke="#3D64E8" strokeWidth="2.5" />
                    <text x="60" y="87" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1A1E3A" fontFamily="'Noto Sans KR', sans-serif">가</text>
                    <path d="M30 80c4-4 8-4 11-1M88 76c-3-3-7-3-10 0" stroke="#2F55D4" strokeWidth="6" strokeLinecap="round" fill="none" />
                </g>
            )}
            {sleeping && (
                <g className={styles.zzz} fill="#8A8FA8" fontFamily="'Lilita One', sans-serif">
                    <text x="96" y="30" fontSize="16">z</text>
                    <text x="108" y="18" fontSize="12">z</text>
                    <text x="117" y="9" fontSize="9">z</text>
                </g>
            )}
        </svg>
    );
};

export default Mascot;
