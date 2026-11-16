// Live Stripe price IDs, shared by the pricing page and the one-tap buttons in
// the weekly limit popup. The server's copies are in createCheckoutSession
// (plusTrial / yearlyDeal) and handleCheckoutComplete.
import { track } from '@/lib/analytics';

export const PRICE_IDS = {
    BASIC_UPGRADE: 'price_1QtCSlDv6kE7GataHOJpDPKT',
    AUDIO_PACK: 'price_1QtCTcDv6kE7GataN7ebeLCF',
    IMAGE_PACK: 'price_1QxXiXDv6kE7GataLRxt8hrj',
    MORE_SENTENCES: 'price_1R5e8hDv6kE7Gata5CKPAu0Z',
    BASIC_SUBSCRIPTION: 'price_1R94kODv6kE7Gata9Zwzvvom',
    PLUS_SUBSCRIPTION: 'price_1QtBf2Dv6kE7Gatasq6pq1Tc',
    BASIC_SUBSCRIPTION_YEARLY: 'price_1Rjh9EDv6kE7GataEdXl4ICx',
    PLUS_SUBSCRIPTION_YEARLY: 'price_1RjhBODv6kE7GatajkAfu5cB',
};

export const PLAN_BY_PRICE_ID = Object.fromEntries(
    Object.entries(PRICE_IDS).map(([plan, id]) => [id, plan])
);

// A signed-out visitor who picks a plan has to sign up first. Remember the plan
// so checkout picks up right after (components/ResumeCheckout), instead of
// leaving them on Home with the plan forgotten.
const PENDING_KEY = 'hanbok_pending_checkout';
const PENDING_MAX_AGE_MS = 30 * 60 * 1000;

export const rememberCheckout = (priceId) => {
    try { localStorage.setItem(PENDING_KEY, JSON.stringify({ priceId, at: Date.now() })); } catch {}
};

// The remembered plan if it's recent, and forgets it either way.
export const takePendingCheckout = () => {
    try {
        const raw = localStorage.getItem(PENDING_KEY);
        localStorage.removeItem(PENDING_KEY);
        const pending = raw ? JSON.parse(raw) : null;
        if (!pending?.priceId || !PLAN_BY_PRICE_ID[pending.priceId]) return null;
        return Date.now() - pending.at <= PENDING_MAX_AGE_MS ? pending.priceId : null;
    } catch {
        return null;
    }
};

// Sends a signed-in user straight to Stripe Checkout. Returns false if the
// session couldn't be created, so the caller can fall back to /pricing.
export const startCheckout = async (priceId, extra = {}) => {
    track('checkout_start', { plan: PLAN_BY_PRICE_ID[priceId] || 'unknown', loggedIn: true, ...extra });
    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priceId }),
            credentials: 'include',
        });
        const { url } = await response.json();
        if (!url) return false;
        window.location.href = url;
        return true;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return false;
    }
};
