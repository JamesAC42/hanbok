'use client';
import { useEffect, useState } from 'react';
import { formsMatch } from '@/lib/grammarForms';

// The Learn guide for a grammar form, if there is one. The list is small and
// static, so it's fetched once per page load and shared.
let guidesPromise = null;
const loadGuides = () => {
    if (!guidesPromise) {
        guidesPromise = fetch('/grammar-guides.json')
            .then((res) => (res.ok ? res.json() : { guides: [] }))
            .then((data) => data.guides || [])
            .catch(() => {
                guidesPromise = null;
                return [];
            });
    }
    return guidesPromise;
};

export const findGuide = (guides, form, language = 'ko') => {
    if (!form || !guides?.length) return null;
    const matches = guides.filter((g) => (g.language || 'ko') === language && formsMatch(g.form, form));
    if (!matches.length) return null;
    matches.sort((a, b) => a.focus - b.focus);
    return { slug: matches[0].slug, title: matches[0].title, href: `/learn/${matches[0].slug}` };
};

export const useGrammarGuides = () => {
    const [guides, setGuides] = useState([]);
    useEffect(() => {
        let cancelled = false;
        loadGuides().then((list) => { if (!cancelled) setGuides(list); });
        return () => { cancelled = true; };
    }, []);
    return guides;
};
