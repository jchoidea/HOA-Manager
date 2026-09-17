import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg tracking-tight">Quartz Property Group</span>
          <nav className="flex items-center gap-6 text-sm">
            <a href="#properties" className="text-ink/70 hover:text-ink">Properties</a>
            <a href="#contact" className="text-ink/70 hover:text-ink">Contact</a>
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
      </section>

      <section id="properties" className="border-t border-hairline bg-stone">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl">Properties we manage</h2>
          <p className="mt-2 max-w-prose text-sm text-ink/70">
            Each community we work with keeps its own dedicated dues
            collection and financial records, kept fully separate from every
            other association we manage.
          </p>

          <div className="mt-8 grid gap-5">
            <Link
              href="/orchard-terrace"
              className="block rounded-lg border border-hairline bg-paper p-6 transition-colors hover:border-evergreen"
            >
              <h3 className="font-display text-lg">Orchard Terrace Condominium</h3>
              <p className="mt-1 text-xs text-ink/50">Bellevue, Washington</p>
              <p className="mt-3 text-sm text-ink/70">
                A twelve-unit condominium community. Pay dues, view association
                info, and more.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-evergreen-dark">
                View property →
              </span>
            </Link>

            <Link
              href="/cordova-square"
              className="block rounded-lg border border-hairline bg-paper p-6 transition-colors hover:border-evergreen"
            >
              <h3 className="font-display text-lg">Cordova Square Condominiums</h3>
              <p className="mt-1 text-xs text-ink/50">Anchorage, Alaska</p>
              <p className="mt-3 text-sm text-ink/70">
                A 141-unit condominium community in Anchorage's Fairview
                neighborhood.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-evergreen-dark">
                View property →
              </span>
            </Link>

            <Link
              href="/park-place"
              className="block rounded-lg border border-hairline bg-paper p-6 transition-colors hover:border-evergreen"
            >
              <h3 className="font-display text-lg">Park Place Condominiums</h3>
              <p className="mt-1 text-xs text-ink/50">Anchorage, Alaska</p>
              <p className="mt-3 text-sm text-ink/70">
                A 98-unit condominium community in Anchorage's South Addition
                neighborhood.
              </p>
              <span className="mt-4 inline-block text-sm font-medium text-evergreen-dark">
                View property →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-2xl">Get in touch</h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink/70">
          Questions about an account, a maintenance request, or anything else —
          reach out and we'll get back to you within one business day.
        </p>
        <div className="mt-6 space-y-1 text-sm text-ink/80">
          <p>Serving the Pacific Northwest and beyond</p>
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
