# Working Scheduler Extraction from Legacy HTML Files
**Date**: November 16, 2025
**Source Files**:
- `Dynamobile.html` (800 lines)
- `Dyna-schedule AI-Enhanced.html` (1424 lines)

---

## 🎯 **THE CRITICAL INSIGHT: HOURS ARE ALWAYS SET**

### The Core Problem We Had:
```typescript
// ❌ Current (BROKEN):
duration: 120,  // Hardcoded 2 hours, no estimatedHours
```

### How Legacy System Works:
```javascript
// ✅ Legacy (WORKING): Every assignment has explicit hours
{
  id: 'ob1-1',
  text: "Chapter 1: Maternity & Women's Healthcare Today",
  date: new Date('2025-05-11'),
  type: "reading",
  hours: 3  // ← ALWAYS SET
}
```

---

## 📊 **HOURS DATABASE FROM LEGACY**

### Extracted from Lines 346-486 (Dyna-schedule AI-Enhanced.html):

```javascript
const TASK_HOURS = {
  // Study Tasks
  reading: 3,          // Per chapter
  video: 1,            // Standard video
  quiz: 1.5,           // Standard quiz
  exam: 2,             // Study time for exam (not the exam itself)
  assignment: 1.5,     // Standard assignment
  project: 10,         // Major project

  // Specialized Tasks
  prep: 1.5,           // HESI prep, case studies
  remediation: 2,      // Remediation work
  vsim: 2,             // Virtual simulation
  simulation: 3,       // High-fidelity simulation
  activity: 0.5,       // Short activities
  admin: 0.5,          // Administrative tasks
  presentation: 2,     // Group presentations
  skills: 2,           // Skills demonstration

  // Variations
  'video-short': 0.5,  // "One-Minute Nurse" videos
  'video-long': 1,     // Full lecture videos
  'quiz-short': 1,     // Quick quizzes (5-15 questions)
  'quiz-long': 2,      // Comprehensive quizzes (35+ questions)
}
```

### **Key Patterns Observed:**

1. **Reading**: ALWAYS 3 hours per chapter
   ```javascript
   { text: "Chapter 1: ...", type: "reading", hours: 3 }
   { text: "Chapter 2: ...", type: "reading", hours: 3 }
   // NOT combined - each chapter is separate task
   ```

2. **Videos**: Vary by length
   ```javascript
   { text: "Video: Fetal Development", type: "video", hours: 1 }
   { text: "One-Minute Nurse: Anticoagulant", type: "video", hours: 0.5 }
   ```

3. **Quizzes**: By question count
   ```javascript
   { text: "Module 1 Adaptive Quiz (15 questions)", type: "quiz", hours: 1.5 }
   { text: "Quiz 1: Health Assessment (35 points)", type: "quiz", hours: 1 }
   { text: "Attestation Quiz", type: "quiz", hours: 0.5 }
   ```

4. **Exams**: Study time estimation
   ```javascript
   { text: "Exam 1: Modules 1 & 2", type: "exam", hours: 2 }
   { text: "Comprehensive Final Exam", type: "exam", hours: 3 }
   { text: "HESI Standardized Exam", type: "exam", hours: 2.5 }
   ```

---

## 🗓️ **ESSENTIAL EVENTS (Hard/Fixed Items)**

### Pattern (Lines 1052-1128):

```javascript
const essentialEvents = [
  { date: new Date('2025-05-05'), title: 'OB Lecture', type: 'lecture', time: '9:00 AM' },
  { date: new Date('2025-05-06'), title: 'OB Clinical', type: 'clinical', time: '1:00 PM' },
  { date: new Date('2025-05-12'), title: 'NCLEX HESI Health Assessment', type: 'exam', time: '2:00 PM' },
  // ... 76 total essential events
]
```

### **Critical Distinction:**

| Essential Events (HARD) | Assignment Tasks (FLEXIBLE) |
|-------------------------|----------------------------|
| Lectures | Reading chapters |
| Clinicals | Video watching |
| Scheduled exams | Quiz prep |
| Labs | Assignment completion |
| Simulations | Study sessions |

**The scheduler schedules AROUND essential events!**

---

