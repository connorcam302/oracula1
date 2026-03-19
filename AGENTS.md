# AGENTS.md — Oracula1

Coding agent instructions for this SvelteKit + Drizzle + PostgreSQL F1 fantasy tracking app.

---

## Commands

```bash
# Type-check all Svelte and TypeScript files (primary verification step)
npm run check

# Watch mode type-check during development
npm run check:watch

# Development server
npm run dev

# Production build
npm run build

# Seed the database (run against a live DB via DATABASE_URL)
npm run db:seed

# Seed via running Docker container (no host npm required)
docker compose exec app npx tsx scripts/seed.ts

# Reset DB (wipes volume, restarts, re-seeds) — DESTRUCTIVE
npm run db:reset
```

**There is no lint or format script.** No ESLint or Prettier is configured. After making changes, always run `npm run check` and fix all errors before finishing. The project uses `svelte-check` for both Svelte template and TypeScript validation.

---

## Project Structure

```
src/
├── app.css              # Tailwind v4 CSS config — colors, fonts, base styles
├── app.html             # HTML shell — Google Fonts loaded here
├── hooks.server.ts      # Auth handle re-export
├── lib/
│   ├── points.ts        # F1 points logic (getPoints, formatPosition)
│   ├── utils.ts         # cn() — clsx + tailwind-merge
│   ├── components/
│   │   ├── app-sidebar.svelte
│   │   ├── charts/      # bar-chart.svelte, line-chart.svelte
│   │   └── ui/          # shadcn-style primitives (badge, button, card, etc.)
│   └── server/
│       ├── auth/        # SvelteKitAuth config
│       └── db/
│           ├── index.ts # Drizzle client
│           └── schema.ts # All table definitions + inferred types
└── routes/
    ├── +layout.server.ts / +layout.svelte
    ├── api/             # JSON API routes (+server.ts files)
    ├── auth/            # signin, register pages
    ├── claim/           # claim a placeholder profile
    ├── profile/[userId] # user stats + race history
    ├── seasons/         # season list, detail, race detail
    └── stats/           # driver/constructor standings + charts
```

Path aliases (configured in `svelte.config.js`):
- `$lib` → `src/lib`
- `$components` → `src/lib/components`
- `$server` → `src/lib/server`
- `$app/*`, `$env/*` — standard SvelteKit

---

## TypeScript

- **`strict: true`** is enabled — no implicit `any`, no implicit returns, no unchecked access
- **Always use `import type`** for type-only imports:
  ```ts
  import type { PageServerLoad } from './$types';
  import type { Snippet } from 'svelte';
  ```
- Page components use `let { data } = $props()` without explicit type annotation — SvelteKit infers the type from the server load function automatically
- All server load functions and API handlers must be typed with their `$types` import

---

## Svelte 5 Runes (Mandatory — runes mode is forced globally)

All `.svelte` files run in runes mode. Never use `export let`, `$:`, or `<slot>`.

```ts
// Props
let { data } = $props();
let { collapsed = $bindable(false), session }: Props = $props();

// Local state
let showModal = $state(false);
let name = $state('');

// Derived values
let isOwner = $derived(data.currentUserId === data.profile.id);

// Complex derived (IIFE pattern — required for multi-step logic)
const filteredResults = $derived(
  (() => {
    let list = [...data.results];
    list.sort(...);
    return list;
  })()
);

// Side effects
$effect(() => {
  if (selectedUser) selectedTeam = data.userTeamMap[selectedUser];
});

// Children / slots
{@render children()}
```

Use `{@const}` for inline template computations:
```svelte
{#each data.seasons as season}
  {@const isComplete = Number(season.completedRaces) === Number(season.raceCount)}
```

---

## Import Order

Within `<script>` blocks, order imports as follows:

1. SvelteKit framework (`$app/navigation`, `$app/stores`, `@sveltejs/kit`)
2. Internal `$lib` imports (components, utilities, server)
3. Third-party libraries (`lucide-svelte`, `chart.js`, etc.)
4. Type imports (can be interspersed using `import type`)

