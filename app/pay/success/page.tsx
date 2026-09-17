import Link from "next/link";

export default function PaySuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-3xl">Payment received</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">
        Thank you — your payment is being processed. You'll see it reflected in
        your account shortly. A confirmation email is on its way from Stripe.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-evergreen px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-evergreen-dark"
      >
        Back home
      </Link>
    </main>
  );
}
