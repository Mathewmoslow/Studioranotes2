import { formatISO, parseISO, set } from 'date-fns';
import { canvasFixture, FixtureData } from './canvasFixture';
import { rawCanvasFixture, RawCanvasFixture } from './rawCanvasFixture';
import { useScheduleStore } from '../../stores/useScheduleStore';
import { normalizeCanvasCourse } from '../canvas/normalizeCourse';
import { determineAssignmentType } from '../taskHours';
import { v4 as uuidv4 } from 'uuid';

type Assertion = { ok: boolean; message: string };

const toDate = (iso: string) => parseISO(iso);

const dayOffsetToDate = (dayOfWeek: number, anchor: Date) => {
  // dayOfWeek in fixture: 0 = Monday per onboarding UI
  const anchorDay = anchor.getDay(); // 0 Sunday
  // Convert fixture day (0=Mon) to JS day (1=Mon, 0=Sun)
  const targetJs = ((dayOfWeek + 1) % 7);
  const diff = (targetJs + 7 - anchorDay) % 7;
  const target = new Date(anchor);
  target.setDate(anchor.getDate() + diff);
  return target;
};

/**
 * Assertions for raw Canvas fixture (exam/due times from raw data).
 */
export const runRawFixtureAssertions = (fixture: RawCanvasFixture = rawCanvasFixture) => {
  const { events, tasks, courses } = useScheduleStore.getState();
  const assertions: Assertion[] = [];

  // Exams
  fixture.courses.forEach(course => {
    (course.calendar_events || [])
      .filter(e => (e.event_type || '').toLowerCase() === 'exam')
      .forEach(exam => {
        const normalizedTitle = exam.title.replace(/^[A-Z]{3,}\d+\s*/i, '').trim() || exam.title;
        const start = parseISO(exam.start_at).getTime();
        const end = parseISO(exam.end_at).getTime();
        const candidates = events.filter(e =>
          e.courseId === String(course.id) &&
          ((e.type || '').toLowerCase() === 'exam' || (e.title || '').toLowerCase().includes('exam'))
        );
        const matchByTime = candidates.find(e => {
          const st = e.startTime instanceof Date ? e.startTime.getTime() : new Date(e.startTime).getTime();
          const et = e.endTime instanceof Date ? e.endTime.getTime() : new Date(e.endTime).getTime();
          return st === start && et === end;
        });
        const matchByTitle = candidates.find(e => (e.title || '').toLowerCase().includes(normalizedTitle.toLowerCase()));
        const match = matchByTime || matchByTitle || candidates[0];
        if (!match) {
          assertions.push({ ok: false, message: `${course.id}: missing exam "${normalizedTitle}"` });
          return;
        }
        const actualStart = (match.startTime instanceof Date ? match.startTime : new Date(match.startTime)).getTime();
        const actualEnd = (match.endTime instanceof Date ? match.endTime : new Date(match.endTime)).getTime();
        if (actualStart !== start) assertions.push({ ok: false, message: `${course.id}: exam "${normalizedTitle}" start mismatch` });
        if (actualEnd !== end) assertions.push({ ok: false, message: `${course.id}: exam "${normalizedTitle}" end mismatch` });
      });
  });

  // Due dates
  fixture.courses.forEach(course => {
    (course.assignments || []).forEach(assign => {
      const expected = parseISO(assign.due_at).getTime();
      const matches = tasks.filter(t => t.courseId === String(course.id) && t.title === assign.name);
      if (!matches.length) {
        assertions.push({ ok: false, message: `${course.id}: missing assignment "${assign.name}"` });
        return;
      }
      const okMatch = matches.find(t => {
        const actual = (t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate)).getTime();
        return actual === expected;
      });
      if (!okMatch) {
        const actuals = matches.map(t => (t.dueDate instanceof Date ? t.dueDate.toISOString() : String(t.dueDate))).join(', ');
        assertions.push({ ok: false, message: `${course.id}: due date mismatch for "${assign.name}" (got: ${actuals})` });
      }
    });
  });

  // Context
  fixture.courses.forEach(course => {
    const match = courses.find(c => c.id === String(course.id));
    if (!match) {
      assertions.push({ ok: false, message: `${course.id}: course missing` });
      return;
    }
    if (!match.additionalContext) {
      assertions.push({ ok: false, message: `${course.id}: additional context missing` });
    }
  });

  if (!assertions.length) assertions.push({ ok: true, message: 'Raw fixture assertions passed' });
  return assertions;
};

