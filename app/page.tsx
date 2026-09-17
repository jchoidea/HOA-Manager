import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg tracking-tight">Quartz Property Group</span>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#about" className="text-ink/70 hover:text-ink">About</a>
            <a href="#services" className="text-ink/70 hover:text-ink">Services</a>
            <a href="#contact" className="text-ink/70 hover:text-ink">Contact</a>
            <Link href="/pay" className="rounded-full bg-evergreen px-4 py-2 text-paper transition-colors hover:bg-evergreen-dark">
              Pay dues
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-20 md:pt-28">
        <h1 className="max-w-2xl font-display text-4xl leading-tight text-ink md:text-5xl">
          Community management built around clarity, not paperwork.
        </h1>
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink/70">
          Quartz Property Group manages condominium and homeowners'
          associations across the Pacific Northwest and beyond — handling
          dues collection, vendor coordination, and day-to-day operations so
          boards and owners can focus on their community, not the
          administrative load behind it.
        </p>
        <div className="mt-9">
          <Link
            href="/pay"
            className="rounded-full bg-evergreen px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-evergreen-dark"
          >
            Pay your monthly dues
          </Link>
        </div>
      </section>

      <section id="about" className="border-t border-hairline bg-stone">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl">About us</h2>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-ink/70">
            We are dedicated to consistently providing high-quality
            comprehensive management, accounting, and vendor coordination
            services. Through our commitment to owners, boards, and clear
            communication, we strive to lead the way in providing value to
            the communities we serve.
          </p>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl">Services</h2>
        <div className="mt-8 grid gap-12 md:grid-cols-3">
          <div>
            <h3 className="font-display text-xl">Dues, handled</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              Owners pay online by card or bank transfer. Payments are
              tracked automatically, and a late fee applies if dues aren't
              received within 15 days of the due date — clearly,
              consistently, every time.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl">Vendors, coordinated</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              Landscaping, repairs, insurance — every vendor bill is logged
              and tracked from invoice to payment, so nothing falls through
              the cracks and the books stay clean.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl">Records, open</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              Every owner can see their own payment history at a glance. No
              surprises, no digging through email threads to find out what's
              owed.
            </p>
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-hairline bg-stone">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl">Get in touch</h2>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink/70">
            Questions about your account, a maintenance request, or anything
            else — reach out and we'll get back to you within one business
            day.
          </p>
          <div className="mt-6 space-y-1 text-sm text-ink/80">
            <p>Serving the Pacific Northwest and beyond</p>
          </div>
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
