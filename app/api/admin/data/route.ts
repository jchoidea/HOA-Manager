import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = supabaseAdmin();

  const { data: units } = await db
    .from("units")
    .select("*, dues_charges(*)")
    .order("unit_number", { ascending: true });

  const { data: vendors } = await db
    .from("vendors")
    .select("*, vendor_bills(*)")
    .order("name", { ascending: true });

  const { data: recentPayments } = await db
    .from("payments")
    .select("*, units(unit_number, owner_name)")
    .order("received_at", { ascending: false })
    .limit(25);

  const { data: settings } = await db.from("settings").select("*").eq("id", 1).single();

  return NextResponse.json({ units, vendors, recentPayments, settings });
}
