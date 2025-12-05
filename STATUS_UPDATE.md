# Status Update (detailed)

## Current behavior
- Canvas import: Assignments, modules, announcements, discussions, calendar events, and course Pages (e.g., Start Here, Course Outline/Calendar) are fetched and stored on the course. Pages are not yet rendered in the UI.
- Task durations: Per-type defaults are always applied. Auto estimation is only a fallback when a task comes in with missing/zero hours (toggle ON = allow fallback). Users set the per-type defaults directly.
- Scheduling: Lecture/meeting times are not used as blockers. Canvas calendar events are fetched but not injected as busy events for the scheduler. Parsed lecture times (from syllabus) are stored on the course but not reconciled with calendar events. Onboarding does not prompt for meeting schedules; only the Courses page allows manual entry.
- Due blocks: Buffer rules remain (2h buffer for due blocks; exact times for exams/tests/finals).

## Problems observed
- Overbooking: Tasks can be scheduled over lectures because neither Canvas calendar events nor meeting schedules are enforced as busy blocks.
- Hidden context: Imported Pages (Course Outline/Calendar/Start Here) are not surfaced, so users may re-enter data that already exists.
- Effort burden: Onboarding doesn’t collect meeting times; users must visit Courses to add them, increasing the chance of missing blockers.

## Agreed next steps (do all 1–4)
1) Use Canvas calendar events as busy time  
   - Transform imported Canvas events into busy events in the store and have the scheduler respect them (skip overlap). Default a 1h end time when Canvas omits it.

2) Reconcile meeting schedules vs. Canvas events  
   - If syllabus-parsed or user-entered meeting schedules exist, compare against Canvas events, drop exact duplicates, and keep a single canonical set. Prefer explicit start/end and retain title/location where available.

3) Onboarding prompt for meeting times when none are found  
   - After import, for courses with no parsed lectures and no Canvas calendar events, prompt for a quick meeting schedule (day/time/type/location) before generating the smart schedule. Saving writes to course.schedule and creates busy events; skipping proceeds without blockers.

4) Surface Canvas Pages in UI  
   - Render imported Pages (title, snippet/body, link to Canvas) in course context/details and/or onboarding Additional Context so users can review Course Outline/Calendar without copy-pasting.

## Risks / considerations
- Event duplication: Need clear rules to merge parsed schedules, user-entered times, and Canvas events to avoid double-blocking the same slot.
- Performance: Adding many busy events could slow scheduling; we may need a cap or de-duplication before insertion.
- Data quality: Some Canvas events lack end times or precise titles; fallback defaults must be conservative to avoid over-blocking.