export const loadFixtureIntoStore = (fixture: FixtureData = canvasFixture) => {
  // Clear existing store
  useScheduleStore.setState({
    courses: [],
    tasks: [],
    timeBlocks: [],
    events: [],
    preferences: useScheduleStore.getState().preferences,
    settings: useScheduleStore.getState().settings,
  });

  const { addCourse, addTask, addEvent } = useScheduleStore.getState();
  const anchor = new Date();

  fixture.courses.forEach((course, idx) => {
    // Add course
    addCourse({
      id: course.id,
      name: course.name,
      code: course.code,
      color: course.color,
      canvasId: course.id,
      schedule: (course.schedule || []).map(slot => {
        const jsDay = ((slot.dayOfWeek + 1) % 7); // fixture uses 0=Mon; JS getDay uses 0=Sun
        return {
          dayOfWeek: jsDay,
          startTime: slot.startTime, // "HH:mm"
          endTime: slot.endTime,     // "HH:mm"
          type: slot.type || 'lecture',
          location: slot.location || '',
        };
      }),
      pages: course.pages,
      additionalContext: course.additionalContext,
    } as any);

    // Exams as events
    (course.exams || []).forEach(exam => {
      addEvent({
        id: `${course.id}-${exam.title}`,
        title: exam.title,
        startTime: toDate(exam.startTime),
        endTime: toDate(exam.endTime),
        type: 'exam',
        courseId: course.id,
        location: course.schedule?.[0]?.location || '',
      } as any);
    });

    // Assignments as tasks
    (course.assignments || []).forEach((assignment, aIdx) => {
      addTask({
        id: `${course.id}-assign-${aIdx}`,
        title: assignment.title,
        courseId: course.id,
        courseName: course.name,
        type: assignment.type,
        dueDate: toDate(assignment.dueDate),
        bufferDays: assignment.bufferDays ?? 0,
        estimatedHours: 2,
        priority: 'high',
        status: 'pending',
        description: '',
        isHardDeadline: true,
      } as any);
    });
  });
};

/**
 * Simulate a Canvas import pipeline using raw Canvas-like data.
 * Converts meeting events into schedules (dayOfWeek, HH:mm) to let the store
 * generate recurring lectures, and maps exams/assignments with proper types.
 */
const normalizeCalendarEventRecord = (evt: any) => {
  if (!evt) return null;
  return {
    ...evt,
    type:
      evt?.event_type ||
      ((evt?.title || '').toLowerCase().includes('exam') ? 'exam' : 'meeting'),
  };
};

export const loadRawCanvasFixture = (fixture: RawCanvasFixture = rawCanvasFixture) => {
  // Clear
  useScheduleStore.setState({
    courses: [],
    tasks: [],
    timeBlocks: [],
    events: [],
    preferences: useScheduleStore.getState().preferences,
    settings: useScheduleStore.getState().settings,
  });

  const { addCourse, addTask, addEvent } = useScheduleStore.getState();

  fixture.courses.forEach((course) => {
    const normalized = normalizeCanvasCourse({ id: course.id, name: course.name, course_code: course.course_code });

    // Build schedule from meeting-like events
    const meetingEvents = (course.calendar_events || [])
      .map(normalizeCalendarEventRecord)
      .filter((evt): evt is any => !!evt && (evt.event_type || evt.type || '').toLowerCase() === 'meeting');
    const schedule = meetingEvents.map(evt => {
      const start = parseISO(evt.start_at);
      const end = parseISO(evt.end_at);
      const toHHMM = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const dayOfWeek = start.getDay(); // JS: 0=Sun
      return {
        dayOfWeek,
        startTime: toHHMM(start),
        endTime: toHHMM(end),
        type: 'lecture',
        location: evt.location_name || '',
      };
    });

    const additionalContext = [
      course.syllabus,
      ...(course.announcements || []).map(a => `${a.title}: ${a.body}`),
      ...(course.pages || []).map(p => `${p.title}: ${p.body}`)
    ].filter(Boolean).join('\n\n');

    addCourse({
      id: String(course.id),
      name: normalized.cleanName,
      code: normalized.cleanCode,
      color: undefined,
      canvasId: String(course.id),
      schedule,
      pages: course.pages?.map(p => ({ title: p.title, snippet: p.body })),
      additionalContext,
    } as any);

    // Exams as events
    (course.calendar_events || [])
      .map(normalizeCalendarEventRecord)
      .filter((evt): evt is any => !!evt && (evt.event_type || evt.type || '').toLowerCase() === 'exam')
      .forEach(exam => {
        const normalizedTitle = exam.title.replace(/^[A-Z]{3,}\d+\s*/i, '').trim() || exam.title;
        addEvent({
          id: `${course.id}-${exam.title}`,
          title: normalizedTitle,
          startTime: parseISO(exam.start_at),
          endTime: parseISO(exam.end_at),
          type: exam.type || 'exam',
          courseId: String(course.id),
          location: exam.location_name || '',
        } as any);
      });

    // Assignments as tasks
    (course.assignments || []).forEach((assignment, aIdx) => {
      const normalizedType = determineAssignmentType(assignment);
      addTask({
        id: `${course.id}-assign-${aIdx}`,
        title: assignment.name,
        courseId: String(course.id),
        courseName: normalized.cleanName,
        type: normalizedType,
        dueDate: parseISO(assignment.due_at),
        bufferDays: normalizedType === 'exam' ? 7 : 3,
        estimatedHours: 2,
        priority: normalizedType === 'exam' ? 'high' : 'medium',
        status: 'pending',
        description: '',
        isHardDeadline: true,
      } as any);
    });
  });
};

