import Stripe from "stripe";

// Define credit plans with their cost in USD
export const creditPlans = {
    basic: { credits: 100, amount: 5 },
    pro: { credits: 400, amount: 19 },
    enterprise: { credits: 1000, amount: 49 },
} as const;

// Create a type that represents the keys of the creditPlans object
export type CreditPlanId = keyof typeof creditPlans;

export const getCreditPlan = (planId: string) => {
    return creditPlans[planId as CreditPlanId];
};

export const createCreditCheckoutSession = async ({
    origin,
    transactionId,
    credits,
    amount,
}: {
    origin: string;
    transactionId: string;
    credits: number;
    amount: number;
}) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

    return stripe.checkout.sessions.create({
        success_url: `${origin}/loading`,
        cancel_url: `${origin}`,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `AI website builder - ${credits} credits`,
                    },
                    unit_amount: Math.floor(amount) * 100,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        metadata: {
            transactionId,
            appId: 'ai-website-builder',
        },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, //Session expires in 30 minutes
    });
};
