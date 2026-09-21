"use client";

import { useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PaymentForm from "@/components/PaymentForm";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

type Balance = {
  unitNumber: string;
  periodMonth: string;
  lateFeeApplied: number;
  baseAmount: number;
  cardFeeCents: number;
  cardTotal: number;
  achTotal: number;
};

type PaymentDetails = {
  clientSecret: string;
  amountDue: number;
  unitNumber: string;
  lateFeeApplied: number;
  method: "card" | "ach";
  cardFeeCents: number;
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function PayPage() {
  const [unitNumber, setUnitNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [noBalance, setNoBalance] = useState(false);
  const [choosing, setChoosing] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNoBalance(false);

    const res = await fetch("/api/lookup-balance", {
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
    if (data.noBalance) {
      setNoBalance(true);
      return;
    }
    setBalance(data);
  }

  async function choosePaymentMethod(method: "card" | "ach") {
    setChoosing(true);
    setError(null);

    const res = await fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitNumber, method }),
    });
    const data = await res.json();
    setChoosing(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
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

      {!balance && !details && (
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

      {balance && !details && (
        <div className="mt-8">
          <div className="mb-6 rounded-md border border-hairline bg-stone px-4 py-3 text-sm">
            <p>
              Unit <span className="font-medium">{balance.unitNumber}</span>
            </p>
            <p className="mt-1">
              Amount due: <span className="font-medium">{money(balance.baseAmount)}</span>
            </p>
            {balance.lateFeeApplied > 0 && (
              <p className="mt-1 text-rust">
                Includes a {money(balance.lateFeeApplied)} late fee.
              </p>
            )}
          </div>

          <p className="mb-3 text-sm font-medium text-ink/80">Choose how to pay:</p>

          <div className="space-y-3">
            <button
              onClick={() => choosePaymentMethod("ach")}
              disabled={choosing}
              className="w-full rounded-md border-2 border-evergreen px-4 py-4 text-left transition-colors hover:bg-evergreen/5 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Bank transfer (ACH)</span>
                <span className="font-display text-lg">{money(balance.achTotal)}</span>
              </div>
              <p className="mt-1 text-xs text-evergreen-dark">No fee</p>
            </button>

            <button
              onClick={() => choosePaymentMethod("card")}
              disabled={choosing}
              className="w-full rounded-md border border-hairline px-4 py-4 text-left transition-colors hover:border-evergreen disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Debit or credit card</span>
                <span className="font-display text-lg">{money(balance.cardTotal)}</span>
              </div>
              <p className="mt-1 text-xs text-ink/50">
                Includes a {money(balance.cardFeeCents)} card convenience fee
              </p>
            </button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-ink/50">
            The card convenience fee covers the processing cost charged to the
            association (2.9% + $0.30 per card payment), rounded up. It
            applies the same way to debit and credit cards. Paying by bank
            transfer (ACH) avoids this fee entirely.
          </p>

          {error && <p className="mt-4 rounded-md bg-rust/10 px-4 py-3 text-sm text-rust">{error}</p>}
          {choosing && <p className="mt-4 text-sm text-ink/60">Setting up payment…</p>}
        </div>
      )}

      {details && (
        <div className="mt-8">
          <div className="mb-6 rounded-md border border-hairline bg-stone px-4 py-3 text-sm">
            <p>
              Unit <span className="font-medium">{details.unitNumber}</span>
            </p>
            <p className="mt-1">
              Amount due: <span className="font-medium">{money(details.amountDue)}</span>
            </p>
            {details.cardFeeCents > 0 && (
              <p className="mt-1 text-ink/60">
                Includes a {money(details.cardFeeCents)} card convenience fee.
              </p>
            )}
          </div>

          {details.cardFeeCents > 0 && (
            <p className="mb-4 text-xs leading-relaxed text-ink/50">
              This fee covers the processing cost charged to the association
              (2.9% + $0.30 per card payment), rounded up, and applies the
              same way to debit and credit cards.
            </p>
          )}

          <Elements stripe={stripePromise} options={{ clientSecret: details.clientSecret }}>
            <PaymentForm amountDue={details.amountDue} />
          </Elements>
        </div>
      )}
    </main>
  );
}