## ⚙️ **THE WORKING SCHEDULER ALGORITHM**

### Core Function (Lines 1314-1379 in Dyna-schedule AI-Enhanced.html):

```javascript
function generateStudySchedule() {
    studyBlocks = [];
    const status = document.getElementById('scheduler-status');
    status.textContent = 'Generating study schedule...';

    // 1. GET USER PREFERENCES
    const dailyMax = parseInt(document.getElementById('daily-max').value);  // 6 hours
    const weekendMax = parseInt(document.getElementById('weekend-max').value);  // 4 hours
    const blockDuration = parseFloat(document.getElementById('block-duration').value);  // 1.5 hours

    // 2. COLLECT ALL INCOMPLETE ASSIGNMENTS
    const weekModules = modules[currentWeek] || {};
    const assignments = [];

    Object.entries(weekModules).forEach(([course, module]) => {
        module.assignments.forEach(assignment => {
            if (!completedAssignments.has(assignment.id)) {
                assignments.push({ ...assignment, course });  // ← assignment has .hours property!
            }
        });
    });

    // 3. SORT BY DUE DATE (earliest first)
    assignments.sort((a, b) => a.date - b.date);

    // 4. SCHEDULE EACH ASSIGNMENT
    assignments.forEach(assignment => {
        // ✅ KEY INSIGHT: Start 3 days before due date
        const daysBeforeDue = 3;
        const startDate = new Date(assignment.date);
        startDate.setDate(startDate.getDate() - daysBeforeDue);

        let hoursScheduled = 0;
        let currentDate = new Date(startDate);

        // ✅ CORE LOOP: Schedule until all hours met OR past due date
        while (hoursScheduled < assignment.hours && currentDate <= assignment.date) {
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const maxToday = isWeekend ? weekendMax : dailyMax;

            // ✅ CHECK EXISTING HOURS FOR THIS DAY
            const existingHours = studyBlocks
                .filter(b => b.date.toDateString() === currentDate.toDateString())
                .reduce((sum, b) => sum + b.hours, 0);

            if (existingHours < maxToday) {
                // ✅ SCHEDULE A BLOCK
                const hoursToSchedule = Math.min(
                    blockDuration,                    // Prefer 1.5h blocks
                    assignment.hours - hoursScheduled,  // Don't exceed needed hours
                    maxToday - existingHours           // Don't exceed daily cap
                );

                studyBlocks.push({
                    date: new Date(currentDate),
                    title: `${assignment.course.toUpperCase()}: ${assignment.text}`,
                    type: 'study',
                    hours: hoursToSchedule
                });

                hoursScheduled += hoursToSchedule;
            }

            // ✅ MOVE TO NEXT DAY
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    status.textContent = `Scheduled ${studyBlocks.length} study blocks`;
    generateCalendar();
}
```

---

## 🔑 **KEY PRINCIPLES**

### 1. **Lead Time Strategy**
```javascript
const daysBeforeDue = 3;  // Start 3 days before due date
const startDate = new Date(assignment.date);
startDate.setDate(startDate.getDate() - daysBeforeDue);
```

**Insight**: Fixed 3-day lead time for all tasks. Simple but effective.

### 2. **Daily Capacity Management**
```javascript
const dailyMax = 6;        // Weekday max: 6 hours
const weekendMax = 4;      // Weekend max: 4 hours
const blockDuration = 1.5; // Preferred block size: 1.5 hours
```

**Insight**: Prevents burnout with hard caps.

### 3. **Existing Hours Check**
```javascript
const existingHours = studyBlocks
    .filter(b => b.date.toDateString() === currentDate.toDateString())
    .reduce((sum, b) => sum + b.hours, 0);

if (existingHours < maxToday) {
    // Only schedule if under daily limit
}
```

**Insight**: Respects daily caps across all tasks.

### 4. **Block Size Optimization**
```javascript
const hoursToSchedule = Math.min(
    blockDuration,                    // 1.5h preferred
    assignment.hours - hoursScheduled,  // Don't overschedule
    maxToday - existingHours           // Respect daily cap
);
```

**Insight**: Flexible block sizing within constraints.

---

## 🎨 **VISUAL PRESENTATION**

