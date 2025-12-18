import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Course, Task, TimeBlock, Event, UserPreferences } from '@studioranotes/types';
import { addDays, startOfDay, endOfDay, isBefore, isAfter, differenceInDays, subDays, isSameDay, format } from 'date-fns';
import { notificationService } from '../lib/notificationService';
import { DynamicScheduler as OldDynamicScheduler } from '../lib/algorithms/dynamicScheduler';
import { DynamicScheduler, convertToSchedulerTask, StudyBlock as SchedulerStudyBlock } from '../lib/scheduler/algorithm';

const DEFAULT_BUSY_EVENT_DURATION_MS = 60 * 60 * 1000; // 1 hour default when Canvas omits end time

const ensureDate = (value: Date | string | undefined) => {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeEventRecord = (event: any) => {
  const startTime = ensureDate(event?.startTime || event?.start_at || event?.startAt);
  if (!startTime) return null;

  let endTime = ensureDate(event?.endTime || event?.end_at || event?.endAt);
  if (!endTime || endTime <= startTime) {
    endTime = new Date(startTime.getTime() + DEFAULT_BUSY_EVENT_DURATION_MS);
  }

  // Preserve/derive type and title
  let derivedType =
    event?.type ||
    event?.event_type ||
    ((event?.title || '').toLowerCase().includes('exam') ? 'exam' : undefined);

  // Fallback: if nothing is provided, treat unknown single events as exams in fixtures/imports
  if (!derivedType) {
    derivedType = 'exam';
  }

  const derivedTitle =
    event?.title ||
    (derivedType === 'exam' ? 'Final Exam' : undefined);

  const normalized = {
    ...event,
    type: derivedType,
    title: derivedTitle,
    startTime,
    endTime
  };

  return normalized;
};

const eventsRoughlyEqual = (existing: any, incoming: any) => {
  if (!existing || !incoming) return false;
  if (existing.courseId && incoming.courseId && existing.courseId !== incoming.courseId) return false;
  if (!existing.startTime || !incoming.startTime) return false;

  const startDiff = Math.abs(existing.startTime.getTime() - incoming.startTime.getTime());
  const sameDay = isSameDay(existing.startTime, incoming.startTime);
  return sameDay && startDiff <= 5 * 60 * 1000; // within 5 minutes on the same day
};

const mergeEventDetails = (existing: any, incoming: any) => {
  if (!existing) return incoming;
  const merged = { ...existing };

  // Prefer longer/more explicit end times
  if (incoming?.endTime && incoming.endTime > (existing?.endTime || new Date(0))) {
    merged.endTime = incoming.endTime;
  }

  // Keep richer titles/locations/descriptions when available
  if (incoming?.title && (!existing?.title || incoming.title.length > existing.title.length)) {
    merged.title = incoming.title;
  }
  if (incoming?.location && !existing?.location) {
    merged.location = incoming.location;
  }
  if (incoming?.description && !existing?.description) {
    merged.description = incoming.description;
  }

  const sources = [existing?.source, incoming?.source].filter(Boolean);
  if (sources.length > 0) {
    merged.source = Array.from(new Set(sources));
  }

  return merged;
};

const mergeEventLists = (existingEvents: any[], incomingEvents: any[]) => {
  const normalizedExisting = existingEvents
    .map(normalizeEventRecord)
    .filter((e): e is any => Boolean(e));

  const merged = [...normalizedExisting];

  incomingEvents.forEach((incomingRaw) => {
    const normalizedIncoming = normalizeEventRecord(incomingRaw);
    if (!normalizedIncoming) return;

    const duplicateIndex = merged.findIndex((evt) => eventsRoughlyEqual(evt, normalizedIncoming));
    if (duplicateIndex >= 0) {
      const mergedEvent = mergeEventDetails(merged[duplicateIndex], normalizedIncoming);
      merged[duplicateIndex] = mergedEvent as any;
    } else {
      merged.push({ ...normalizedIncoming, id: normalizedIncoming.id || uuidv4() } as any);
    }
  });

  return merged;
};

// Helper function to generate recurring lecture events
const generateLectureEventsForCourse = (
  course: Course,
  get: () => any,
  set: (state: any) => void
) => {
  if (!course.schedule || course.schedule.length === 0) return;

  const state = get();
  const lectureEvents: Event[] = [];

  // Get current academic term from the store
  const academicTermStore = (window as any).__academicTermStore?.getState?.();
  const currentTerm = academicTermStore?.currentTerm;

  let startDate = new Date();
  let endDate = new Date();

  if (currentTerm) {
    // Use actual term dates if available
    startDate = new Date(currentTerm.startDate);
    endDate = new Date(currentTerm.endDate);
  } else {
    // Fallback to 4 months if no term is set
    endDate.setMonth(endDate.getMonth() + 4);
  }
  
  // For each day in the semester
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Check if this course has a lecture on this day
    course.schedule.forEach(scheduleItem => {
      // RecurringEvent has dayOfWeek property (0-6 where 0 = Sunday)
      if (scheduleItem.dayOfWeek === dayOfWeek && scheduleItem.startTime && scheduleItem.endTime) {
        // Parse time strings (e.g., "09:00" -> hours and minutes)
        const [startHour, startMin] = scheduleItem.startTime.split(':').map(Number);
        const [endHour, endMin] = scheduleItem.endTime.split(':').map(Number);
        
        const lectureStart = new Date(currentDate);
        lectureStart.setHours(startHour, startMin, 0, 0);
        
        const lectureEnd = new Date(currentDate);
        lectureEnd.setHours(endHour, endMin, 0, 0);
        
        // Check if there's an exam on this day for this course
        const hasExamToday = state.events.some((e: Event) => 
          e.type === 'exam' && 
          e.courseId === course.id && 
          isSameDay(new Date(e.startTime), currentDate)
        );
        
        // Skip lecture if there's an exam
        if (!hasExamToday) {
          const lectureEvent: Event = {
            id: uuidv4(),
            title: `${course.name} ${scheduleItem.type === 'lecture' ? 'Lecture' : scheduleItem.type}`,
            type: 'lecture' as const,
            courseId: course.id,
            startTime: lectureStart,
            endTime: lectureEnd,
            location: scheduleItem.room || course.room || course.name,
            description: `Regular ${scheduleItem.type} for ${course.name}`,
          };
          
          lectureEvents.push(lectureEvent);
        }
      }
    });
    
    currentDate = addDays(currentDate, 1);
  }
  
  // Add all lecture events to the store
  if (lectureEvents.length > 0) {
    set((state: any) => ({
      events: mergeEventLists(state.events, lectureEvents.map(evt => ({ ...evt, source: 'schedule' })))
    }));
    console.log(`Generated ${lectureEvents.length} lecture events for ${course.name}`);
  }
};

