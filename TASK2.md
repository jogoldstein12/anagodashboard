# Task: Add Task Management UI

## Context
The Mission Control tasks page (`src/app/tasks/`) has a kanban board that displays tasks but has NO way to create, edit, or delete tasks. The Convex backend already has `tasks.create`, `tasks.update`, `tasks.updateStatus` mutations ready.

## What to Build

### 1. Create Task Modal
Add a "New Task" button to the tasks page header area (next to the filters). Clicking it opens a modal with:
- Title (required, text input)
- Description (textarea)
- Agent (select: anago, iq, greensea, courtside, afterdark)
- Priority (select: p0, p1, p2, p3)
- Status (select: backlog, up_next, in_progress, done)
- Due Date (optional date input)
- Submit button → calls `api.tasks.create`

### 2. Edit Task
Make each TaskCard clickable to open an edit modal (reuse the create modal form, pre-filled). Include:
- All the same fields as create, pre-filled with current values
- Save button → calls `api.tasks.update`
- Delete button (with confirm) → needs a new `tasks.remove` mutation

### 3. Quick Status Change
Add a small dropdown or button row on each TaskCard to quickly change status (move between columns) without opening the full edit modal. Use `api.tasks.updateStatus`.

### 4. Add Delete Mutation
Add to `convex/tasks.ts`:
```typescript
export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
```

## Technical Notes
- Use `useMutation` from "convex/react" for mutations
- Import from `../../../../convex/_generated/api` (match existing pattern)
- Modal: create a reusable `TaskModal` component in `src/app/tasks/_components/`
- Keep the glass/dark theme: `bg-white/[0.06]`, `border-white/[0.12]`, etc.
- Keep `@ts-nocheck` at top of Convex files
- After changes, run `npm run build` to verify no errors

## File References
- `src/app/tasks/_components/TasksPageClient.tsx` — main page, add button here
- `src/app/tasks/_components/TaskCard.tsx` — make clickable, add quick status
- `convex/tasks.ts` — add remove mutation
- `src/lib/types.ts` — Task type definition
- `src/lib/constants.ts` — AGENTS, PRIORITY_COLORS, etc.
- `src/components/ui/Modal.tsx` — existing modal component (check if it exists)
