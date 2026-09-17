import Link from "next/link";

export default function OrchardTerracePage() {
  return (
    <main>
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-sm text-ink/60 hover:text-ink">
            ← Quartz Property Group
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/pay" className="rounded-full bg-evergreen px-4 py-2 text-paper transition-colors hover:bg-evergreen-dark">
              Pay dues
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16">
        <p className="text-xs uppercase tracking-wide text-evergreen-dark">Managed Property</p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl leading-tight text-ink md:text-5xl">
          Orchard Terrace Condominium
        </h1>
        <p className="mt-2 text-sm text-ink/50">Managed by Quartz Property Group</p>
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink/70">
          A twelve-unit condominium community in Bellevue, Washington.
          Orchard Terrace Condominium Homeowners Association collects monthly
          dues, coordinates vendors, and maintains shared spaces on behalf of
          its twelve unit owners.
        </p>
        <div className="mt-9 flex items-center gap-5">
          <Link
            href="/pay"
            className="rounded-full bg-evergreen px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-evergreen-dark"
          >
            Pay your monthly dues
          </Link>
          <a href="#contact" className="text-sm font-medium text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">
            Get in touch
          </a>
        </div>
      </section>

      <section className="border-t border-hairline bg-stone">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-3">
            <div>
              <h2 className="font-display text-xl">Dues, handled</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Pay online by card or bank transfer. Payments are tracked
                automatically, and a late fee applies if dues aren't received
                within 15 days of the due date — clearly, consistently, every time.
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl">Vendors, coordinated</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Landscaping, repairs, insurance — every vendor bill is logged and
                tracked from invoice to payment, so nothing falls through the
                cracks and the books stay clean.
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl">Records, open</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">
                Every owner can see their own payment history at a glance. No
                surprises, no digging through email threads to find out what's
                owed.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl">Get in touch</h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink/70">
          Questions about your account, a maintenance request, or anything else —
          reach out and we'll get back to you within one business day.
        </p>
        <div className="mt-6 space-y-1 text-sm text-ink/80">
          <p>Orchard Terrace Condominium Homeowners Association</p>
          <p>12406 SE 31st St, Bellevue, WA 98005</p>
        </div>
      </section>

      <footer className="border-t border-hairline">
        <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-ink/50">
          © {new Date().getFullYear()} Quartz Property Group. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
