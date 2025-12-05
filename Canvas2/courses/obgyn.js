// ========== OB/GYN COURSE DATA ==========
import { commonEventColors } from '../config.js';

// OB/GYN Module to Week Mapping
const obgynModuleMap = {
  1: ['module-obgyn-content-1'],
  2: ['module-obgyn-content-2'],
  3: ['module-obgyn-exam-3'],                              // Exam 1 (covers modules 1-2)
  4: ['module-obgyn-content-4'],                           // Self-directed week
  5: ['module-obgyn-content-5'],
  6: ['module-obgyn-exam-6'],                              // Exam 2 (covers modules 3-4)
  7: ['module-obgyn-content-7'],
  8: ['module-obgyn-content-8'],
  9: ['module-obgyn-exam-9'],                              // Exam 3 (covers modules 5-6)
  10: ['module-obgyn-content-10'],
  11: ['module-obgyn-content-11'],
  12: ['module-obgyn-exam-12'],                            // Exam 4 (covers modules 7-8)
  13: ['module-obgyn-exam-13'],                            // HESI specialty exam
  14: ['module-obgyn-exam-14']                             // Final exam
};

// OB/GYN-specific color overrides
const obgynEventColors = {
  ...commonEventColors,
  // Any OB/GYN specific color overrides would go here
};

