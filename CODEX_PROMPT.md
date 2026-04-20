# Build Task: supabase-db-visualizer

Build a complete, production-ready Next.js 15 App Router application.

PROJECT: supabase-db-visualizer
HEADLINE: Supabase DB Visualizer — paste connection string, get ERD + query explorer + row counts
WHAT: Paste Supabase DB URL. Auto-generated ERD diagram, schema browser, row counts, slow-query log. Zero install.
WHY: pgAdmin is heavy, Supabase Studio is tied to one project. Multi-db solo devs want cloud-native universal tool.
WHO PAYS: Solo founders running 2-5 Supabase projects
NICHE: database-tools
PRICE: $$12/mo/mo

ARCHITECTURE SPEC:
Next.js app with server-side PostgreSQL connection handling, real-time ERD generation using vis.js/d3, and cached query execution. Backend API routes handle database introspection and query execution, while frontend renders interactive diagrams and data tables.

PLANNED FILES:
- app/page.tsx
- app/dashboard/page.tsx
- app/api/connect/route.ts
- app/api/schema/route.ts
- app/api/query/route.ts
- components/ConnectionForm.tsx
- components/ERDDiagram.tsx
- components/SchemaExplorer.tsx
- components/QueryEditor.tsx
- lib/database.ts
- lib/erd-generator.ts
- lib/auth.ts
- lib/subscription.ts

DEPENDENCIES: next, react, tailwindcss, pg, vis-network, monaco-editor, next-auth, lemonsqueezy.js, zod, lucide-react, recharts

REQUIREMENTS:
- Next.js 15 with App Router (app/ directory)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (npx shadcn@latest init, then add needed components)
- Dark theme ONLY — background #0d1117, no light mode
- Lemon Squeezy checkout overlay for payments
- Landing page that converts: hero, problem, solution, pricing, FAQ
- The actual tool/feature behind a paywall (cookie-based access after purchase)
- Mobile responsive
- SEO meta tags, Open Graph tags
- /api/health endpoint that returns {"status":"ok"}
- NO HEAVY ORMs: Do NOT use Prisma, Drizzle, TypeORM, Sequelize, or Mongoose. If the tool needs persistence, use direct SQL via `pg` (Postgres) or `better-sqlite3` (local), or just filesystem JSON. Reason: these ORMs require schema files and codegen steps that fail on Vercel when misconfigured.
- INTERNAL FILE DISCIPLINE: Every internal import (paths starting with `@/`, `./`, or `../`) MUST refer to a file you actually create in this build. If you write `import { Card } from "@/components/ui/card"`, then `components/ui/card.tsx` MUST exist with a real `export const Card` (or `export default Card`). Before finishing, scan all internal imports and verify every target file exists. Do NOT use shadcn/ui patterns unless you create every component from scratch — easier path: write all UI inline in the page that uses it.
- DEPENDENCY DISCIPLINE: Every package imported in any .ts, .tsx, .js, or .jsx file MUST be
  listed in package.json dependencies (or devDependencies for build-only). Before finishing,
  scan all source files for `import` statements and verify every external package (anything
  not starting with `.` or `@/`) appears in package.json. Common shadcn/ui peers that MUST
  be added if used:
  - lucide-react, clsx, tailwind-merge, class-variance-authority
  - react-hook-form, zod, @hookform/resolvers
  - @radix-ui/* (for any shadcn component)
- After running `npm run build`, if you see "Module not found: Can't resolve 'X'", add 'X'
  to package.json dependencies and re-run npm install + npm run build until it passes.

ENVIRONMENT VARIABLES (create .env.example):
- NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID
- NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID
- LEMON_SQUEEZY_WEBHOOK_SECRET

After creating all files:
1. Run: npm install
2. Run: npm run build
3. Fix any build errors
4. Verify the build succeeds with exit code 0

Do NOT use placeholder text. Write real, helpful content for the landing page
and the tool itself. The tool should actually work and provide value.
