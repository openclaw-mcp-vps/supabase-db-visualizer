import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined, DatabaseZap, ShieldCheck, Sparkles } from "lucide-react";
import { LemonCheckoutButton } from "@/components/LemonCheckoutButton";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <nav className="mb-10 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-4 py-3 backdrop-blur">
        <p className="text-sm font-semibold tracking-wide">Supabase DB Visualizer</p>
        <Link
          className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition hover:bg-[#1b2431]"
          href="/dashboard"
        >
          Open Dashboard
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </nav>

      <section className="grid items-center gap-8 md:grid-cols-[1.1fr,0.9fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[#2f81f7]/45 bg-[#2f81f7]/10 px-3 py-1 text-xs text-[#8ebeff]">
            <Sparkles className="h-3.5 w-3.5" />
            Zero install. Multi-project friendly.
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
            Paste a Supabase DB URL.
            <br />
            Get a live ERD, schema explorer, and SQL workspace.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-[var(--text-secondary)] md:text-lg">
            pgAdmin is heavy. Supabase Studio is project-locked. Supabase DB Visualizer gives solo founders one cloud-native place to inspect 2-5 databases, compare schema health, and debug slow SQL in minutes.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-2xl font-semibold">ERD in seconds</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Auto-mapped FK graph with table metadata.</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-2xl font-semibold">Cached SQL runs</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Read-only query runner with replay speed.</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-2xl font-semibold">Slow query log</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Spot repeat offenders before users do.</p>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl shadow-black/30">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Pricing</p>
          <h2 className="mt-2 text-2xl font-semibold">Solo Founder Plan</h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            Built for devs running multiple Supabase projects who need one neutral workspace.
          </p>

          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[#0f141c] p-4">
            <p className="text-4xl font-bold">$12<span className="text-lg font-medium text-[var(--text-secondary)]">/mo</span></p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
              <li>Unlimited Supabase/Postgres connections</li>
              <li>Auto ERD + schema browser + row estimates</li>
              <li>Read-only SQL explorer with query cache</li>
              <li>Slow-query tracking and execution timings</li>
            </ul>
          </div>

          <div className="mt-5">
            <LemonCheckoutButton />
          </div>
        </aside>
      </section>

      <section className="mt-14 grid gap-6 md:grid-cols-3">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <DatabaseZap className="mb-3 h-5 w-5 text-[#2f81f7]" />
          <h3 className="text-lg font-semibold">Problem</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Data model drift hides across side projects. You jump between terminals, hosted tools, and stale docs just to answer basic relationship and row-count questions.
          </p>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <ChartNoAxesCombined className="mb-3 h-5 w-5 text-[#2f81f7]" />
          <h3 className="text-lg font-semibold">Solution</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Connect once and get instant visual context: tables, foreign keys, row volume, and SQL output in a single focused workflow that works across all your Supabase environments.
          </p>
        </article>

        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <ShieldCheck className="mb-3 h-5 w-5 text-[#2f81f7]" />
          <h3 className="text-lg font-semibold">Security</h3>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            DB credentials stay server-side in encrypted, httpOnly cookies. The query API only accepts read-only SQL to reduce accidental production damage.
          </p>
        </article>
      </section>

      <section className="mt-14 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article>
            <h3 className="font-semibold">Does this only work with Supabase?</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              It targets Supabase Postgres URLs out of the box, but any PostgreSQL-compatible connection string can work.
            </p>
          </article>
          <article>
            <h3 className="font-semibold">What can I run in the SQL editor?</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              SELECT, WITH, and EXPLAIN statements. Mutations are blocked so you can inspect safely.
            </p>
          </article>
          <article>
            <h3 className="font-semibold">How do I unlock the dashboard?</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Complete checkout in the Lemon Squeezy overlay. Once webhook confirmation arrives, access is granted via signed cookie.
            </p>
          </article>
          <article>
            <h3 className="font-semibold">Can I switch databases quickly?</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Yes. Connect, inspect, and disconnect repeatedly without local setup. It is optimized for founders juggling multiple projects.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
