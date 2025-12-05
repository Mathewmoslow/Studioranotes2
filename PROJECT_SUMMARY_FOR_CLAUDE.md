# StudiOra Premium — Project Summary for Claude Code Assistance

## Overview
- Monorepo managed with Turborepo containing `apps/web` (Next.js/UIs), `packages/types` (shared types), `packages/ui` (design system), and additional shared services.
- Front-end is Material-UI + Zustand stores pulled from NotesAI/StudentLife and unified behind a shared state/config layer.
- Database layer is Prisma + Supabase; we now connect via the Supabase session pooler (`DATABASE_URL`) and normalized Canvas payloads.
- Authentication: NextAuth with Google, session persistence already working; supabase service/anon keys stored in `apps/web/.env`.

## What’s Done
1. **Environment**
   - Supabase connection (session pooler + direct URL) wired, Prisma client regenerated, `.env` synced both at repo root and `apps/web`.
   - Turbo/Next dev flow working once run from `/codexversion`; root folder should not be used for commands.
2. **Onboarding**
   - Combined Canvas/university selection, expanded DynaSchedule settings, normalized max daily hours, added helper cards for study time preferences.
   - Sync persists preferences to Zustand store and scheduler config before onboarding completes.
3. **Canvas Sync API**
   - `/api/canvas/import` now fetches courses, assignments, events; `/api/sync` normalizes IDs/types/status/priority before persisting.
   - Added resilience to missing IDs, intelligent retries/upserts, and logging for each sync step.
4. **User Experience**
   - Dashboard and scheduler components migrated; dynamic scheduler, upcoming tasks, study blocks, note generation widgets all rendering with data from Canvas imports.
   - Added helper screens/logging in onboarding (error alerts, course import progress, logs in console). 

## Current Pain Points
- Canvas import pulls assignments but Prisma schema expects string IDs and enums; we now normalize but ongoing coverage may still reveal new fields (monitor logs). 
- Onboarding still has redundant study-hour inputs elsewhere; duplication will require further UI adjustments.
- Next.js warning about multiple `package-lock.json` files remains (non-blocking) and port 3000 must be freed manually if the process doesn't exit.

## Immediate Next Steps for Claude
1. **Complete onboarding clean-up** — remove duplicated “study hours per day” inputs, consolidate preferences, and double-check DynaSchedule flow matches the screenshots/tracking updates from the original repo.
2. **Canvas data persistence** — ensure assignments, events, and notes get persisted to Supabase; verify imported assignments appear under `/tasks`, `/schedule`, and dashboards.
3. **Component parity & QA** — walk through the remaining Phase 1 checklist (API app shell, error middleware, logging), then begin Phase 2 Canvas-specific tasks (token storage, sync status UI, conflict resolution). 
4. **Testing guidance** — Clear local storage (`onboarding_<email>`) to trigger onboarding, connect Canvas with valid tokens, import courses, and ensure `/api/sync`/Prisma logs stay clean.

## Testing & Validation Checklist
- Run `npm run dev` inside `/codexversion`; ensure NextAuth/Canvas import endpoints log 200s and Prisma doesn’t throw validation errors.
- Canvas import should log each course/message and return assignments (check Network tab for `/api/canvas/courses`).
- Onboarding should only ask for study hours once; completed values should flow into the scheduler (`state.schedulerConfig`, `state.preferences`).
- Validate Supabase tables via Prisma Studio to confirm courses/tasks/timeblocks persisted.

## References
- Supabase connection strings: session pooler 5432 with `pgbouncer=true` removed, direct URL for migrations.
- `apps/web/src/app/api/sync/route.ts` now has normalization helpers (`normalizeTaskType`, `normalizeTaskStatus`, etc.).
- Canvas import logic is in `apps/web/src/app/api/canvas/courses/route.ts` and handles assignments/syllabus/events/modules.

Feel free to continue from here and reach out if you need me to adjust doc scope, add diagrams, or dig into a specific unit of work.
