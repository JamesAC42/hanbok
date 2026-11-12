'use client';
import { useEffect, useState } from 'react';
import styles from '@/styles/pages/learn.module.scss';

// "On this page": built from the article's own h2 headings once it has
// rendered, so every guide gets one without listing its sections by hand.
// The section being read is highlighted as the reader scrolls.
export default function ArticleToc({ rootId, extra = [], inline = false }) {
    const [items, setItems] = useState([]);
    const [active, setActive] = useState('');

    useEffect(() => {
        const root = document.getElementById(rootId);
        if (!root) return undefined;
        const heads = [...root.querySelectorAll('h2[id]')];
        const extraHeads = extra.map((x) => document.getElementById(x.id)).filter(Boolean);
        const all = [...heads, ...extraHeads];
        setItems([
            ...heads.map((h) => ({ id: h.id, text: h.textContent.replace(/^\d+\.\s*/, '') })),
            ...extra.filter((x) => document.getElementById(x.id)),
        ]);
        if (!all.length || typeof IntersectionObserver === 'undefined') return undefined;
        const seen = new Map();
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => seen.set(e.target.id, e.boundingClientRect.top));
            // The last heading that has scrolled above the upper third is the one being read.
            const line = window.innerHeight * 0.33;
            let current = all[0].id;
            all.forEach((h) => { if (h.getBoundingClientRect().top < line) current = h.id; });
            setActive(current);
        }, { rootMargin: '0px 0px -60% 0px', threshold: [0, 1] });
        all.forEach((h) => io.observe(h));
        return () => io.disconnect();
        // extra is a static list per page
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rootId]);

    if (items.length < 2) return null;

    const list = (
        <ol className={styles.tocList}>
            {items.map((it) => (
                <li key={it.id}>
                    <a href={`#${it.id}`} className={it.id === active ? styles.tocOn : undefined}>
                        {it.text}
                    </a>
                </li>
            ))}
        </ol>
    );

    if (inline) {
        return (
            <details className={styles.tocInline}>
                <summary>On this page <span>{items.length} sections</span></summary>
                {list}
            </details>
        );
    }
    return (
        <nav className={styles.railCard} aria-label="On this page">
            <p className={styles.railLabel}>On this page</p>
            {list}
        </nav>
    );
}
