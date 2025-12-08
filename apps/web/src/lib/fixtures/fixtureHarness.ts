import { formatISO, parseISO, set } from 'date-fns';
import { canvasFixture, FixtureData } from './canvasFixture';
import { rawCanvasFixture, RawCanvasFixture } from './rawCanvasFixture';
import { useScheduleStore } from '../../stores/useScheduleStore';
import { normalizeCanvasCourse } from '../canvas/normalizeCourse';
import { determineAssignmentType } from '../taskHours';

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
        const match = candidates.find(e => (e.title || '').toLowerCase().includes(normalizedTitle.toLowerCase())) || candidates[0];
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
    const meetingEvents = (course.calendar_events || []).filter(e => (e.event_type || '').toLowerCase() === 'meeting');
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
      .filter(e => (e.event_type || '').toLowerCase() === 'exam')
      .forEach(exam => {
        const normalizedTitle = exam.title.replace(/^[A-Z]{3,}\d+\s*/i, '').trim() || exam.title;
        addEvent({
          id: `${course.id}-${exam.title}`,
          title: normalizedTitle,
          startTime: parseISO(exam.start_at),
          endTime: parseISO(exam.end_at),
          type: 'exam',
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
      const match = events.find(e => e.courseId === course.id && e.title === exam.title);
      if (!match) {
        problems.push({ ok: false, message: `${course.id}: missing exam "${exam.title}"` });
        return;
      }
      const start = toDate(exam.startTime).getTime();
      const end = toDate(exam.endTime).getTime();
      if (match.startTime instanceof Date && match.startTime.getTime() !== start) {
        problems.push({ ok: false, message: `${course.id}: exam "${exam.title}" start mismatch` });
      }
      if (match.endTime instanceof Date && match.endTime.getTime() !== end) {
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
