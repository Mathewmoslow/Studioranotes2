# Legacy vs Current Implementation - Gap Analysis
**Date**: November 16, 2025
**Issue**: Auto-schedule failed due to missing estimated hours

---

## 🔴 CRITICAL ISSUE: Hours Estimation System MISSING

### What Legacy Had:
**Complete hours database** (`HOURS_SYSTEM_FOR_CHATGPT.md`):

```typescript
const HOURS_DATABASE = {
  reading: { min: 1, max: 2, default: 1.5 },      // PER CHAPTER
  assignment: { min: 2, max: 4, default: 3 },
  quiz: { min: 2, max: 3, default: 2.5 },
  exam: { min: 6, max: 10, default: 8 },
  project: { min: 8, max: 20, default: 10 },
  lab: { min: 3, max: 5, default: 4 },            // Includes report
  clinical: { min: 4, max: 8, default: 6 },
  simulation: { min: 2, max: 4, default: 3 },
  lecture: { min: 1, max: 3, default: 1.5 },
  tutorial: { min: 1, max: 2, default: 1 }
}
```

### What We Currently Have:
**NONE** - Canvas import sets:
```typescript
// OnboardingFlow.tsx:628
duration: 120, // Hardcoded 2 hours for EVERYTHING
```

### Impact:
- ❌ Scheduler can't run (requires estimatedHours)
- ❌ All tasks get same duration regardless of type
- ❌ Reading assignments wildly underestimated
- ❌ Exams severely underestimated

---

## 🔴 CRITICAL ISSUE: Complexity Multiplier System MISSING

### What Legacy Had:
```typescript
// SCHEDULER_DOCUMENTATION.md:39-44
Total Time = Base Time × Complexity Factor × Buffer
- Base Time: Estimated hours from task
- Complexity Factor: 1.0 to 2.0 based on 1-5 star rating
- Buffer: 1.2 for hard deadlines, 1.0 for soft
```

**Complexity Scale**:
- 1 star: Simple (30 min) - factor 0.5
- 2 stars: Basic (1-2 hours) - factor 0.75
- 3 stars: Standard (2-4 hours) - factor 1.0
- 4 stars: Major (4-8 hours) - factor 1.5
- 5 stars: Comprehensive (8+ hours) - factor 2.0

### What We Currently Have:
```typescript
// We STORE complexity but DON'T USE IT in calculations
task.complexity = 3  // Just stored, never applied
```

### Impact:
- ❌ All tasks treated equally regardless of difficulty
- ❌ Complex tasks underestimated
- ❌ Simple tasks overestimated

---

## 🔴 CRITICAL ISSUE: Distributed Scheduling Algorithm MISSING

### What Legacy Had:
**Smart distribution** (`DYNAMIC_SCHEDULING_ATTEMPT.md:59-74`):

```typescript
getDistributedDays(startDate, endDate, totalHours) {
  // Uses 50% of daily capacity for sustainability
  const dailyCapacity = preferences.dailyMaxHours * 0.5
  const daysNeeded = Math.ceil(totalHours / dailyCapacity)
  const interval = totalAvailableDays / daysNeeded

  // Example: 12 hour task with 30 days available
  // Capacity: 6h * 50% = 3h/day
  // Days needed: 12/3 = 4 days
  // Interval: 30/4 = 7.5 days
  // Result: Sessions on days 1, 8, 16, 23
}
```

### What We Currently Have:
```typescript
// useScheduleStore.ts:525-529
const daysAvailable = Math.max(1, differenceInDays(effectiveDeadline, effectiveStartDate) + 1)
const hoursPerDay = Math.min(
  task.estimatedHours / daysAvailable,  // Divides equally
  state.preferences.maxDailyStudyHours || 3
)
```

**This just divides hours equally - bunches work near deadlines!**

### Impact:
- ❌ All study time crammed near due dates
- ❌ Ignores the 50% capacity rule for sustainability
- ❌ No intelligent spacing between sessions
- ❌ Leads to burnout and procrastination

---

## 🟠 HIGH PRIORITY: Multi-Factor Slot Scoring INCOMPLETE

### What Legacy Had:
**Comprehensive scoring** (`DYNAMIC_SCHEDULING_ATTEMPT.md:43-52`):