interface ScheduleStore {
  courses: Course[];
  tasks: Task[];
  timeBlocks: TimeBlock[];
  events: Event[];
  preferences: UserPreferences;
  settings: {
    googleBackupEnabled?: boolean;
    autoBackupInterval?: number;
    lastBackupTime?: string;
    notificationsEnabled?: boolean;
  };
  autoRescheduleEnabled: boolean;
  dynamicScheduler: DynamicScheduler | null;
  energyPatterns: Array<{ hour: number; energyLevel: number; productivity: number }>;
  schedulerConfig: {
    dailyStudyHours: { min: number; max: number; preferred: number };
    breakDuration: { short: number; long: number };
    sessionDuration: { min: number; max: number; preferred: number };
  };
  scheduleWarnings: {
    unscheduledTaskIds: string[];
    message: string;
    details: Array<{
      taskId: string;
      title: string;
      remainingMinutes: number;
      dueDate?: Date;
    }>;
  };
  
  // Course actions
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, course: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  removeHistoricalCourses: (cutoffDate?: Date) => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'scheduledBlocks'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string, skipReschedule?: boolean) => void;
  
  // TimeBlock actions
  addTimeBlock: (timeBlock: Omit<TimeBlock, 'id'>) => void;
  updateTimeBlock: (id: string, timeBlock: Partial<TimeBlock>) => void;
  deleteTimeBlock: (id: string) => void;
  toggleTimeBlockComplete: (id: string) => void;
  
  // Event actions
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  toggleEventComplete: (id: string) => void;
  
  // Scheduling actions
  scheduleTask: (taskId: string) => void;
  rescheduleAllTasks: () => void;
  dynamicReschedule: () => void;
  setAutoReschedule: (enabled: boolean) => void;
  generateSmartSchedule: (startDate?: Date, endDate?: Date) => void;
  updateEnergyPattern: (hour: number, energyLevel: number) => void;
  updateSchedulerConfig: (config: Partial<ScheduleStore['schedulerConfig']>) => void;
  
  // Preferences
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateSettings: (settings: Partial<ScheduleStore['settings']>) => void;
  
  // Backup/Restore
  restoreFromBackup: (data: {
    tasks: Task[];
    courses: Course[];
    settings?: any;
    timeBlocks: TimeBlock[];
    preferences: UserPreferences;
  }) => void;
  
  // Queries
  getTasksForDate: (date: Date) => Task[];
  getUpcomingTasks: (days: number) => Task[];
  getTasksByCourse: (courseId: string) => Task[];
}

const defaultPreferences: UserPreferences = {
  studyHours: { start: '09:00', end: '22:00' },
  themePaletteId: 'bright-study',
  breakDuration: 15,
  sessionDuration: 120,
  studySessionDuration: 120,
  complexityDefaults: {
    assignment: 3,
    exam: 2.5,
    project: 4,
    reading: 2,
    lab: 3
  },
  bufferDefaults: {
    soft: 20,
    hard: 10
  },
  defaultBufferDays: 3,
  energyLevels: {
    9: 0.7, 10: 0.9, 11: 1.0, 12: 0.8, 13: 0.6,
    14: 0.7, 15: 0.8, 16: 0.9, 17: 0.8, 18: 0.7,
    19: 0.8, 20: 0.7, 21: 0.6, 22: 0.5
  },
  maxDailyStudyHours: 8,
  autoReschedule: true,
  allowWeekendStudy: true,
  minimumBreakBetweenSessions: 15,
  useAutoEstimation: false,
  preferredStudyTimes: {
    morning: false,
    afternoon: true,
    evening: true,
    night: false,
  },
  hoursPerWeekday: 3,
  hoursPerWeekend: 5,
  studyDays: {
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true
  },
  daysBeforeExam: 7,
  daysBeforeAssignment: 3,
  daysBeforeProject: 10,
  daysBeforeReading: 2,
  daysBeforeLab: 3,
  hoursPerWorkDay: 3,
  defaultHoursPerType: {
    assignment: 3,
    exam: 8,
    project: 10,
    reading: 2,
    lab: 4,
    quiz: 2,
    homework: 2
  },
  complexityMultipliers: {
    1: 0.5,  // ⭐ Very Easy - quick review, -50% time
    2: 0.75, // ⭐⭐ Easy - familiar material, -25% time  
    3: 1.0,  // ⭐⭐⭐ Medium - standard difficulty, no adjustment (BASE TIME)
    4: 1.5,  // ⭐⭐⭐⭐ Hard - complex/unfamiliar, +50% time
    5: 2.0   // ⭐⭐⭐⭐⭐ Very Hard - many parts/very complex, +100% time
  },
  enableNotifications: false,
  reminderTiming: 15,
  theme: 'system',
  calendarView: 'week',
  firstDayOfWeek: 0,
  noteGenerationStyle: 'comprehensive',
  aiAssistanceLevel: 'moderate'
};

