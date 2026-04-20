import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Clock3,
  Database,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { CheckoutCTA } from "@/components/CheckoutCTA";

export const metadata: Metadata = {
  title: "Supabase DB Visualizer — ERD + Query Explorer in One URL",
  description:
    "Paste your Supabase database URL and instantly inspect relationships, row counts, schema details, and slow queries.",
};

const painPoints = [
  {
    title: "Context switching between projects",
    detail:
      "Supabase Studio is great per project, but solo founders running multiple products waste time hopping tabs and relearning each schema.",
  },
  {
    title: "Heavy desktop tooling",
    detail:
      "pgAdmin and desktop clients are overkill when you just need relational context and fast read-only inspection from any machine.",
  },
  {
    title: "No shared schema view",
    detail:
      "Onboarding freelancers or partners is hard when the only documentation lives in migration files and tribal memory.",
  },
];

const solutionItems = [
  {
    title: "Auto-generated ERD",
    detail:
      "Visualize tables and foreign keys instantly with an interactive graph that makes joins obvious and schema debt visible.",
    icon: Network,
  },
  {
    title: "Query Explorer with cache",
    detail:
      "Run read-only SQL with Monaco editor, fast result previews, and short-term caching to avoid hammering the same analytics query.",
    icon: Search,
  },
  {
    title: "Schema + row intelligence",
    detail:
      "Inspect columns, primary keys, row count distribution, and table growth hotspots without leaving the browser.",
    icon: BarChart3,
  },
  {
    title: "Slow-query telemetry",
    detail:
      "Track slow queries from this workspace so you can prioritize index work and reduce accidental full-table scans.",
    icon: Clock3,
  },
];

const faqs = [
  {
    question: "Does this modify my database?",
    answer:
      "No. The explorer only allows SELECT, WITH, and EXPLAIN statements. It blocks write operations by design.",
  },
  {
    question: "Can I use this for multiple Supabase projects?",
    answer:
      "Yes. Each session can connect to any PostgreSQL-compatible Supabase URL, so one account covers all of your side projects.",
  },
  {
    question: "How is access controlled?",
    answer:
      "Dashboard access is locked behind a paid session cookie set after successful checkout verification.",
  },
  {
    question: "What happens if I am not ready to buy yet?",
    answer:
      "You can review the full feature breakdown here first. Checkout starts only when you click the paywall unlock button.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="mb-12 flex items-center justify-between rounded-2xl border border-white/10 bg-[#111827]/60 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wide text-[#c9d7e4]">
          <Database className="h-4 w-4 text-[#35c8ff]" />
          Supabase DB Visualizer
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg border border-[#2b3647] px-3 py-2 text-sm text-[#d9e5ef] transition hover:border-[#35c8ff] hover:text-[#35c8ff]"
        >
          Open Dashboard
        </Link>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#121a25] via-[#0f1724] to-[#0d1117] p-6 sm:p-10">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#35c8ff]/10 blur-3xl" />
        <div className="absolute -right-24 bottom-2 h-72 w-72 rounded-full bg-[#22d3ee]/10 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2a3a4e] bg-[#0f1a28] px-3 py-1 text-xs font-medium text-[#9fc6dd]">
              <Sparkles className="h-3.5 w-3.5" />
              Built for solo founders managing 2-5 Supabase projects
            </p>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
              Paste your Supabase URL. Get ERD, query explorer, and row counts in one workspace.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#a9b8c7] sm:text-lg">
              Supabase DB Visualizer gives you a cloud-native control room for every project. No local installs,
              no migration spelunking, and no guessing how tables relate under pressure.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <CheckoutCTA />
              <Link
                href="#pricing"
                className="rounded-xl border border-[#304259] px-4 py-3 text-sm font-semibold text-[#cad8e6] transition hover:border-[#35c8ff] hover:text-[#35c8ff]"
              >
                View Pricing
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-[#27364c] bg-[#111a29] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#88a5bf]">What You Get</h2>
            <ul className="mt-4 space-y-3 text-sm text-[#ced9e4]">
              <li className="rounded-lg border border-[#233247] bg-[#0f1623] px-3 py-2">Interactive ERD from live foreign-key metadata</li>
              <li className="rounded-lg border border-[#233247] bg-[#0f1623] px-3 py-2">Read-only SQL runner with Monaco editor and response cache</li>
              <li className="rounded-lg border border-[#233247] bg-[#0f1623] px-3 py-2">Schema browser with row count heat map for table prioritization</li>
              <li className="rounded-lg border border-[#233247] bg-[#0f1623] px-3 py-2">Slow-query timeline to spot expensive statements fast</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-16" id="problem">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">Why Existing Options Break for Multi-DB Builders</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {painPoints.map((item) => (
            <article key={item.title} className="rounded-2xl border border-[#273344] bg-[#101722]/85 p-5">
              <h3 className="text-lg font-semibold text-[#e6edf3]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9fb0c3]">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16" id="solution">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">Purpose-Built Workflow for Fast Database Decisions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {solutionItems.map(({ title, detail, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-[#283749] bg-[#101a27]/90 p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-lg border border-[#2d4259] bg-[#0e1724] p-2 text-[#35c8ff]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-[#e7eef6]">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#9eb2c6]">{detail}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="mt-16 rounded-3xl border border-[#2a3a4e] bg-[#101826]/90 p-6 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">Simple Founder Pricing</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9db1c5] sm:text-base">
              One plan for every Supabase project you run. Keep schema visibility, query exploration, and slow-query context
              in a single workspace.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-[#d7e2ed]">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#35c8ff]" />
                Secure server-side connection handling
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#35c8ff]" />
                Unlimited schema refreshes and ERD redraws
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#35c8ff]" />
                Query cache + execution telemetry
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#2a3a4e] bg-[#0f1725] p-5">
            <p className="text-xs uppercase tracking-wide text-[#8ca8c0]">Starter Plan</p>
            <p className="mt-2 text-4xl font-bold text-white">$12</p>
            <p className="text-sm text-[#9bb0c5]">per month</p>
            <p className="mt-4 text-sm text-[#c7d4e2]">
              Ideal for independent builders running multiple Supabase products who need one place to inspect structure and
              performance.
            </p>
            <div className="mt-5">
              <CheckoutCTA fullWidth />
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mt-16">
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">FAQ</h2>
        <div className="mt-6 space-y-3">
          {faqs.map((item) => (
            <article key={item.question} className="rounded-xl border border-[#273549] bg-[#101827]/85 p-4">
              <h3 className="text-base font-semibold text-[#e9f0f8]">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#9eb3c8]">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="mt-16 flex flex-col gap-3 border-t border-white/10 pt-8 text-sm text-[#8ea5bc] sm:flex-row sm:items-center sm:justify-between">
        <p>Supabase DB Visualizer helps solo founders ship faster by reducing schema ambiguity.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 font-semibold text-[#35c8ff] transition hover:text-[#6dd9ff]"
        >
          Go to Dashboard
          <ArrowRight className="h-4 w-4" />
        </Link>
      </footer>
    </main>
  );
}
