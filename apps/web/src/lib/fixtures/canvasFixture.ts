export type FixtureCourse = {
  id: string;
  name: string;
  code: string;
  color?: string;
  schedule?: {
    dayOfWeek: number; // 0 = Monday per onboarding UI indexing
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    type?: string;
    location?: string;
  }[];
  pages?: { title: string; snippet: string }[];
  additionalContext?: string;
  assignments?: {
    title: string;
    type: string;
    dueDate: string; // ISO
    bufferDays?: number;
  }[];
  exams?: {
    title: string;
    type: string;
    startTime: string; // ISO
    endTime: string;   // ISO
  }[];
};

export type FixtureData = {
  courses: FixtureCourse[];
};

// Canvas-like deterministic fixture for testing schedule accuracy
export const canvasFixture: FixtureData = {
  courses: [
    {
      id: 'BIO201',
      name: 'Human Biology II',
      code: 'BIO201',
      color: '#0ea5e9',
      schedule: [
        { dayOfWeek: 0, startTime: '10:00', endTime: '11:15', type: 'lecture', location: 'Room 210' }, // Mon
        { dayOfWeek: 2, startTime: '10:00', endTime: '11:15', type: 'lecture', location: 'Room 210' }, // Wed
      ],
      assignments: [
        {
          title: 'Metabolism Pathways Worksheet',
          type: 'assignment',
          dueDate: '2025-12-15T17:00:00.000Z',
          bufferDays: 2,
        },
      ],
      exams: [
        {
          title: 'Midterm Exam',
          type: 'exam',
          startTime: '2025-12-10T15:00:00.000Z',
          endTime: '2025-12-10T16:30:00.000Z',
        },
      ],
      pages: [
        {
          title: 'Course Outline',
          snippet: 'Overview of units, grading, and weekly cadence.',
        },
      ],
      additionalContext: 'Uses McGraw-Hill text; labs start week 3. Focus on endocrine and metabolism.',
    },
    {
      id: 'NURS320',
      name: 'Adult Health II',
      code: 'NURS320',
      color: '#22c55e',
      schedule: [
        { dayOfWeek: 1, startTime: '14:00', endTime: '16:00', type: 'lecture', location: 'Sim Lab A' }, // Tue
        { dayOfWeek: 3, startTime: '14:00', endTime: '16:00', type: 'lecture', location: 'Sim Lab A' }, // Thu
      ],
      assignments: [
        {
          title: 'Cardiac Care Plan',
          type: 'project',
          dueDate: '2025-12-18T20:00:00.000Z',
          bufferDays: 3,
        },
      ],
      exams: [
        {
          title: 'Final Exam',
          type: 'exam',
          startTime: '2025-12-20T13:00:00.000Z',
          endTime: '2025-12-20T15:00:00.000Z',
        },
      ],
      pages: [
        {
          title: 'Clinical Checklist',
          snippet: 'Vital signs competency, IV starts, and med admin schedule.',
        },
      ],
      additionalContext: 'Bring stethoscope to every session; clinical rotation assignments finalize on week 2.',
    },
  ],
};
