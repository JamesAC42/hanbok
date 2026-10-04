// Placeholder for the Hanbok mascot. The final character art (and its poses)
// will replace this drawing; callers pass the pose they want so the swap is
// just a change here.
const Mascot = ({ pose = 'wave', size = 72, className = '' }) => (
    <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 80 80"
        role="img"
        aria-label="Hanbok mascot"
        data-pose={pose}
    >
        <circle cx="40" cy="40" r="38" fill="var(--background-alt, #f1f3f9)" />
        {/* tail */}
        <path d="M18 52 L6 62 L12 64 L22 56 Z" fill="#1f2433" />
        {/* body */}
        <ellipse cx="40" cy="46" rx="20" ry="18" fill="#1f2433" />
        <ellipse cx="42" cy="51" rx="13" ry="12" fill="#ffffff" />
        {/* wing */}
        <path d="M24 42 Q30 34 40 40 Q34 52 24 50 Z" fill="#3d64e8" />
        {pose === 'wave' && <path d="M56 40 Q66 30 64 22 Q58 30 52 36 Z" fill="#3d64e8" />}
        {/* head */}
        <circle cx="46" cy="28" r="12" fill="#1f2433" />
        <circle cx="50" cy="26" r="3.2" fill="#ffffff" />
        <circle cx="50.8" cy="26" r="1.8" fill="#1f2433" />
        <path d="M57 28 L64 30 L57 32 Z" fill="#f2a33a" />
        {/* norigae tassel */}
        <circle cx="38" cy="38" r="2.2" fill="#e5487a" />
        <path d="M38 40 L36.5 47 M38 40 L39.5 47" stroke="#e5487a" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);

export default Mascot;
