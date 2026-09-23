# Quartz Property Group — website + dues & bookkeeping system

A small web app for managing a 12-unit community: a public site, an online
dues payment portal (card + ACH), and an admin dashboard for tracking who's
paid, applying late fees automatically, and logging vendor bills.

## What this does — and doesn't — do

**Does:**
- Public website with a "Pay dues" page
- Owners pay monthly dues online by card or bank account (ACH debit) via Stripe
- Automatically generates each month's charge per unit
- Automatically applies a late fee (default $50) if a charge is still unpaid
  15 days after the due date (both numbers are editable in Settings)
- Admin dashboard: see every unit's balance, mark manual payments (check/cash),
  waive late fees, manage vendors and their bills, edit settings

**Doesn't (and can't, out of the box):**
- **Send money out via ACH to vendors.** Stripe (as configured here) is only
  set up to *collect* money from owners. Actually transmitting ACH payments
  to your landscaper, insurer, etc. requires bank-level rails — use your
  business bank's bill-pay feature, or a tool like Bill.com or Melio. This
  app tracks those bills (amount, due date, paid/unpaid) so your books stay
  accurate; you execute the actual transfer elsewhere and mark it paid here.

### Using Bill.com for vendor payments

This app is set up to work alongside Bill.com's own dashboard, no API
integration required:

1. Enter the vendor bill under the **Vendors** tab in `/admin` — this is
   your permanent record of what's owed.
2. Log into Bill.com separately and pay the vendor there. Bill.com handles
   the actual ACH transmission to the vendor.
3. Back in `/admin`, click **Mark paid** on that bill. You'll be prompted
   for a payment reference — paste in Bill.com's confirmation number so
   your records stay tied together.

This means you're entering each vendor bill in two places (this app, and
Bill.com), but nothing more complex than that — no API keys, no approval
process. If that double entry becomes annoying as the vendor list grows,
the next step up is a CSV export from this app's vendor bills that you
import into Bill.com; ask if you want that added later.

---

## One-time setup

You'll need three free accounts: **Supabase** (database), **Stripe**
(payments), and **Vercel** (hosting). Total cost to run this is $0/month
until you have real payment volume (Stripe takes a small % + $0.30 per card
transaction, and a smaller % for ACH, capped — see stripe.com/pricing).

### 1. Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, go to **SQL Editor**, paste the contents of
   `supabase/schema.sql` from this project, and run it. This creates all the
   tables (units, dues charges, payments, vendors, vendor bills, settings).
3. Go to **Project Settings → API**. Copy the **Project URL** and the
   **service_role key** (not the anon key — the service role key is needed
   for the server to read/write freely). You'll paste these into your `.env`
   file below.

### 2. Payments (Stripe)

1. Create a free account at [stripe.com](https://stripe.com).
2. In the dashboard, make sure you're in **Test mode** (toggle top-right)
   while you're setting things up.
3. Go to **Developers → API keys**. Copy the **Publishable key** and
   **Secret key**.
4. Go to **Settings → Payment methods** and make sure **US bank account
   (ACH Direct Debit)** is enabled, alongside cards.
5. Once you deploy (step 4 below) and have a live URL, come back to
   **Developers → Webhooks**, click **Add endpoint**, and set the URL to:
   `https://your-site.vercel.app/api/stripe-webhook`. Select the event
   `payment_intent.succeeded` (and `payment_intent.payment_failed` if you
   want failure logging). Copy the **Signing secret** it gives you.
6. When you're ready to accept real payments, flip to **Live mode** in
   Stripe, repeat steps 3–5 for your live keys, and swap them into your
   Vercel environment variables.

### 3. Email notifications (Resend)

Owners get an automatic email when a late fee is applied, and a receipt
when a payment goes through.

1. Create a free account at [resend.com](https://resend.com) (3,000
   emails/month free — plenty for 12 units).
2. Go to **API Keys** and create one. Copy it for `RESEND_API_KEY` below.
3. To start, you can leave `FROM_EMAIL` as the default shared testing
   address — emails will send right away, no setup needed. When you're
   ready for emails to come from your own domain (e.g.
   `dues@cascadecommunitymanagement.com`), verify that domain under
   **Domains** in Resend, then update `FROM_EMAIL` to match.

### 4. Hosting (Vercel)

1. Push this project to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), click **Add New → Project**, and
   import that repository.
3. Before deploying, add all the environment variables from `.env.example`
   under **Settings → Environment Variables**:

   | Variable | Where it comes from |
   |---|---|
   | `SUPABASE_URL` | Supabase → Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
   | `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe → Developers → API keys |
   | `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks (after step 2.5 above) |
   | `RESEND_API_KEY` | Resend → API Keys |
   | `FROM_EMAIL` | Leave as the default, or your verified domain address |
   | `SITE_URL` | Your Vercel URL once deployed — you can add this after the first deploy and redeploy |
   | `ADMIN_PASSWORD` | Make up a strong password |
   | `ADMIN_SESSION_SECRET` | Run `openssl rand -base64 32` in a terminal |
   | `CRON_SECRET` | Run `openssl rand -hex 16` in a terminal |

4. Click **Deploy**. Vercel will give you a URL like
   `https://cascade-community.vercel.app`. You can add a custom domain later
   under **Settings → Domains**.
5. The daily automation (`vercel.json`) is picked up automatically — Vercel
   will run the late-fee/charge-generation check once a day. No extra setup
   needed, though scheduled Cron Jobs require Vercel's Hobby (free, 1 cron
   max) or Pro plan — the Hobby plan is enough for this.

### 5. Add your 12 units

Go to `https://your-site.vercel.app/admin`, log in with the `ADMIN_PASSWORD`
you set, and add each unit under the **Units** tab (unit number, owner name,
email). Once a unit exists, the first dues charge will be created
automatically on the configured due day of the month — or you can insert one
manually via the Supabase table editor to start right away.

Set your real dues amount and late fee under the **Settings** tab (defaults
are $300/month dues and a $50 late fee with a 15-day grace period).

---

## Running it locally (optional, for testing before you deploy)

```bash
npm install
cp .env.example .env.local   # fill in your real values
npm run dev
```

Visit `http://localhost:3000`. Use Stripe's test card `4242 4242 4242 4242`
(any future expiry, any CVC) to test card payments, or Stripe's test bank
account details (see Stripe's ACH testing docs) for ACH.

To test the daily cron job locally, visit:
`http://localhost:3000/api/cron/daily` with header
`Authorization: Bearer <your CRON_SECRET>`.

---

## A note on Washington law

Washington's HOA/condo statutes (RCW 64.34 for condominiums, RCW 64.38 for
homeowners' associations generally) govern how assessments and late fees can
be charged. This app enforces whatever late fee and grace period you enter,
but it doesn't know what your governing documents or state law actually
allow — worth a quick check with your CC&Rs/bylaws or an attorney before you
finalize the numbers. This isn't legal advice.

## Project structure

```
app/
  page.tsx                  Public homepage
  pay/page.tsx               Owner dues payment page
  admin/page.tsx              Admin dashboard (login + units/vendors/settings)
  api/
    create-payment-intent/   Starts a Stripe payment for a unit
    stripe-webhook/          Records successful payments
    cron/daily/               Generates monthly charges + applies late fees
    admin/login/               Admin password check
    admin/data/                 Dashboard data for the admin UI
    admin/actions/               Manual payments, vendor bills, settings, etc.
lib/                          Supabase/Stripe/auth helpers
supabase/schema.sql            Database schema — run this once in Supabase
```
