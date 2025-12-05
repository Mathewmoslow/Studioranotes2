# Course Lifecycle Management - Proposal

## Problem Statement

**Current Issue:**
- Canvas returns courses from multiple semesters (10 courses total)
- No way to distinguish active vs. completed courses
- Old semester tasks will interfere with current scheduling
- Need historical access without clutter

**Examples:**
- Fall 2025: NURS320, NURS340 (active)
- Spring 2026: NURS420, NURS450 (upcoming)
- Summer 2025: NURS200 (completed)

## Proposed Solution

### Add Course Status Enum

```prisma
enum CourseStatus {
  ACTIVE      // Currently enrolled
  COMPLETED   // Finished, keep for reference
  ARCHIVED    // Old semester, hide by default
  UPCOMING    // Future semester
}
```

---

## Implementation Plan

### Phase 1: Schema Update
```prisma
model Course {
  // ... existing fields
  status CourseStatus @default(ACTIVE)

  // Already have these:
  semester String? // "Fall", "Spring", "Summer"
  year     Int?    // 2025, 2026
}
```

### Phase 2: Import Logic
When importing from Canvas:
- Check course dates (start_at, end_at)
- Auto-assign status:
  - `start_at` in future → UPCOMING
  - `end_at` in past → COMPLETED
  - Otherwise → ACTIVE
- User can override during import

### Phase 3: Dashboard Filtering
```typescript
// Default view: ACTIVE courses only
const activeCourses = courses.filter(c => c.status === 'ACTIVE')

// Separate views:
- "Current Semester" (ACTIVE)
- "Upcoming" (UPCOMING)
- "Completed" (COMPLETED + ARCHIVED)
```

### Phase 4: Task Filtering
```typescript
// Scheduler only uses ACTIVE course tasks
const activeTasks = tasks.filter(t =>
  courses.find(c => c.id === t.courseId && c.status === 'ACTIVE')
)
```

---

## User Workflows

### Workflow 1: New Semester Starts
**Option A: Automatic (Smart)**
```
1. System detects course end dates passed
2. Prompts: "Archive Fall 2025 courses?"
3. User confirms
4. Status: ACTIVE → COMPLETED
```

**Option B: Manual (Simple)**
```
1. User clicks "Start New Semester"
2. System shows current ACTIVE courses
3. User selects which to archive
4. New imports default to ACTIVE
```

### Workflow 2: Mid-Semester Re-Import
**Current behavior: Duplicates courses**
**New behavior:**
```
1. System detects existing courses
2. Updates existing instead of creating new
3. Preserves status unless user changes
4. Merges new assignments into existing
```

### Workflow 3: View Historical Data
```
1. Dashboard has "View" dropdown:
   - Current Semester (default)
   - All Courses
   - Archived Courses
2. Notes/resources still accessible
3. Old tasks hidden from scheduler
```

---

## Database Impact

### Migration Required
```sql
ALTER TABLE courses ADD COLUMN status TEXT DEFAULT 'ACTIVE';
```

### Backward Compatibility
- Existing courses default to ACTIVE
- No data loss
- Can manually adjust after migration

---

## UI Changes Needed

### 1. Course Import Screen
```
[ ] NURS320: Adult Health II (Fall 2025) [ACTIVE ▼]
[ ] NURS200: Fundamentals (Summer 2025) [COMPLETED ▼]
```

### 2. Dashboard Filter
```
View: [Current Semester ▼] [Archive Selected Courses]
```

### 3. Settings Page
```
Semester Management:
Current: Fall 2025
[ Start New Semester ] [ Archive All Completed ]
```

---

## Scheduler Integration

### Before (Current - BROKEN):
```typescript
// Uses ALL tasks from ALL semesters
const allTasks = await prisma.task.findMany()
// Result: Overloaded schedule with old tasks
```

### After (Proposed - FIXED):
```typescript
// Only ACTIVE course tasks
const activeTasks = await prisma.task.findMany({
  where: {
    course: {
      status: 'ACTIVE'
    }
  }
})
```

---

## Implementation Priority

### OPTION 1: Full Implementation (2-3 hours)
✅ **Do This Now**
- Add status enum to schema
- Update import to set status
- Filter dashboard by ACTIVE
- Filter scheduler by ACTIVE
- Add archive action

**Pros:** Solves problem completely
**Cons:** 2-3 hours before scheduler test

### OPTION 2: Quick Fix (30 min)
⚡ **Quick Win**
- Add status field (default ACTIVE)
- Manual archive button
- Filter queries by ACTIVE
- Defer smart detection

**Pros:** Fast, testable today
**Cons:** Manual management required

### OPTION 3: Defer (Not Recommended)
❌ **Don't Do This**
- Test scheduler with all 10 courses
- Fix later

**Pros:** Test immediately
**Cons:** Inaccurate testing, will need to retest

---

## Recommended Action

**Implement OPTION 2 (Quick Fix) NOW:**

### Changes Required:
1. **Schema:** Add `status` field (5 min)
2. **Queries:** Filter by ACTIVE (10 min)
3. **UI:** Add "Archive" button (15 min)
4. **Test:** Verify filtering works (10 min)

**Total: ~30 minutes**

Then test scheduler with clean data.

---

## Questions to Answer

1. **When importing 10 courses, which 5 are current?**
   - Check Canvas `enrollment_state` field
   - Check `start_at` and `end_at` dates
   - Default recent courses to ACTIVE?

2. **What happens to tasks when course is archived?**
   - Keep tasks (for historical reference)
   - Just hide from scheduler
   - OR mark tasks as ARCHIVED too?

3. **Can user un-archive a course?**
   - Yes, simple status change
   - Useful for referencing old materials

4. **Should we auto-archive based on dates?**
   - Defer to v2 (smart detection)
   - Start with manual control

---

## Decision Time

**What do you want to do?**

A. **Quick Fix (30 min)** - Add status field + manual archive
B. **Full Solution (2-3 hrs)** - Complete lifecycle management
C. **Different approach** - Your idea?
