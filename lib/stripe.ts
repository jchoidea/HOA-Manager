import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function stripe() {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
    }
    stripeInstance = new Stripe(key, {
      apiVersion: "2024-06-20",
    });
  }
  return stripeInstance;
}
