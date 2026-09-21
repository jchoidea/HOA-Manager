import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Step 1 of the pay flow: look up what's owed, and show the resident both
// payment options with their true totals BEFORE they pick one. This is what
// makes the card convenience fee properly "disclosed before payment" rather
// than a surprise added after they've already started entering card details.
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

    return NextResponse.json({
      unitNumber: unit.unit_number,
      periodMonth: charge.period_month,
      lateFeeApplied: charge.late_fee_applied_cents || 0,
      baseAmount,
      cardFeeCents,
      cardTotal: baseAmount + cardFeeCents,
      achTotal: baseAmount,
    });
  } catch (err: any) {
    console.error("lookup-balance error", err);
    return NextResponse.json({ error: "Unexpected error looking up your balance." }, { status: 500 });
  }
}
