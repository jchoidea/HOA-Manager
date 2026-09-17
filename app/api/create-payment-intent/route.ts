import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

// Called from the /pay page once the owner picks their unit.
// Creates (or reuses) a Stripe Customer for the unit, finds their oldest
// unpaid dues charge, and returns a PaymentIntent client secret so the
// browser can collect card or ACH bank details via Stripe Elements.
export async function POST(req: NextRequest) {
  try {
    const { unitNumber } = await req.json();
    if (!unitNumber) {
      return NextResponse.json({ error: "Unit number is required." }, { status: 400 });
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

    // Find the oldest unpaid or late charge for this unit
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
      return NextResponse.json({ error: "No balance due — you're all paid up." }, { status: 200 });
    }

    const amountDue = charge.amount_due_cents + (charge.late_fee_applied_cents || 0);

    const stripeClient = stripe();

    // Reuse or create a Stripe Customer for this unit so repeat payments
    // (and future ACH mandates) are tied to the same customer record.
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
      payment_method_types: ["card", "us_bank_account"],
      metadata: {
        unit_id: unit.id,
        unit_number: unit.unit_number,
        dues_charge_id: charge.id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amountDue,
      unitNumber: unit.unit_number,
      periodMonth: charge.period_month,
      lateFeeApplied: charge.late_fee_applied_cents || 0,
    });
  } catch (err: any) {
    console.error("create-payment-intent error", err);
    return NextResponse.json({ error: "Unexpected error creating payment." }, { status: 500 });
  }
}
