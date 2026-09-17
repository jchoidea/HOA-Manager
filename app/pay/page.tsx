"use client";

import { useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "@/components/PaymentForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

type PaymentDetails = {
  clientSecret: string;
  amountDue: number;
  unitNumber: string;
  lateFeeApplied: number;
};

export default function PayPage() {
  const [unitNumber, setUnitNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [noBalance, setNoBalance] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNoBalance(false);

    const res = await fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitNumber }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    if (!data.clientSecret) {
      setNoBalance(true);
      return;
    }
    setDetails(data);
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-6 py-16">
      <Link href="/" className="text-sm text-ink/60 hover:text-ink">
        ← Back home
      </Link>

      <h1 className="mt-6 font-display text-3xl">Pay your dues</h1>
      <p className="mt-2 text-sm text-ink/70">
        Enter your unit number to look up your balance.
      </p>

      {!details && (
        <form onSubmit={handleLookup} className="mt-8 space-y-4">
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-ink/80">
              Unit number
            </label>
            <input
              id="unit"
              type="text"
              required
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              placeholder="e.g. 4"
              className="mt-1 w-full rounded-md border border-hairline bg-white px-4 py-2.5 text-sm outline-none focus:border-evergreen focus:ring-1 focus:ring-evergreen"
            />
          </div>

          {error && <p className="rounded-md bg-rust/10 px-4 py-3 text-sm text-rust">{error}</p>}
          {noBalance && (
            <p className="rounded-md bg-evergreen/10 px-4 py-3 text-sm text-evergreen-dark">
              You're all paid up — no balance due right now.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-evergreen px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-evergreen-dark disabled:opacity-50"
          >
            {loading ? "Looking up…" : "Look up balance"}
          </button>
        </form>
      )}

      {details && (
        <div className="mt-8">
          <div className="mb-6 rounded-md border border-hairline bg-stone px-4 py-3 text-sm">
            <p>
              Unit <span className="font-medium">{details.unitNumber}</span>
            </p>
            <p className="mt-1">
              Amount due: <span className="font-medium">${(details.amountDue / 100).toFixed(2)}</span>
            </p>
            {details.lateFeeApplied > 0 && (
              <p className="mt-1 text-rust">
                Includes a ${(details.lateFeeApplied / 100).toFixed(2)} late fee.
              </p>
            )}
          </div>

          <Elements stripe={stripePromise} options={{ clientSecret: details.clientSecret }}>
            <PaymentForm amountDue={details.amountDue} />
          </Elements>
        </div>
      )}
    </main>
  );
}
