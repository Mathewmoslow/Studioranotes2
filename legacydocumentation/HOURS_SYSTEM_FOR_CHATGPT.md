# Task Hours Estimation System for ChatGPT

## Overview
When parsing academic tasks from unstructured text, you need to estimate the hours required for each task. This document provides the exact hours database used by our system.

## Hours Database

### Study Tasks
| Task Type | Min Hours | Max Hours | Default | Description |
|-----------|-----------|-----------|---------|-------------|
| reading | 1 | 2 | 1.5 | Per chapter or article |
| assignment | 2 | 4 | 3 | Homework, problem sets |
| quiz | 2 | 3 | 2.5 | Study time for quiz |
| exam | 6 | 10 | 8 | Study time for exam |
| project | 8 | 20 | 10 | Papers, presentations, group projects |

### Class Activities
| Task Type | Min Hours | Max Hours | Default | Description |
|-----------|-----------|-----------|---------|-------------|
| lecture | 1 | 3 | 1.5 | Class duration |
| lab | 3 | 5 | 4 | Lab session + report |
| clinical | 4 | 8 | 6 | Clinical rotation |
| simulation | 2 | 4 | 3 | Simulation lab |
| tutorial | 1 | 2 | 1 | Tutorial or recitation |

## Important Rules for Hour Estimation

1. **Use the range**: When estimating, pick a value between min and max based on context
   - Simple/easy tasks → use min hours
   - Complex/difficult tasks → use max hours
   - No context → use default

2. **Chapter-based reading**: ALWAYS estimate 1-2 hours PER CHAPTER
   - "Read chapters 10-20" = 11 tasks × 1.5 hours each = 16.5 total hours

3. **Exam preparation**: Consider the exam type
   - Quiz: 2-3 hours
   - Midterm: 6-8 hours
   - Final exam: 8-10 hours

4. **Projects scale with scope**:
   - Individual paper: 8-12 hours
   - Group project: 10-15 hours
   - Major presentation: 12-20 hours

5. **Clinical and lab sessions**: Include preparation and documentation time
   - Lab: Includes report writing time
   - Clinical: Includes patient documentation

## Examples for ChatGPT

### Input: "Read chapters 5-8 for next week"
Output:
```json
{
  "tasks": [
    { "title": "Read Chapter 5", "type": "reading", "estimatedHours": 1.5 },
    { "title": "Read Chapter 6", "type": "reading", "estimatedHours": 1.5 },
    { "title": "Read Chapter 7", "type": "reading", "estimatedHours": 1.5 },
    { "title": "Read Chapter 8", "type": "reading", "estimatedHours": 1.5 }
  ]
}
```

### Input: "Midterm exam on Oct 15, final project due Dec 1"
Output:
```json
{
  "tasks": [
    { "title": "Midterm Exam", "type": "exam", "estimatedHours": 8, "dueDate": "2024-10-15" },
    { "title": "Final Project", "type": "project", "estimatedHours": 15, "dueDate": "2024-12-01" }
  ]
}
```

### Input: "Weekly lab sessions on Thursdays, 2pm-5pm"
Output (for 4 weeks):
```json
{
  "tasks": [
    { "title": "Lab Session - Week 1", "type": "lab", "estimatedHours": 4 },
    { "title": "Lab Session - Week 2", "type": "lab", "estimatedHours": 4 },
    { "title": "Lab Session - Week 3", "type": "lab", "estimatedHours": 4 },
    { "title": "Lab Session - Week 4", "type": "lab", "estimatedHours": 4 }
  ]
}
```

## Key Points for Accurate Estimation

1. **Always be specific**: Don't combine multiple tasks into one
2. **Consider context**: A "quick quiz" might be 2 hours, a "comprehensive exam" might be 10 hours
3. **Include all components**: Labs include report time, projects include research time
4. **Recurring events**: Create separate tasks for each occurrence
5. **Default when uncertain**: Use the default value if context is unclear

## System Fallback
If you don't provide `estimatedHours`, our system will apply these defaults:
- assignment: 3 hours
- exam: 8 hours
- project: 10 hours
- reading: 1.5 hours
- lab: 4 hours
- lecture: 1.5 hours
- clinical: 6 hours
- simulation: 3 hours
- tutorial: 1 hour
- quiz: 2.5 hours

However, it's better if you estimate based on the actual context provided in the text.