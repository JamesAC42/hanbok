// List prices in USD, shared by the pricing page and the plans popup.
export const PLAN_PRICES = {
    basic: {
        monthly: 4,
        yearly: 40, // $3/month billed yearly - 25% discount
    },
    plus: {
        monthly: 10,
        yearly: 99, // $8/month billed yearly - 20% discount
    }
};

// Yearly price after the deal from /api/pricing/offer, or null without one.
export const dealYearlyPrice = (plan, deal) => {
    const list = PLAN_PRICES[plan]?.yearly;
    if (!deal || !list) return null;
    if (deal.percentOff) return Math.round(list * (100 - deal.percentOff)) / 100;
    if (deal.amountOff) return Math.max(0, Math.round((list - deal.amountOff) * 100) / 100);
    return null;
};

// "$69.30" or "$70": drop cents when there are none.
export const formatPrice = (amount) =>
    `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;

// Short headline for the deal: "30% off" or "$20 off".
export const dealAmountLabel = (deal) =>
    deal?.percentOff ? `${deal.percentOff}% off` : deal?.amountOff ? `${formatPrice(deal.amountOff)} off` : '';

// How long the discount lasts once you subscribe.
export const dealDurationLabel = (deal) => {
    if (!deal) return '';
    if (deal.duration === 'forever') return 'every year you stay';
    if (deal.duration === 'repeating' && deal.durationInMonths > 12) return `for ${deal.durationInMonths} months`;
    return 'your first year';
};

// "Ends Tuesday, October 20", in the visitor's time zone.
export const dealEndsLabel = (deal) => {
    if (!deal?.endsAt) return '';
    const date = new Date(deal.endsAt);
    if (Number.isNaN(date.getTime())) return '';
    return `Ends ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
};
