// ========== NCLEX COURSE DATA ==========
import { commonEventColors } from '../config.js';

// NCLEX Module to Week Mapping
const nclexModuleMap = {
  1: ['module-nclex-content-1'],                           // Week 1: Health Assessment
  2: ['module-nclex-exam-2'],                              // Week 2: HESI Health Assessment
  3: ['module-nclex-content-3'],                           // Week 3: Nutrition and Wellness
  4: ['module-nclex-break-4'],                             // Week 4: Memorial Day - No Class
  5: ['module-nclex-exam-5'],                              // Week 5: HESI Nutrition
  6: ['module-nclex-content-6'],                           // Week 6: Foundations of Nursing
  7: ['module-nclex-content-7'],                           // Week 7: High-Fidelity Simulation
  8: ['module-nclex-exam-8'],                              // Week 8: HESI Fundamentals
  9: ['module-nclex-content-9'],                           // Week 9: Pharmacology Concepts
  10: ['module-nclex-content-10'],                         // Week 10: Mental Health
  11: ['module-nclex-exam-11'],                            // Week 11: HESI Mental Health
  12: ['module-nclex-exam-12'],                            // Week 12: HESI Pathophysiology
  13: ['module-nclex-review-13'],                          // Week 13: Mid-HESI Review
  14: ['module-nclex-exam-14']                             // Week 14: Mid-HESI Final
};

// NCLEX-specific color overrides
const nclexEventColors = {
  ...commonEventColors,
  // Any NCLEX specific color overrides would go here
};

