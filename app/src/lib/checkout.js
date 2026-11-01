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
