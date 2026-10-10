'use client';
import { useEffect, useState } from 'react';

// Chrome Web Store listing. While empty, install buttons say "Coming soon"
// and the home card stays hidden.
export const CHROME_EXTENSION_URL =
    'https://chromewebstore.google.com/detail/hanbok-study/fmcnjefaokldjlddnakekdokejlpamlc';

// The extension's content script sets data-hanbok-extension on <html> and
// fires 'hanbok-extension-ready' on hanbokstudy.com.
const readInstalled = () =>
    typeof document !== 'undefined' && !!document.documentElement.dataset.hanbokExtension;

export const useExtensionInstalled = () => {
    // Start false on the server and the first client render to avoid a
    // hydration mismatch; check for real after mount.
    const [installed, setInstalled] = useState(false);
    useEffect(() => {
        if (readInstalled()) setInstalled(true);
        const onReady = () => setInstalled(true);
        window.addEventListener('hanbok-extension-ready', onReady);
        return () => window.removeEventListener('hanbok-extension-ready', onReady);
    }, []);
    return installed;
};

// Desktop Chromium browsers (Chrome, Edge, Brave, Opera...) can install
// Chrome Web Store extensions. Phones and tablets cannot.
export const isDesktopChrome = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const data = navigator.userAgentData;
    if (data) {
        if (data.mobile) return false;
        const brands = (data.brands || []).map(b => b.brand);
        if (brands.some(b => b === 'Chromium' || b === 'Google Chrome')) {
            return !/Android|iPhone|iPad|iPod/i.test(ua);
        }
    }
    if (/Android|iPhone|iPad|iPod|Mobile|CriOS|EdgiOS/i.test(ua)) return false;
    return /Chrome\//.test(ua);
};
