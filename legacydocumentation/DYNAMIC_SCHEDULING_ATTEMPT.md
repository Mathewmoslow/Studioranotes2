# DYNAMIC SCHEDULING ATTEMPT

## Overview
This document outlines the comprehensive dynamic scheduling system implemented for the StudentLife/Studiora app. The scheduler intelligently distributes study sessions throughout the semester while respecting user preferences, energy levels, and calendar availability.

## Core Philosophy
Instead of bunching study sessions near due dates, the scheduler spreads work throughout the available time period, creating a more sustainable and effective study pattern.

## Key Components

### 1. StudyScheduler Class (`/src/core/algorithms/studyScheduler.ts`)

#### Distribution Strategies
- **Distributed**: Spreads tasks evenly across the semester
- **Compressed**: Groups tasks closer to due dates (fallback)

```typescript
preferences.spreadStrategy = 'distributed' // Default strategy
```

#### Scheduling Algorithm Flow
1. Analyzes all tasks requiring study time
2. Calculates total hours needed per task (including complexity multipliers)
3. Determines optimal distribution window (from today to due date - buffer)
4. Intelligently selects days based on strategy
5. Finds best time slots on each selected day
6. Creates study blocks with varied start times

### 2. Time Slot Selection Process

#### Step 1: Find ALL Available Slots
```typescript
findAllAvailableSlots(date, existingEvents, hoursNeeded)
```
- Scans morning (8AM-12PM), afternoon (1PM-6PM), evening (7PM-10PM)
- Checks against existing calendar events
- Returns all possible time slots

#### Step 2: Score Each Slot
```typescript
calculateSlotScore(slot, date, taskType, dayEvents)
```

Scoring factors (max score: ~200):
- **Task type preference** (+60/+40/+20 points)
  - Exams prefer morning/afternoon
  - Reading prefers evening
  - Projects prefer afternoon/morning
- **Daily energy level** (+0-30 points based on day of week)
- **Avoid clustering** (-15 points per nearby block)
- **Time variety** (-10 points per duplicate hour)
- **Complexity matching** (+20 points for optimal matches)

#### Step 3: Select Best Slot
- Sorts slots by score
- Takes top 3 candidates
- Randomly selects from top candidates (prevents rigid patterns)

### 3. Distribution Methods

#### Distributed Days Selection
```typescript
getDistributedDays(startDate, endDate, totalHours)
```
- Calculates ideal spacing between study sessions
- Uses 50% of daily capacity for better sustainability
- Formula: `interval = totalAvailableDays / daysNeeded`

#### Example Distribution
For a task needing 12 hours with 30 days available:
- Daily capacity: 6 hours * 50% = 3 hours/day
- Days needed: 12/3 = 4 days
- Interval: 30/4 = 7.5 days
- Result: Study sessions on days 1, 8, 16, 23

### 4. Energy Level Integration

Default energy levels by day:
- Monday: 90%
- Tuesday: 100%
- Wednesday: 95%
- Thursday: 85%
- Friday: 70%
- Saturday: 80%
- Sunday: 90%

High-complexity tasks are preferentially scheduled on high-energy days.

### 5. Conflict Resolution

The scheduler respects:
- Existing lectures (e.g., NURS315 Wednesday 1PM)
- Previously scheduled study blocks
- Manual time blocks created by user
- Buffer times between activities

### 6. Smart Features

#### Adaptive Rescheduling
When a task is completed:
1. Removes associated study blocks
2. Redistributes remaining tasks
3. Optimizes based on new timeline

#### Multi-Factor Optimization
- Considers 5+ factors simultaneously
- Weighs trade-offs between preferences
- Adapts to changing calendar state

#### Time Variety
- Avoids scheduling everything at same time
- Varies between morning, afternoon, evening
- Prevents study fatigue

## Configuration

### User Preferences
```typescript
preferences: {
  dailyMaxHours: 6,
  weekendMaxHours: 4,
  blockDuration: 1.5,
  preferredTimes: {
    morning: { start: 8, end: 12, weight: 1 },
    afternoon: { start: 13, end: 18, weight: 1 },
    evening: { start: 19, end: 22, weight: 1 }
  },
  spreadStrategy: 'distributed'
}
```

### Task Types & Default Hours
- Exam: 8 hours
- Project: 10 hours
- Assignment: 3 hours
- Reading: 2 hours
- Quiz: 2 hours
- Lab: 4 hours

## Implementation Files

1. **Core Algorithm**: `/src/core/algorithms/studyScheduler.ts`
   - Main scheduling logic
   - Slot scoring system
   - Distribution algorithms

2. **Store Actions**: `/src/stores/scheduleActions.ts`
   - Integration with app state
   - Trigger scheduling

3. **Store**: `/src/stores/useScheduleStore.ts`
   - State management
   - Task/event storage

4. **UI Modal**: `/src/components/tasks/StudySchedulerModal.tsx`
   - User interface
   - Preference settings
   - Progress display

## Fixes Implemented

1. **5PM Clustering Fix**: Removed hardcoded 2PM/5PM defaults, now uses dynamic slot finding
2. **Lecture Integration**: NURS315 correctly blocks Wednesday 1PM
3. **Due Times**: Assignments show 11:59PM due time
4. **Distribution**: Tasks spread throughout semester, not bunched at deadlines
5. **Time Variety**: Study blocks use varied times based on availability

## Testing

To verify the scheduler is working:
1. Import course syllabus
2. Open DynaSchedule modal
3. Check that study blocks (DO blocks) appear at various times
4. Verify lectures block appropriate slots
5. Confirm tasks are distributed across weeks, not clustered

## Future Enhancements

Potential improvements:
- Learning from user behavior
- Integration with productivity patterns
- Smart break scheduling
- Collaborative study session coordination
- Exam review intensification periods

## Troubleshooting

If all blocks appear at same time:
1. Check calendar events are loading correctly
2. Verify preferences are set
3. Ensure sufficient time available before due dates
4. Check console for scheduling conflicts

If tasks bunch near deadlines:
1. Verify `spreadStrategy` is set to 'distributed'
2. Check buffer days settings
3. Ensure tasks have reasonable hour estimates

## Technical Notes

- Uses date-fns for date manipulation
- ISO 8601 format for all timestamps
- Timezone-aware scheduling
- Conflict detection uses temporal overlap algorithm
- Score-based selection ensures flexibility

---

*This scheduler represents a comprehensive solution for intelligent, adaptive study planning that respects user preferences while optimizing for learning effectiveness.*