import { formatISO, parseISO, set } from 'date-fns';
import { canvasFixture, FixtureData, FixtureCourse } from './canvasFixture';
import { useScheduleStore } from '../../stores/useScheduleStore';

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
        const baseDate = dayOffsetToDate(slot.dayOfWeek, anchor);
        const [sh, sm] = slot.startTime.split(':').map(Number);
        const [eh, em] = slot.endTime.split(':').map(Number);
        return {
          dayOfWeek: slot.dayOfWeek,
          startTime: formatISO(set(baseDate, { hours: sh, minutes: sm, seconds: 0, milliseconds: 0 })),
          endTime: formatISO(set(baseDate, { hours: eh, minutes: em, seconds: 0, milliseconds: 0 })),
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

const assertLectures = (fixture: FixtureData): Assertion[] => {
  const { events } = useScheduleStore.getState();
  const problems: Assertion[] = [];

  fixture.courses.forEach(course => {
    const lectures = events.filter(e => e.courseId === course.id && (e.type || '').toLowerCase().includes('lecture'));
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
      const match = tasks.find(t => t.courseId === course.id && t.title === assign.title);
      if (!match) {
        problems.push({ ok: false, message: `${course.id}: missing assignment "${assign.title}"` });
        return;
      }
      const expected = toDate(assign.dueDate).getTime();
      const actual = match.dueDate instanceof Date ? match.dueDate.getTime() : new Date(match.dueDate).getTime();
      if (expected !== actual) {
        problems.push({ ok: false, message: `${course.id}: due date mismatch for "${assign.title}"` });
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