/**
 * Deterministic 2026 semester fixture (single, clean dataset):
 * - Term: Jan 1 2026 – Mar 27 2026
 * - 4 courses, each with ≥20 assignments across subcategories, plus lectures and exams.
 * - Includes welcome/announcement context.
 */
export const loadDeterministicFixture = () => {
  const startTerm = new Date('2026-01-01T00:00:00Z');
  const endTerm = new Date('2026-03-27T23:59:59Z');

  // Clear store but keep preferences/settings
  const existingPrefs = useScheduleStore.getState().preferences;
  const existingSettings = useScheduleStore.getState().settings;
  useScheduleStore.setState({
    courses: [],
    tasks: [],
    timeBlocks: [],
    events: [],
    preferences: {
      ...existingPrefs,
      weekdayStartTime: '08:00',
      weekdayEndTime: '22:00',
      weekendStartTime: '08:00',
      weekendEndTime: '22:00',
      weekdayStudyHours: 8,
      weekendStudyHours: 8,
      studyDays: { mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: true },
      allowWeekends: true,
      preferredTimes: ['morning', 'afternoon', 'evening'],
      sessionDurationMinutes: 60,
      breakInterval: 3,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
    },
    settings: existingSettings,
    schedulerConfig: {
      dailyStudyHours: { min: 4, max: 12, preferred: 8 },
      breakDuration: { short: 5, long: 15 },
      sessionDuration: { min: 40, max: 90, preferred: 60 },
    },
  });

  const { addCourse, addEvent, addTask } = useScheduleStore.getState();

  type CourseDef = {
    id: string;
    name: string;
    code: string;
    color: string;
    schedule: { dayOfWeek: number; startTime: string; endTime: string; type?: string; location?: string }[];
    exams: { title: string; start: string; end: string }[];
    assignments: { title: string; due: string; type: string; bufferDays?: number }[];
    welcome: string;
    announcements: string[];
  };

  const courses: CourseDef[] = [
    {
      id: 'AH2',
      name: 'Adult Health II',
      code: 'NURS320',
      color: '#2563eb',
      schedule: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '11:30', type: 'lecture', location: 'Sim Lab A' }, // Mon
        { dayOfWeek: 3, startTime: '10:00', endTime: '11:30', type: 'lecture', location: 'Sim Lab A' }, // Wed
      ],
      exams: [
        { title: 'Midterm Exam', start: '2026-02-10T14:00:00-05:00', end: '2026-02-10T15:30:00-05:00' },
        { title: 'Final Exam', start: '2026-03-20T13:00:00-04:00', end: '2026-03-20T15:00:00-04:00' },
      ],
      assignments: [],
      welcome: 'Welcome to Adult Health II. This term we focus on complex med-surg care. Expect simulations and clinical prep weekly.',
      announcements: ['Clinical rotations finalize in week 2. Bring stethoscope and IV kit to all labs.'],
    },
    {
      id: 'BIO2',
      name: 'Human Biology II',
      code: 'BIO201',
      color: '#a855f7',
      schedule: [
        { dayOfWeek: 2, startTime: '09:30', endTime: '11:00', type: 'lecture', location: 'Room 210' }, // Tue
        { dayOfWeek: 4, startTime: '09:30', endTime: '11:00', type: 'lecture', location: 'Room 210' }, // Thu
      ],
      exams: [
        { title: 'Metabolism Exam', start: '2026-02-17T10:00:00-05:00', end: '2026-02-17T11:30:00-05:00' },
        { title: 'Comprehensive Final', start: '2026-03-25T10:00:00-04:00', end: '2026-03-25T12:00:00-04:00' },
      ],
      assignments: [],
      welcome: 'Welcome to Human Biology II. We dive into endocrine, metabolism, and systems integration.',
      announcements: ['Lab practicals start week 3. Safety gear required.'],
    },
    {
      id: 'PHARM',
      name: 'Pharmacology Concepts',
      code: 'NURS350',
      color: '#f59e0b',
      schedule: [
        { dayOfWeek: 1, startTime: '14:00', endTime: '15:30', type: 'lecture', location: 'Auditorium A' }, // Mon
        { dayOfWeek: 3, startTime: '14:00', endTime: '15:30', type: 'lecture', location: 'Auditorium A' }, // Wed
      ],
      exams: [
        { title: 'Pharm Midterm', start: '2026-02-12T15:00:00-05:00', end: '2026-02-12T16:30:00-05:00' },
        { title: 'Pharm Final', start: '2026-03-24T15:00:00-04:00', end: '2026-03-24T17:00:00-04:00' },
      ],
      assignments: [],
      welcome: 'Welcome to Pharmacology Concepts. Emphasis on safe med admin and mechanism of action.',
      announcements: ['Drug cards due weekly; check rubric in LMS.'],
    },
    {
      id: 'PEDS',
      name: 'Pediatric Nursing',
      code: 'NURS330',
      color: '#0ea5e9',
      schedule: [
        { dayOfWeek: 2, startTime: '13:00', endTime: '14:30', type: 'lecture', location: 'Peds Lab' }, // Tue
        { dayOfWeek: 4, startTime: '13:00', endTime: '14:30', type: 'lecture', location: 'Peds Lab' }, // Thu
      ],
      exams: [
        { title: 'Peds Growth & Dev Exam', start: '2026-02-18T13:30:00-05:00', end: '2026-02-18T15:00:00-05:00' },
        { title: 'Peds Final', start: '2026-03-26T13:30:00-04:00', end: '2026-03-26T15:30:00-04:00' },
      ],
      assignments: [],
      welcome: 'Welcome to Pediatric Nursing. We will cover growth/development and acute pediatrics.',
      announcements: ['Clinical site onboarding due by week 2.'],
    },
  ];

  // Helper to distribute due dates across term
  const spreadDueDates = (count: number, start: Date, end: Date) => {
    const dates: string[] = [];
    const span = end.getTime() - start.getTime();
    for (let i = 0; i < count; i++) {
      const offset = Math.round((span / (count + 1)) * (i + 1));
      const d = new Date(start.getTime() + offset);
      d.setHours(17, 0, 0, 0);
      dates.push(d.toISOString());
    }
    return dates;
  };

  const subcategories = ['READ', 'WATCH', 'PREP', 'REVIEW', 'WORK', 'LAB'];

  courses.forEach((course) => {
    // generate assignments
    const dueDates = spreadDueDates(22, startTerm, endTerm);
    course.assignments = dueDates.map((iso, idx) => {
      const sub = subcategories[idx % subcategories.length];
      const titlePrefix = {
        READ: 'Chapter Reading',
        WATCH: 'Video Review',
        PREP: 'Prep Task',
        REVIEW: 'Study Guide',
        WORK: 'Case Study',
        LAB: 'Lab/Clinical Prep',
      }[sub] || 'Task';
      return {
        title: `${titlePrefix} ${idx + 1}`,
        due: iso,
        type: sub.toLowerCase(),
        bufferDays: 2,
      };
    });

    // add course
    addCourse({
      id: course.id,
      name: course.name,
      code: course.code,
      color: course.color,
      canvasId: course.id,
      startDate: startTerm,
      endDate: endTerm,
      schedule: course.schedule,
      pages: [{ title: 'Welcome', body: course.welcome }],
      additionalContext: `${course.welcome}\n\nAnnouncements:\n- ${course.announcements.join('\n- ')}`,
    } as any);

    // add exams
    course.exams.forEach((exam) => {
      addEvent({
        id: `${course.id}-${exam.title}-${uuidv4()}`,
        title: exam.title,
        startTime: parseISO(exam.start),
        endTime: parseISO(exam.end),
        type: 'exam',
        courseId: course.id,
        location: course.schedule?.[0]?.location || '',
        source: 'fixture',
      } as any);
    });

    // add assignments as tasks
    course.assignments.forEach((assignment, idx) => {
      addTask({
        id: `${course.id}-assign-${idx}`,
        title: assignment.title,
        courseId: course.id,
        courseName: course.name,
        type: assignment.type,
        dueDate: parseISO(assignment.due),
        bufferDays: assignment.bufferDays ?? 2,
        estimatedHours: 2,
        priority: 'high',
        status: 'pending',
        description: assignment.title,
        isHardDeadline: true,
        source: 'fixture',
      } as any);
    });
  });

  return { coursesLoaded: courses.length, tasksLoaded: useScheduleStore.getState().tasks.length };
};