```typescript
calculateSlotScore(slot, date, taskType, dayEvents) {
  let score = 0

  // Task type preference (+60/+40/+20)
  if (taskType === 'exam' && slot.period === 'morning') score += 60
  if (taskType === 'reading' && slot.period === 'evening') score += 40

  // Daily energy level (+0-30 based on day of week)
  score += energyLevels[dayOfWeek] * 30

  // Avoid clustering (-15 per nearby block)
  nearbyBlocks.forEach(() => score -= 15)

  // Time variety (-10 per duplicate hour)
  duplicateHours.forEach(() => score -= 10)

  // Complexity matching (+20 for optimal)
  if (complexity === 'high' && energyLevel === 'high') score += 20

  return score  // Max ~200 points
}
```

### What We Currently Have:
**Basic energy scoring only** (`useScheduleStore.ts:578-599`):

```typescript
const scoreTimeSlot = (hour, taskDifficulty, isUrgent) => {
  let energyScore = 0.5
  if (hour >= 6 && hour < 12) energyScore = 0.9
  // ... basic time-of-day logic only
  return energyScore  // Max 1.0
}
```

### Impact:
- ⚠️ No task type preferences
- ⚠️ No clustering avoidance
- ⚠️ No time variety enforcement
- ⚠️ Suboptimal time slot selection

---

## 🟠 HIGH PRIORITY: Visual Block Differentiation MISSING

### What Legacy Had:
**Clear visual hierarchy** (`SCHEDULER_DOCUMENTATION.md:59-83`):

```css
/* DO Blocks (Study Time) */
.do-block {
  background: diagonal-stripes;
  border-left: 3px solid [priority-color];
}

/* DUE Blocks (Deadlines) */
.due-block {
  background: solid [course-color];
  border: 3px solid red;
}

/* CLASS Blocks */
.class-block {
  background: solid [course-color];
  icon: school;
}

/* CLINICAL Blocks */
.clinical-block {
  background: cross-hatch;
  border: dashed;
  icon: medical;
}
```

**Plus opacity and border variations** (`FEATURE_SUMMARY.md:26-33`):
- Exams: 80% opacity, 3px solid border, 📊
- Assignments: 53% opacity, 2px solid border, 📝
- Projects: 60% opacity, 2px double border, 💻
- Readings: 33% opacity, 2px dashed border, 📖

### What We Currently Have:
**Basic TimeBlock type** - no visual differentiation implemented

### Impact:
- ⚠️ Can't distinguish block types at a glance
- ⚠️ Calendar looks cluttered and confusing
- ⚠️ Hard to identify priorities visually

---

## 🟠 HIGH PRIORITY: Adaptive Rescheduling MISSING

### What Legacy Had:
**Automatic redistribution** (`DYNAMIC_SCHEDULING_ATTEMPT.md:99-103`):

```typescript
onTaskComplete(taskId) {
  // 1. Remove associated study blocks
  const removedBlocks = removeStudyBlocks(taskId)

  // 2. Get remaining tasks
  const remainingTasks = tasks.filter(t => !t.completed)

  // 3. Redistribute with new timeline
  rescheduleAllTasks(remainingTasks)

  // 4. Optimize based on freed time
  optimizeSchedule()
}
```

### What We Currently Have:
```typescript
// useScheduleStore.ts:384-387
if (state.autoRescheduleEnabled) {
  console.log(`✅ Task "${task.title}" completed. Triggering dynamic reschedule...`)
  get().dynamicReschedule()  // Calls generateSmartSchedule() - full reschedule
}
```

**Issues:**
- ❌ Full reschedule is expensive
- ❌ Doesn't intelligently redistribute freed time
- ❌ No incremental optimization

---

## 🟡 MEDIUM PRIORITY: Lead Time & Buffer System INCOMPLETE

### What Legacy Had:
**Task-specific lead times** (`FEATURE_SUMMARY.md:49`):

```typescript
const LEAD_TIMES = {
  exam: 7,         // Start studying 7 days before
  project: 5,
  assignment: 3,
  quiz: 2,
  reading: 1,
  lab: 2
}

const BUFFERS = {
  hard_deadline: 1.2,  // 20% buffer
  soft_deadline: 1.0   // No buffer
}
```

