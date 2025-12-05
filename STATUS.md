Status: Scheduler debug & UI fixes (current session)

- Scheduler now defaults to full availability (capacityLimitPercent = 1.0) and logs slot/buffer details to diagnose zero-length blocks (apps/web/src/lib/scheduler/algorithm.ts). Generate Smart Schedule logs will show dayStart/dayEnd, busy slots, available slots, and any skipped/invalid durations.
- Schedule tab now has a visible “Generate Smart Schedule” button in the header (apps/web/src/components/scheduler/SchedulerView.tsx). Use this in the dashboard’s Schedule view to run the scheduler.
- Course detail page crash fixed by normalizing task due dates before sorting (apps/web/src/app/courses/[id]/page.tsx).
- Outstanding: /api/sync still returns 500—need the server console stack trace (from the Next.js dev terminal) to diagnose (likely Prisma/DB). Also need to rerun Generate Smart Schedule and capture the new slot logs to resolve the zero-minute blocks.

How to proceed:
1) Run the app (npm run dev from repo root), go to Dashboard -> Schedule, click “Generate Smart Schedule”, and copy the scheduler log output from the terminal (look for findAvailableSlots/slot duration messages).
2) Trigger whatever causes /api/sync 500 and copy the server stack trace from the terminal.
