import { Resend } from "resend";

let resendInstance: Resend | null = null;

function resend() {
  if (!resendInstance) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("Missing RESEND_API_KEY environment variable.");
    }
    resendInstance = new Resend(key);
  }
  return resendInstance;
}

function fromAddress() {
  // Defaults to Resend's shared testing address, which works immediately
  // with no domain setup. Once you verify your own domain in Resend,
  // set FROM_EMAIL to something like "dues@yourcompany.com" instead.
  return process.env.FROM_EMAIL || "Cascade Community Management <onboarding@resend.dev>";
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export async function sendLateFeeEmail(params: {
  to: string;
  ownerName: string;
  unitNumber: string;
  periodMonth: string;
  amountDueCents: number;
  lateFeeCents: number;
  payUrl: string;
}) {
  const { to, ownerName, unitNumber, periodMonth, amountDueCents, lateFeeCents, payUrl } = params;
  const totalDue = amountDueCents + lateFeeCents;

  try {
    await resend().emails.send({
      from: fromAddress(),
      to,
      subject: `Late fee applied — Unit ${unitNumber} dues`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1C2321;">
          <h2 style="font-weight: 600;">A late fee has been applied</h2>
          <p>Hi ${ownerName},</p>
          <p>
            Your dues for <strong>${periodMonth}</strong> (Unit ${unitNumber}) were not
            received within the 15-day grace period, so a late fee of
            <strong>${money(lateFeeCents)}</strong> has been added to your balance.
          </p>
          <p>
            <strong>Total now due: ${money(totalDue)}</strong>
          </p>
          <p style="margin-top: 24px;">
            <a href="${payUrl}" style="background:#2F4A3E;color:#FAFAF7;padding:12px 24px;border-radius:999px;text-decoration:none;">
              Pay now
            </a>
          </p>
          <p style="margin-top: 32px; font-size: 13px; color: #666;">
            If you believe this is a mistake, reply to this email and we'll take a look.
          </p>
        </div>
      `,
    });
  } catch (err) {
    // Email failures shouldn't break the late-fee cron job itself —
    // the fee is still applied and recorded either way. Just log it.
    console.error("Failed to send late fee email:", err);
  }
}

export async function sendPaymentReceivedEmail(params: {
  to: string;
  ownerName: string;
  unitNumber: string;
  amountCents: number;
}) {
  const { to, ownerName, unitNumber, amountCents } = params;

  try {
    await resend().emails.send({
      from: fromAddress(),
      to,
      subject: `Payment received — Unit ${unitNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1C2321;">
          <h2 style="font-weight: 600;">Payment received</h2>
          <p>Hi ${ownerName},</p>
          <p>
            We've received your payment of <strong>${money(amountCents)}</strong> for
            Unit ${unitNumber}. Thanks for keeping current on your dues.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send payment confirmation email:", err);
  }
}
