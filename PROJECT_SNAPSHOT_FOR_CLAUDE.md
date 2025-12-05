# StudiOra Notes — Codex Handoff Snapshot

## 1. Current State
- **Branch/Path:** `/Users/mathewmoslow/Documents/Apps/studioranotes/codexversion`
- **Stack:** Turborepo powering `apps/web` (Next.js + MUI + Zustand) with Prisma/Supabase + NextAuth + Canvas/OpenAI integrations.
- **Canvas Import:** Courses now import with full Canvas metadata (assignments, syllabus, modules, calendar events, announcements, discussions). Assignments create structured tasks, exam entries from parsed schedule, and hidden context tasks via the Extract Context endpoint.
- **Scheduling:** DynamicScheduler now runs automatically after import, covers the entire semester window, and Upcoming Tasks look ahead to the full term instead of 14 days.
- **Context Genie:** Runs silently during import to seed hidden deadlines and in-person work, while existing Context Genie UI remains available for manual refinement.
- **Layout:** Dashboard padding/border radii trimmed for denser desktop layouts.

## 2. Recent Progress
1. **Onboarding flow:** Enriched Canvas import with Canvas ID-based course dedup, auto task creation (assignments/exams), context extraction, and automatic semester scheduling.
2. **Data helpers:** Added scheduler/semester helpers and Canvas context endpoints (announcements + discussions) so AI logic sees richer materials.
3. **Scheduler behavior:** Removed 2-week horizon, auto-scheduled once courses finish importing, and updated scheduling/UIs to cover the entire term.
4. **Cosmetics:** Reduced padding/rounding on main dashboard pieces for a more compact view.
5. **Plan updates:** Documented the new steps (context extraction + full-term scheduling) in `DEVELOPMENT_PLAN.md`.

## 3. Challenges & Resolutions
1. **Assignments missing after Canvas import** — Fixed by forcing Canvas tasks to carry `estimatedHours`, creating exam tasks from parsed schedules, and reusing Canvas IDs to avoid duplicates; now scheduler sees actual work items (plus generated context ones) immediately.
2. **Context data gaps** — Expanded `api/canvas/courses` to fetch announcements/discussions, feeding them (along with calendar events) into `/api/canvas/extract-context` so AI can surface informal deadlines.
3. **Scheduler horizon** — Reworked `generateSmartSchedule` to default to the latest course end date (with a fallback 16-week window) and removed manual 2-week calls from UI/store, enabling the dashboard to always show full-semester coverage.
4. **Layout feels sparse** — Trimmed welcome and tab panels’ padding/borders and lowered the dashboard margin-top so a 4K/desktop view shows more content without scrolling.

## 4. Remaining Work (Current Effort)
- Verify context extraction can flag in-person blocks (lectures, clinicals, exam/quiz slots) and mark them as protected for the scheduler/time-block generator.
- Finish solidifying hidden context tasks so they show up in scheduler and notes (including support for recurring items coming from the new AI endpoint). 
- Ensure any new tasks created by context extraction include estimated durations and persist when syncing to Supabase.
- Run full manual testing: re-import Canvas courses, confirm assignments and context tasks appear, and ensure the scheduler creates blocks for the full semester without needing manual generation.
- QA `db-sync`/`useDatabaseSync` flows (not touched yet) to confirm the new tasks persist to the database and rehydrate correctly.

## 5. Future Implementations
- Add AI note generation shortcuts inside each course (drag-and-drop resource + context-aware summary builder).
- Surface analytics and study patterns that the scheduler generates, tie-in with the new `priority` weighting logic.
- Extend context extraction to leverage token-minimizing caches, plus logging for training the regex/machine learning stack already present in `apps/web/src/lib`.

## 6. Handoff Notes
1. `npm install` (if dependencies are stale) → `cd apps/web` → `npm run dev` to start turbo + Next.
2. Run Canvas onboarding: connect Canvas, allow automatic import, and observe the auto-caused semester schedule populate the dashboard (the smart schedule button now reruns the same window if desired).
3. The new `PROJECT_SNAPSHOT_FOR_CLAUDE.md` lives here for quick context; `DEVELOPMENT_PLAN.md` highlights the next tasks.
4. Watch the console for `/api/canvas/extract-context` when testing, and check the scheduler log output to confirm the semester horizon is respected.

This snapshot is intended to hand off to the next Codex agent (or Claude Code) with a clear picture of where we landed and what to tackle next.
