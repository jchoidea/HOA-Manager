"use client";

import { useEffect, useState } from "react";

type Unit = {
  id: string;
  unit_number: string;
  owner_name: string;
  owner_email: string;
  dues_charges: DuesCharge[];
};

type DuesCharge = {
  id: string;
  period_month: string;
  amount_due_cents: number;
  late_fee_applied_cents: number;
  status: "pending" | "late" | "paid" | "waived";
  due_date: string;
};

type Vendor = {
  id: string;
  name: string;
  default_category: string | null;
  vendor_bills: VendorBill[];
};

type VendorBill = {
  id: string;
  description: string;
  amount_cents: number;
  status: "unpaid" | "scheduled" | "paid";
  due_date: string | null;
};

type Settings = {
  monthly_dues_cents: number;
  late_fee_cents: number;
  grace_period_days: number;
  due_day_of_month: number;
  company_name: string;
  card_convenience_fee_cents: number;
};

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [tab, setTab] = useState<"units" | "vendors" | "settings">("units");
  const [units, setUnits] = useState<Unit[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  async function loadData() {
    const res = await fetch("/api/admin/data");
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await res.json();
    setUnits(data.units || []);
    setVendors(data.vendors || []);
    setSettings(data.settings || null);
    setAuthed(true);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setLoginError("Incorrect password.");
      return;
    }
    await loadData();
  }

  async function runAction(action: string, payload: any) {
    await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    await loadData();
  }

  if (authed === null) {
    return <main className="p-10 text-sm text-ink/60">Loading…</main>;
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <h1 className="font-display text-2xl">Admin sign in</h1>
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-md border border-hairline bg-white px-4 py-2.5 text-sm outline-none focus:border-evergreen focus:ring-1 focus:ring-evergreen"
          />
          {loginError && <p className="text-sm text-rust">{loginError}</p>}
          <button className="w-full rounded-full bg-evergreen px-6 py-3 text-sm font-medium text-paper hover:bg-evergreen-dark">
            Sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">{settings?.company_name ?? "Admin"}</h1>
        <nav className="flex gap-1 rounded-full bg-stone p-1 text-sm">
          {(["units", "vendors", "settings"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 capitalize transition-colors ${
                tab === t ? "bg-evergreen text-paper" : "text-ink/70 hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {tab === "units" && <UnitsTab units={units} runAction={runAction} />}
      {tab === "vendors" && <VendorsTab vendors={vendors} runAction={runAction} />}
      {tab === "settings" && settings && <SettingsTab settings={settings} runAction={runAction} />}
    </main>
  );
}

function statusColor(status: string) {
  if (status === "paid") return "text-evergreen-dark";
  if (status === "late") return "text-rust";
  return "text-ink/60";
}

function UnitsTab({ units, runAction }: { units: Unit[]; runAction: (a: string, p: any) => void }) {
  const [newUnit, setNewUnit] = useState({ unitNumber: "", ownerName: "", ownerEmail: "", ownerPhone: "" });

  return (
    <section className="mt-8 space-y-8">
      <div className="overflow-hidden rounded-md border border-hairline">
        <table className="w-full text-sm">
          <thead className="bg-stone text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Current period</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => {
              const openCharge = unit.dues_charges
                ?.filter((c) => c.status !== "paid" && c.status !== "waived")
                .sort((a, b) => a.period_month.localeCompare(b.period_month))[0];

              return (
                <tr key={unit.id} className="border-t border-hairline">
                  <td className="px-4 py-3 font-medium">{unit.unit_number}</td>
                  <td className="px-4 py-3">
                    {unit.owner_name}
                    <div className="text-xs text-ink/50">{unit.owner_email}</div>
                  </td>
                  <td className="px-4 py-3">{openCharge ? openCharge.period_month : "—"}</td>
                  <td className="px-4 py-3">
                    {openCharge ? money(openCharge.amount_due_cents + openCharge.late_fee_applied_cents) : "—"}
                  </td>
                  <td className={`px-4 py-3 capitalize ${openCharge ? statusColor(openCharge.status) : "text-ink/40"}`}>
                    {openCharge ? openCharge.status : "current"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {openCharge && (
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() =>
                            runAction("record_manual_payment", {
                              duesChargeId: openCharge.id,
                              unitId: unit.id,
                              amountCents: openCharge.amount_due_cents + openCharge.late_fee_applied_cents,
                              notes: "Recorded manually by admin",
                            })
                          }
                          className="text-xs font-medium text-evergreen-dark hover:underline"
                        >
                          Mark paid
                        </button>
                        {openCharge.late_fee_applied_cents > 0 && (
                          <button
                            onClick={() => runAction("waive_late_fee", { duesChargeId: openCharge.id })}
                            className="text-xs font-medium text-ink/50 hover:underline"
                          >
                            Waive fee
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="font-display text-lg">Add a unit</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAction("add_unit", newUnit);
            setNewUnit({ unitNumber: "", ownerName: "", ownerEmail: "", ownerPhone: "" });
          }}
          className="mt-3 grid gap-3 md:grid-cols-4"
        >
          <input
            required
            placeholder="Unit number"
            value={newUnit.unitNumber}
            onChange={(e) => setNewUnit({ ...newUnit, unitNumber: e.target.value })}
            className="rounded-md border border-hairline px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Owner name"
            value={newUnit.ownerName}
            onChange={(e) => setNewUnit({ ...newUnit, ownerName: e.target.value })}
            className="rounded-md border border-hairline px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            placeholder="Owner email"
            value={newUnit.ownerEmail}
            onChange={(e) => setNewUnit({ ...newUnit, ownerEmail: e.target.value })}
            className="rounded-md border border-hairline px-3 py-2 text-sm"
          />
          <input
            placeholder="Phone (optional)"
            value={newUnit.ownerPhone}
            onChange={(e) => setNewUnit({ ...newUnit, ownerPhone: e.target.value })}
            className="rounded-md border border-hairline px-3 py-2 text-sm"
          />
          <button className="rounded-full bg-evergreen px-5 py-2 text-sm font-medium text-paper hover:bg-evergreen-dark md:col-span-4 md:w-fit">
            Add unit
          </button>
        </form>
      </div>
    </section>
  );
}

function VendorsTab({ vendors, runAction }: { vendors: Vendor[]; runAction: (a: string, p: any) => void }) {
  const [newVendor, setNewVendor] = useState({ name: "", contactEmail: "", contactPhone: "", category: "", notes: "" });
  const [newBill, setNewBill] = useState({ vendorId: "", description: "", amountCents: "", billDate: "", dueDate: "" });

  return (
    <section className="mt-8 space-y-10">
      <div>
        <h2 className="font-display text-lg">Vendor bills</h2>
        <div className="mt-3 overflow-hidden rounded-md border border-hairline">
          <table className="w-full text-sm">
            <thead className="bg-stone text-left text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {vendors.flatMap((vendor) =>
                (vendor.vendor_bills || []).map((bill) => (
                  <tr key={bill.id} className="border-t border-hairline">
                    <td className="px-4 py-3 font-medium">{vendor.name}</td>
                    <td className="px-4 py-3">{bill.description}</td>
                    <td className="px-4 py-3">{money(bill.amount_cents)}</td>
                    <td className="px-4 py-3">{bill.due_date ?? "—"}</td>
                    <td className={`px-4 py-3 capitalize ${bill.status === "paid" ? "text-evergreen-dark" : "text-ink/60"}`}>
                      {bill.status}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {bill.status !== "paid" && (
                        <button
                          onClick={() => {
                            const ref = window.prompt("Payment reference (check #, ACH confirmation, etc.) — optional:");
                            runAction("mark_vendor_bill_paid", { billId: bill.id, paymentReference: ref || null });
                          }}
                          className="text-xs font-medium text-evergreen-dark hover:underline"
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-ink/50">
          "Mark paid" only updates these records. Send the actual ACH or check through your bank first.
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-display text-lg">Add a vendor</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAction("add_vendor", newVendor);
              setNewVendor({ name: "", contactEmail: "", contactPhone: "", category: "", notes: "" });
            }}
            className="mt-3 space-y-3"
          >
            <input
              required
              placeholder="Vendor name"
              value={newVendor.name}
              onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
              className="w-full rounded-md border border-hairline px-3 py-2 text-sm"
            />
            <input
              placeholder="Category (e.g. Landscaping)"
              value={newVendor.category}
              onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
              className="w-full rounded-md border border-hairline px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Contact email"
              value={newVendor.contactEmail}
              onChange={(e) => setNewVendor({ ...newVendor, contactEmail: e.target.value })}
              className="w-full rounded-md border border-hairline px-3 py-2 text-sm"
            />
            <button className="rounded-full bg-evergreen px-5 py-2 text-sm font-medium text-paper hover:bg-evergreen-dark">
              Add vendor
            </button>
          </form>
        </div>

        <div>
          <h2 className="font-display text-lg">Add a bill</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAction("add_vendor_bill", {
                ...newBill,
                amountCents: Math.round(parseFloat(newBill.amountCents) * 100),
              });
              setNewBill({ vendorId: "", description: "", amountCents: "", billDate: "", dueDate: "" });
            }}
            className="mt-3 space-y-3"
          >
            <select
              required
              value={newBill.vendorId}
              onChange={(e) => setNewBill({ ...newBill, vendorId: e.target.value })}
              className="w-full rounded-md border border-hairline px-3 py-2 text-sm"
            >
              <option value="">Select vendor…</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Description (e.g. September landscaping)"
              value={newBill.description}
              onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
              className="w-full rounded-md border border-hairline px-3 py-2 text-sm"
            />
            <input
              required
              type="number"
              step="0.01"
              placeholder="Amount ($)"
              value={newBill.amountCents}
              onChange={(e) => setNewBill({ ...newBill, amountCents: e.target.value })}
              className="w-full rounded-md border border-hairline px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={newBill.dueDate}
              onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })}
              className="w-full rounded-md border border-hairline px-3 py-2 text-sm"
            />
            <button className="rounded-full bg-evergreen px-5 py-2 text-sm font-medium text-paper hover:bg-evergreen-dark">
              Add bill
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function SettingsTab({ settings, runAction }: { settings: Settings; runAction: (a: string, p: any) => void }) {
  const [form, setForm] = useState({
    companyName: settings.company_name,
    monthlyDues: (settings.monthly_dues_cents / 100).toString(),
    lateFee: (settings.late_fee_cents / 100).toString(),
    gracePeriodDays: settings.grace_period_days.toString(),
    dueDayOfMonth: settings.due_day_of_month.toString(),
  });

  return (
    <section className="mt-8 max-w-md">
      <h2 className="font-display text-lg">Company settings</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runAction("update_settings", {
            companyName: form.companyName,
            monthlyDuesCents: Math.round(parseFloat(form.monthlyDues) * 100),
            lateFeeCents: Math.round(parseFloat(form.lateFee) * 100),
            gracePeriodDays: parseInt(form.gracePeriodDays, 10),
            dueDayOfMonth: parseInt(form.dueDayOfMonth, 10),
          });
        }}
        className="mt-4 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-ink/80">Company name</label>
          <input
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Monthly dues ($)</label>
          <input
            type="number"
            step="0.01"
            value={form.monthlyDues}
            onChange={(e) => setForm({ ...form, monthlyDues: e.target.value })}
            className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Late fee ($)</label>
          <input
            type="number"
            step="0.01"
            value={form.lateFee}
            onChange={(e) => setForm({ ...form, lateFee: e.target.value })}
            className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Grace period (days)</label>
          <input
            type="number"
            value={form.gracePeriodDays}
            onChange={(e) => setForm({ ...form, gracePeriodDays: e.target.value })}
            className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/80">Dues due day of month</label>
          <input
            type="number"
            min="1"
            max="28"
            value={form.dueDayOfMonth}
            onChange={(e) => setForm({ ...form, dueDayOfMonth: e.target.value })}
            className="mt-1 w-full rounded-md border border-hairline px-3 py-2 text-sm"
          />
        </div>
        <button className="rounded-full bg-evergreen px-6 py-2.5 text-sm font-medium text-paper hover:bg-evergreen-dark">
          Save settings
        </button>
      </form>
    </section>
  );
}
