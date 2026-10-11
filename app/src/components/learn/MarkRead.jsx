'use client';

import { useEffect, useRef } from 'react';
import { markRead } from '@/lib/learnProgress';

// Placed after an article's body: once the reader has scrolled to it (or past
// it), the guide counts as read on /learn.
export default function MarkRead({ slug }) {
    const ref = useRef(null);
    useEffect(() => {
        const check = () => {
            const el = ref.current;
            if (el && el.getBoundingClientRect().top < window.innerHeight) {
                markRead(slug);
                window.removeEventListener('scroll', check);
            }
        };
        window.addEventListener('scroll', check, { passive: true });
        return () => window.removeEventListener('scroll', check);
    }, [slug]);
    return <div ref={ref} aria-hidden="true" />;
}