// OB/GYN Events
const obgynEvents = [
  // === WEEKLY LECTURES ===
  // OB lectures (Mondays 9-12)
  { title: 'OB Lecture', start: '2025-05-05T09:00', end: '2025-05-05T12:00', group: 'lecture', course: 'obgyn', week: 1, 
    details: 'Module 1: Perspectives in Women\'s Health, Fetal Development, Normal Pregnancy' },
  { title: 'OB Lecture', start: '2025-05-12T09:00', end: '2025-05-12T12:00', group: 'lecture', course: 'obgyn', week: 2,
    details: 'Module 2: Normal Labor & Birth' },
  { title: 'OB Exam 1', start: '2025-05-19T09:00', end: '2025-05-19T11:00', group: 'exam', course: 'obgyn', week: 3,
    details: 'Exam 1 covering Modules 1-2 (Perspectives, Fetal Development, Normal Pregnancy, Normal Labor & Birth)' },
  // Memorial Day - no class
  { title: 'OB Lecture', start: '2025-06-02T09:00', end: '2025-06-02T12:00', group: 'lecture', course: 'obgyn', week: 5,
    details: 'Module 4: Newborn Adaptation & Care' },
  { title: 'OB Exam 2', start: '2025-06-09T09:00', end: '2025-06-09T11:00', group: 'exam', course: 'obgyn', week: 6,
    details: 'Exam 2 covering Modules 3-4 (Normal Postpartum, Newborn Adaptation & Care)' },
  { title: 'OB Lecture', start: '2025-06-16T09:00', end: '2025-06-16T12:00', group: 'lecture', course: 'obgyn', week: 7,
    details: 'Module 5: Pregnancy at Risk' },
  { title: 'OB Lecture', start: '2025-06-23T09:00', end: '2025-06-23T12:00', group: 'lecture', course: 'obgyn', week: 8,
    details: 'Module 6: Labor at Risk' },
  { title: 'OB Exam 3', start: '2025-06-30T09:00', end: '2025-06-30T11:00', group: 'exam', course: 'obgyn', week: 9,
    details: 'Exam 3 covering Modules 5-6 (Pregnancy at Risk, Labor at Risk)' },
  { title: 'OB Lecture', start: '2025-07-07T09:00', end: '2025-07-07T12:00', group: 'lecture', course: 'obgyn', week: 10,
    details: 'Module 7: Postpartum at Risk' },
  { title: 'OB Lecture', start: '2025-07-14T09:00', end: '2025-07-14T12:00', group: 'lecture', course: 'obgyn', week: 11,
    details: 'Module 8: Newborn at Risk' },
  { title: 'OB Exam 4', start: '2025-07-21T09:00', end: '2025-07-21T11:00', group: 'exam', course: 'obgyn', week: 12,
    details: 'Exam 4 covering Modules 7-8 (Postpartum at Risk, Newborn at Risk)' },
  { title: 'OB HESI', start: '2025-07-28T09:00', end: '2025-07-28T11:30', group: 'exam', course: 'obgyn', week: 13,
    details: 'HESI Standardized Exam - Comprehensive OB content' },
  { title: 'OB Final Exam', start: '2025-08-04T10:10', end: '2025-08-04T12:10', group: 'exam', course: 'obgyn', week: 14,
    details: 'Comprehensive Final Exam covering all modules' },

  // === CLINICAL BLOCKS ===
  // OB Clinical Group B (Tuesdays 6am-4pm)
  { title: 'OB Orientation', start: '2025-05-06T13:00', end: '2025-05-06T17:00', group: 'clinical', course: 'obgyn', tab: 'clinical',
    details: 'OB Orientation - Group B (13:00-17:00)' },
  { title: 'OB Clinical (Group B)', start: '2025-06-17T06:00', end: '2025-06-17T16:00', group: 'clinical', course: 'obgyn', tab: 'clinical',
    details: 'OB Clinical Day 1 - Group B (06:00-16:00)' },
  { title: 'OB Clinical (Group B)', start: '2025-06-24T06:00', end: '2025-06-24T16:00', group: 'clinical', course: 'obgyn', tab: 'clinical',
    details: 'OB Clinical Day 2 - Group B (06:00-16:00)' },
  { title: 'OB Clinical (Group B)', start: '2025-07-01T06:00', end: '2025-07-01T16:00', group: 'clinical', course: 'obgyn', tab: 'clinical',
    details: 'OB Clinical Day 3 - Group B (06:00-16:00)' },
  { title: 'OB Clinical (Group B)', start: '2025-07-08T06:00', end: '2025-07-08T16:00', group: 'clinical', course: 'obgyn', tab: 'clinical',
    details: 'OB Clinical Day 4 - Group B (06:00-16:00)' },
  { title: 'OB Clinical (Group B)', start: '2025-07-15T06:00', end: '2025-07-15T16:00', group: 'clinical', course: 'obgyn', tab: 'clinical',
    details: 'OB Clinical Day 5 - Group B (06:00-16:00)' },
  { title: 'OB Simulation', start: '2025-07-31T08:00', end: '2025-07-31T17:00', group: 'clinical', course: 'obgyn', tab: 'clinical',
    details: 'OB Simulation - Attend your assigned slot (08:00-17:00)' },
  
  // === PREPARATION WORK (2 hours each course) ===
  // OB Prep - Friday mornings (1 hour)
  { title: 'OB video prep part 1', start: '2025-05-09T10:00', end: '2025-05-09T11:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 1', start: '2025-05-16T10:00', end: '2025-05-16T11:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 1', start: '2025-05-30T10:00', end: '2025-05-30T11:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 1', start: '2025-06-06T10:00', end: '2025-06-06T11:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 1', start: '2025-06-20T10:00', end: '2025-06-20T11:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 1', start: '2025-06-27T10:00', end: '2025-06-27T11:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 1', start: '2025-07-11T10:00', end: '2025-07-11T11:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 1', start: '2025-07-18T10:00', end: '2025-07-18T11:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 1', start: '2025-08-01T10:00', end: '2025-08-01T11:00', group: 'prep', course: 'obgyn' },

  // OB Prep - Tuesday evening (1 hour)
  { title: 'OB video prep part 2', start: '2025-05-06T19:00', end: '2025-05-06T20:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 2', start: '2025-05-13T19:00', end: '2025-05-13T20:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 2', start: '2025-05-27T19:00', end: '2025-05-27T20:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 2', start: '2025-06-03T19:00', end: '2025-06-03T20:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 2', start: '2025-06-17T19:00', end: '2025-06-17T20:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 2', start: '2025-06-24T19:00', end: '2025-06-24T20:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 2', start: '2025-07-08T19:00', end: '2025-07-08T20:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 2', start: '2025-07-15T19:00', end: '2025-07-15T20:00', group: 'prep', course: 'obgyn' },
  { title: 'OB video prep part 2', start: '2025-07-29T19:00', end: '2025-07-29T20:00', group: 'prep', course: 'obgyn' }
];