### What We Currently Have:
```typescript
// useScheduleStore.ts:488
const softDeadline = subDays(adjustedDueDate, task.bufferDays || 0)
// bufferDays defaults to 0 if not set
```

**Issues:**
- ⚠️ No task-type-specific lead times
- ⚠️ bufferDays rarely set during import
- ⚠️ No hard vs soft deadline distinction

---

## 🟡 MEDIUM PRIORITY: Chapter-Based Reading MISSING

### What Legacy Had:
**Per-chapter breakdown** (`HOURS_SYSTEM_FOR_CHATGPT.md:32-62`):

```typescript
// Input: "Read chapters 5-8"
// Output: 4 separate tasks
[
  { title: "Read Chapter 5", type: "reading", hours: 1.5 },
  { title: "Read Chapter 6", type: "reading", hours: 1.5 },
  { title: "Read Chapter 7", type: "reading", hours: 1.5 },
  { title: "Read Chapter 8", type: "reading", hours: 1.5 }
]
// Total: 6 hours (not 1.5!)
```

### What We Currently Have:
```typescript
// Single task: "Read chapters 5-8" with 2 hours (wrong!)
```

### Impact:
- ⚠️ Reading assignments severely underestimated
- ⚠️ Can't track chapter-by-chapter progress
- ⚠️ Scheduler can't break up reading into digestible chunks

---

## 🟢 LOW PRIORITY: Energy Levels by Day of Week

### What Legacy Had:
```typescript
const DEFAULT_ENERGY = {
  Monday: 0.90,
  Tuesday: 1.00,
  Wednesday: 0.95,
  Thursday: 0.85,
  Friday: 0.70,
  Saturday: 0.80,
  Sunday: 0.90
}
```

### What We Currently Have:
**Not implemented** - we have energy by hour, not by day

---

## 📊 Feature Comparison Matrix

| Feature | Legacy | Current | Gap |
|---------|--------|---------|-----|
| **Hours Estimation** | ✅ Complete DB | ❌ Hardcoded 2h | CRITICAL |
| **Complexity Multiplier** | ✅ 0.5-2.0x | ❌ Stored only | CRITICAL |
| **Distributed Scheduling** | ✅ 50% capacity | ❌ Equal division | CRITICAL |
| **Multi-Factor Scoring** | ✅ ~200 points | ⚠️ Basic (1.0) | HIGH |
| **Visual Differentiation** | ✅ 4 block types | ❌ None | HIGH |
| **Adaptive Reschedule** | ✅ Incremental | ⚠️ Full only | HIGH |
| **Lead Time System** | ✅ Per task type | ⚠️ Generic | MEDIUM |
| **Chapter Reading** | ✅ Per chapter | ❌ Single task | MEDIUM |
| **Energy by Day** | ✅ Weekday curve | ❌ None | LOW |
| **Slot Clustering Avoid** | ✅ -15 penalty | ❌ None | MEDIUM |
| **Time Variety** | ✅ -10 penalty | ❌ None | MEDIUM |

---

## 🎯 Immediate Action Items

### 1. **Implement Hours Estimation** (30 min)
Location: `/api/sync/route.ts` and `/api/canvas/courses/route.ts`

```typescript
const getEstimatedHours = (assignment: any): number => {
  const type = determineAssignmentType(assignment)

  const HOURS_DB = {
    reading: 1.5,
    assignment: 3,
    quiz: 2.5,
    exam: 8,
    project: 10,
    lab: 4,
    clinical: 6,
    simulation: 3,
    lecture: 1.5,
    tutorial: 1
  }

  let baseHours = HOURS_DB[type] || 3

  // Adjust by points (complexity proxy)
  if (assignment.points_possible) {
    if (assignment.points_possible >= 100) baseHours *= 1.5
    if (assignment.points_possible <= 10) baseHours *= 0.5
  }

  return baseHours
}

// In sync route:
estimatedHours: task.estimatedHours || getEstimatedHours(task)
```

### 2. **Apply Complexity Multiplier** (15 min)
Location: `useScheduleStore.ts:scheduleTask`

```typescript
// After line 499:
const complexityMultiplier = {
  1: 0.5,
  2: 0.75,
  3: 1.0,
  4: 1.5,
  5: 2.0
}[task.complexity || 3]

const adjustedHours = task.estimatedHours * complexityMultiplier
const bufferMultiplier = task.isHardDeadline ? 1.2 : 1.0
const totalHours = adjustedHours * bufferMultiplier
```

