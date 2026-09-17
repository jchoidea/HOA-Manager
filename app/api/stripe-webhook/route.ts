import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPaymentReceivedEmail } from "@/lib/email";
import Stripe from "stripe";

// Stripe calls this URL directly (not the browser), so we verify the
// request really came from Stripe using the webhook signing secret.
// Configure this endpoint's URL in the Stripe Dashboard -> Developers -> Webhooks.
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed", err.message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const db = supabaseAdmin();

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { unit_id, dues_charge_id } = intent.metadata || {};

    if (unit_id && dues_charge_id) {
      // Record the payment
      await db.from("payments").insert({
        dues_charge_id,
        unit_id,
        amount_cents: intent.amount_received,
        method: intent.payment_method_types.includes("us_bank_account") ? "ach" : "card",
        stripe_payment_intent_id: intent.id,
        status: "succeeded",
      });

      // Mark the dues charge paid
      await db
        .from("dues_charges")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", dues_charge_id);

      await db.from("activity_log").insert({
        event: "payment_succeeded",
        detail: { unit_id, dues_charge_id, amount_cents: intent.amount_received },
      });

      const { data: unit } = await db
        .from("units")
        .select("unit_number, owner_name, owner_email")
        .eq("id", unit_id)
        .single();

      if (unit?.owner_email) {
        await sendPaymentReceivedEmail({
          to: unit.owner_email,
          ownerName: unit.owner_name,
          unitNumber: unit.unit_number,
          amountCents: intent.amount_received,
        });
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    await db.from("activity_log").insert({
      event: "payment_failed",
      detail: { payment_intent_id: intent.id, metadata: intent.metadata },
    });
  }

  return NextResponse.json({ received: true });
}
