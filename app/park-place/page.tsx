import Link from "next/link";

export default function ParkPlacePage() {
  return (
    <main>
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-sm text-ink/60 hover:text-ink">
            ← Quartz Property Group
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16">
        <p className="text-xs uppercase tracking-wide text-evergreen-dark">Managed Property</p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl leading-tight text-ink md:text-5xl">
          Park Place Condominiums
        </h1>
        <p className="mt-2 text-sm text-ink/50">Managed by Quartz Property Group</p>
        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink/70">
          A 98-unit condominium community in Anchorage's South Addition
          neighborhood, built in 2001.
        </p>

        <div className="mt-8 inline-block rounded-full bg-stone px-5 py-2.5 text-sm text-ink/60">
          Owner dues portal — coming soon
        </div>

        <div className="mt-10 space-y-1 text-sm text-ink/80">
          <p>Park Place Condominium Association</p>
          <p>1200 I St, Anchorage, AK 99501</p>
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
