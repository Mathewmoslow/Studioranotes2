# Smart Scheduler Documentation

## Overview
The Studiora Smart Scheduler automatically creates optimized study schedules based on your courses, tasks, and preferences.

## How It Works

### 1. Input Data
The scheduler considers:
- **Course Schedules**: Fixed class times, labs, clinical days
- **Tasks**: Assignments, exams, readings with due dates
- **Task Complexity**: 1-5 star rating affecting time allocation
- **User Preferences**: 
  - Preferred study hours (morning/afternoon/evening)
  - Session duration (default: 90 minutes)
  - Break duration between sessions
- **Existing Events**: Personal appointments, work schedules

### 2. Scheduling Algorithm

#### Priority Calculation
Tasks are prioritized based on:
1. **Due Date Proximity** (highest weight)
   - < 24 hours: URGENT (red)
   - 1-3 days: HIGH (orange)
   - 3-7 days: MEDIUM (yellow)
   - > 7 days: LOW (green)

2. **Task Complexity** (secondary weight)
   - Higher complexity tasks get scheduled earlier
   - More time allocated for complex tasks

3. **Task Type**
   - Exams get 2x estimated time
   - Projects get 1.5x estimated time
   - Readings get 1x estimated time

#### Time Calculation
```
Total Time = Base Time × Complexity Factor × Buffer
- Base Time: Estimated hours from task
- Complexity Factor: 1.0 to 2.0 based on 1-5 rating
- Buffer: 1.2 for hard deadlines, 1.0 for soft
```

#### Scheduling Process
1. **Sort tasks** by priority (due date, then complexity)
2. **Calculate start date** based on total time needed
3. **Find available time slots** avoiding:
   - Class times
   - Clinical days
   - Personal events
   - Already scheduled blocks
4. **Create study blocks** (DO blocks) with:
   - Maximum session duration (90 min default)
   - Break time between sessions
   - Respect for preferred study hours

### 3. Types of Calendar Blocks

#### DO Blocks (Study/Work Time)
- **Visual**: Diagonal stripe pattern
- **Color**: Course color with stripes
- **Priority Border**: Left border color indicates urgency
- **Purpose**: Time allocated to work on tasks

#### DUE Blocks (Deadlines)
- **Visual**: Solid background
- **Color**: Course color background
- **Priority Border**: Full border in priority color
- **Purpose**: Shows when assignments are due

#### CLASS Blocks
- **Visual**: Solid course color
- **Icon**: School icon
- **Purpose**: Regular class meetings

#### CLINICAL Blocks
- **Visual**: Cross-hatch pattern
- **Icon**: Medical icon
- **Border**: Dashed
- **Purpose**: Clinical rotations, labs, simulations

### 4. Dynamic Rescheduling

The scheduler automatically adjusts when:
- A task is marked complete early
- A task takes longer than expected
- New urgent tasks are added
- Class schedule changes

### 5. Manual Overrides

You can:
- Drag and drop blocks to different times
- Manually add study blocks
- Lock certain blocks from rescheduling
- Set task-specific preferences

## Entry Points

There are TWO ways to trigger scheduling:

### 1. From Dashboard
- **Button**: "Generate Smart Schedule"
- **Location**: DynaSchedule section
- **Scope**: All pending tasks
- **Use Case**: Initial schedule creation or full reschedule

### 2. From Task Modal
- **Button**: "Schedule This Task"
- **Location**: Individual task view
- **Scope**: Single task only
- **Use Case**: Adding new task to existing schedule

## Best Practices

1. **Set Accurate Complexity Ratings**
   - 1 star: Simple reading/review (30 min)
   - 2 stars: Basic assignment (1-2 hours)
   - 3 stars: Standard homework (2-4 hours)
   - 4 stars: Major assignment (4-8 hours)
   - 5 stars: Exam/project (8+ hours)

2. **Block Off Fixed Commitments**
   - Add clinical days as recurring events
   - Add work schedules
   - Add personal appointments

3. **Use Proper Task Types**
   - Exam: Comprehensive study time
   - Assignment: Focused work blocks
   - Reading: Flexible timing
   - Lab: Fixed preparation time

4. **Review and Adjust**
   - Check generated schedule daily
   - Mark blocks complete as you finish
   - Let the system reschedule remaining work

## Clinical Day Handling

For nursing programs with clinical rotations:

1. **Setup**: Add clinical days when creating course
   - Mark as "CLINICAL" type
   - Set full day blocks (e.g., 6:30 AM - 7:00 PM)
   - Include prep/post time

2. **Scheduling Impact**:
   - No study blocks scheduled during clinical
   - Tasks due after clinical get extra buffer
   - Pre-clinical prep automatically scheduled

3. **Associated Work**:
   - Clinical prep: Night before
   - Care plans: 2 days before
   - Reflections: Day after
   - Skills lab: Week before clinical starts

## Tips for Success

- **Import Everything**: The more data, the better the schedule
- **Update Progress**: Mark tasks complete to trigger rescheduling
- **Trust the System**: Let it handle the optimization
- **Override When Needed**: You know your energy patterns best