// NCLEX Events
const nclexEvents = [
  // === LECTURES AND MODULES ===
  // Week 1: Orientation & Health Assessment
  { title: 'NCLEX Orientation & Health Assessment', start: '2025-05-05T14:00', end: '2025-05-05T17:00', 
    group: 'lecture', course: 'nclex', week: 1,
    details: 'Course orientation and Module 1: Health Assessment concepts review. Location: On-campus.' },
  
  // Week 3: Nutrition and Wellness
  { title: 'NCLEX: Nutrition & Wellness', start: '2025-05-19T14:00', end: '2025-05-19T17:00', 
    group: 'lecture', course: 'nclex', week: 3,
    details: 'Module 2: Nutrition and Wellness concepts review. Location: Zoom.' },
  
  // Week 6: Foundations of Nursing
  { title: 'NCLEX: Foundations of Nursing', start: '2025-06-09T14:00', end: '2025-06-09T17:00', 
    group: 'lecture', course: 'nclex', week: 6,
    details: 'Module 3: Foundations of Nursing concepts review. Location: Zoom.' },
  
  // Week 7: High-Fidelity Simulation
  { title: 'NCLEX: High-Fidelity Simulation', start: '2025-06-16T14:00', end: '2025-06-16T17:00', 
    group: 'clinical', course: 'nclex', week: 7,
    details: 'Module 4: High-Fidelity Simulation (Continuity of Care). Location: On-campus in NB 109.' },
  
  // Week 9: Pharmacology Concepts
  { title: 'NCLEX: Pharmacology Concepts', start: '2025-06-30T14:00', end: '2025-06-30T17:00', 
    group: 'lecture', course: 'nclex', week: 9,
    details: 'Module 5: Pharmacology concepts review. Location: Zoom.' },
  
  // Week 10: Mental Health
  { title: 'NCLEX: Mental Health', start: '2025-07-07T14:00', end: '2025-07-07T17:00', 
    group: 'lecture', course: 'nclex', week: 10,
    details: 'Module 6: Mental Health concepts review. Location: Zoom.' },
  
  // Week 13: Mid-HESI Review
  { title: 'NCLEX: Mid-HESI Review', start: '2025-07-28T14:00', end: '2025-07-28T17:00', 
    group: 'lecture', course: 'nclex', week: 13,
    details: 'Mid-HESI concepts review and preparation. Location: Zoom.' },
  
  // === HESI EXAMS ===
  // Week 2: HESI Health Assessment
  { title: 'HESI Health Assessment Exam', start: '2025-05-12T14:00', end: '2025-05-12T16:00', 
    group: 'exam', course: 'nclex', week: 2,
    details: 'HESI Specialty RN Exam: Health Assessment. Location: On-campus. Bring student ID.' },
  
  // Week 5: HESI Nutrition
  { title: 'HESI Nutrition Exam', start: '2025-06-02T14:00', end: '2025-06-02T16:00', 
    group: 'exam', course: 'nclex', week: 5,
    details: 'HESI Specialty RN Exam: Nutrition. Location: On-campus. Bring student ID.' },
  
  // Week 8: HESI Fundamentals
  { title: 'HESI Fundamentals Exam', start: '2025-06-23T14:00', end: '2025-06-23T16:00', 
    group: 'exam', course: 'nclex', week: 8,
    details: 'HESI Specialty RN Exam: Fundamentals. Location: On-campus. Bring student ID.' },
  
  // Week 11: HESI Mental Health
  { title: 'HESI Mental Health Exam', start: '2025-07-14T14:00', end: '2025-07-14T16:00', 
    group: 'exam', course: 'nclex', week: 11,
    details: 'HESI Specialty RN Exam: Mental Health. Location: On-campus. Bring student ID.' },
  
  // Week 12: HESI Pathophysiology
  { title: 'HESI Pathophysiology Exam', start: '2025-07-21T14:00', end: '2025-07-21T16:00', 
    group: 'exam', course: 'nclex', week: 12,
    details: 'HESI Specialty RN Exam: Pathophysiology. Location: On-campus. Bring student ID.' },
  
  // Week 14: Mid-HESI Final Exam (Thursday)
  { title: 'Mid-HESI Final Exam', start: '2025-08-07T10:00', end: '2025-08-07T13:00', 
    group: 'exam', course: 'nclex', week: 14,
    details: 'Final Exam: Mid-HESI (Comprehensive). Location: On-campus. Bring student ID.' },
  
  // === QUIZ DUE DATES ===
  // Module 1 Quiz
  { title: 'Health Assessment Quiz Due', start: '2025-05-12T13:45', end: '2025-05-12T14:15', 
    group: 'prep', course: 'nclex', week: 2,
    details: 'Quiz 1: Health Assessment and Foundations of Nursing Concepts. Worth 35 points.' },
  
  // Module 2 Quiz
  { title: 'Nutrition & Wellness Quiz Due', start: '2025-06-02T13:45', end: '2025-06-02T14:15', 
    group: 'prep', course: 'nclex', week: 5,
    details: 'Quiz 2: Health Promotion and Maintenance, and Nursing Pharmacology. Worth 40 points.' },
  
  // Module 3 Quiz
  { title: 'Foundations of Nursing Quiz Due', start: '2025-06-23T13:45', end: '2025-06-23T14:15', 
    group: 'prep', course: 'nclex', week: 8,
    details: 'Quiz 3: Health Assessment, Foundations of Nursing and Pathophysiology Concepts. Worth 50 points.' },
  
  // Module 4 Simulation Quizzes
  { title: 'Pre-simulation Quiz Due', start: '2025-06-16T14:00', end: '2025-06-16T14:30', 
    group: 'prep', course: 'nclex', week: 7,
    details: 'Pre-simulation preparation quiz. Worth 40 points.' },
  
  { title: 'Post-simulation Quiz Due', start: '2025-06-16T18:00', end: '2025-06-16T18:30', 
    group: 'prep', course: 'nclex', week: 7,
    details: 'Post-simulation reflection quiz. Worth 40 points.' },
  
  // Module 5 Quiz (Placeholder)
  { title: 'Pharmacology Quiz Due', start: '2025-07-07T13:45', end: '2025-07-07T14:15', 
    group: 'prep', course: 'nclex', week: 10,
    details: 'Verify with instructor for Pharmacology quiz details.' },
  
  // Module 6 Quiz
  { title: 'Mental Health Quiz Due', start: '2025-07-14T13:45', end: '2025-07-14T14:15', 
    group: 'prep', course: 'nclex', week: 11,
    details: 'Quiz 4: Mental Health Concepts. Worth 35 points.' },
  
  // Additional Quizzes
  { title: 'Maternal & Child Quiz Due', start: '2025-07-21T13:45', end: '2025-07-21T14:15', 
    group: 'prep', course: 'nclex', week: 12,
    details: 'Quiz 5: Maternal and Child Nursing Concepts. Worth 40 points.' },
  
  { title: 'Adult Health Quiz Due', start: '2025-08-07T09:45', end: '2025-08-07T10:15', 
    group: 'prep', course: 'nclex', week: 14,
    details: 'Quiz 6: Adult Health I Concepts. Worth 32 points.' },
  
  // === HESI EXAM PREP ASSIGNMENTS ===
  // Health Assessment HESI Prep
  { title: 'HESI Health Assessment Prep Due', start: '2025-05-12T13:45', end: '2025-05-12T14:15', 
    group: 'drill', course: 'nclex', week: 2,
    details: 'Complete 50 NCLEX-style practice questions for Health Assessment. Worth 50 points.' },
  
  // Nutrition HESI Prep
  { title: 'HESI Nutrition Prep Due', start: '2025-06-02T13:45', end: '2025-06-02T14:15', 
    group: 'drill', course: 'nclex', week: 5,
    details: 'Complete 50 NCLEX-style practice questions for Nutrition. Worth 50 points.' },
  
  // Fundamentals HESI Prep
  { title: 'HESI Fundamentals Prep Due', start: '2025-06-23T13:45', end: '2025-06-23T14:15', 
    group: 'drill', course: 'nclex', week: 8,
    details: 'Complete 50 NCLEX-style practice questions for Fundamentals of Nursing. Worth 50 points.' },
  
  // Mental Health HESI Prep
  { title: 'HESI Mental Health Prep Due', start: '2025-07-14T13:45', end: '2025-07-14T14:15', 
    group: 'drill', course: 'nclex', week: 11,
    details: 'Complete 50 NCLEX-style practice questions for Mental Health. Worth 50 points.' },
  
  // Pathophysiology HESI Prep
  { title: 'HESI Pathophysiology Prep Due', start: '2025-07-21T13:45', end: '2025-07-21T14:15', 
    group: 'drill', course: 'nclex', week: 12,
    details: 'Complete 50 NCLEX-style practice questions for Pathophysiology. Worth 50 points.' },
  
  // === POST-HESI REFLECTION ASSIGNMENTS ===
  // Health Assessment Reflection
  { title: 'Health Assessment Reflection Due', start: '2025-05-12T17:00', end: '2025-05-12T17:30', 
    group: 'prep', course: 'nclex', week: 2,
    details: 'Reflection Quiz: Post HESI Specialty RN Exam (Health Assessment). Worth 5 points.' },
  
  // Nutrition Reflection
  { title: 'Nutrition Reflection Due', start: '2025-06-02T17:00', end: '2025-06-02T17:30', 
    group: 'prep', course: 'nclex', week: 5,
    details: 'Reflection Quiz: Post HESI Specialty RN Exam (Nutrition). Worth 5 points.' },
  
  // Fundamentals Reflection
  { title: 'Fundamentals Reflection Due', start: '2025-06-23T17:00', end: '2025-06-23T17:30', 
    group: 'prep', course: 'nclex', week: 8,
    details: 'Reflection Quiz: Post HESI Specialty RN Exam (Fundamentals). Worth 5 points.' },
  
  // Mental Health Reflection
  { title: 'Mental Health Reflection Due', start: '2025-07-14T17:00', end: '2025-07-14T17:30', 
    group: 'prep', course: 'nclex', week: 11,
    details: 'Reflection Quiz: Post HESI Specialty RN Exam (Mental Health). Worth 5 points.' },
  
  // Pathophysiology Reflection
  { title: 'Pathophysiology Reflection Due', start: '2025-07-21T17:00', end: '2025-07-21T17:30', 
    group: 'prep', course: 'nclex', week: 12,
    details: 'Reflection Quiz: Post HESI Specialty RN Exam (Pathophysiology). Worth 5 points.' },
  
  // === REMEDIATION ASSIGNMENTS ===
  // Health Assessment Remediation
  { title: 'Health Assessment Templates Due', start: '2025-05-27T23:59', end: '2025-05-28T00:30', 
    group: 'remediation', course: 'nclex', week: 4,
    details: 'Remediation Learning Templates for HESI Health Assessment. Worth 30 points.' },
  
  { title: 'Health Assessment Case Studies Due', start: '2025-05-27T23:30', end: '2025-05-28T00:00', 
    group: 'remediation', course: 'nclex', week: 4,
    details: 'Remediation Evolve-Provided Case Studies: Post-HESI Health Assessment. Worth 30 points.' },
  
  // Nutrition Remediation
  { title: 'Nutrition Templates Due', start: '2025-06-16T23:59', end: '2025-06-17T00:30', 
    group: 'remediation', course: 'nclex', week: 7,
    details: 'Remediation Learning Templates for HESI Nutrition. Worth 30 points.' },
  
  { title: 'Nutrition Case Studies Due', start: '2025-06-16T23:30', end: '2025-06-17T00:00', 
    group: 'remediation', course: 'nclex', week: 7,
    details: 'Remediation Evolve-Provided Case Studies: Post-HESI Nutrition. Worth 30 points.' },
  
  // Fundamentals Remediation
  { title: 'Fundamentals Templates Due', start: '2025-07-07T23:59', end: '2025-07-08T00:30', 
    group: 'remediation', course: 'nclex', week: 10,
    details: 'Remediation Learning Templates for HESI Fundamentals. Worth 30 points.' },
  
  { title: 'Fundamentals Case Studies Due', start: '2025-07-07T23:30', end: '2025-07-08T00:00', 
    group: 'remediation', course: 'nclex', week: 10,
    details: 'Remediation Evolve-Provided Case Studies: Post-HESI Fundamentals. Worth 30 points.' },
  
  // Mental Health Remediation
  { title: 'Mental Health Templates Due', start: '2025-07-28T23:59', end: '2025-07-29T00:30', 
    group: 'remediation', course: 'nclex', week: 13,
    details: 'Remediation Learning Templates for HESI Mental Health. Worth 30 points.' },
  
  { title: 'Mental Health Case Studies Due', start: '2025-07-28T23:30', end: '2025-07-29T00:00', 
    group: 'remediation', course: 'nclex', week: 13,
    details: 'Remediation Evolve-Provided Case Studies: Post-HESI Mental Health. Worth 30 points.' },
  
  // Pathophysiology Remediation
  { title: 'Pathophysiology Templates Due', start: '2025-08-04T23:59', end: '2025-08-05T00:30', 
    group: 'remediation', course: 'nclex', week: 14,
    details: 'Remediation Learning Templates for HESI Pathophysiology. Worth 30 points.' },
  
  { title: 'Pathophysiology Case Studies Due', start: '2025-08-04T23:30', end: '2025-08-05T00:00', 
    group: 'remediation', course: 'nclex', week: 14,
    details: 'Remediation Evolve-Provided Case Studies: Post-HESI Pathophysiology. Worth 30 points.' },
  
  // Simulation Remediation
  { title: 'Simulation Skills Remediation Due', start: '2025-07-31T23:59', end: '2025-08-01T00:30', 
    group: 'remediation', course: 'nclex', week: 13,
    details: 'Remediation: Post High-Fidelity Simulation Skills. Worth 50 points. Must be completed one week before Mid-HESI.' }
];

