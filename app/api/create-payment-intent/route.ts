import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

// Called from the /pay page AFTER the resident has already seen both totals
// (via /api/lookup-balance) and picked a method. The amount and allowed
// payment method are both locked in server-side based on that choice, so
// the card convenience fee can never be silently added or skipped.
export async function POST(req: NextRequest) {
  try {
    const { unitNumber, method } = await req.json();
    if (!unitNumber) {
      return NextResponse.json({ error: "Unit number is required." }, { status: 400 });
    }
    if (method !== "card" && method !== "ach") {
      return NextResponse.json({ error: "A payment method (card or ach) is required." }, { status: 400 });
    }

    const db = supabaseAdmin();

    const { data: unit, error: unitError } = await db
      .from("units")
      .select("*")
      .eq("unit_number", unitNumber)
      .eq("active", true)
      .single();

    if (unitError || !unit) {
      return NextResponse.json({ error: "We couldn't find that unit. Check the number and try again." }, { status: 404 });
    }

    const { data: charge, error: chargeError } = await db
      .from("dues_charges")
      .select("*")
      .eq("unit_id", unit.id)
      .in("status", ["pending", "late"])
      .order("period_month", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (chargeError) {
      return NextResponse.json({ error: "Something went wrong looking up your balance." }, { status: 500 });
    }

    if (!charge) {
      return NextResponse.json({ noBalance: true });
    }

    const { data: settings } = await db.from("settings").select("*").eq("id", 1).single();
    const cardFeeCents = settings?.card_convenience_fee_cents ?? 1000;

    const baseAmount = charge.amount_due_cents + (charge.late_fee_applied_cents || 0);
    // The convenience fee applies only when the resident chose "card" — it's
    // a flat fee for using the card payment channel at all (credit or
    // debit alike), never conditioned on the card being specifically a
    // credit card. That distinction is what keeps this clear of the
    // federal ban on debit card surcharging.
    const amountDue = method === "card" ? baseAmount + cardFeeCents : baseAmount;

    const stripeClient = stripe();

    let customerId = unit.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripeClient.customers.create({
        name: unit.owner_name,
        email: unit.owner_email,
        metadata: { unit_id: unit.id, unit_number: unit.unit_number },
      });
      customerId = customer.id;
      await db.from("units").update({ stripe_customer_id: customerId }).eq("id", unit.id);
    }

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountDue,
      currency: "usd",
      customer: customerId,
      // Restricted to exactly the one method the resident chose — this is
      // what makes the fee enforceable rather than optional at checkout.
      payment_method_types: method === "card" ? ["card"] : ["us_bank_account"],
      metadata: {
        unit_id: unit.id,
        unit_number: unit.unit_number,
        dues_charge_id: charge.id,
        method,
        card_fee_cents: method === "card" ? String(cardFeeCents) : "0",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amountDue,
      unitNumber: unit.unit_number,
      periodMonth: charge.period_month,
      lateFeeApplied: charge.late_fee_applied_cents || 0,
      method,
      cardFeeCents: method === "card" ? cardFeeCents : 0,
    });
  } catch (err: any) {
    console.error("create-payment-intent error", err);
    return NextResponse.json({ error: "Unexpected error creating payment." }, { status: 500 });
  }
}