### Event Type Styling (Lines 181-184):
```css
.event.lecture { background-color: #2196F3; }  /* Blue */
.event.clinical { background-color: #4CAF50; } /* Green */
.event.exam { background-color: #f44336; }     /* Red */
.event.study { background-color: #000000; }    /* Black */
```

### Calendar Integration (Lines 1262-1272):
```javascript
// Merge essential events and study blocks
const dayEvents = [...essentialEvents, ...studyBlocks].filter(e => {
    return e.date.toDateString() === date.toDateString();
});

dayEvents.forEach(event => {
    const eventDiv = document.createElement('div');
    eventDiv.className = `event ${event.type}`;
    eventDiv.textContent = event.title;
    dayCell.appendChild(eventDiv);
});
```

**Insight**: Study blocks and fixed events displayed together in calendar.

---

## 📝 **DATA STRUCTURE**

### Assignment Object:
```javascript
{
  id: 'ob1-1',                    // Unique ID for completion tracking
  text: "Chapter 1: Maternity",   // Display name
  date: new Date('2025-05-11'),   // Due date
  type: "reading",                 // Task type (affects hours)
  hours: 3                         // CRITICAL: Estimated hours
}
```

### Study Block Object:
```javascript
{
  date: new Date(currentDate),                        // When to study
  title: `OBGYN: Chapter 1: Maternity`,              // What to study
  type: 'study',                                      // Type marker
  hours: 1.5                                          // Block duration
}
```

### Essential Event Object:
```javascript
{
  date: new Date('2025-05-05'),  // When
  title: 'OB Lecture',            // What
  type: 'lecture',                // Type (lecture/clinical/exam)
  time: '9:00 AM'                 // Time of day
}
```

---

## 🚀 **IMPLEMENTATION ROADMAP FOR TYPESCRIPT**

### Phase 1: Hours Estimation (CRITICAL - 30 min)
```typescript
// apps/web/src/lib/taskHours.ts
export const TASK_HOURS_DATABASE = {
  reading: 3,
  video: 1,
  quiz: 1.5,
  exam: 2,
  assignment: 1.5,
  // ... rest of hours database
}

export function estimateTaskHours(task: any): number {
  const baseHours = TASK_HOURS_DATABASE[task.type] || 2

  // Adjust by title keywords
  if (task.title.toLowerCase().includes('one-minute')) return 0.5
  if (task.title.toLowerCase().includes('comprehensive')) return baseHours * 1.5

  // Adjust by points (if available)
  if (task.points_possible) {
    if (task.points_possible >= 50) return baseHours * 1.5
    if (task.points_possible <= 10) return baseHours * 0.5
  }

  return baseHours
}
```

### Phase 2: Canvas Import Integration (15 min)
```typescript
// apps/web/src/app/api/canvas/courses/route.ts
import { estimateTaskHours } from '@/lib/taskHours'

assignments: canvasAssignments.map((assignment: any) => ({
  id: assignment.id,
  name: assignment.name,
  dueDate: assignment.due_at,
  type: determineAssignmentType(assignment),
  estimatedHours: estimateTaskHours({  // ← ADD THIS
    type: determineAssignmentType(assignment),
    title: assignment.name,
    points_possible: assignment.points_possible
  })
}))
```

### Phase 3: Scheduler Port (1 hour)
```typescript
// apps/web/src/stores/useScheduleStore.ts

scheduleTask: (taskId) => {
  const task = state.tasks.find(t => t.id === taskId)
  if (!task || !task.estimatedHours) return

  const DAYS_BEFORE_DUE = 3
  const startDate = subDays(task.dueDate, DAYS_BEFORE_DUE)

  let hoursScheduled = 0
  let currentDate = new Date(startDate)

  while (hoursScheduled < task.estimatedHours && !isAfter(currentDate, task.dueDate)) {
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
    const maxToday = isWeekend ?
      state.preferences.weekendMaxHours :
      state.preferences.maxDailyStudyHours

    // Get existing hours for this day
    const existingHours = state.timeBlocks
      .filter(b => isSameDay(new Date(b.startTime), currentDate))
      .reduce((sum, b) => sum + differenceInHours(new Date(b.endTime), new Date(b.startTime)), 0)

    if (existingHours < maxToday) {
      const hoursToSchedule = Math.min(
        state.preferences.blockDuration || 1.5,
        task.estimatedHours - hoursScheduled,
        maxToday - existingHours
      )

      // Create study block
      const startTime = new Date(currentDate)
      startTime.setHours(9) // Default 9am start

      const endTime = addHours(startTime, hoursToSchedule)

      state.timeBlocks.push({
        id: generateId(),
        taskId: task.id,
        startTime,
        endTime,
        type: 'study',
        title: task.title
      })

      hoursScheduled += hoursToSchedule
    }

    currentDate = addDays(currentDate, 1)
  }
}
```