// Module descriptions and content
const nclexModuleContent = {
  // Week 1 - Health Assessment
  "1": {
    title: "Health Assessment",
    week: 1,
    chapters: "Health assessment, oxygenation, perfusion, elimination",
    keyTopics: [
      "Health assessment concepts",
      "COPD and pneumonia pathophysiology",
      "Coronary artery disease",
      "Physical assessment techniques"
    ],
    classMeeting: "Monday 5 May 14:00-17:00 (On-campus)",
    assignments: [
      {
        id: "health-assessment-quiz",
        title: "Quiz 1: Health Assessment (35 points)",
        dueDate: "2025-05-12",
        platform: "canvas"
      },
      {
        id: "hesi-health-assessment-prep",
        title: "HESI Exam Prep: 50 Practice Questions",
        dueDate: "2025-05-12",
        platform: "canvas"
      },
      {
        id: "health-assessment-post-hesi",
        title: "Post-HESI Reflection",
        dueDate: "2025-05-12",
        platform: "canvas"
      },
      {
        id: "health-assessment-remediation-templates",
        title: "Remediation Learning Templates",
        dueDate: "2025-05-27",
        platform: "canvas"
      },
      {
        id: "health-assessment-case-studies",
        title: "Case Studies Remediation",
        dueDate: "2025-05-27",
        platform: "canvas"
      }
    ]
  },
  
  // Week 2 - HESI Health Assessment Exam
  "2": {
    type: "exam",
    title: "HESI Health Assessment Exam",
    week: 2,
    chapters: "Health assessment concepts",
    keyTopics: [
      "HESI Specialty RN Exam",
      "Health Assessment",
      "Physical assessment techniques",
      "Test-taking strategies"
    ],
    classMeeting: "Monday 12 May 14:00-16:00 (On-campus)",
    note: "Bring student ID. Arrive 15 minutes early.",
    assignments: [
      {
        id: "health-assessment-quiz-submission",
        title: "Quiz 1: Health Assessment (35 points)",
        dueDate: "2025-05-12",
        platform: "canvas"
      },
      {
        id: "hesi-health-assessment-exam",
        title: "HESI Specialty RN Exam: Health Assessment",
        dueDate: "2025-05-12",
        platform: "hesi"
      },
      {
        id: "health-assessment-reflection",
        title: "Post-HESI Reflection",
        dueDate: "2025-05-12",
        platform: "canvas"
      }
    ]
  },
  
  // Week 3 - Nutrition and Wellness
  "3": {
    title: "Nutrition and Wellness",
    week: 3,
    chapters: "Nutritional therapy, healthy eating, enteral vs parenteral nutrition",
    keyTopics: [
      "Health promotion",
      "Wellness concepts", 
      "Enteral and parenteral nutrition", 
      "Meal planning and calorie counting"
    ],
    classMeeting: "Monday 19 May 14:00-17:00 (Zoom)",
    assignments: [
      {
        id: "nutrition-quiz",
        title: "Quiz 2: Nutrition & Wellness (40 points)",
        dueDate: "2025-06-02",
        platform: "canvas"
      },
      {
        id: "hesi-nutrition-prep",
        title: "HESI Exam Prep: 50 Practice Questions",
        dueDate: "2025-06-02",
        platform: "canvas"
      },
      {
        id: "nutrition-post-hesi",
        title: "Post-HESI Reflection",
        dueDate: "2025-06-02",
        platform: "canvas"
      },
      {
        id: "nutrition-remediation-templates",
        title: "Remediation Learning Templates",
        dueDate: "2025-06-16",
        platform: "canvas"
      },
      {
        id: "nutrition-case-studies",
        title: "Case Studies Remediation",
        dueDate: "2025-06-16",
        platform: "canvas"
      }
    ]
  },
  
  // Week 4 - Memorial Day Break
  "4": {
    type: "break",
    title: "Memorial Day - No Class",
    week: 4,
    chapters: "No formal content - remediation period",
    keyTopics: [
      "Health Assessment remediation",
      "Completion of previous assignments"
    ],
    note: "Holiday week - no class meeting. Use this time to complete Health Assessment remediation assignments.",
    assignments: [
      {
        id: "health-assessment-remediation-templates-due",
        title: "Health Assessment Remediation Templates",
        dueDate: "2025-05-27",
        platform: "canvas"
      },
      {
        id: "health-assessment-case-studies-due",
        title: "Health Assessment Case Studies",
        dueDate: "2025-05-27",
        platform: "canvas"
      }
    ]
  },
  
  // Week 5 - HESI Nutrition Exam
  "5": {
    type: "exam",
    title: "HESI Nutrition Exam",
    week: 5,
    chapters: "Nutrition concepts",
    keyTopics: [
      "HESI Specialty RN Exam",
      "Nutrition",
      "Health promotion and maintenance",
      "Test-taking strategies"
    ],
    classMeeting: "Monday 2 Jun 14:00-16:00 (On-campus)",
    note: "Bring student ID. Arrive 15 minutes early.",
    assignments: [
      {
        id: "nutrition-quiz-submission",
        title: "Quiz 2: Nutrition & Wellness (40 points)",
        dueDate: "2025-06-02",
        platform: "canvas"
      },
      {
        id: "hesi-nutrition-exam",
        title: "HESI Specialty RN Exam: Nutrition",
        dueDate: "2025-06-02",
        platform: "hesi"
      },
      {
        id: "nutrition-reflection",
        title: "Post-HESI Reflection",
        dueDate: "2025-06-02",
        platform: "canvas"
      }
    ]
  },
  
  // Week 6 - Foundations of Nursing
  "6": {
    title: "Foundations of Nursing",
    week: 6,
    chapters: "Basic nursing skills, infection control, safety",
    keyTopics: [
      "Basic nursing procedures",
      "Patient safety concepts",
      "Infection control",
      "Documentation principles"
    ],
    classMeeting: "Monday 9 Jun 14:00-17:00 (Zoom)",
    assignments: [
      {
        id: "foundations-quiz",
        title: "Quiz 3: Foundations of Nursing (50 points)",
        dueDate: "2025-06-23",
        platform: "canvas"
      },
      {
        id: "hesi-fundamentals-prep",
        title: "HESI Exam Prep: 50 Practice Questions",
        dueDate: "2025-06-23",
        platform: "canvas"
      }
    ]
  },
  
  // Week 7 - High-Fidelity Simulation
  "7": {
    type: "simulation",
    title: "High-Fidelity Simulation",
    week: 7,
    chapters: "Continuity of care, clinical skills application",
    keyTopics: [
      "Clinical skills application",
      "Continuity of care",
      "Patient handoff",
      "Communication skills"
    ],
    classMeeting: "Monday 16 Jun 14:00-17:00 (On-campus, NB 109)",
    note: "Wear clinical uniform with name badge. Bring stethoscope and other clinical tools.",
    assignments: [
      {
        id: "pre-simulation-quiz",
        title: "Pre-simulation Quiz (40 points)",
        dueDate: "2025-06-16",
        platform: "canvas"
      },
      {
        id: "post-simulation-quiz",
        title: "Post-simulation Quiz (40 points)",
        dueDate: "2025-06-16",
        platform: "canvas"
      },
      {
        id: "nutrition-remediation-templates-due",
        title: "Nutrition Remediation Templates",
        dueDate: "2025-06-16",
        platform: "canvas"
      },
      {
        id: "nutrition-case-studies-due",
        title: "Nutrition Case Studies",
        dueDate: "2025-06-16",
        platform: "canvas"
      }
    ]
  },
  
  // Week 8 - HESI Fundamentals
  "8": {
    type: "exam",
    title: "HESI Fundamentals Exam",
    week: 8,
    chapters: "Foundations of nursing concepts",
    keyTopics: [
      "HESI Specialty RN Exam",
      "Fundamentals of nursing",
      "Basic nursing skills",
      "Test-taking strategies"
    ],
    classMeeting: "Monday 23 Jun 14:00-16:00 (On-campus)",
    note: "Bring student ID. Arrive 15 minutes early.",
    assignments: [
      {
        id: "foundations-quiz-submission",
        title: "Quiz 3: Foundations of Nursing (50 points)",
        dueDate: "2025-06-23",
        platform: "canvas"
      },
      {
        id: "hesi-fundamentals-exam",
        title: "HESI Specialty RN Exam: Fundamentals",
        dueDate: "2025-06-23",
        platform: "hesi"
      },
      {
        id: "fundamentals-reflection",
        title: "Post-HESI Reflection",
        dueDate: "2025-06-23",
        platform: "canvas"
      }
    ]
  },
  
  // Week 9 - Pharmacology Concepts
  "9": {
    title: "Pharmacology Concepts",
    week: 9,
    chapters: "Medication administration, pharmacokinetics, drug classifications",
    keyTopics: [
      "Medication administration principles",
      "Common drug classifications",
      "Pharmacokinetics",
      "Medication calculation"
    ],
    classMeeting: "Monday 30 Jun 14:00-17:00 (Zoom)",
    assignments: [
      {
        id: "pharmacology-quiz",
        title: "Pharmacology Quiz",
        dueDate: "2025-07-07",
        platform: "canvas"
      },
      {
        id: "fundamentals-remediation-templates",
        title: "Fundamentals Remediation Templates",
        dueDate: "2025-07-07",
        platform: "canvas"
      },
      {
        id: "fundamentals-case-studies",
        title: "Fundamentals Case Studies",
        dueDate: "2025-07-07",
        platform: "canvas"
      }
    ]
  },
  
  // Week 10 - Mental Health
  "10": {
    title: "Mental Health",
    week: 10,
    chapters: "Mental health disorders, therapeutic communication, crisis intervention",
    keyTopics: [
      "Common mental health disorders",
      "Therapeutic communication",
      "Crisis intervention",
      "Psychopharmacology"
    ],
    classMeeting: "Monday 7 Jul 14:00-17:00 (Zoom)",
    assignments: [
      {
        id: "mental-health-quiz",
        title: "Quiz 4: Mental Health Concepts (35 points)",
        dueDate: "2025-07-14",
        platform: "canvas"
      },
      {
        id: "hesi-mental-health-prep",
        title: "HESI Exam Prep: 50 Practice Questions",
        dueDate: "2025-07-14",
        platform: "canvas"
      }
    ]
  },
  
  // Week 11 - HESI Mental Health
  "11": {
    type: "exam",
    title: "HESI Mental Health Exam",
    week: 11,
    chapters: "Mental health nursing concepts",
    keyTopics: [
      "HESI Specialty RN Exam",
      "Mental health disorders",
      "Psychiatric nursing",
      "Test-taking strategies"
    ],
    classMeeting: "Monday 14 Jul 14:00-16:00 (On-campus)",
    note: "Bring student ID. Arrive 15 minutes early.",
    assignments: [
      {
        id: "mental-health-quiz-submission",
        title: "Quiz 4: Mental Health Concepts (35 points)",
        dueDate: "2025-07-14",
        platform: "canvas"
      },
      {
        id: "hesi-mental-health-exam",
        title: "HESI Specialty RN Exam: Mental Health",
        dueDate: "2025-07-14",
        platform: "hesi"
      },
      {
        id: "mental-health-reflection",
        title: "Post-HESI Reflection",
        dueDate: "2025-07-14",
        platform: "canvas"
      }
    ]
  },
  
  // Week 12 - HESI Pathophysiology
  "12": {
    type: "exam",
    title: "HESI Pathophysiology Exam",
    week: 12,
    chapters: "Disease processes, pathophysiological concepts",
    keyTopics: [
      "HESI Specialty RN Exam",
      "Pathophysiology",
      "Disease processes",
      "Test-taking strategies"
    ],
    classMeeting: "Monday 21 Jul 14:00-16:00 (On-campus)",
    note: "Bring student ID. Arrive 15 minutes early.",
    assignments: [
      {
        id: "maternal-child-quiz",
        title: "Quiz 5: Maternal and Child Nursing Concepts (40 points)",
        dueDate: "2025-07-21",
        platform: "canvas"
      },
      {
        id: "hesi-pathophysiology-exam",
        title: "HESI Specialty RN Exam: Pathophysiology",
        dueDate: "2025-07-21",
        platform: "hesi"
      },
      {
        id: "pathophysiology-reflection",
        title: "Post-HESI Reflection",
        dueDate: "2025-07-21",
        platform: "canvas"
      }
    ]
  },
  
  // Week 13 - Mid-HESI Review
  "13": {
    type: "review",
    title: "Mid-HESI Review",
    week: 13,
    chapters: "Comprehensive content review",
    keyTopics: [
      "NCLEX-style question strategies",
      "Content review from all modules",
      "Test-taking strategies",
      "Critical thinking skills"
    ],
    classMeeting: "Monday 28 Jul 14:00-17:00 (Zoom)",
    note: "Comprehensive review session. Bring questions from previous exams.",
    assignments: [
      {
        id: "mental-health-remediation-templates",
        title: "Mental Health Remediation Templates",
        dueDate: "2025-07-28",
        platform: "canvas"
      },
      {
        id: "mental-health-case-studies",
        title: "Mental Health Case Studies",
        dueDate: "2025-07-28",
        platform: "canvas"
      },
      {
        id: "simulation-skills-remediation",
        title: "Simulation Skills Remediation",
        dueDate: "2025-07-31",
        platform: "canvas"
      }
    ]
  },
  
  // Week 14 - Mid-HESI Final
  "14": {
    type: "exam",
    title: "Mid-HESI Final Exam",
    week: 14,
    chapters: "Comprehensive nursing content",
    keyTopics: [
      "Comprehensive final exam",
      "All nursing content areas",
      "Critical thinking",
      "Clinical judgment"
    ],
    classMeeting: "Thursday 7 Aug 10:00-13:00 (On-campus)",
    note: "This is a comprehensive final exam covering all content areas. Bring student ID. Arrive 30 minutes early.",
    assignments: [
      {
        id: "adult-health-quiz",
        title: "Quiz 6: Adult Health I Concepts (32 points)",
        dueDate: "2025-08-07",
        platform: "canvas"
      },
      {
        id: "mid-hesi-final",
        title: "Mid-HESI Final Exam",
        dueDate: "2025-08-07",
        platform: "hesi"
      },
      {
        id: "pathophysiology-remediation-templates",
        title: "Pathophysiology Remediation Templates",
        dueDate: "2025-08-04",
        platform: "canvas"
      },
      {
        id: "pathophysiology-case-studies",
        title: "Pathophysiology Case Studies",
        dueDate: "2025-08-04",
        platform: "canvas"
      }
    ]
  }
};

export { nclexModuleMap, nclexEventColors, nclexEvents, nclexModuleContent };