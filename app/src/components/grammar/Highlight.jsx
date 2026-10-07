// Marks the learner's saved words inside a sentence. Verbs and adjectives
// match on their stem (가져가다 -> 가져가) since they appear conjugated.
const stemOf = (word) => (word.length > 2 && word.endsWith('다') ? word.slice(0, -1) : word);

const Highlight = ({ text, words = [], className }) => {
    const needles = [...new Set(words.map(stemOf).filter((w) => w && w.length >= 1))]
        .sort((a, b) => b.length - a.length);
    if (!needles.length || !text) return text || null;
    const escaped = needles.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'));
    return parts.map((part, i) => (needles.includes(part)
        ? <mark key={i} className={className}>{part}</mark>
        : part));
};

export default Highlight;
