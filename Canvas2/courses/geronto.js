// ========== GERONTOLOGICAL NURSING COURSE DATA ==========
import { commonEventColors } from '../config.js';

// Gerontological Nursing Module to Week Mapping
const gerontoModuleMap = {
  1: ['module-geronto-content-1'],
  2: ['module-geronto-content-2'],
  3: ['module-geronto-exam-3'],                            // Exam 1 (covers modules 1-2)
  4: ['module-geronto-content-4'],
  5: ['module-geronto-content-5'],
  6: ['module-geronto-content-6'],
  7: ['module-geronto-exam-7'],                            // Exam 2 (covers modules 3-4)
  8: ['module-geronto-content-8'],
  9: ['module-geronto-content-9'],
  10: ['module-geronto-content-10'],
  11: ['module-geronto-project-11'],                       // Project presentations
  12: ['module-geronto-exam-12'],                          // Exam 3 (covers modules 5-8)
  13: ['module-geronto-exam-13'],                          // HESI specialty exam
  14: []                                                   // No session this week
};

// Gerontological-specific color overrides
const gerontoEventColors = {
  ...commonEventColors,
  geronto: '#17a2b8'     // Gerontological specific events
};

// Gerontological Nursing Events
const gerontoEvents = [
  // === GERONTOLOGICAL NURSING EVENTS ===
  // Lectures (Wednesdays 1-4pm)
  { title: 'Geronto: Week 1 Class', start: '2025-05-07T13:00', end: '2025-05-07T16:00', group: 'geronto', course: 'geronto', week: 1,
    details: 'Module 1: Welcome & Intro to Gerontological Nursing. Attendance quiz within first 10 minutes.' },
  { title: 'Geronto: Week 2 Class', start: '2025-05-14T13:00', end: '2025-05-14T16:00', group: 'geronto', course: 'geronto', week: 2,
    details: 'Module 2: Legal and Ethical Aspects. Quiz 1 at 2pm (LockDown Browser required).' },
  { title: 'Geronto: Exam 1', start: '2025-05-21T13:00', end: '2025-05-21T15:00', group: 'exam', course: 'geronto', week: 3,
    details: 'Module 1 Exam covering Modules 1 & 2 via ExamSoft.' },
  { title: 'Geronto: Week 4 Class', start: '2025-05-28T13:00', end: '2025-05-28T16:00', group: 'geronto', course: 'geronto', week: 4,
    details: 'Module 3: Falls Prevention & Rest, Sleep, Comfort, and Pain Management.' },
  { title: 'Geronto: Week 5 Class', start: '2025-06-04T13:00', end: '2025-06-04T16:00', group: 'geronto', course: 'geronto', week: 5,
    details: 'Module 4: Continued discussions. Quiz 2 at 2pm (LockDown Browser required).' },
  { title: 'Geronto: Week 6 Class', start: '2025-06-11T13:00', end: '2025-06-11T16:00', group: 'geronto', course: 'geronto', week: 6,
    details: 'Module 5: Group project work session.' },
  { title: 'Geronto: Exam 2', start: '2025-06-18T13:00', end: '2025-06-18T15:00', group: 'exam', course: 'geronto', week: 7,
    details: 'Exam 2 covering Modules 3 & 4.' },
  { title: 'Geronto: Week 8 Class', start: '2025-06-25T13:00', end: '2025-06-25T16:00', group: 'geronto', course: 'geronto', week: 8,
    details: 'Module 6: Alzheimer Disease, Delirium vs. Dementia. Quiz 3 at 2pm (LockDown Browser required).' },
  { title: 'Geronto: Week 9 Class', start: '2025-07-02T13:00', end: '2025-07-02T16:00', group: 'geronto', course: 'geronto', week: 9,
    details: 'Module 7: Immunity, Infections, Chronic Conditions, and Cancer.' },
  { title: 'Geronto: Week 10 Class', start: '2025-07-09T13:00', end: '2025-07-09T16:00', group: 'geronto', course: 'geronto', week: 10,
    details: 'Module 8: Continuum of Care and Care Settings. Quiz 4 at 2pm (LockDown Browser required).' },
  { title: 'Geronto: Week 11 Class', start: '2025-07-16T13:00', end: '2025-07-16T16:00', group: 'geronto', course: 'geronto', week: 11,
    details: 'Group Project Presentations.' },
  { title: 'Geronto: Exam 3', start: '2025-07-23T13:00', end: '2025-07-23T15:00', group: 'exam', course: 'geronto', week: 12,
    details: 'Exam 3 (Final) covering Modules 5-8.' },
  { title: 'Geronto: HESI Exam', start: '2025-07-30T13:00', end: '2025-07-30T15:00', group: 'exam', course: 'geronto', week: 13,
    details: 'HESI Specialty Exam - Comprehensive Gerontological content.' },
  
  // Geronto CastleBranch Test Dates
  { title: 'CastleBranch Quiz Window Opens', start: '2025-05-07T06:00', end: '2025-05-07T07:00', group: 'prep', course: 'geronto', week: 1 },
  { title: 'CastleBranch Quiz Due', start: '2025-05-12T23:59', end: '2025-05-13T00:30', group: 'exam', course: 'geronto', week: 2 },
  
  // Geronto Assignments
  { title: 'Geronto: Assessment Assignment Due', start: '2025-06-02T23:59', end: '2025-06-03T00:30', group: 'prep', course: 'geronto', week: 5 },
  { title: 'Geronto: Team Project Submission 1', start: '2025-06-23T23:59', end: '2025-06-24T00:30', group: 'prep', course: 'geronto', week: 8 },
  { title: 'Geronto: Final Team Project Due', start: '2025-07-14T23:59', end: '2025-07-15T00:30', group: 'prep', course: 'geronto', week: 11 }
];