---

## 🎯 **MISSING PIECES (vs Legacy)**

### What Legacy DOESN'T Have:
1. ❌ Multi-factor slot scoring (just uses fixed lead time)
2. ❌ Energy-based time selection (no time-of-day optimization)
3. ❌ Complexity multipliers (fixed hours per type)
4. ❌ Distributed scheduling (bunches near due dates with 3-day lead)

### What Legacy DOES Have (and we need):
1. ✅ **Explicit hours per task** (CRITICAL)
2. ✅ **Daily capacity management** (prevents overload)
3. ✅ **Existing hours checking** (respects limits)
4. ✅ **Fixed vs flexible event distinction** (lectures vs study)
5. ✅ **Simple, predictable algorithm** (easy to understand)

---

## 💡 **RECOMMENDED HYBRID APPROACH**

### Combine Legacy + Documentation Features:

```typescript
// STEP 1: Use legacy hours database (from HTML files)
const baseHours = TASK_HOURS_DATABASE[task.type]

// STEP 2: Apply complexity multiplier (from documentation)
const complexityFactor = [0.5, 0.75, 1.0, 1.5, 2.0][task.complexity - 1]
const adjustedHours = baseHours * complexityFactor

// STEP 3: Use distributed scheduling (from documentation)
const daysNeeded = Math.ceil(adjustedHours / (dailyCapacity * 0.5))
const interval = totalAvailableDays / daysNeeded

// STEP 4: Apply legacy daily caps (from HTML files)
const existingHours = getExistingHoursForDay(currentDate)
if (existingHours < maxToday) {
  scheduleBlock(...)
}
```

---

## 🏁 **IMMEDIATE ACTION ITEMS**

### 1. **Create Hours Database** (5 min)
```bash
# Create file
touch apps/web/src/lib/taskHours.ts
```

### 2. **Add to Canvas Import** (10 min)
```typescript
// In /api/canvas/courses/route.ts
import { estimateTaskHours } from '@/lib/taskHours'
estimatedHours: estimateTaskHours(...)
```

### 3. **Add to Sync Route** (10 min)
```typescript
// In /api/sync/route.ts
estimatedHours: task.estimatedHours || estimateTaskHours(task)
```

### 4. **Test** (5 min)
```bash
# Run dev server
npm run dev

# Import courses
# Check that tasks have estimatedHours > 0
# Run auto-schedule
# Verify study blocks created
```

---

## 📊 **SUCCESS METRICS**

After implementation:
- ✅ Every imported task has `estimatedHours > 0`
- ✅ Auto-schedule creates study blocks
- ✅ Study blocks respect daily caps (6h weekday, 4h weekend)
- ✅ Study blocks start 3 days before due date
- ✅ Dashboard shows scheduled hours

---

## 🎓 **KEY TAKEAWAYS**

1. **Legacy system is SIMPLE but WORKS**
   - Fixed 3-day lead time
   - Hard daily caps
   - Explicit hours per task

2. **Critical missing piece: Hours estimation**
   - Every task MUST have `.hours` or `.estimatedHours`
   - Without this, scheduler cannot function

3. **Two-tier event system**
   - Essential events (HARD): Lectures, clinicals, exams
   - Study blocks (FLEXIBLE): Generated by scheduler

4. **User preferences matter**
   - Daily max hours
   - Weekend max hours
   - Block duration

5. **Simple > Complex (for MVP)**
   - Get basic scheduling working first
   - Add intelligence (energy, scoring, distribution) later

---

**Next Step**: Implement hours estimation system (30 minutes)
