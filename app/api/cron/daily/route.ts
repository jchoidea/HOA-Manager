import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendLateFeeEmail } from "@/lib/email";

// This runs once a day (see vercel.json for the schedule). It does two things:
//   1. On the settings' due_day_of_month, generate this month's dues_charges
//      for every active unit (if they don't already exist).
//   2. For any charge that's still "pending" and past due_date + grace_period_days,
//      mark it "late" and add the flat late fee — exactly once.
//
// Vercel Cron calls this with a GET request and includes a bearer token
// (CRON_SECRET) so random internet traffic can't trigger it.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = supabaseAdmin();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const { data: settingsRows } = await db.from("settings").select("*").eq("id", 1).single();
  const settings = settingsRows;
  if (!settings) {
    return NextResponse.json({ error: "Settings row missing." }, { status: 500 });
  }

  const results = { chargesCreated: 0, lateFeesApplied: 0 };

  // --- Step 1: generate this month's charges, once per month ---------------
  if (today.getDate() === settings.due_day_of_month) {
    const periodMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const dueDate = periodMonth; // due the same configured day, this simple version uses the 1st

    const { data: units } = await db.from("units").select("id").eq("active", true);

    for (const unit of units || []) {
      const { data: existing } = await db
        .from("dues_charges")
        .select("id")
        .eq("unit_id", unit.id)
        .eq("period_month", periodMonth)
        .maybeSingle();

      if (!existing) {
        await db.from("dues_charges").insert({
          unit_id: unit.id,
          period_month: periodMonth,
          amount_due_cents: settings.monthly_dues_cents,
          due_date: dueDate,
          status: "pending",
        });
        results.chargesCreated++;
      }
    }
  }

  // --- Step 2: apply late fees to anything past the grace period -----------
  const { data: pendingCharges } = await db
    .from("dues_charges")
    .select("*, units(unit_number, owner_name, owner_email)")
    .eq("status", "pending");

  const siteUrl = process.env.SITE_URL || "";

  for (const charge of pendingCharges || []) {
    const dueDate = new Date(charge.due_date);
    const graceDeadline = new Date(dueDate);
    graceDeadline.setDate(graceDeadline.getDate() + settings.grace_period_days);

    if (today > graceDeadline) {
      await db
        .from("dues_charges")
        .update({
          status: "late",
          late_fee_applied_cents: settings.late_fee_cents,
        })
        .eq("id", charge.id);

      await db.from("activity_log").insert({
        event: "late_fee_applied",
        detail: { dues_charge_id: charge.id, unit_id: charge.unit_id, amount_cents: settings.late_fee_cents },
      });

      const unit = (charge as any).units;
      if (unit?.owner_email) {
        await sendLateFeeEmail({
          to: unit.owner_email,
          ownerName: unit.owner_name,
          unitNumber: unit.unit_number,
          periodMonth: charge.period_month,
          amountDueCents: charge.amount_due_cents,
          lateFeeCents: settings.late_fee_cents,
          payUrl: `${siteUrl}/pay`,
        });
      }

      results.lateFeesApplied++;
    }
  }

  return NextResponse.json({ ok: true, date: todayStr, ...results });
}