const assertLectures = (fixture: FixtureData): Assertion[] => {
  const { events } = useScheduleStore.getState();
  const problems: Assertion[] = [];

  fixture.courses.forEach(course => {
    const lectures = events.filter(e => {
      const t = (e.type || '').toLowerCase();
      return e.courseId === course.id && (t.includes('lecture') || t.includes('class'));
    });
    const expected = course.schedule?.length || 0;
    if (lectures.length < expected) {
      problems.push({ ok: false, message: `${course.id}: expected ${expected} lecture events, found ${lectures.length}` });
    }
  });
  return problems.length ? problems : [{ ok: true, message: 'Lectures match expected counts' }];
};

const assertExams = (fixture: FixtureData): Assertion[] => {
  const { events } = useScheduleStore.getState();
  const problems: Assertion[] = [];

  fixture.courses.forEach(course => {
    (course.exams || []).forEach(exam => {
      const candidates = events.filter(e => {
        const type = (e.type || '').toLowerCase();
        const title = (e.title || '').toLowerCase();
        return (
          String(e.courseId) === String(course.id) &&
          (type === 'exam' || title.includes('exam'))
        );
      });
      if (!candidates.length) {
        console.debug('[fixture] exam missing; candidates for course', course.id, events.filter(e => String(e.courseId) === String(course.id)));
        problems.push({ ok: false, message: `${course.id}: missing exam "${exam.title}"` });
        return;
      }

      const normalizedTitle = exam.title.trim().toLowerCase();
      const match = candidates.find(e => (e.title || '').trim().toLowerCase() === normalizedTitle) || candidates[0];
      if (!match) {
        problems.push({ ok: false, message: `${course.id}: missing exam "${exam.title}"` });
        return;
      }
      const start = toDate(exam.startTime).getTime();
      const end = toDate(exam.endTime).getTime();
      const actualStart = match.startTime instanceof Date ? match.startTime.getTime() : new Date(match.startTime).getTime();
      const actualEnd = match.endTime instanceof Date ? match.endTime.getTime() : new Date(match.endTime).getTime();
      if (!Number.isNaN(actualStart) && actualStart !== start) {
        problems.push({ ok: false, message: `${course.id}: exam "${exam.title}" start mismatch` });
      }
      if (!Number.isNaN(actualEnd) && actualEnd !== end) {
        problems.push({ ok: false, message: `${course.id}: exam "${exam.title}" end mismatch` });
      }
    });
  });
  return problems.length ? problems : [{ ok: true, message: 'Exams match expected times' }];
};