### 3. **Implement Distributed Scheduling** (2 hours)
Location: `useScheduleStore.ts:scheduleTask`

Replace equal division with:

```typescript
const getDistributedDays = (startDate: Date, endDate: Date, totalHours: number) => {
  const dailyCapacity = (state.preferences.maxDailyStudyHours || 6) * 0.5
  const daysNeeded = Math.ceil(totalHours / dailyCapacity)
  const totalAvailableDays = differenceInDays(endDate, startDate)

  if (daysNeeded >= totalAvailableDays) {
    // Not enough time - use every day
    return Array.from({ length: totalAvailableDays }, (_, i) => addDays(startDate, i))
  }

  // Distribute evenly
  const interval = totalAvailableDays / daysNeeded
  const selectedDays: Date[] = []

  for (let i = 0; i < daysNeeded; i++) {
    const dayOffset = Math.floor(i * interval)
    selectedDays.push(addDays(startDate, dayOffset))
  }

  return selectedDays
}
```

### 4. **Complete Multi-Factor Slot Scoring** (1 hour)
Location: `useScheduleStore.ts:scoreTimeSlot`

Add:
- Task type preferences (+60/+40/+20)
- Clustering avoidance (-15 per nearby)
- Time variety (-10 per duplicate)
- Complexity matching (+20)

### 5. **Add Lead Time Defaults** (10 min)
Location: `/api/sync/route.ts`

```typescript
const LEAD_TIME_DEFAULTS = {
  exam: 7,
  project: 5,
  assignment: 3,
  quiz: 2,
  reading: 1,
  lab: 2
}

bufferDays: task.bufferDays || LEAD_TIME_DEFAULTS[taskType]
```

---

## ⏱️ Estimated Implementation Time

| Priority | Task | Time | Impact |
|----------|------|------|--------|
| 🔴 P0 | Hours estimation | 30 min | Unblocks scheduling |
| 🔴 P0 | Complexity multiplier | 15 min | Accurate time calc |
| 🔴 P0 | Distributed scheduling | 2 hours | Prevents cramming |
| 🟠 P1 | Multi-factor scoring | 1 hour | Better time slots |
| 🟠 P1 | Lead time defaults | 10 min | Task-specific buffers |
| 🟡 P2 | Visual differentiation | 2 hours | Better UX |
| 🟡 P2 | Chapter reading split | 1 hour | Accurate estimates |

**Total Critical Path**: ~4 hours to restore core functionality

---

## 🎓 What Legacy System Got Right

1. **Sustainability Focus**: 50% capacity rule prevents burnout
2. **Multi-Factor Decisions**: Considers 5+ factors simultaneously
3. **Task-Type Awareness**: Different strategies for exams vs readings
4. **Visual Clarity**: Immediate visual feedback on block types
5. **Complexity Integration**: Accounts for task difficulty in planning
6. **Incremental Optimization**: Doesn't rebuild entire schedule on every change

---

## 💡 Recommendations

### Immediate (Today):
1. Add hours estimation function
2. Apply complexity multipliers
3. Set buffer day defaults

### This Week:
1. Implement distributed scheduling algorithm
2. Complete multi-factor slot scoring
3. Add visual block differentiation

### This Month:
1. Chapter-based reading breakdown
2. Adaptive rescheduling improvements
3. Energy levels by day of week

---

## 🔍 Root Cause Analysis

**Why did auto-schedule fail?**
- ❌ Canvas import sets `duration: 120` for all tasks
- ❌ Sync doesn't apply `estimatedHours` fallback
- ❌ Scheduler requires `estimatedHours > 0` to create blocks
- ❌ Result: Zero study blocks created

**Why was this missed?**
- Legacy documentation not reviewed before porting
- Focus was on overdue task handling, not hours estimation
- Canvas2 HTML files don't include the hours logic (it was in a separate system)

---

## 📝 Conclusion

The legacy system was **significantly more robust** than our current implementation. We've essentially rebuilt the UI but lost critical scheduling intelligence. The good news: all the algorithms are documented and can be ported.

**Priority: CRITICAL** - Without hours estimation, the scheduler is non-functional.

**Next Step**: Implement hours estimation immediately (30 min fix).
