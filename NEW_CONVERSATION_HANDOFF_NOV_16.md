# NEW CONVERSATION HANDOFF — Nov 16

## Work Completed
- Canonical course IDs now assigned during Canvas imports (`apps/web/src/components/onboarding/OnboardingFlow.tsx`), so tasks stay linked to their parent course and `/api/sync` succeeds.
- Study Preferences UI writes to store preferences (weekday/weekend hours, study days, etc.) and auto-saves on Step 3.
- `/api/sync/route.ts` skips tasks whose course can’t be resolved and only upserts with DB-safe course IDs to avoid the `tasks_courseId_fkey` error.
- Reverted to the stable MUI Grid API (current dependency tree lacks `Unstable_Grid2`), so `npm run build` works without module errors.

## Current State
- Import works, but because the semester is nearly over, almost every task arrives overdue. `generateSmartSchedule()` currently refuses to schedule overdue tasks, so the dashboard shows 0 study blocks.
- Dashboard calendar still uses a placeholder widget; it doesn’t merge lectures/clinicals, tasks, and study blocks the way StudentLife did.
- Hidden assignments (e.g., “Read Chapters 12–16” noted in module text) aren’t extracted unless the user manually adds them.
- Audited vulnerabilities (cookie, js-yaml, mammoth, xlsx) are unrelated to the scheduling issues and can wait.

## Outstanding Work / Next Steps
1. **Overdue Reconciliation & Catch-Up**
   - During import, mark `dueDate < now` tasks as `status: 'overdue'` but still create initial study blocks (treat them as “due today”).
   - In `useScheduleStore.generateSmartSchedule()`, allow scheduling for overdue tasks so the calendar isn’t empty.
   - After onboarding, show a “Needs Attention” modal with options: “Auto schedule catch-up”, “Mark all complete”, or “Review individually”.

2. **Adaptive Scheduler Logic (from legacy files)**
   - Review **all HTML files** under:
     * `/Users/mathewmoslow/Documents/Studioranotescodex/codexversion/Canvas2`
     * `/Users/mathewmoslow/Documents/Apps/StudentLife`
   - Extract the JavaScript scheduler algorithms (per-task hour estimates, daily caps, reading/video classification, due vs do blocks) and port the most robust logic into the current store. This is required to mirror StudentLife’s scheduler behaviour.

3. **Dashboard Calendar Upgrade**
   - Build a React calendar that combines: `courses.schedule` + `canvasData.calendarEvents` (lectures/clinicals), `tasks` (with status chips), and `timeBlocks` (study sessions). Use the legacy HTML layouts as the blueprint (module cards, week selector, month/week/list toggles).

4. **AI Context Intake / Supplemental Docs**
   - On the Step-4 success screen, add a guided “Upload syllabus/outline” modal so users can paste or upload missing instructions. Feed that into the existing context extractor and through the adaptive scheduler.

5. **Security Follow-up**
   - After the scheduling/dashboard refactor, revisit `npm audit` and plan upgrades (`next-auth`, `mammoth`, `xlsx`, etc.).

## Environment / Testing Notes
- Work exclusively from `/Users/mathewmoslow/Documents/Studioranotescodex/codexversion` (the old `/Users/mathewmoslow/Documents/Apps/studioranotes` path now symlinks here).
- Clear test data between runs: `node apps/web/scripts/clear-user-data.js <email>`.
- Dev server: `npm run dev` at the codexversion root. Delay `npm run build` until the scheduler/calendar rewrite is done.