// Helper to ensure task data integrity
const ensureTaskIntegrity = (task: any): Task => {
  return {
    ...task,
    scheduledBlocks: Array.isArray(task.scheduledBlocks) ? task.scheduledBlocks : [],
    dueDate: task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate),
    bufferPercentage: task.bufferPercentage || 20,
    status: task.status || 'not-started'
  };
};

export const useScheduleStore = create<ScheduleStore>()(
  persist(
    (set, get) => ({
      courses: [],
      tasks: [],
      timeBlocks: [],
      events: [],
      preferences: defaultPreferences,
      settings: {
        googleBackupEnabled: false,
        autoBackupInterval: 30,
        lastBackupTime: undefined
      },
      autoRescheduleEnabled: true,
      dynamicScheduler: null,
      energyPatterns: [],
      schedulerConfig: {
        dailyStudyHours: { min: 2, max: 8, preferred: 4 },
        breakDuration: { short: 5, long: 20 },
        sessionDuration: { min: 25, max: 90, preferred: 50 }
      },
      scheduleWarnings: {
        unscheduledTaskIds: [],
        message: '',
        details: [],
      },
      
      // Course actions
      addCourse: (course) => {
        // Use provided ID if it exists (for Canvas imports), otherwise generate UUID
        const courseId = (course as any).id || uuidv4();
        const newCourse = { ...course, id: courseId };
        set((state) => ({
          courses: [...state.courses, newCourse],
        }));

        // Generate lecture events if course has schedule
        if (course.schedule && course.schedule.length > 0) {
          const courseWithId = { ...newCourse };
          generateLectureEventsForCourse(courseWithId, get, set);
        }
      },
      
      updateCourse: (id, course) => {
        const state = get();
        const updatedCourses = state.courses.map((c) => (c.id === id ? { ...c, ...course } : c));
        let updatedEvents = state.events;

        // If schedule changed, wipe existing lecture events for this course
        if (course.schedule) {
          updatedEvents = state.events.filter((e) => !(e.courseId === id && e.type === 'lecture'));
        }

        set({
          courses: updatedCourses,
          events: updatedEvents
        });

        // Regenerate lecture events using the new schedule
        if (course.schedule) {
          const courseForEvents = updatedCourses.find((c) => c.id === id);
          if (courseForEvents) {
            generateLectureEventsForCourse(courseForEvents as any, get, set);
          }
        }
      },
      
      deleteCourse: (id) => set((state) => ({
        courses: state.courses.filter((c) => c.id !== id),
        tasks: state.tasks.filter((t) => t.courseId !== id),
        events: state.events.filter((e) => e.courseId !== id),
      })),

      removeHistoricalCourses: (cutoffDate?: Date) => {
        const state = get();
        const cutoff = cutoffDate ? new Date(cutoffDate) : new Date();
        cutoff.setHours(0, 0, 0, 0);

        const keepIds: Set<string> = new Set();

        state.courses.forEach((course) => {
          let latest: Date | null = null;
          const courseTasks = state.tasks.filter((t) => t.courseId === course.id);
          const courseEvents = state.events.filter((e) => e.courseId === course.id);
          const courseBlocks = state.timeBlocks.filter((b) => {
            const task = state.tasks.find((t) => t.id === b.taskId);
            return task?.courseId === course.id;
          });

          const consider = (d?: Date) => {
            if (!d) return;
            const dt = new Date(d);
            if (!latest || dt > latest) latest = dt;
          };

          const courseEnd = (course as any)?.endDate ? new Date((course as any).endDate) : null;
          consider(courseEnd || undefined);
          courseTasks.forEach((t) => consider(t.dueDate));
          courseEvents.forEach((e) => consider(e.endTime || e.startTime));
          courseBlocks.forEach((b) => consider(b.endTime || b.startTime));

          const hasCourseEndInPast = courseEnd ? courseEnd < cutoff : false;
          const hasAnyActivityAfterCutoff = latest && latest >= cutoff;

          // Keep if no course end is known (err on the side of caution) or any activity is after cutoff
          if (!hasCourseEndInPast || hasAnyActivityAfterCutoff) {
            keepIds.add(course.id);
          }
        });

        const courses = state.courses.filter((c) => keepIds.has(c.id));
        const tasks = state.tasks.filter((t) => keepIds.has(t.courseId));
        const events = state.events.filter((e) => !e.courseId || keepIds.has(e.courseId));
        const timeBlocks = state.timeBlocks.filter((b) => {
          const task = state.tasks.find((t) => t.id === b.taskId);
          return task ? keepIds.has(task.courseId) : true;
        });

        set({ courses, tasks, events, timeBlocks });
      },
      
      // Task actions
      addTask: (taskData) => {
        const taskId = uuidv4();
        const state = get();
        
        // Determine buffer days based on task type and preferences
        let bufferDays = 3; // default
        if (taskData.type === 'exam') {
          bufferDays = state.preferences.daysBeforeExam || 7;
        } else if (taskData.type === 'assignment') {
          bufferDays = state.preferences.daysBeforeAssignment || 3;
        } else if (taskData.type === 'project') {
          bufferDays = state.preferences.daysBeforeProject || 10;
        } else if (taskData.type === 'reading') {
          bufferDays = 2; // Less buffer for readings
        }
        
        // Create the task with all required fields
        const newTask: Task = { 
          ...taskData, 
          id: taskId, 
          bufferDays,
          scheduledBlocks: [],
          bufferPercentage: taskData.bufferPercentage || 20
        };
        
        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));
        
        // Create a deadline event (visual representation of DUE date)
        // Block should END at the due time, not start at it
        const deadlineEvent: Event = {
          id: uuidv4(),
          title: `DUE: ${taskData.title}`,
          type: 'deadline',
          courseId: taskData.courseId,
          startTime: new Date(taskData.dueDate.getTime() - 2 * 60 * 60 * 1000), // Start 2 hours before deadline (1hr work + 1hr buffer)
          endTime: new Date(taskData.dueDate.getTime() - 60 * 60 * 1000), // End 1 hour before deadline for upload buffer
          description: `Deadline for ${taskData.title}`,
          taskId: taskId,
        };
        
        set((state) => ({
          events: [...state.events, deadlineEvent],
        }));
        
        // Schedule DO blocks for the task (work time before deadline)
        if (taskData.estimatedHours && taskData.estimatedHours > 0) {
          get().scheduleTask(taskId);
        }
        
        // Schedule notifications for the new task
        const updatedState = get();
        notificationService.scheduleTaskNotifications(updatedState.tasks);
      },
      
      updateTask: (id, task) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
        }));
        
        // Reschedule notifications after task update
        const updatedState = get();
        notificationService.scheduleTaskNotifications(updatedState.tasks);
        
        // Trigger dynamic rescheduling if enabled and task status changed to completed
        if (task.status === 'completed' && updatedState.autoRescheduleEnabled) {
          get().dynamicReschedule();
        }
      },
      
      completeTask: (id, skipReschedule = false) => {
        const state = get();
        const task = state.tasks.find(t => t.id === id);

        if (!task) return;

        // Mark task as completed
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'completed' as const } : t
          ),
        }));

        // Trigger dynamic rescheduling if enabled (unless skipped for batch operations)
        if (state.autoRescheduleEnabled && !skipReschedule) {
          console.log(`✅ Task "${task.title}" completed. Triggering dynamic reschedule...`);
          get().dynamicReschedule();
        } else if (skipReschedule) {
          console.log(`✅ Task "${task.title}" completed (reschedule skipped for batch operation)`);
        }

        // Update notifications
        const updatedState = get();
        notificationService.scheduleTaskNotifications(updatedState.tasks);
      },
      
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          timeBlocks: state.timeBlocks.filter((tb) => tb.taskId !== id),
          events: state.events.filter((e) => e.taskId !== id),
        }));
        
        // Reschedule notifications after task deletion
        const updatedState = get();
        notificationService.scheduleTaskNotifications(updatedState.tasks);
      },
      
      // TimeBlock actions
      addTimeBlock: (timeBlock) => set((state) => ({
        timeBlocks: [...state.timeBlocks, { ...timeBlock, id: uuidv4() }],
      })),
      
      updateTimeBlock: (id, timeBlock) => set((state) => ({
        timeBlocks: state.timeBlocks.map((tb) => (tb.id === id ? { ...tb, ...timeBlock } : tb)),
      })),
      
      deleteTimeBlock: (id) => set((state) => ({
        timeBlocks: state.timeBlocks.filter((tb) => tb.id !== id),
      })),
      
      toggleTimeBlockComplete: (id) => set((state) => ({
        timeBlocks: state.timeBlocks.map((tb) => 
          tb.id === id ? { ...tb, completed: !tb.completed } : tb
        ),
      })),
      
      // Event actions
      addEvent: (event) => {
        const normalizedIncoming = normalizeEventRecord({
          ...event,
          source: event.source || ((event as any).fromCanvas ? 'canvas' : undefined)
        });

        if (!normalizedIncoming) {
          console.warn('Skipping invalid event payload', event);
          return;
        }

        const state = get();
        let baseEvents = state.events;

        // Check if this is an exam on a day that has lectures
        if (normalizedIncoming.type === 'exam') {
          // Remove any lectures on the same day for the same course
          const examDate = startOfDay(normalizedIncoming.startTime);
          baseEvents = state.events.filter(e => {
            if (e.type === 'lecture' && e.courseId === normalizedIncoming.courseId) {
              const eventStart = ensureDate(e.startTime);
              if (!eventStart) return false;
              const eventDate = startOfDay(eventStart);
              return !isSameDay(eventDate, examDate);
            }
            return true;
          });
        }

        const mergedEvents = mergeEventLists(baseEvents, [{ ...normalizedIncoming, id: uuidv4() }]);

        set({
          events: mergedEvents,
        });
      },
      
      updateEvent: (id, event) => set((state) => {
        const existing = state.events.find((e) => e.id === id);
        const base = existing ? { ...existing } : { id };

        return {
          events: mergeEventLists(
            state.events.filter((e) => e.id !== id),
            [{ ...base, ...event, id }]
          ),
        };
      }),
      
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter((e) => e.id !== id),
      })),
      
      toggleEventComplete: (id) => set((state) => ({
        events: state.events.map((e) => 
          e.id === id ? { ...e, completed: !e.completed, completedAt: !e.completed ? new Date() : undefined } : e
        ),
      })),
      
      // Scheduling
      scheduleTask: (taskId) => {
        const state = get();
        const task = state.tasks.find(t => t.id === taskId);
        if (!task || !task.estimatedHours || task.estimatedHours === 0) {
          console.log(`Skipping scheduling for task ${taskId} - no estimated hours`);
          return;
        }

        console.log(`Scheduling task: ${task.title}, estimated hours: ${task.estimatedHours}, buffer days: ${task.bufferDays}`);
        console.log(`Task due date: ${task.dueDate}`);

        // Ensure dueDate is a proper Date object
        const ensureDate = (date: Date | string): Date => {
          return typeof date === 'string' ? new Date(date) : date;
        };

        const dueDate = ensureDate(task.dueDate);

        // Subtract 1 hour from due date for upload buffer
        const adjustedDueDate = new Date(dueDate.getTime() - 60 * 60 * 1000); // 1 hour buffer

        // Calculate soft deadline (when work should be completed)
        const softDeadline = subDays(adjustedDueDate, task.bufferDays || 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // If overdue, flag and skip scheduling into the future
        if (isBefore(adjustedDueDate, today)) {
          if (task.status !== 'overdue') {
            get().updateTask(taskId, { status: 'overdue' });
          }
          console.log(`⛔ Skipping scheduling for overdue task "${task.title}" (due ${adjustedDueDate.toLocaleDateString()})`);
          return;
        }

        console.log(`Today: ${today.toISOString()}, Due: ${adjustedDueDate.toISOString()} (with 1hr buffer), Soft deadline: ${softDeadline.toISOString()}`);

        // Mark as overdue but keep original dates (no extension)
        const isOverdue = isBefore(adjustedDueDate, today);
        if (isOverdue && task.status !== 'overdue') {
          get().updateTask(taskId, { status: 'overdue' });
          console.log(`⚠️ Task "${task.title}" is OVERDUE (due ${adjustedDueDate.toLocaleDateString()}). Will schedule on historical dates.`);
        }

        // Start date is some days before soft deadline to allow time to complete
        const idealStartDate = subDays(softDeadline, Math.ceil(task.estimatedHours / 2));
        const startDate = isAfter(today, idealStartDate) ? idealStartDate : idealStartDate;

        // Use actual deadlines (no effective date extension)
        const effectiveStartDate = startDate;
        const effectiveDeadline = softDeadline;

        // Calculate how many days we have to work
        const daysAvailable = Math.max(1, differenceInDays(effectiveDeadline, effectiveStartDate) + 1);
        const hoursPerDay = Math.min(
          task.estimatedHours / daysAvailable,
          state.preferences.hoursPerWorkDay || state.preferences.maxDailyStudyHours || 3
        );

        console.log(`Days available: ${daysAvailable}, hours per day: ${hoursPerDay}${isOverdue ? ' (OVERDUE - historical dates)' : ''}`);

        // Create DO blocks (study/work time) - allow past dates for historical accuracy
        let remainingHours = task.estimatedHours;
        let currentDate = new Date(effectiveStartDate);
        const newBlocks: TimeBlock[] = [];

        while (remainingHours > 0 && !isAfter(currentDate, effectiveDeadline)) {
          // Check if there are any events on this day that would conflict
          const dayEvents = state.events.filter(e => 
            isSameDay(ensureDate(e.startTime), currentDate)
          );
          
          // Skip days with all-day events (clinicals)
          if (dayEvents.some(e => e.type === 'clinical')) {
            currentDate = addDays(currentDate, 1);
            continue;
          }
          
          // Get all busy times for this day (lectures, labs, exams)
          const busyTimes = dayEvents.map(e => ({
            start: ensureDate(e.startTime).getHours() + ensureDate(e.startTime).getMinutes() / 60,
            end: ensureDate(e.endTime).getHours() + ensureDate(e.endTime).getMinutes() / 60,
            type: e.type
          }));
          
          const hoursToday = Math.min(remainingHours, hoursPerDay);
          
          // Skip if less than 30 minutes remaining
          if (hoursToday < 0.5) {
            break;
          }
          
          // Find best time slot based on preferences and conflicts
          // Parse study hours from preferences (e.g., "09:00" -> 9)
          const studyStartHour = parseInt(state.preferences.studyHours?.start?.split(':')[0] || '9');
          const studyEndHour = parseInt(state.preferences.studyHours?.end?.split(':')[0] || '22');
          
          let startHour = studyStartHour + 5; // Default to mid-day
          
          // Distribute study blocks throughout the day
          const blocksToday = newBlocks.filter(b => {
            const blockDate = new Date(b.startTime);
            return blockDate.toDateString() === currentDate.toDateString();
          }).length;

          // 🔥 ENERGY-BASED SLOT SCORING (from Canvas2 adaptiveScheduler.js) 🔥
          const scoreTimeSlot = (hour: number, taskDifficulty: number, isUrgent: boolean): number => {
            let energyScore = 0.5;

            // Energy levels by time of day (from Canvas2)
            if (hour >= 6 && hour < 12) energyScore = 0.9; // Morning: high energy
            else if (hour >= 12 && hour < 18) energyScore = 0.7; // Afternoon: medium energy
            else if (hour >= 18 && hour < 22) energyScore = 0.8; // Evening: good energy
            else if (hour >= 22 || hour < 6) energyScore = 0.5; // Night: low energy

            // Adjust for task difficulty (complex tasks need high energy)
            const complexity = task.complexity || 3;
            if (complexity >= 4 && energyScore < 0.7) {
              energyScore *= 0.8; // Penalize scheduling hard tasks during low energy
            }

            // Boost score for urgent tasks
            if (isUrgent && energyScore > 0.6) {
              energyScore *= 1.2;
            }

            return Math.min(1, energyScore);
          };

          // Find available time slots with energy-based scoring
          const findAvailableStartTime = (preferredHour: number, duration: number): number => {
            const minimumGap = 0.25; // 15-minute gap between tasks

            // Get all existing blocks for the same date
            const existingBlocksToday = [...state.timeBlocks, ...newBlocks].filter(block => {
              const blockDate = new Date(block.startTime);
              return blockDate.toDateString() === currentDate.toDateString();
            });

            // Try multiple time slots and score them
            const candidateSlots: Array<{ hour: number; score: number }> = [];

            for (let testHour = studyStartHour; testHour < studyEndHour - duration; testHour += 0.5) {
              const testEnd = testHour + duration;

              // Check busy times (classes/events)
              const hasBusyConflict = busyTimes.some(busy =>
                (testHour >= busy.start && testHour < busy.end) ||
                (testEnd > busy.start && testEnd <= busy.end) ||
                (testHour <= busy.start && testEnd >= busy.end)
              );

              // Check existing blocks with minimum gap
              const hasBlockConflict = existingBlocksToday.some(block => {
                const blockStart = ensureDate(block.startTime);
                const blockEnd = ensureDate(block.endTime);
                const blockStartHour = blockStart.getHours() + blockStart.getMinutes() / 60;
                const blockEndHour = blockEnd.getHours() + blockEnd.getMinutes() / 60;

                return (
                  (testHour >= (blockStartHour - minimumGap) && testHour < (blockEndHour + minimumGap)) ||
                  (testEnd > (blockStartHour - minimumGap) && testEnd <= (blockEndHour + minimumGap)) ||
                  (testHour <= (blockStartHour - minimumGap) && testEnd >= (blockEndHour + minimumGap))
                );
              });

              if (!hasBusyConflict && !hasBlockConflict) {
                // Score this slot based on energy levels and task characteristics
                const score = scoreTimeSlot(testHour, task.complexity || 3, isOverdue || daysAvailable < 3);
                candidateSlots.push({ hour: testHour, score });
              }
            }

            // Sort by score (highest first) and return the best slot
            if (candidateSlots.length > 0) {
              candidateSlots.sort((a, b) => b.score - a.score);
              // Pick from top 3 candidates randomly to add variety
              const topCandidates = candidateSlots.slice(0, Math.min(3, candidateSlots.length));
              const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
              return selected.hour;
            }

            // Fallback: return preferred hour if no good slots found
            return preferredHour;
          };
          
          // Determine preferred start time based on preferences and existing blocks
          let preferredStartHour = studyStartHour + 5; // Default mid-day
          
          if (blocksToday === 0) {
            // First block - check preferences
            if (state.preferences.preferredStudyTimes?.morning) {
              preferredStartHour = Math.max(studyStartHour, 9);
            } else if (state.preferences.preferredStudyTimes?.afternoon) {
              preferredStartHour = 14;
            } else if (state.preferences.preferredStudyTimes?.evening) {
              preferredStartHour = Math.min(19, studyEndHour - 3);
            }
          } else {
            // Subsequent blocks - try to distribute throughout the day
            const hoursAvailable = studyEndHour - studyStartHour;
            const interval = Math.floor(hoursAvailable / 4);
            preferredStartHour = Math.min(studyStartHour + ((blocksToday + 1) * interval), studyEndHour - 2);
          }
          
          // Find actual available start time that avoids conflicts
          startHour = findAvailableStartTime(preferredStartHour, Math.ceil(hoursToday));
          
          const blockStart = new Date(currentDate);
          blockStart.setHours(Math.floor(startHour), (startHour % 1) * 60, 0, 0);
          
          const blockEnd = new Date(blockStart);
          // Ensure block doesn't extend past study hours or into busy times
          let endHour = Math.min(startHour + Math.ceil(hoursToday), studyEndHour);
          
          // Check if end time conflicts with any busy period
          const nextBusyTime = busyTimes.find(busy => busy.start > startHour && busy.start < endHour);
          if (nextBusyTime) {
            endHour = Math.min(endHour, nextBusyTime.start);
          }
          
          blockEnd.setHours(Math.floor(endHour), (endHour % 1) * 60, 0, 0);
          
          const newBlock: TimeBlock = {
            id: uuidv4(),
            taskId,
            startTime: blockStart,
            endTime: blockEnd,
            completed: false,
            type: task.type === 'reading' ? 'study' : 
                  task.type === 'exam' ? 'review' : 'work'
          };
          
          newBlocks.push(newBlock);
          
          remainingHours -= hoursToday;
          currentDate = addDays(currentDate, 1);
        }
        
        console.log(`Created ${newBlocks.length} DO blocks for task ${task.title}`);
        
        // Add all the new blocks
        set((state) => ({
          timeBlocks: [...state.timeBlocks, ...newBlocks]
        }));
      },
      
      rescheduleAllTasks: () => {
        const state = get();
        
        // Calculate task priority based on complexity and urgency
        const calculateTaskPriority = (task: Task): number => {
          const now = new Date();
          const dueDate = new Date(task.dueDate);
          const daysUntilDue = Math.max(0, Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          
          // Complexity score (0-1) based on estimated hours
          const maxHours = Math.max(...state.tasks.map(t => t.estimatedHours || 1));
          const complexityScore = (task.estimatedHours || 1) / maxHours;
          
          // Urgency score (0-1) - higher for tasks due sooner
          const maxDays = Math.max(...state.tasks.map(t => {
            const due = new Date(t.dueDate);
            return Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          }));
          const urgencyScore = maxDays > 0 ? 1 - (daysUntilDue / maxDays) : 1;
          
          // Combined priority: weight complexity (30%) and urgency (70%)
          const priority = (complexityScore * 0.3) + (urgencyScore * 0.7);
          
          console.log(`Task "${task.title}": complexity=${complexityScore.toFixed(2)}, urgency=${urgencyScore.toFixed(2)}, priority=${priority.toFixed(2)}`);
          return priority;
        };
        
        // Clear existing time blocks
        set({ timeBlocks: [] });
        
        // Sort tasks by priority (highest first) before scheduling
        const incompleteTasks = state.tasks
          .filter(task => task.status !== 'completed' && task.estimatedHours > 0)
          .map(task => ({ task, priority: calculateTaskPriority(task) }))
          .sort((a, b) => b.priority - a.priority) // Sort by priority descending
          .map(({ task }) => task);
        
        console.log(`🎯 Scheduling ${incompleteTasks.length} tasks by priority:`);
        incompleteTasks.forEach((task, index) => {
          console.log(`${index + 1}. ${task.title} (due: ${new Date(task.dueDate).toDateString()})`);
        });
        
        // Schedule tasks in priority order
        incompleteTasks.forEach(task => {
          console.log(`Rescheduling high-priority task: ${task.title}`);
          get().scheduleTask(task.id);
        });
      },
      
      dynamicReschedule: () => {
        const state = get();
        get().generateSmartSchedule();
      },

      generateSmartSchedule: (startDate, endDate) => {
        const state = get();

        // Default to today through 60 days from today if not specified (increased from 14 days)
        const defaultStart = startOfDay(new Date());
        const defaultEnd = addDays(defaultStart, 60);

        const scheduleStart = startDate || defaultStart;
        const schedulerTasksRaw = state.tasks
          .filter(t => t.status !== 'completed')
          .filter(t => {
            const due = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
            return !Number.isNaN(due.getTime());
          });

        const maxDue = schedulerTasksRaw.reduce<Date | null>((latest, t) => {
          const due = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
          if (!latest || due > latest) return due;
          return latest;
        }, null);

        const scheduleEnd = endDate || maxDue || defaultEnd;

        console.log(`🔄 Generating smart schedule from ${format(scheduleStart, 'MMM d')} to ${format(scheduleEnd, 'MMM d')}...`);

        const parseHourSafe = (value: string | undefined, fallback: number) => {
          const parsed = Number.parseInt(value ?? '');
          if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 23) return parsed;
          return fallback;
        };

        const wakeHour = parseHourSafe(state.preferences.studyHours?.start?.split(':')[0], 7);
        const bedHour = parseHourSafe(state.preferences.studyHours?.end?.split(':')[0], 23);
        const safeBedHour = bedHour <= wakeHour ? Math.min(23, wakeHour + 8) : bedHour;

        // Initialize new scheduler with config including user preferences
        const scheduler = new DynamicScheduler({
          dailyStudyHours: state.schedulerConfig.dailyStudyHours,
          breakDuration: state.schedulerConfig.breakDuration,
          sessionDuration: state.schedulerConfig.sessionDuration,
          sleepSchedule: {
            bedtime: safeBedHour,
            wakeTime: wakeHour
          },
          capacityLimitPercent: 1,
          preferredStudyTimes: state.preferences.preferredStudyTimes,
          studyDays: state.preferences.studyDays,
          allowWeekendStudy: state.preferences.allowWeekendStudy
        });

        // Update energy patterns if available
        if (state.energyPatterns.length > 0) {
          scheduler.updateEnergyPattern(state.energyPatterns);
        }

        // Convert tasks to scheduler format
        const today = startOfDay(new Date());
        const schedulerTasks = schedulerTasksRaw
          .filter(t => {
            const due = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate);
            // Skip historical (due before today)
            return !Number.isNaN(due.getTime()) && !isBefore(startOfDay(due), today);
          })
          .map(task => {
            const preferredHours = state.preferences.defaultHoursPerType?.[task.type];
            const estimatedHours =
              (preferredHours && preferredHours > 0 ? preferredHours : task.estimatedHours) || 1;

            return convertToSchedulerTask({
              ...task,
              estimatedHours,
            });
          })
          .filter(t => t.estimatedDuration > 0);

        console.log(`📋 Found ${schedulerTasks.length} tasks to schedule`);

        const manualBlocks = state.timeBlocks.filter(b => b.isManual === true);
        const normalizeTime = (value: Date | string) => (value instanceof Date ? value : new Date(value));

        // Convert existing events to busy slots
        const existingEvents = state.events
          .map(normalizeEventRecord)
          .filter((e): e is any => Boolean(e))
          .map(e => ({
            start: e.startTime,
            end: e.endTime
          }));

        const manualBusy = manualBlocks.map(b => ({
          start: normalizeTime(b.startTime),
          end: normalizeTime(b.endTime)
        }));

        console.log(`📅 Blocking out ${existingEvents.length} existing events`);

        // Generate optimized schedule
        const studyBlocks = scheduler.generateSchedule(
          schedulerTasks,
          scheduleStart,
          scheduleEnd,
          [...existingEvents, ...manualBusy]
        );

        const estimatedByTask = new Map(schedulerTasks.map(t => [t.id, t.estimatedDuration]));
        const scheduledByTask = new Map<string, number>();
        studyBlocks.forEach(block => {
          const duration = (block.endTime.getTime() - block.startTime.getTime()) / 60000;
          scheduledByTask.set(block.taskId, (scheduledByTask.get(block.taskId) || 0) + duration);
        });

        const unscheduledDetails = schedulerTasks
          .map(task => {
            const est = estimatedByTask.get(task.id) || 0;
            const scheduled = scheduledByTask.get(task.id) || 0;
            const remaining = Math.max(0, est - scheduled);
            return { task, remaining };
          })
          .filter(({ remaining }) => remaining > 1)
          .map(({ task, remaining }) => ({
            taskId: task.id,
            title: task.title,
            remainingMinutes: remaining,
            dueDate: task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate),
          }));

        const unscheduledTaskIds = unscheduledDetails.map((d) => d.taskId);

        // Convert study blocks to time blocks
        const newTimeBlocks: TimeBlock[] = studyBlocks
          .map(block => ({
            id: block.id,
            taskId: block.taskId,
            startTime: block.startTime,
            endTime: block.endTime,
            completed: false,
            type: block.taskType === 'exam' ? 'review' :
                  block.taskType === 'reading' ? 'study' : 'work'
          }));

        set({
          timeBlocks: [...manualBlocks, ...newTimeBlocks],
          dynamicScheduler: scheduler,
          scheduleWarnings: {
            unscheduledTaskIds,
            message: unscheduledTaskIds.length
              ? `${unscheduledTaskIds.length} tasks could not be fully scheduled. Adjust your study window or preferences to fit the required hours.`
              : '',
            details: unscheduledDetails,
          }
        });

        console.log(`📅 Smart schedule generated: ${newTimeBlocks.length} study blocks created`);
      },

      updateEnergyPattern: (hour, energyLevel) => {
        set((state) => {
          const patterns = [...state.energyPatterns];
          const existingIndex = patterns.findIndex(p => p.hour === hour);

          if (existingIndex >= 0) {
            patterns[existingIndex] = {
              ...patterns[existingIndex],
              energyLevel,
              productivity: energyLevel * 0.9
            };
          } else {
            patterns.push({
              hour,
              energyLevel,
              productivity: energyLevel * 0.9
            });
          }

          // Update scheduler if it exists
          if (state.dynamicScheduler) {
            state.dynamicScheduler.updateEnergyPattern(patterns);
          }

          return { energyPatterns: patterns };
        });
      },

      updateSchedulerConfig: (config) => {
        set((state) => ({
          schedulerConfig: { ...state.schedulerConfig, ...config }
        }));
      },
      
      setAutoReschedule: (enabled) => {
        set({ autoRescheduleEnabled: enabled });
        console.log(`Auto-reschedule ${enabled ? 'enabled' : 'disabled'}`);
      },
      
      updatePreferences: (preferences) => set((state) => ({
        preferences: { ...state.preferences, ...preferences },
      })),
      
      updateSettings: (settings) => set((state) => ({
        settings: { ...state.settings, ...settings },
      })),
      
      // Backup/Restore
      restoreFromBackup: (data) => {
        set({
          tasks: data.tasks.map(ensureTaskIntegrity),
          courses: data.courses,
          timeBlocks: data.timeBlocks,
          preferences: { ...defaultPreferences, ...data.preferences },
          settings: data.settings || get().settings,
        });
        
        // Trigger reschedule after restore
        const state = get();
        if (state.autoRescheduleEnabled) {
          state.rescheduleAllTasks();
        }
      },
      
      // Queries
      getTasksForDate: (date) => {
        const { tasks } = get();
        return tasks.filter(task => {
          const taskDate = new Date(task.dueDate);
          return taskDate.toDateString() === date.toDateString();
        });
      },
      
      getUpcomingTasks: (days) => {
        const { tasks } = get();
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        
        return tasks.filter(task => {
          const taskDate = new Date(task.dueDate);
          return taskDate >= now && taskDate <= futureDate;
        });
      },
      
      getTasksByCourse: (courseId) => {
        const { tasks } = get();
        return tasks.filter(task => task.courseId === courseId);
      }
    }),
    {
      name: 'schedule-store',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Fix any corrupted task data during hydration
        if (persistedState && persistedState.tasks) {
          persistedState.tasks = persistedState.tasks.map((task: any) => ensureTaskIntegrity(task));
        }
        
        // Ensure all arrays exist
        persistedState.courses = persistedState.courses || [];
        persistedState.timeBlocks = Array.isArray(persistedState.timeBlocks)
          ? persistedState.timeBlocks.filter((b: any) => {
              const start = new Date(b.startTime);
              const end = new Date(b.endTime);
              return start instanceof Date && end instanceof Date && !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
            })
          : [];
        persistedState.events = mergeEventLists([], persistedState.events || []);
        persistedState.preferences = persistedState.preferences || defaultPreferences;
        
        return persistedState;
      },
    }
  )
);