// Module descriptions and content
const gerontoModuleContent = {
  // Week 1 - Introduction to Gerontological Nursing
  "1": {
    title: "Introduction to Gerontological Nursing",
    week: 1,
    chapters: "Legal/ethical aspects, assessment fundamentals, elder care principles",
    keyTopics: [
      "Legal and ethical aspects of gerontological nursing",
      "Assessment of older adults",
      "Principles of elder care"
    ],
    assignments: [
      {
        id: "castlebranch-education-quiz",
        title: "CastleBranch Education Quiz",
        dueDate: "2025-05-12",
        platform: "canvas"
      },
      {
        id: "geronto-topic3",
        title: "Topic 3: Legal and Ethical Aspects",
        dueDate: "2025-05-14",
        platform: "coursepoint"
      },
      {
        id: "geronto-quiz1",
        title: "Quiz 1: Modules 1 & 2",
        dueDate: "2025-05-14",
        platform: "canvas"
      }
    ],
    classMeeting: "Wednesdays 1:00pm in NB 103. Attendance quiz within first 10 minutes."
  },
  
  // Week 2 - Legal and Ethical Aspects
  "2": {
    title: "Legal and Ethical Aspects",
    week: 2,
    chapters: "Elder law, ethics in elder care, end-of-life considerations",
    keyTopics: [
      "Ethical issues in geriatric care",
      "Legal protections for older adults",
      "End-of-life care planning",
      "Advance directives"
    ],
    classMeeting: "Wednesday 14 May 1:00-4:00pm in NB 103",
    assignments: [
      {
        id: "geronto-legal-ethical-worksheet",
        title: "Legal & Ethical Worksheet",
        dueDate: "2025-05-14",
        platform: "canvas"
      },
      {
        id: "geronto-advance-directives",
        title: "Advance Directives Assignment",
        dueDate: "2025-05-20",
        platform: "canvas"
      }
    ]
  },
  
  // Week 3 - Exam 1
  "3": {
    type: "exam",
    title: "Exam 1",
    week: 3,
    chapters: "Modules 1 & 2: Introduction to Gerontological Nursing, Legal and Ethical Aspects",
    keyTopics: [
      "Assessment of older adults",
      "Principles of elder care",
      "Ethical issues in geriatric care",
      "Legal protections",
      "End-of-life planning"
    ],
    classMeeting: "Wednesday 21 May 1:00-3:00pm in NB 103 – EXAM DAY",
    note: "Bring student ID and laptop with ExamSoft installed and registered",
    assignments: [
      {
        id: "geronto-exam1",
        title: "Exam 1: Modules 1-2",
        dueDate: "2025-05-21",
        platform: "examsoft"
      }
    ]
  },
  
  // Week 4 - Falls Prevention & Pain Management
  "4": {
    title: "Falls Prevention & Pain Management",
    week: 4,
    chapters: "Fall risk assessment, sleep disorders, pain assessment and management",
    keyTopics: [
      "Fall risk assessment tools",
      "Environmental safety measures",
      "Pain assessment in elderly patients",
      "Sleep disorders and interventions"
    ],
    classMeeting: "Wednesday 28 May 1:00-4:00pm in NB 103",
    assignments: [
      {
        id: "geronto-falls-case-study",
        title: "Falls Prevention Case Study",
        dueDate: "2025-06-02",
        platform: "canvas"
      },
      {
        id: "geronto-pain-assessment",
        title: "Pain Assessment Tool Analysis",
        dueDate: "2025-06-02",
        platform: "canvas"
      }
    ]
  },
  
  // Week 5 - Continued discussions
  "5": {
    title: "Care Management & Assessment",
    week: 5,
    chapters: "Comprehensive geriatric assessment, care coordination",
    keyTopics: [
      "Comprehensive geriatric assessment methods",
      "Care coordination models",
      "Quality of life measurements",
      "Functional assessment tools"
    ],
    classMeeting: "Wednesday 4 Jun 1:00-4:00pm in NB 103",
    assignments: [
      {
        id: "geronto-quiz2",
        title: "Quiz 2: Modules 3-4",
        dueDate: "2025-06-04",
        platform: "canvas"
      },
      {
        id: "geronto-assessment-assignment",
        title: "Geriatric Assessment Assignment",
        dueDate: "2025-06-02",
        platform: "canvas"
      }
    ]
  },
  
  // Week 6 - Group project work session
  "6": {
    title: "Group Project Work Session",
    week: 6,
    chapters: "Team collaboration, evidence-based practice",
    keyTopics: [
      "Evidence-based interventions",
      "Team collaboration",
      "Project planning",
      "Research methods"
    ],
    classMeeting: "Wednesday 11 Jun 1:00-4:00pm in NB 103",
    assignments: [
      {
        id: "geronto-project-outline",
        title: "Group Project Outline",
        dueDate: "2025-06-11",
        platform: "canvas"
      }
    ]
  },
  
  // Week 7 - Exam 2
  "7": {
    type: "exam",
    title: "Exam 2",
    week: 7,
    chapters: "Modules 3-4: Falls Prevention, Pain Management, Care Management",
    keyTopics: [
      "Falls prevention",
      "Pain assessment and management",
      "Sleep disorders",
      "Comprehensive geriatric assessment",
      "Care coordination"
    ],
    classMeeting: "Wednesday 18 Jun 1:00-3:00pm in NB 103 – EXAM DAY",
    note: "Bring student ID and laptop with ExamSoft installed and registered",
    assignments: [
      {
        id: "geronto-exam2",
        title: "Exam 2: Modules 3-4",
        dueDate: "2025-06-18",
        platform: "examsoft"
      }
    ]
  },
  
  // Week 8 - Alzheimer Disease, Delirium vs. Dementia
  "8": {
    title: "Alzheimer's Disease & Cognitive Disorders",
    week: 8,
    chapters: "Dementia types, delirium, cognitive assessment",
    keyTopics: [
      "Alzheimer's disease pathophysiology",
      "Differentiating delirium and dementia",
      "Cognitive assessment tools",
      "Behavioral management strategies"
    ],
    classMeeting: "Wednesday 25 Jun 1:00-4:00pm in NB 103",
    assignments: [
      {
        id: "geronto-quiz3",
        title: "Quiz 3: Cognitive Disorders",
        dueDate: "2025-06-25",
        platform: "canvas"
      },
      {
        id: "geronto-team-project-draft",
        title: "Team Project Submission 1",
        dueDate: "2025-06-23",
        platform: "canvas"
      }
    ]
  },
  
  // Week 9 - Immunity, Infections, Chronic Conditions, and Cancer
  "9": {
    title: "Chronic Conditions & Cancer in Elderly",
    week: 9,
    chapters: "Immunity changes, infection control, chronic disease management",
    keyTopics: [
      "Age-related immune changes",
      "Infection prevention in elderly care settings",
      "Common chronic conditions in older adults",
      "Geriatric oncology considerations"
    ],
    classMeeting: "Wednesday 2 Jul 1:00-4:00pm in NB 103",
    assignments: [
      {
        id: "geronto-chronic-disease-case",
        title: "Chronic Disease Management Case Study",
        dueDate: "2025-07-07",
        platform: "canvas"
      }
    ]
  },
  
  // Week 10 - Continuum of Care and Care Settings
  "10": {
    title: "Continuum of Care & Care Settings",
    week: 10,
    chapters: "Elder care options, transitions of care",
    keyTopics: [
      "Care setting options for older adults",
      "Transitions of care",
      "Home care vs. institutional care",
      "Long-term care facility regulations"
    ],
    classMeeting: "Wednesday 9 Jul 1:00-4:00pm in NB 103",
    assignments: [
      {
        id: "geronto-quiz4",
        title: "Quiz 4: Care Settings",
        dueDate: "2025-07-09",
        platform: "canvas"
      },
      {
        id: "geronto-transition-of-care",
        title: "Transition of Care Planning Assignment",
        dueDate: "2025-07-12",
        platform: "canvas"
      }
    ]
  },
  
  // Week 11 - Project Presentations
  "11": {
    type: "project",
    title: "Group Project Presentations",
    week: 11,
    chapters: "Evidence-based gerontological nursing practice",
    keyTopics: [
      "Presentation skills",
      "Evidence-based practice in gerontological nursing",
      "Team collaboration",
      "Peer evaluation"
    ],
    classMeeting: "Wednesday 16 Jul 1:00-4:00pm in NB 103",
    note: "Business casual attire required for presentations",
    assignments: [
      {
        id: "geronto-final-presentation",
        title: "Group Presentation",
        dueDate: "2025-07-16",
        platform: "in-class"
      },
      {
        id: "geronto-final-project",
        title: "Final Team Project Submission",
        dueDate: "2025-07-14",
        platform: "canvas"
      },
      {
        id: "geronto-peer-evaluation",
        title: "Peer Evaluation Form",
        dueDate: "2025-07-16",
        platform: "canvas"
      }
    ]
  },
  
  // Week 12 - Exam 3 (Final)
  "12": {
    type: "exam",
    title: "Exam 3 (Final)",
    week: 12,
    chapters: "Modules 5-8: Cognitive Disorders, Chronic Conditions, Care Settings",
    keyTopics: [
      "Alzheimer's and dementia",
      "Chronic disease management",
      "Immunity and infections in older adults",
      "Continuum of care",
      "Care transitions"
    ],
    classMeeting: "Wednesday 23 Jul 1:00-3:00pm in NB 103 – FINAL EXAM",
    note: "Bring student ID and laptop with ExamSoft installed and registered",
    assignments: [
      {
        id: "geronto-exam3",
        title: "Exam 3 (Final): Modules 5-8",
        dueDate: "2025-07-23",
        platform: "examsoft"
      }
    ]
  },
  
  // Week 13 - HESI Specialty Exam
  "13": {
    type: "exam",
    title: "HESI Specialty Exam",
    week: 13,
    chapters: "Comprehensive gerontological nursing content",
    keyTopics: [
      "Comprehensive gerontological nursing practice",
      "NCLEX-style question strategies",
      "Critical thinking and clinical judgment"
    ],
    classMeeting: "Wednesday 30 Jul 1:00-3:00pm in Computer Lab NB 207",
    note: "This exam is required to pass the course. Bring your student ID.",
    assignments: [
      {
        id: "geronto-hesi",
        title: "HESI Specialty Exam: Gerontological Nursing",
        dueDate: "2025-07-30",
        platform: "hesi"
      }
    ]
  },
  
  // Week 14 - No session this week
  "14": {
    title: "No Session This Week",
    week: 14,
    chapters: "Course completed",
    keyTopics: []
  }
};

export { gerontoModuleMap, gerontoEventColors, gerontoEvents, gerontoModuleContent };