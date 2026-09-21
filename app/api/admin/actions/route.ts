import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/requireAdmin";

// A single action endpoint keeps the admin API small. Each action is a
// distinct, auditable operation — see the activity_log insert at the end.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { action, payload } = await req.json();
  const db = supabaseAdmin();

  switch (action) {
    case "record_manual_payment": {
      // For checks, cash, or Zelle — anything paid outside Stripe
      const { duesChargeId, unitId, amountCents, notes } = payload;
      await db.from("payments").insert({
        dues_charge_id: duesChargeId,
        unit_id: unitId,
        amount_cents: amountCents,
        method: "manual",
        status: "succeeded",
        notes,
      });
      await db
        .from("dues_charges")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", duesChargeId);
      break;
    }

    case "waive_late_fee": {
      const { duesChargeId } = payload;
      await db
        .from("dues_charges")
        .update({ late_fee_applied_cents: 0, status: "pending" })
        .eq("id", duesChargeId);
      break;
    }

    case "add_unit": {
      const { unitNumber, ownerName, ownerEmail, ownerPhone } = payload;
      await db.from("units").insert({
        unit_number: unitNumber,
        owner_name: ownerName,
        owner_email: ownerEmail,
        owner_phone: ownerPhone,
      });
      break;
    }

    case "add_vendor": {
      const { name, contactEmail, contactPhone, category, notes } = payload;
      await db.from("vendors").insert({
        name,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        default_category: category,
        notes,
      });
      break;
    }

    case "add_vendor_bill": {
      const { vendorId, description, amountCents, billDate, dueDate } = payload;
      await db.from("vendor_bills").insert({
        vendor_id: vendorId,
        description,
        amount_cents: amountCents,
        bill_date: billDate,
        due_date: dueDate,
      });
      break;
    }

    case "mark_vendor_bill_paid": {
      // You've sent the ACH/check via your bank — this just records it here
      const { billId, paymentReference } = payload;
      await db
        .from("vendor_bills")
        .update({ status: "paid", paid_at: new Date().toISOString(), payment_reference: paymentReference })
        .eq("id", billId);
      break;
    }

    case "update_settings": {
      const { monthlyDuesCents, lateFeeCents, gracePeriodDays, dueDayOfMonth, companyName, cardConvenienceFeeCents } = payload;
      await db
        .from("settings")
        .update({
          monthly_dues_cents: monthlyDuesCents,
          late_fee_cents: lateFeeCents,
          grace_period_days: gracePeriodDays,
          due_day_of_month: dueDayOfMonth,
          company_name: companyName,
          card_convenience_fee_cents: cardConvenienceFeeCents,
        })
        .eq("id", 1);
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  await db.from("activity_log").insert({ event: `admin_action:${action}`, detail: payload });

  return NextResponse.json({ ok: true });
}
