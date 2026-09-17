"use client";

import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";

export default function PaymentForm({ amountDue }: { amountDue: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pay/success`,
      },
    });

    if (error) {
      setErrorMessage(error.message ?? "Something went wrong processing your payment.");
      setSubmitting(false);
    }
    // On success, Stripe redirects to return_url automatically.
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {errorMessage && (
        <p className="rounded-md bg-rust/10 px-4 py-3 text-sm text-rust">{errorMessage}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-full bg-evergreen px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-evergreen-dark disabled:opacity-50"
      >
        {submitting ? "Processing…" : `Pay $${(amountDue / 100).toFixed(2)}`}
      </button>
    </form>
  );
}
