import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Database,
  Network,
  ShieldCheck,
  Timer,
  Workflow
} from "lucide-react";

const painPoints = [
  {
    title: "Tooling friction across projects",
    description:
      "Switching between pgAdmin and multiple Supabase Studio tabs creates context loss every time you debug schemas."
  },
  {
    title: "No shared ERD source of truth",
    description:
      "You can ship migrations quickly, but reviewing foreign key drift and relationship impact is still manual and slow."
  },
  {
    title: "Slow query feedback arrives too late",
    description:
      "Performance regressions usually surface after deploy because solo founders lack a lightweight query diagnostics loop."
  }
];

const features = [
  {
    icon: Network,
    title: "Auto ERD generation",
    description:
      "We introspect `information_schema` and draw an interactive entity-relationship map in seconds."
  },
  {
    icon: Database,
    title: "Schema browser with row counts",
    description:
      "Scan tables, columns, PK/FK markers, and live row estimates from one searchable pane."
  },
  {
    icon: Timer,
    title: "Read-only query explorer",
    description:
      "Run `SELECT`, `WITH`, and `EXPLAIN` safely, format SQL, preview result sets, and track slow statements."
  },
  {
    icon: BarChart3,
    title: "Slow query log",
    description:
      "Durations are captured per run so you can watch where latency is rising before users feel it."
  },
  {
    icon: ShieldCheck,
    title: "Server-side connection handling",
    description:
      "Connection strings are used only for API calls in your deployment, not exposed in client-side libraries."
  },
  {
    icon: Workflow,
    title: "Zero install workflow",
    description:
      "Paste URL, inspect schema, run diagnostics, move on. No desktop setup, no local driver maintenance."
  }
];

const faqs = [
  {
    question: "Can I use this for multiple Supabase projects?",
    answer:
      "Yes. Each session can connect to any PostgreSQL-compatible Supabase database by pasting its connection URL."
  },
  {
    question: "Does this mutate my database?",
    answer:
      "The explorer enforces read-only query types (`SELECT`, `WITH`, `EXPLAIN`) so the built-in runner avoids write operations."
  },
  {
    question: "How is access controlled after payment?",
    answer:
      "Checkout happens on Stripe hosted checkout. After purchase, access is unlocked with an HTTP-only cookie for the dashboard."
  },
  {
    question: "Do I need a local install?",
    answer:
      "No. The app is fully browser-based and cloud-native, designed for solo founders jumping between databases quickly."
  }
];

export default function HomePage() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 pb-20 pt-8 sm:px-8 lg:px-12">
      <header className="rounded-2xl border bg-[#10161f]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8b949e]">
              Supabase DB Visualizer
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#e6edf3] sm:text-4xl">
              Paste connection string. Ship schema changes with confidence.
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-[#30363d] bg-[#161b22] px-4 py-2 text-sm font-medium text-[#e6edf3] transition hover:bg-[#1d2530]"
            >
              Open dashboard
            </Link>
            <a
              href={paymentLink}
              className="inline-flex items-center justify-center rounded-lg bg-[#2f81f7] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f6feb]"
              target="_blank"
              rel="noreferrer"
            >
              Buy for $12/mo
            </a>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-base text-[#c9d1d9] sm:text-lg">
          Supabase DB Visualizer gives solo builders a universal schema cockpit: ERD diagram,
          searchable schema explorer, safe query runner, and slow-query tracking in one place.
        </p>
      </header>

      <section className="mt-14 grid gap-5 md:grid-cols-3">
        {painPoints.map((item) => (
          <article
            key={item.title}
            className="rounded-xl border border-[#30363d] bg-[#0f141b]/90 p-5"
          >
            <h2 className="text-lg font-semibold text-[#e6edf3]">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9da7b3]">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="mt-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold text-[#e6edf3] sm:text-3xl">
            Built for multi-db solo workflows
          </h2>
          <p className="text-sm text-[#8b949e]">No desktop clients. No project lock-in.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-xl border border-[#30363d] bg-[#101722]/80 p-5"
            >
              <feature.icon className="h-5 w-5 text-[#58a6ff]" aria-hidden />
              <h3 className="mt-3 text-base font-semibold text-[#e6edf3]">{feature.title}</h3>
              <p className="mt-2 text-sm text-[#9da7b3]">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <article className="rounded-2xl border border-[#30363d] bg-[#0f141b] p-6">
          <h2 className="text-2xl font-semibold text-[#e6edf3]">Simple pricing, solo-founder friendly</h2>
          <p className="mt-3 text-sm text-[#9da7b3]">
            One plan for builders running 2-5 Supabase projects. Keep schema visibility centralized
            and stop paying with debugging time.
          </p>
          <div className="mt-6 rounded-xl border border-[#2f81f7]/50 bg-[#111f36] p-5">
            <p className="text-sm uppercase tracking-[0.16em] text-[#8fb9ff]">Starter</p>
            <p className="mt-2 text-4xl font-semibold text-white">$12<span className="text-lg text-[#b6d4ff]">/mo</span></p>
            <ul className="mt-4 space-y-2 text-sm text-[#dbe9ff]">
              <li>Unlimited Supabase connection sessions</li>
              <li>ERD + schema explorer + row counts</li>
              <li>Read-only query explorer + slow query log</li>
              <li>Cloud-native, zero install</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={paymentLink}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2f81f7] px-4 py-2 font-semibold text-white transition hover:bg-[#1f6feb]"
                target="_blank"
                rel="noreferrer"
              >
                Start paid access <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-lg border border-[#4f6077] px-4 py-2 font-medium text-[#dbe9ff] transition hover:bg-[#1b2b44]"
              >
                See dashboard
              </Link>
            </div>
          </div>
        </article>

        <article className="grid-mask rounded-2xl border border-[#30363d] bg-[#11161f] p-6">
          <h2 className="text-2xl font-semibold text-[#e6edf3]">How it works</h2>
          <ol className="mt-4 space-y-4 text-sm text-[#c1cad4]">
            <li>
              <span className="font-semibold text-[#f0f6fc]">1. Paste your Supabase Postgres URL.</span>
              We test connectivity from the server and confirm metadata.
            </li>
            <li>
              <span className="font-semibold text-[#f0f6fc]">2. Inspect generated ERD and schema.</span>
              View PK/FK structure and row counts without opening multiple tools.
            </li>
            <li>
              <span className="font-semibold text-[#f0f6fc]">3. Run diagnostics queries.</span>
              Format SQL, execute safe reads, and watch slow-query timings over time.
            </li>
          </ol>
        </article>
      </section>

      <section className="mt-16 rounded-2xl border border-[#30363d] bg-[#0f141b] p-6">
        <h2 className="text-2xl font-semibold text-[#e6edf3]">FAQ</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-xl border border-[#30363d] bg-[#111824] p-4">
              <h3 className="text-base font-semibold text-[#e6edf3]">{faq.question}</h3>
              <p className="mt-2 text-sm text-[#9da7b3]">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-16 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#30363d] bg-[#0f141b] p-6 text-center sm:flex-row sm:text-left">
        <div>
          <p className="text-lg font-semibold text-[#f0f6fc]">Ready to replace heavyweight DB tooling?</p>
          <p className="text-sm text-[#9da7b3]">
            Connect any Supabase project and get architecture clarity in under a minute.
          </p>
        </div>
        <a
          href={paymentLink}
          className="inline-flex items-center rounded-lg bg-[#2f81f7] px-5 py-2.5 font-semibold text-white transition hover:bg-[#1f6feb]"
          target="_blank"
          rel="noreferrer"
        >
          Buy access
        </a>
      </footer>
    </main>
  );
}