const assertDueDates = (fixture: FixtureData): Assertion[] => {
  const { tasks } = useScheduleStore.getState();
  const problems: Assertion[] = [];

  fixture.courses.forEach(course => {
    (course.assignments || []).forEach(assign => {
      const candidates = tasks.filter(t => t.courseId === course.id && t.title === assign.title);
      if (!candidates.length) {
        problems.push({ ok: false, message: `${course.id}: missing assignment "${assign.title}"` });
        return;
      }
      const expected = toDate(assign.dueDate).getTime();
      const match = candidates.find(t => {
        const actual = t.dueDate instanceof Date ? t.dueDate.getTime() : new Date(t.dueDate).getTime();
        return actual === expected;
      });
      if (!match) {
        const actuals = candidates.map(t => (t.dueDate instanceof Date ? t.dueDate.toISOString() : String(t.dueDate))).join(', ');
        problems.push({ ok: false, message: `${course.id}: due date mismatch for "${assign.title}" (got: ${actuals})` });
      }
    });
  });

  return problems.length ? problems : [{ ok: true, message: 'Due dates match expected times' }];
};

const assertContext = (fixture: FixtureData): Assertion[] => {
  const { courses } = useScheduleStore.getState();
  const problems: Assertion[] = [];

  fixture.courses.forEach(course => {
    const match = courses.find(c => c.id === course.id);
    if (!match) {
      problems.push({ ok: false, message: `${course.id}: course missing` });
      return;
    }
    if (course.additionalContext && !match.additionalContext) {
      problems.push({ ok: false, message: `${course.id}: additional context missing` });
    }
    if ((course.pages?.length || 0) > 0 && !(match.pages?.length || 0)) {
      problems.push({ ok: false, message: `${course.id}: pages not present` });
    }
  });

  return problems.length ? problems : [{ ok: true, message: 'Context (pages/additionalContext) present' }];
};