In `+page.server.ts` / `+server.ts`:
1. `import type { PageServerLoad } from './$types'` — always first
2. `$lib/server/db` and schema imports
3. `drizzle-orm` operators (`eq`, `desc`, `sql`, etc.)
4. `@sveltejs/kit` helpers (`error`, `redirect`, `json`)

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Files | kebab-case | `app-sidebar.svelte`, `bar-chart.svelte` |
| Components (when imported) | PascalCase | `AppSidebar`, `BarChart` |
| Variables & functions | camelCase | `addRace`, `selectedTrack`, `showAddRace` |
| Module-level constants | UPPER_SNAKE | `DRIVER_COLORS`, `POINTS_MAP` |
| DB tables | camelCase plural | `users`, `raceResults`, `seasonTeamMembers` |
| DB columns (schema) | camelCase property, snake_case string | `roundNumber: integer('round_number')` |
| Type exports from schema | PascalCase | `User`, `Season`, `Race`, `RaceResult` |

---

## Component Props Pattern

Use `interface Props` for all reusable components:

```ts
interface Props {
  variant?: BadgeVariant;
  class?: string;
  children?: Snippet;
}
let { variant = 'default', class: className, children, ...restProps }: Props = $props();
```

For components that wrap HTML elements, extend the element's attribute type:
```ts
interface Props extends HTMLButtonAttributes {
  variant?: ButtonVariant;
}
```

---

## Server Load Functions

```ts
import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = await locals.auth?.();
  if (!session?.user) throw redirect(302, '/auth/signin');

  const [record] = await db.select().from(users).where(eq(users.id, params.id)).limit(1);
  if (!record) throw error(404, 'Not found');

  return { record };
};
```

API route handlers follow the same pattern but return `json()`:
```ts
export const POST: RequestHandler = async ({ request, locals }) => {
  const session = await locals.auth?.();
  if (!session?.user?.id) return json({ error: 'Unauthorized' }, { status: 401 });
  // ...
  return json({ success: true });
};
```

---

## Error Handling

**In server load functions** — throw SvelteKit helpers:
```ts
throw error(404, 'Season not found');
throw redirect(302, '/auth/signin');
```

**In API route handlers** — return JSON error responses:
```ts
if (!name?.trim()) return json({ error: 'Name is required' }, { status: 400 });
```

**In page component fetch calls** — `try/finally` to always reset loading state:
```ts
async function addRace() {
  if (!selectedTrack) return;
  addingRace = true;
  try {
    const res = await fetch(`/api/seasons/${data.season.id}/races`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: parseInt(selectedTrack), roundNumber })
    });
    if (res.ok) {
      showAddRace = false;
      await invalidateAll(); // always use invalidateAll() after mutations
    }
  } finally {
    addingRace = false;
  }
}
```

When user-facing error messages are needed, add a `catch` block and set a `$state` error variable.

---

## Database (Drizzle ORM)

Always import the `db` client from `$lib/server/db`:

```ts
import { db } from '$lib/server/db';
import { seasons, races, raceResults } from '$lib/server/db/schema';
import { eq, desc, sql, and, count } from 'drizzle-orm';
```

**Destructure single-row results** and guard immediately:
```ts
const [season] = await db.select().from(seasons).where(eq(seasons.id, id)).limit(1);
if (!season) throw error(404, 'Season not found');
```

**Raw SQL** for aggregates:
```ts
sql<number>`COUNT(CASE WHEN ${raceResults.position} = 1 THEN 1 END)`.as('wins')
```

**Transactions** for multi-step mutations:
```ts
await db.transaction(async (tx) => {
  await tx.update(users).set({ ...}).where(eq(users.id, oldId));
  await tx.delete(raceResults).where(eq(raceResults.userId, oldId));
});
```

---

## UI Components

UI primitives live in `src/lib/components/ui/`. Each component folder has:
- `component.svelte` — the implementation
- `index.ts` — barrel export + variant definitions using `tailwind-variants` (`tv()`)

Use the `cn()` utility from `$lib/utils` for all conditional class merging:
```ts
import { cn } from '$lib/utils';
class={cn('base-classes', conditional && 'extra', className)}
```

**No form actions** are used. All mutations go through `fetch()` to `/api/*` routes.

---

## Design System

Custom color tokens (defined in `app.css`, accessible as Tailwind classes):
- `primary` — F1 Red (#E10600) — brand color, primary actions
- `gold` — Championship Gold — P1, wins, completed states
- `blue` — Electric Blue — data, in-progress states
- `success` — Emerald Green — confirmed, completed
- `destructive` — Error Red — DNF, errors, delete actions

Font families:
- `font-sans` — Barlow (body/UI text)
- `font-display` — Barlow Condensed (headings, numbers, card titles)

Use `font-display` on all page `h1` headings, card titles, and stat numbers. Use `tabular-nums` on all numeric data. Use `uppercase tracking-widest text-xs` for metadata labels under stats.

Refer to `.impeccable.md` at the project root for full brand and design context.
