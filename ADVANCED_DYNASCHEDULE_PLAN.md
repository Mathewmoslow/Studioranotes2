# Advanced DynaSchedule Features Plan

## Overview
Post-launch enhancements to the dynamic scheduling system. These features build on the existing scheduler (`/apps/web/src/lib/scheduler/algorithm.ts`) which already implements:
- 50% daily capacity rule
- Visual task blocks (DO/DUE)
- Basic priority ordering by due date

---

## Feature 1: Multi-Factor Scoring

### Current State
Tasks are scheduled primarily by due date, with some complexity weighting.

### Proposed Enhancement
Add a scoring system that combines:

1. **Deadline Urgency (40%)** - How close is the due date?
   ```typescript
   urgencyScore = 1 - (daysUntilDue / maxDays)
   // Task due tomorrow = 0.95, task due in 2 weeks = 0.3
   ```

2. **Importance Weight (40%)** - User-defined priority
   ```typescript
   importanceScore = task.priority / 5
   // Priority 5 (critical) = 1.0, Priority 1 (low) = 0.2
   ```

3. **Complexity Penalty (20%)** - Complex tasks need earlier scheduling
   ```typescript
   complexityScore = task.complexity / 5
   // Ensures hard tasks aren't left to last minute
   ```

### Implementation Location
- `apps/web/src/lib/scheduler/algorithm.ts` - Add scoring function
- `apps/web/src/stores/useScheduleStore.ts` - Update `generateSmartSchedule()`

### Files to Modify
```
apps/web/src/lib/scheduler/algorithm.ts
  - Add calculateTaskScore() function
  - Update generateSchedule() to sort by score

packages/types/src/index.ts
  - Add priority: 1-5 to Task interface (if not present)

apps/web/src/components/scheduler/EventModalMUI.tsx
  - Add priority selector (1-5 stars or dropdown)
```

### Estimated Effort
~2 hours implementation + testing

---

## Feature 2: Task Rescheduling (Drag-Drop)

### Current State
Tasks are auto-scheduled. Manual rescheduling requires deleting and recreating.

### Proposed Enhancement
Allow drag-drop rescheduling with cascade effects:

1. **Drag Block to New Time**
   - Move a study block to a different time/day
   - System recalculates remaining blocks for that task

2. **Cascade Logic**
   - If moved block conflicts with others, shift them
   - Respect capacity limits when cascading
   - Show warning if cascade pushes tasks past due dates

3. **Manual Override Flag**
   - Mark manually-placed blocks as `isManual: true`
   - Exclude from auto-rescheduling

### Implementation Location
- `apps/web/src/components/scheduler/SchedulerView.tsx` - Add drag handlers
- Already uses FullCalendar which has built-in drag support

### Files to Modify
```
apps/web/src/components/scheduler/SchedulerView.tsx
  - Enable eventDrop/eventResize handlers
  - Add confirmation dialog for cascade effects

apps/web/src/stores/useScheduleStore.ts
  - Add rescheduleBlock(blockId, newStart, newEnd) action
  - Add cascadeReschedule() logic

apps/web/src/lib/scheduler/algorithm.ts
  - Add findAffectedBlocks() helper
  - Update generateSchedule to respect manual blocks
```

### UI Flow
```
User drags block →
  Conflict check →
    No conflict: Move block, mark as manual
    Conflict: Show dialog with options
      1. "Move anyway" (cascade others)
      2. "Cancel"
      3. "Swap with conflicting block"
```

### Estimated Effort
~4 hours implementation + testing

---

## Feature 3: Calendar Sync (Google/iCal)

### Current State
No external calendar integration.

### Proposed Enhancement
Two-way sync with Google Calendar and iCal export:

#### 3a. iCal Export (Simpler - Do First)
- Export tasks/events as .ics file
- User imports into their calendar app
- One-way, no OAuth needed

#### 3b. Google Calendar Sync (Full Integration)
- OAuth2 authentication with Google
- Push Studiora events to Google Calendar
- Pull Google events as busy time
- Bidirectional sync

### Implementation - iCal Export

```typescript
// apps/web/src/lib/icalExport.ts
export function generateICalFile(events: Event[], tasks: Task[]): string {
  let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Studiora//EN\n'

  // Add events
  events.forEach(event => {
    ical += formatEvent(event)
  })

  // Add task due dates
  tasks.forEach(task => {
    ical += formatTaskDeadline(task)
  })

  ical += 'END:VCALENDAR'
  return ical
}
```

### Implementation - Google Calendar

```
apps/web/src/app/api/google/auth/route.ts
  - OAuth2 redirect handler

apps/web/src/app/api/google/callback/route.ts
  - Token exchange

apps/web/src/app/api/google/sync/route.ts
  - Push/pull events

apps/web/src/lib/googleCalendar.ts
  - Calendar API wrapper

apps/web/src/components/settings/CalendarSettings.tsx
  - Connect/disconnect UI
  - Sync preferences (which calendars to sync)
```

### Environment Variables Needed
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://studiora.io/api/google/callback
```

### Estimated Effort
- iCal Export: ~2 hours
- Google Calendar: ~6 hours (OAuth complexity)

---

## Implementation Priority

### Phase 1 (Immediate Post-Launch)
1. **iCal Export** - Quick win, high user value
2. **Multi-Factor Scoring** - Improves scheduling quality

### Phase 2 (Based on User Feedback)
3. **Drag-Drop Rescheduling** - If users request manual control
4. **Google Calendar Sync** - If users heavily request it

---

## Technical Notes

### Existing Infrastructure
- FullCalendar library already loaded (supports drag-drop)
- Zustand store ready for new actions
- Algorithm file well-structured for extensions

### Risk Areas
- Drag-drop cascade logic can get complex
- Google OAuth requires proper security review
- iCal format has edge cases (timezones, recurring events)

### Testing Requirements
- Multi-factor scoring: Verify correct ordering with various task combinations
- Drag-drop: Test cascade with overlapping blocks, capacity limits
- Calendar sync: Test with different calendar clients

---

## Approval Needed

Before implementation, confirm:
1. Priority order of features
2. Whether Google Calendar sync is worth the OAuth complexity
3. Any changes to scoring weights (currently 40/40/20)