export const runFixtureAssertions = (fixture: FixtureData = canvasFixture) => {
  const results = [
    ...assertLectures(fixture),
    ...assertExams(fixture),
    ...assertDueDates(fixture),
    ...assertContext(fixture),
  ];
  const ok = results.every(r => r.ok);
  return { ok, results };
};
// Build payload for context extraction API using raw Canvas fixture data
export const buildContextPayloadFromRaw = (course: any, additionalContextMap: Record<string, string> = {}) => {
  return {
    courseName: course.name,
    syllabus: course.syllabus,
    announcements: course.announcements || [],
    discussions: course.discussions || [],
    moduleDescriptions: (course.modules || []).map((m: any) => ({ name: m.name, description: m.description || '' })),
    assignmentDescriptions: (course.assignments || []).map((a: any) => ({
      name: a.name,
      description: a.description || a.page_html || ''
    })),
    pages: (course.pages || []).map((p: any) => ({ title: p.title, body: p.body || '' })),
    additionalContext: additionalContextMap[course.id] || '',
  };
};

// Apply context extraction results to the schedule store (tasks/exams)
export const applyContextExtractionResults = (courseId: string, courseName: string, result: any) => {
  const { addTask, updateTask, events, tasks, updateEvent } = useScheduleStore.getState();
  const extractedTasks = Array.isArray(result?.tasks) ? result.tasks : [];
  const examUpdates = Array.isArray(result?.examUpdates) ? result.examUpdates : [];

  extractedTasks.forEach((task: any, index: number) => {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const title = task.title || `Context Task ${index + 1}`;
    const normalizedType = determineAssignmentType(task.type || title);
    const action = task.action === 'update' ? 'update' : 'add';
    const matching = tasks.filter(t => t.courseId === courseId && t.title === title);

    if (action === 'update' && matching.length > 0) {
      matching.forEach(m => {
        updateTask(m.id, {
          dueDate: dueDate || m.dueDate,
          description: task.description || m.description,
        });
      });
      return;
    }

    if (dueDate && matching.find(m => new Date(m.dueDate).getTime() === dueDate.getTime())) return;

    addTask({
      title,
      courseId,
      courseName,
      type: normalizedType,
      dueDate: dueDate || new Date(),
      estimatedHours: task.estimatedHours || 2,
      priority: 'medium',
      status: 'pending',
      description: task.description || '',
      isHardDeadline: true,
    } as any);
  });

  examUpdates.forEach((examUpdate: any) => {
    const targetTitle = (examUpdate.title || '').trim().toLowerCase();
    const examEvents = events.filter(e =>
      e.courseId === courseId && (e.type === 'exam' || (e.title || '').toLowerCase().includes('exam'))
    );
    const match = examEvents.find(e => (e.title || '').toLowerCase().includes(targetTitle));
    if (match) {
      updateEvent(match.id as string, {
        startTime: examUpdate.startTime ? new Date(examUpdate.startTime) : match.startTime,
        endTime: examUpdate.endTime ? new Date(examUpdate.endTime) : match.endTime,
        location: examUpdate.location || (match as any).location
      } as any);
    }
  });
};