// Module descriptions and content
const obgynModuleContent = {
  // Week 1 - Perspectives in Women's Health
  "1": {
    title: "Perspectives in Women's Health, Fetal Development, Normal Pregnancy",
    week: 1,
    chapters: "Chapters 1-6: Women's Health, Fetal Development, Prenatal Care",
    keyTopics: [
      "Women's health throughout the lifespan",
      "Fetal development stages and monitoring",
      "Comprehensive prenatal care",
      "Maternal physiological adaptations"
    ],
    classMeeting: "Monday 5 May 09:00-12:00",
    assignments: [
      {
        id: "sherpath-videos-1",
        title: "Sherpath Videos & Readings (Ch. 1-6)",
        dueDate: "2025-05-11",
        platform: "sherpath"
      },
      {
        id: "module1-adaptive-quiz",
        title: "Module 1 Adaptive Quiz (15 questions)",
        dueDate: "2025-05-18",
        platform: "sherpath"
      }
    ]
  },
  
  // Week 2 - Normal Labor & Birth
  "2": {
    title: "Normal Labor & Birth",
    week: 2,
    chapters: "Chapters 7-10: Labor Process, Birth, Pain Management",
    keyTopics: [
      "Stages of labor and physiological processes",
      "Birth mechanisms and delivery procedures",
      "Pain management and coping techniques",
      "Immediate postpartum care"
    ],
    classMeeting: "Monday 12 May 09:00-12:00",
    assignments: [
      {
        id: "sherpath-videos-2",
        title: "Sherpath Videos & Readings (Ch. 7-10)",
        dueDate: "2025-05-18",
        platform: "sherpath"
      },
      {
        id: "module2-adaptive-quiz",
        title: "Module 2 Adaptive Quiz (15 questions)",
        dueDate: "2025-05-25",
        platform: "sherpath"
      }
    ]
  },
  
  // Week 3 - Exam 1
  "3": {
    type: "exam",
    title: "Exam 1",
    week: 3,
    chapters: "Modules 1-2: Women's Health, Fetal Development, Normal Pregnancy, Labor & Birth",
    keyTopics: [
      "Women's health",
      "Fetal development",
      "Normal pregnancy",
      "Labor and birth processes"
    ],
    classMeeting: "Monday 19 May 09:00-11:00",
    note: "Bring student ID and pencil. Comprehensive exam covering Modules 1-2.",
    assignments: [
      {
        id: "obgyn-exam1",
        title: "Exam 1",
        dueDate: "2025-05-19",
        platform: "canvas"
      }
    ]
  },
  
  // Week 4 - Normal Postpartum (Self-directed)
  "4": {
    title: "Normal Postpartum",
    week: 4,
    chapters: "Chapters 17, 23, 26: Postpartum adaptations, infant feeding, family planning",
    keyTopics: [
      "Postpartum adaptations and nursing care",
      "Infant feeding methods and education",
      "Family planning and contraception",
      "Psychosocial adaptations to parenthood"
    ],
    note: "This module is self-directed due to Memorial Day. No in-person lecture.",
    assignments: [
      {
        id: "sherpath-videos-3",
        title: "Sherpath Videos & Readings (Ch. 17, 23, 26)",
        dueDate: "2025-05-25",
        platform: "sherpath"
      },
      {
        id: "module3-adaptive-quiz",
        title: "Module 3 Adaptive Quiz (15 questions)",
        dueDate: "2025-06-08",
        platform: "sherpath"
      }
    ]
  },
  
  // Week 5 - Newborn Adaptation & Care
  "5": {
    title: "Newborn Adaptation & Care",
    week: 5,
    chapters: "Chapters 18-22: Newborn physiologic adaptations, assessment, care",
    keyTopics: [
      "Newborn physiologic adaptations",
      "Comprehensive newborn assessment",
      "Essential newborn care",
      "Parent education for newborn care"
    ],
    classMeeting: "Monday 2 Jun 09:00-12:00",
    assignments: [
      {
        id: "sherpath-videos-4",
        title: "Sherpath Videos & Readings (Ch. 18-22)",
        dueDate: "2025-06-08",
        platform: "sherpath"
      },
      {
        id: "module4-adaptive-quiz",
        title: "Module 4 Adaptive Quiz (15 questions)",
        dueDate: "2025-06-15",
        platform: "sherpath"
      }
    ]
  },
  
  // Week 6 - Exam 2
  "6": {
    type: "exam",
    title: "Exam 2",
    week: 6,
    chapters: "Modules 3-4: Normal Postpartum, Newborn Adaptation & Care",
    keyTopics: [
      "Postpartum adaptations",
      "Infant feeding methods",
      "Newborn assessment",
      "Essential newborn care"
    ],
    classMeeting: "Monday 9 Jun 09:00-11:00",
    note: "Bring student ID and pencil. Comprehensive exam covering Modules 3-4.",
    assignments: [
      {
        id: "obgyn-exam2",
        title: "Exam 2",
        dueDate: "2025-06-09",
        platform: "canvas"
      }
    ]
  },
  
  // Week 7 - Pregnancy at Risk
  "7": {
    title: "Pregnancy at Risk",
    week: 7,
    chapters: "Chapters 11-13: High-risk pregnancy, gestational complications",
    keyTopics: [
      "High-risk pregnancy assessment and management",
      "Gestational diabetes",
      "Pregnancy-induced hypertension",
      "Hemorrhagic complications"
    ],
    classMeeting: "Monday 16 Jun 09:00-12:00",
    assignments: [
      {
        id: "sherpath-videos-5",
        title: "Sherpath Videos & Readings (Ch. 11-13)",
        dueDate: "2025-06-22",
        platform: "sherpath"
      },
      {
        id: "module5-adaptive-quiz",
        title: "Module 5 Adaptive Quiz (15 questions)",
        dueDate: "2025-06-29",
        platform: "sherpath"
      }
    ]
  },
  
  // Week 8 - Labor at Risk
  "8": {
    title: "Labor at Risk",
    week: 8,
    chapters: "Chapters 14-16: Complications during labor and birth",
    keyTopics: [
      "Dysfunctional labor patterns",
      "Fetal distress",
      "Operative obstetrics",
      "Emergency childbirth"
    ],
    classMeeting: "Monday 23 Jun 09:00-12:00",
    assignments: [
      {
        id: "sherpath-videos-6",
        title: "Sherpath Videos & Readings (Ch. 14-16)",
        dueDate: "2025-06-29",
        platform: "sherpath"
      },
      {
        id: "module6-adaptive-quiz",
        title: "Module 6 Adaptive Quiz (15 questions)",
        dueDate: "2025-07-06",
        platform: "sherpath"
      }
    ]
  },
  
  // Week 9 - Exam 3
  "9": {
    type: "exam",
    title: "Exam 3",
    week: 9,
    chapters: "Modules 5-6: Pregnancy at Risk, Labor at Risk",
    keyTopics: [
      "High-risk pregnancy",
      "Gestational complications",
      "Dysfunctional labor",
      "Operative obstetrics"
    ],
    classMeeting: "Monday 30 Jun 09:00-11:00",
    note: "Bring student ID and pencil. Comprehensive exam covering Modules 5-6.",
    assignments: [
      {
        id: "obgyn-exam3",
        title: "Exam 3",
        dueDate: "2025-06-30",
        platform: "canvas"
      }
    ]
  },
  
  // Week 10 - Postpartum at Risk
  "10": {
    title: "Postpartum at Risk",
    week: 10,
    chapters: "Chapters 27-28: Postpartum complications",
    keyTopics: [
      "Postpartum hemorrhage",
      "Postpartum infections",
      "Thromboembolic disorders",
      "Postpartum mood disorders"
    ],
    classMeeting: "Monday 7 Jul 09:00-12:00",
    assignments: [
      {
        id: "sherpath-videos-7",
        title: "Sherpath Videos & Readings (Ch. 27-28)",
        dueDate: "2025-07-13",
        platform: "sherpath"
      },
      {
        id: "module7-adaptive-quiz",
        title: "Module 7 Adaptive Quiz (15 questions)",
        dueDate: "2025-07-20",
        platform: "sherpath"
      }
    ]
  },
  
  // Week 11 - Newborn at Risk
  "11": {
    title: "Newborn at Risk",
    week: 11,
    chapters: "Chapters 29-31: High-risk newborn, congenital disorders",
    keyTopics: [
      "Prematurity and low birth weight",
      "Respiratory distress syndrome",
      "Congenital anomalies",
      "Neonatal abstinence syndrome"
    ],
    classMeeting: "Monday 14 Jul 09:00-12:00",
    assignments: [
      {
        id: "sherpath-videos-8",
        title: "Sherpath Videos & Readings (Ch. 29-31)",
        dueDate: "2025-07-20",
        platform: "sherpath"
      },
      {
        id: "module8-adaptive-quiz",
        title: "Module 8 Adaptive Quiz (15 questions)",
        dueDate: "2025-07-27",
        platform: "sherpath"
      }
    ]
  },
  
  // Week 12 - Exam 4
  "12": {
    type: "exam",
    title: "Exam 4",
    week: 12,
    chapters: "Modules 7-8: Postpartum at Risk, Newborn at Risk",
    keyTopics: [
      "Postpartum complications",
      "Prematurity",
      "Neonatal disorders",
      "Congenital anomalies"
    ],
    classMeeting: "Monday 21 Jul 09:00-11:00",
    note: "Bring student ID and pencil. Comprehensive exam covering Modules 7-8.",
    assignments: [
      {
        id: "obgyn-exam4",
        title: "Exam 4",
        dueDate: "2025-07-21",
        platform: "canvas"
      }
    ]
  },
  
  // Week 13 - HESI Specialty Exam
  "13": {
    type: "exam",
    title: "HESI Specialty Exam",
    week: 13,
    chapters: "Comprehensive OB content",
    keyTopics: [
      "All maternal-newborn content",
      "Test-taking strategies",
      "Critical thinking",
      "NCLEX-style questions"
    ],
    classMeeting: "Monday 28 Jul 09:00-11:30",
    note: "Standardized exam. Bring student ID and arrive 15 minutes early.",
    assignments: [
      {
        id: "obgyn-hesi",
        title: "HESI Specialty Exam",
        dueDate: "2025-07-28",
        platform: "hesi"
      },
      {
        id: "hesi-remediation",
        title: "HESI Remediation Assignment",
        dueDate: "2025-08-04",
        platform: "canvas"
      }
    ]
  },
  
  // Week 14 - Final Exam
  "14": {
    type: "exam",
    title: "Final Exam",
    week: 14,
    chapters: "All modules 1-8",
    keyTopics: [
      "Comprehensive obstetrics content",
      "Normal and high-risk pregnancy",
      "Normal and complicated labor",
      "Postpartum and newborn care"
    ],
    classMeeting: "Monday 4 Aug 10:10-12:10",
    note: "Comprehensive final exam. Bring student ID and pencil. Covers all course content.",
    assignments: [
      {
        id: "obgyn-final",
        title: "Comprehensive Final Exam",
        dueDate: "2025-08-04",
        platform: "canvas"
      }
    ]
  }
};

export { obgynModuleMap, obgynEventColors, obgynEvents, obgynModuleContent };