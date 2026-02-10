# CLAUDE.md — Coding Standards & Review Rules

This file governs all coding work on Mission Control. Both DeepSeek (drafting) and Claude Code (reviewing) must follow these rules.

---

## 1. Architecture Rules

### File Organization
- **One component per file.** No 500-line mega-files with multiple components.
- **Co-locate related files.** Component + its types + its utils go in the same folder.
- **Page components** go in `src/app/<route>/page.tsx`. Keep them thin — they compose components, not implement logic.
- **Shared components** go in `src/components/`. Page-specific components go in `src/app/<route>/_components/`.

### Component Structure
```
src/
  app/
    agents/
      page.tsx                    # Agent overview grid
      [id]/
        page.tsx                  # Agent profile
        _components/
          AgentHeader.tsx
          AgentTabs.tsx
    costs/
      page.tsx
      _components/
        CostChart.tsx
  components/                     # Shared across pages
    ui/
      Modal.tsx
      Tabs.tsx
      Badge.tsx
      StatCard.tsx
    GlassPanel.tsx
    Sidebar.tsx
    AgentBadge.tsx
  lib/
    utils.ts                      # Pure helper functions
    constants.ts                  # Colors, agent config, etc.
    types.ts                      # Shared TypeScript types
```

### Naming Conventions
- **Components:** PascalCase (`AgentCard.tsx`)
- **Utilities:** camelCase (`formatCost.ts`)
- **Constants:** UPPER_SNAKE_CASE (`AGENT_COLORS`)
- **CSS classes:** Use Tailwind only — no custom CSS files per component
- **Convex functions:** camelCase (`getByAgent`, `listActive`)

---

## 2. Code Quality Rules

### TypeScript
- **Strict mode.** No `any` types unless absolutely unavoidable (and add a `// TODO: type this` comment).
- **Define interfaces/types** for all component props. No inline `{ name: string, count: number }` in function signatures.
- **Export types** from a central `types.ts` or co-located with the component.
- **Use `satisfies`** for type-checking object literals when appropriate.

### React / Next.js
- **Server Components by default.** Only add `"use client"` when you need interactivity (click handlers, state, effects, Convex hooks).
- **No `useEffect` for data fetching.** Use Convex `useQuery` hooks instead.
- **No prop drilling beyond 2 levels.** If data needs to go deeper, restructure or use composition.
- **Memoize expensive computations** with `useMemo`. Don't memoize everything — only when there's a real perf concern.
- **No inline functions in JSX** for complex logic. Extract to named functions.

### Convex
- **All database queries go through Convex functions.** No direct DB access from components.
- **Use indexes** for any query that filters or sorts. Check `schema.ts` before writing a query.
- **Paginate large result sets.** Never return unbounded arrays.
- **Validate inputs** in mutations. Don't trust the client.

### Styling (Tailwind + Glassmorphism)
- **Use the design tokens from SPEC-V2.md.** Don't invent new colors or spacing.
- **Glass effect classes** should be consistent: `bg-white/[0.07] border border-white/[0.12] backdrop-blur-xl rounded-xl`
- **Responsive design:** All pages must work at 1024px+ width. Mobile is not a priority but don't break it.
- **Dark mode only.** This is a dark-themed app. Don't add light mode support.
- **Animations:** Use CSS transitions (`transition-all duration-200`), not JavaScript animation libraries. Keep it subtle.
- **No external CSS frameworks** besides Tailwind. No Bootstrap, no Chakra, no Material.

---

## 3. Patterns to Follow

### Data Fetching Pattern
```tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AgentList() {
  const agents = useQuery(api.agents.list);
  
  if (agents === undefined) return <LoadingState />;
  if (agents.length === 0) return <EmptyState message="No agents found" />;
  
  return agents.map(agent => <AgentCard key={agent._id} agent={agent} />);
}
```

### Component Pattern
```tsx
interface AgentCardProps {
  agent: Agent;
  onClick?: (id: string) => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  // Component logic here
}
```

### Error Handling
- **Every `useQuery` must handle the `undefined` (loading) state.**
- **Every mutation must handle errors** — either try/catch or `.catch()`.
- **Show user-friendly error states**, not raw error messages.

### Loading States
- **Use skeleton loaders** that match the shape of the content they replace.
- **Never show a blank page** while data loads.
- **Shared `<LoadingState />` and `<EmptyState />` components** for consistency.

---

## 4. What NOT to Do

- ❌ **Don't install new dependencies** without explicit approval. Use what's already in `package.json` + built-in browser APIs + SVG for charts.
- ❌ **Don't use D3, Chart.js, Recharts, or any chart library.** Build SVG charts from scratch — they're simpler than you think for our needs and avoid massive bundle bloat.
- ❌ **Don't use a rich text editor library** for the Memory Browser. A `<textarea>` with monospace font is fine for v1.
- ❌ **Don't add authentication/auth.** This is a local tool, not a multi-tenant app.
- ❌ **Don't add API routes.** All data flows through Convex.
- ❌ **Don't refactor existing working code** unless it blocks new work. If it works, leave it.
- ❌ **Don't change the Convex schema** without flagging it. Schema changes can break existing data.
- ❌ **Don't use `localStorage` or `sessionStorage`** for app state. Use URL params for filters/views, Convex for persistent state.
- ❌ **Don't add comments that just restate the code.** Comments explain *why*, not *what*.

---

## 5. Review Checklist (Claude Code)

When reviewing DeepSeek's code, check every item:

### Build & Runtime
- [ ] `pnpm build` passes with zero errors and zero warnings
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No console errors/warnings in browser dev tools
- [ ] Pages render correctly (visual check)

### Code Quality
- [ ] No `any` types
- [ ] No unused imports or variables
- [ ] No hardcoded strings that should be constants (colors, agent names, etc.)
- [ ] Props are typed with interfaces
- [ ] Components are reasonably sized (<150 lines preferred, <250 max)
- [ ] `"use client"` only where necessary

### UI/UX
- [ ] Glass styling is consistent with existing components
- [ ] Loading states exist for all data-dependent views
- [ ] Empty states exist when no data
- [ ] Hover/active states on interactive elements
- [ ] Text is readable (sufficient contrast against glass backgrounds)
- [ ] Sidebar navigation updated with new routes
- [ ] No layout shifts during loading

### Convex
- [ ] Queries use appropriate indexes
- [ ] No unbounded queries (always limit results)
- [ ] Mutations validate inputs
- [ ] No N+1 query patterns (fetching in a loop)

### Consistency
- [ ] New components follow the same patterns as existing ones
- [ ] Color palette matches SPEC-V2.md design tokens
- [ ] Spacing is consistent with existing pages
- [ ] Agent colors/emojis match the defined constants

---

## 6. Git Commit Rules

- **One commit per phase** (squash if needed during development)
- **Commit message format:** `Phase X: Brief description of what was built`
- **Don't commit `node_modules`, `.next`, or build artifacts**
- **Run `pnpm build` before committing** — never commit broken code

---

## 7. Dependencies (Approved List)

Only these packages are approved. Do not add others without asking:

```
next, react, react-dom          — Framework
convex                          — Database + real-time
tailwindcss, postcss            — Styling
clsx, tailwind-merge            — Class utilities
lucide-react                    — Icons
date-fns                        — Date formatting
```

If you genuinely need something else, document *why* and what alternatives you considered.
