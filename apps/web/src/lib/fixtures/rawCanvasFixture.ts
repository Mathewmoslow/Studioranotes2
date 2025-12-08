// Raw Canvas-like fixture (Eastern Time) to drive the import/pipeline harness
// Times are in America/New_York (UTC-5/UTC-4 depending on DST). The ISO strings below
// are written with explicit offsets to remove ambiguity.

export type RawCanvasCourse = {
  id: number | string;
  name: string;
  course_code?: string;
  timeZone?: string;
  syllabus?: string;
  announcements?: { title: string; body: string }[];
  pages?: { title: string; body: string }[];
  calendar_events?: {
    title: string;
    start_at: string; // ISO with offset
    end_at: string;   // ISO with offset
    location_name?: string;
    description?: string;
    // hint for meetings vs others
    event_type?: 'meeting' | 'exam' | 'other';
  }[];
  assignments?: {
    name: string;
    due_at: string;
    points_possible?: number;
    submission_types?: string[];
    page_html?: string;
  }[];
};

export type RawCanvasFixture = {
  courses: RawCanvasCourse[];
};

export const rawCanvasFixture: RawCanvasFixture = {
  courses: [
    {
      id: 'BIO201',
      name: 'BIO201 Human Biology II 2025 Fall A',
      course_code: 'BIO201',
      timeZone: 'America/New_York',
      syllabus: 'Focus on endocrine and metabolism. Labs start week 3.',
      announcements: [
        { title: 'Lab Prep', body: 'Bring gloves and goggles starting week 3.' },
      ],
      pages: [
        {
          title: 'Course Outline',
          body: 'Overview of units, grading, and weekly cadence.',
        },
      ],
      calendar_events: [
        // Lectures: Mon/Wed 10:00–11:15 ET
        {
          title: 'BIO201 Lecture',
          start_at: '2025-12-08T10:00:00-05:00',
          end_at: '2025-12-08T11:15:00-05:00',
          location_name: 'Room 210',
          event_type: 'meeting',
        },
        {
          title: 'BIO201 Lecture',
          start_at: '2025-12-10T10:00:00-05:00',
          end_at: '2025-12-10T11:15:00-05:00',
          location_name: 'Room 210',
          event_type: 'meeting',
        },
        // Exam
        {
          title: 'Midterm Exam',
          start_at: '2025-12-10T15:00:00-05:00',
          end_at: '2025-12-10T16:30:00-05:00',
          location_name: 'Auditorium A',
          event_type: 'exam',
        },
      ],
      assignments: [
        {
          name: 'Metabolism Pathways Worksheet',
          due_at: '2025-12-15T17:00:00-05:00',
          submission_types: ['online_upload'],
          page_html: 'Metabolism Pathways Worksheet Part 1 due Dec 15 5pm ET. Part 2 due Dec 18 5pm ET. Submit both parts.'
        },
      ],
    },
    {
      id: 'NURS320',
      name: 'NURS320 Adult Health II 2025 Fall A',
      course_code: 'NURS320',
      timeZone: 'America/New_York',
      syllabus: 'Bring stethoscope to every session; clinical rotation assignments finalize on week 2.',
      pages: [
        {
          title: 'Clinical Checklist',
          body: 'Vital signs competency, IV starts, and med admin schedule.',
        },
      ],
      announcements: [
        { title: 'Clinical Rotation', body: 'Rotation assignments finalize in week 2.' },
      ],
      calendar_events: [
        // Lectures: Tue/Thu 14:00–16:00 ET
        {
          title: 'NURS320 Lecture',
          start_at: '2025-12-09T14:00:00-05:00',
          end_at: '2025-12-09T16:00:00-05:00',
          location_name: 'Sim Lab A',
          event_type: 'meeting',
        },
        {
          title: 'NURS320 Lecture',
          start_at: '2025-12-11T14:00:00-05:00',
          end_at: '2025-12-11T16:00:00-05:00',
          location_name: 'Sim Lab A',
          event_type: 'meeting',
        },
        // Exam
        {
          title: 'Final Exam',
          start_at: '2025-12-20T13:00:00-05:00',
          end_at: '2025-12-20T15:00:00-05:00',
          location_name: 'Main Hall',
          event_type: 'exam',
        },
      ],
      assignments: [
        {
          name: 'Cardiac Care Plan',
          due_at: '2025-12-18T20:00:00-05:00',
          submission_types: ['online_upload'],
          page_html: 'Cardiac Care Plan final submission due Dec 18 8pm ET. Peer review due Dec 20 5pm ET. Location update: submit via Portal Room 101.'
        },
      ],
    },
  ],
};
