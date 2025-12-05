// ========== ADULT HEALTH COURSE DATA ==========
import { commonEventColors } from '../config.js';

// Adult Health Module to Week Mapping
const adultHealthModuleMap = {
  1: ['module-adulthealth-content-1'],                     // Week 1: Cardiology
  2: ['module-adulthealth-content-2'],                     // Week 2: Neurology, Sensory, Hematology
  3: ['module-adulthealth-exam-3'],                        // Week 3: Exam 1
  4: ['module-adulthealth-content-4'],                     // Week 4: Fluids and URI
  5: ['module-adulthealth-content-5'],                     // Week 5: Electrolytes
  6: ['module-adulthealth-exam-6'],                        // Week 6: Exam 2
  7: ['module-adulthealth-content-7'],                     // Week 7: Immune
  8: ['module-adulthealth-content-8'],                     // Week 8: Operative and Integumentary I
  9: ['module-adulthealth-content-9'],                     // Week 9: Integumentary II and Diabetes
  10: ['module-adulthealth-exam-10'],                      // Week 10: Exam 3
  11: ['module-adulthealth-content-11'],                   // Week 11: GU and Musculoskeletal I
  12: ['module-adulthealth-content-12'],                   // Week 12: Musculoskeletal II and GI
  13: ['module-adulthealth-exam-13'],                      // Week 13: Exam 4
  14: ['module-adulthealth-exam-14']                       // Week 14: Final Exam
};

// Adult Health-specific color overrides
const adultHealthEventColors = {
  ...commonEventColors,
  // Any Adult Health specific color overrides would go here
};

// Adult Health Events
const adultHealthEvents = [
  // Adult Health lectures (Wednesdays 9:05-12:10)
  { title: 'Adult Health Lecture', start: '2025-05-07T09:05', end: '2025-05-07T12:10', group: 'lecture', course: 'adulthealth', week: 1,
    details: 'Module 1: Cardiology - Introduction to heart anatomy, physiology, and common cardiac disorders.' },
  
  { title: 'Adult Health Lecture', start: '2025-05-14T09:05', end: '2025-05-14T12:10', group: 'lecture', course: 'adulthealth', week: 2,
    details: 'Module 2: Neurology/Sensory/Hematology - Neurological assessment, blood disorders, and sensory function.' },
  
  { title: 'Adult Health Exam 1', start: '2025-05-21T09:05', end: '2025-05-21T11:05', group: 'exam', course: 'adulthealth', week: 3,
    details: 'Exam 1 covering Modules 1-2 (Cardiology, Neurology/Sensory/Hematology). Bring student ID and pencil.' },
  
  { title: 'Adult Health Lecture', start: '2025-05-28T09:05', end: '2025-05-28T12:10', group: 'lecture', course: 'adulthealth', week: 4,
    details: 'Module 4: Fluids & Upper Respiratory Infections - Fluid balance, respiratory assessment techniques, URI management.' },
  
  { title: 'Adult Health Lecture', start: '2025-06-04T09:05', end: '2025-06-04T12:10', group: 'lecture', course: 'adulthealth', week: 5,
    details: 'Module 5: Electrolytes - Electrolyte imbalances, assessment techniques, and management strategies.' },
  
  { title: 'Adult Health Exam 2', start: '2025-06-11T09:05', end: '2025-06-11T11:05', group: 'exam', course: 'adulthealth', week: 6,
    details: 'Exam 2 covering Modules 4-5 (Fluids & URI, Electrolytes). Bring student ID and pencil.' },
  
  { title: 'Adult Health Lecture', start: '2025-06-18T09:05', end: '2025-06-18T12:10', group: 'lecture', course: 'adulthealth', week: 7,
    details: 'Module 7: Immune - Immune system disorders, assessment and management of immunocompromised patients.' },
  
  { title: 'Adult Health Lecture', start: '2025-06-25T09:05', end: '2025-06-25T12:10', group: 'lecture', course: 'adulthealth', week: 8,
    details: 'Module 8: Operative + Integumentary I - Pre/post-operative care and introduction to skin disorders.' },
  
  { title: 'Adult Health Lecture', start: '2025-07-02T09:05', end: '2025-07-02T12:10', group: 'lecture', course: 'adulthealth', week: 9,
    details: 'Module 9: Integumentary II & Diabetes - Advanced wound care, burn management, and diabetic care.' },
  
  { title: 'Adult Health Exam 3', start: '2025-07-09T09:05', end: '2025-07-09T11:05', group: 'exam', course: 'adulthealth', week: 10,
    details: 'Exam 3 covering Modules 7-9 (Immune, Operative, Integumentary, Diabetes). Bring student ID and pencil.' },
  
  { title: 'Adult Health Lecture', start: '2025-07-16T09:05', end: '2025-07-16T12:10', group: 'lecture', course: 'adulthealth', week: 11,
    details: 'Module 11: GU & Musculoskeletal I - Urinary disorders, fractures, and joint disorders.' },
  
  { title: 'Adult Health Lecture', start: '2025-07-23T09:05', end: '2025-07-23T12:10', group: 'lecture', course: 'adulthealth', week: 12,
    details: 'Module 12: Musculoskeletal II & GI - Advanced orthopedic care and gastrointestinal disorders.' },
  
  { title: 'Adult Health Exam 4', start: '2025-07-30T09:05', end: '2025-07-30T11:05', group: 'exam', course: 'adulthealth', week: 13,
    details: 'Exam 4 covering Modules 11-12 (GU, Musculoskeletal, GI). Bring student ID and pencil.' },
  
  { title: 'Adult Health Final', start: '2025-08-06T09:05', end: '2025-08-06T12:05', group: 'exam', course: 'adulthealth', week: 14,
    details: 'Comprehensive Final Exam covering all modules. Bring student ID and pencil.' },

  // Clinical days (Thursdays 6am-4pm)
  { title: 'Adult Health Clinical', start: '2025-05-08T06:00', end: '2025-05-08T16:00', group: 'clinical', course: 'adulthealth',
    details: 'Adult Health Clinical Day - Location: AdventHealth Hospital. Arrive in proper uniform with all supplies.' },
  
  { title: 'Adult Health Clinical', start: '2025-05-15T06:00', end: '2025-05-15T16:00', group: 'clinical', course: 'adulthealth',
    details: 'Adult Health Clinical Day - Location: AdventHealth Hospital. Arrive in proper uniform with all supplies.' },
  
  { title: 'Adult Health Clinical', start: '2025-05-22T06:00', end: '2025-05-22T16:00', group: 'clinical', course: 'adulthealth',
    details: 'Adult Health Clinical Day - Location: AdventHealth Hospital. Arrive in proper uniform with all supplies.' },
  
  { title: 'Adult Health Clinical', start: '2025-05-29T06:00', end: '2025-05-29T16:00', group: 'clinical', course: 'adulthealth',
    details: 'Adult Health Clinical Day - Location: AdventHealth Hospital. Arrive in proper uniform with all supplies.' },
  
  { title: 'Adult Health Clinical', start: '2025-06-05T06:00', end: '2025-06-05T16:00', group: 'clinical', course: 'adulthealth',
    details: 'Adult Health Clinical Day - Location: AdventHealth Hospital. Arrive in proper uniform with all supplies.' },
  
  { title: 'Adult Health Clinical', start: '2025-06-12T06:00', end: '2025-06-12T16:00', group: 'clinical', course: 'adulthealth',
    details: 'Adult Health Clinical Day - Location: AdventHealth Hospital. Arrive in proper uniform with all supplies.' },
  
  // No clinical on June 19 (Juneteenth)
  
  { title: 'Adult Health Clinical', start: '2025-06-26T06:00', end: '2025-06-26T16:00', group: 'clinical', course: 'adulthealth',
    details: 'Adult Health Clinical Day - Location: AdventHealth Hospital. Arrive in proper uniform with all supplies.' },
  
  // No clinical on July 3 (Independence Day weekend)
  
  { title: 'Adult Health Clinical', start: '2025-07-10T06:00', end: '2025-07-10T16:00', group: 'clinical', course: 'adulthealth',
    details: 'Adult Health Clinical Day - Location: AdventHealth Hospital. Arrive in proper uniform with all supplies.' },
  
  { title: 'Adult Health Clinical', start: '2025-07-17T06:00', end: '2025-07-17T16:00', group: 'clinical', course: 'adulthealth',
    details: 'Adult Health Clinical Day - Location: AdventHealth Hospital. Arrive in proper uniform with all supplies.' },
  
  { title: 'Adult Health Clinical', start: '2025-07-24T06:00', end: '2025-07-24T16:00', group: 'clinical', course: 'adulthealth',
    details: 'Adult Health Clinical Day - Location: AdventHealth Hospital. Arrive in proper uniform with all supplies.' },
  
  { title: 'Adult Health Clinical', start: '2025-07-31T06:00', end: '2025-07-31T16:00', group: 'clinical', course: 'adulthealth',
    details: 'Adult Health Clinical Day - Location: AdventHealth Hospital. Arrive in proper uniform with all supplies.' },
  
  { title: 'Adult Health Clinical', start: '2025-08-07T06:00', end: '2025-08-07T16:00', group: 'clinical', course: 'adulthealth',
    details: 'Adult Health Clinical Day - Location: AdventHealth Hospital. Arrive in proper uniform with all supplies.' },

  // Assignment due dates
  { title: 'Dosage Calculation Quiz Due', start: '2025-05-07T17:00', end: '2025-05-07T17:30', group: 'prep', course: 'adulthealth', week: 1,
    details: 'Required pre-course assessment. Must score 90% to pass.' },
  
  { title: 'Cardiology Quiz Due', start: '2025-05-14T08:45', end: '2025-05-14T09:15', group: 'prep', course: 'adulthealth', week: 2,
    details: 'Module 1 quiz worth 11 points.' },
  
  { title: 'Hematology Quiz Due', start: '2025-05-14T08:45', end: '2025-05-14T09:15', group: 'prep', course: 'adulthealth', week: 2,
    details: 'Module 2 quiz worth 5 points.' },
  
  { title: 'HESI Remediation Due', start: '2025-05-23T17:00', end: '2025-05-23T17:30', group: 'prep', course: 'adulthealth', week: 3,
    details: 'Foundations HESI Remediation assignment worth 100 points.' },
  
  { title: 'Fluids Quiz Due', start: '2025-05-28T08:45', end: '2025-05-28T09:15', group: 'prep', course: 'adulthealth', week: 4,
    details: 'Module 4 quiz worth 15 points.' },
  
  { title: 'Electrolytes Quiz Due', start: '2025-06-04T08:45', end: '2025-06-04T09:15', group: 'prep', course: 'adulthealth', week: 5,
    details: 'Module 5 quiz worth 8 points.' },
  
  { title: 'Immune Quiz Due', start: '2025-06-18T08:45', end: '2025-06-18T09:15', group: 'prep', course: 'adulthealth', week: 7,
    details: 'Module 7 quiz worth 14 points.' },
  
  { title: 'Operative Quiz Due', start: '2025-06-25T08:45', end: '2025-06-25T09:15', group: 'prep', course: 'adulthealth', week: 8,
    details: 'Module 8 quiz worth 10 points.' },
  
  { title: 'Integumentary Quiz Due', start: '2025-07-02T08:45', end: '2025-07-02T09:15', group: 'prep', course: 'adulthealth', week: 9,
    details: 'Module 9 (Part 1) quiz worth 5 points.' },
  
  { title: 'Diabetes Quiz Due', start: '2025-07-02T08:45', end: '2025-07-02T09:15', group: 'prep', course: 'adulthealth', week: 9,
    details: 'Module 9 (Part 2) quiz worth 11 points.' },
  
  { title: 'Genitourinary Quiz Due', start: '2025-07-16T08:45', end: '2025-07-16T09:15', group: 'prep', course: 'adulthealth', week: 11,
    details: 'Module 11 (Part 1) quiz worth 11 points.' },
  
  { title: 'Musculoskeletal Quiz Due', start: '2025-07-23T08:45', end: '2025-07-23T09:15', group: 'prep', course: 'adulthealth', week: 12,
    details: 'Module 12 (Part 1) quiz worth 10 points.' },
  
  { title: 'Gastrointestinal Quiz Due', start: '2025-07-23T08:45', end: '2025-07-23T09:15', group: 'prep', course: 'adulthealth', week: 12,
    details: 'Module 12 (Part 2) quiz worth 12 points.' },

  // vSim assignments
  { title: 'vSim: Lloyd Bennett Due', start: '2025-05-20T23:59', end: '2025-05-21T00:30', group: 'drill', course: 'adulthealth', week: 3,
    details: 'Virtual simulation: Surgical Scenario 5 (Hematology). Must score 80% on simulation and SBAR report.' },
  
  { title: 'vSim: Skylar Hansen Due', start: '2025-07-08T23:59', end: '2025-07-09T00:30', group: 'drill', course: 'adulthealth', week: 10,
    details: 'Virtual simulation: Medical Scenario 5 (Diabetes). Must score 80% on simulation and SBAR report.' },
  
  { title: 'vSim: Marilyn Hughes Due', start: '2025-07-22T23:59', end: '2025-07-23T00:30', group: 'drill', course: 'adulthealth', week: 12,
    details: 'Virtual simulation: Surgical Scenario 1 (Musculoskeletal). Must score 80% on simulation and SBAR report.' },
  
  { title: 'vSim: Stan Checketts Due', start: '2025-07-29T23:59', end: '2025-07-30T00:30', group: 'drill', course: 'adulthealth', week: 13,
    details: 'Virtual simulation: GI scenario. Must score 80% on simulation and SBAR report.' },

  // CoursePoint assignments
  { title: 'CoursePoint: Cardiology Modules Due', start: '2025-05-13T23:59', end: '2025-05-14T00:30', group: 'prep', course: 'adulthealth', week: 2,
    details: 'Complete Practice and Learn: Angina, COPD and Peripheral Vascular Disease, Coronary Artery Disease.' },
  
  { title: 'CoursePoint: Fluid & Electrolytes Due', start: '2025-06-10T23:59', end: '2025-06-11T00:30', group: 'prep', course: 'adulthealth', week: 6,
    details: 'Complete Practice and Learn: Fluid and Electrolytes Imbalance.' },
  
  { title: 'CoursePoint: Operative Care Due', start: '2025-06-24T23:59', end: '2025-06-25T00:30', group: 'prep', course: 'adulthealth', week: 8,
    details: 'Complete Practice and Learn: Teaching Coughing and Splinting.' },
  
  { title: 'CoursePoint: Diabetes & Wound Due', start: '2025-07-01T23:59', end: '2025-07-02T00:30', group: 'prep', course: 'adulthealth', week: 9,
    details: 'Complete Practice and Learn: Diabetes and Wounds modules. Complete One Minute Nurse: Diabetes mellitus insulin.' },
  
  { title: 'CoursePoint: GU & MSK Due', start: '2025-07-15T23:59', end: '2025-07-16T00:30', group: 'prep', course: 'adulthealth', week: 11,
    details: 'Complete Practice and Learn: Fractures and Lower Urinary Tract Infection. Complete One-Minute Nurse: UTI.' },
  
  { title: 'CoursePoint: GI Due', start: '2025-07-22T23:59', end: '2025-07-23T00:30', group: 'prep', course: 'adulthealth', week: 12,
    details: 'Complete Practice and Learn: Nursing Process: The Patient with PUD and Preventing Complications of Enternal Feeding.' },

  // Critical Skills demonstration
  { title: 'Critical Skills Demo Deadline', start: '2025-07-25T12:00', end: '2025-07-25T12:30', group: 'exam', course: 'adulthealth', week: 12,
    details: 'Handwashing and Manual Vital Signs must be successfully demonstrated by Friday of week 12 by noon EST. Failure results in course incomplete.' }
];  // <-- existing events array ends with this bracket & semicolon

/* ---------- PREP-WORK HELPER ---------- */
function addPrepWork({ wk, dateISO, txt }) {
  // ❶ calendar block
  adultHealthEvents.push({
    title:  `Prep: ${txt}`,
    start:  `${dateISO}T18:00`,
    end:    `${dateISO}T21:00`,
    group:  'prep',
    course: 'adulthealth',
    week:   wk,
    details:'Complete watch / read / engage items before class.'
  });

  // ❷ checklist item (first in assignments array)
  adultHealthModuleContent[wk].assignments.unshift({
    id:      `prep-${wk}`,
    title:   `Prep work – ${txt}`,
    dueDate: dateISO,
    platform:'canvas'
  });
}
/* ---------- END HELPER ---------- */
// Module descriptions and content
const adultHealthModuleContent = {
  // Week 1 - Cardiology
  "1": {
    title: "Cardiology",
    week: 1,
    chapters: "Cardiovascular assessment, cardiac disorders, ECG basics",
    keyTopics: [
      "Introduction to Adult Health Nursing",
      "Cardiovascular System",
      "Common Cardiac Disorders",
      "ECG Interpretation Basics"
    ],
    classMeeting: "Wed 7 May 09:05-12:10 (CC 226/227)",
    assignments: [
      { id: "cardiology-quiz", title: "In-class Quiz (11 pts)", dueDate: "2025-05-14", platform: "canvas" },
      { id: "prepare-class-cardio", title: "Prepare for Class Quiz", dueDate: "2025-05-06", platform: "canvas" },
      { id: "coursepoint-angina", title: "Practice & Learn: Angina", dueDate: "2025-05-13", platform: "coursepoint" },
      { id: "coursepoint-copd-pvd", title: "Practice and Learn: COPD and PVD", dueDate: "2025-05-13", platform: "coursepoint" },
      { id: "coursepoint-cad", title: "Practice and Learn: CAD", dueDate: "2025-05-13", platform: "coursepoint" }
    ]
  },
  
  // Week 2 - Neuro/Sensory/Hematology
  "2": {
    title: "Neurology, Sensory, and Hematology",
    week: 2,
    chapters: "Neurological assessment, sensory function, blood disorders",
    keyTopics: [
      "Neurological Assessment",
      "Common Neurological Disorders",
      "Sensory System Overview",
      "Hematological Disorders"
    ],
    classMeeting: "Wed 14 May 09:05-12:10 (CC 226/227)",
    assignments: [
      { id: "hematology-quiz", title: "In-class Quiz (5 pts)", dueDate: "2025-05-14", platform: "canvas" },
      { id: "prepare-class-neuro", title: "Prepare for Class Quiz", dueDate: "2025-05-13", platform: "canvas" },
      { id: "vsim-lloyd-bennett", title: "vSim: Lloyd Bennett (Hematology)", dueDate: "2025-05-20", platform: "coursepoint" }
    ],
    clinicalFocus: "First clinical day – Thu 8 May, 06:00-16:00"
  },
  
  // Week 3 - Exam 1 + Foundations HESI Remediation
  "3": {
    type: "exam",
    title: "Exam 1 + Foundations HESI Remediation",
    week: 3,
    chapters: "Cardiology, Neuro/Sensory, Hematology",
    keyTopics: [
      "Exam 1 (Modules 1-2)",
      "Cardiology",
      "Neuro/Sensory",
      "Hematology"
    ],
    classMeeting: "Wed 21 May 09:05-12:10 (CC 226/227) – EXAM DAY",
    note: "Bring #2 pencils and student ID",
    assignments: [
      { id: "adulthealth-exam1", title: "Exam 1 (50 pts)", dueDate: "2025-05-21", platform: "canvas" },
      { id: "hesi-remediation", title: "Foundations HESI Remediation Dropbox", dueDate: "2025-05-23", platform: "canvas" }
    ],
    clinicalFocus: "Thu 22 May, 06:00-16:00"
  },
  
  // Week 4 - Fluids & URI
  "4": {
    title: "Fluids & URI",
    week: 4,
    chapters: "Fluid balance, respiratory assessment, URI management",
    keyTopics: [
      "Fluid Balance & Imbalances",
      "IV Therapy",
      "Upper Respiratory Disorders",
      "Oxygenation Therapies"
    ],
    classMeeting: "Wed 28 May 09:05-12:10 (CC 226/227)",
    assignments: [
      { id: "fluids-quiz", title: "Fluids Quiz (15 pts)", dueDate: "2025-05-28", platform: "canvas" },
      { id: "prepare-class-fluids", title: "Prepare for Class Quiz", dueDate: "2025-05-27", platform: "canvas" },
      { id: "coursepoint-fluid-electrolytes", title: "Practice and Learn: Fluid and Electrolytes Imbalance", dueDate: "2025-06-10", platform: "coursepoint" }
    ],
    clinicalFocus: "Thu 29 May, 06:00-16:00"
  },
  
  // Week 5 - Electrolytes
  "5": {
    title: "Electrolytes",
    week: 5,
    chapters: "Electrolyte imbalances, assessment, management strategies",
    keyTopics: [
      "Electrolyte Balance",
      "Acid-Base Balance",
      "Blood Gas Interpretation",
      "Case Studies: Electrolyte Imbalances"
    ],
    classMeeting: "Wed 4 Jun 09:05-12:10 (CC 226/227)",
    assignments: [
      { id: "electrolytes-quiz", title: "Electrolytes Quiz (8 pts)", dueDate: "2025-06-04", platform: "canvas" },
      { id: "prepare-class-electrolytes", title: "Prepare for Class Quiz", dueDate: "2025-06-03", platform: "canvas" }
    ],
    clinicalFocus: "Thu 5 Jun, 06:00-16:00"
  },
  
  // Week 6 - Exam 2
  "6": {
    type: "exam",
    title: "Exam 2",
    week: 6,
    chapters: "Fluids, Upper Respiratory, Electrolytes",
    keyTopics: [
      "Exam 2 (Modules 4-5)",
      "Fluids",
      "Upper Respiratory",
      "Electrolytes"
    ],
    classMeeting: "Wed 11 Jun 09:05-12:10 (CC 226/227) – EXAM DAY",
    note: "Bring #2 pencils and student ID",
    assignments: [
      { id: "adulthealth-exam2", title: "Exam 2 (50 pts)", dueDate: "2025-06-11", platform: "canvas" }
    ],
    clinicalFocus: "Thu 12 Jun, 06:00-16:00"
  },
  
  // Week 7 - Immune
  "7": {
    title: "Immune",
    week: 7,
    chapters: "Immune system disorders, assessment, management strategies",
    keyTopics: [
      "Immune System Function",
      "Hypersensitivity Reactions",
      "Common Immune Disorders",
      "Immunosuppressive Therapies"
    ],
    classMeeting: "Wed 18 Jun 09:05-12:10 (CC 226/227)",
    assignments: [
      { id: "immune-quiz", title: "Immune Quiz (14 pts)", dueDate: "2025-06-18", platform: "canvas" },
      { id: "prepare-class-immune", title: "Prepare for Class Quiz", dueDate: "2025-06-17", platform: "canvas" }
    ],
    note: "No clinical on Thu 19 Jun (Juneteenth)"
  },
  
  // Week 8 - Operative and Integumentary I
  "8": {
    title: "Operative & Integumentary I",
    week: 8,
    chapters: "Pre/post-operative care, skin disorders",
    keyTopics: [
      "Perioperative Nursing Care",
      "Surgical Risk Assessment",
      "Integumentary System Overview",
      "Pressure Injuries"
    ],
    classMeeting: "Wed 25 Jun 09:05-12:10 (CC 226/227)",
    assignments: [
      { id: "operative-quiz", title: "Operative Quiz (10 pts)", dueDate: "2025-06-25", platform: "canvas" },
      { id: "prepare-class-operative", title: "Prepare for Class Quiz", dueDate: "2025-06-24", platform: "canvas" },
      { id: "coursepoint-coughing-splinting", title: "Practice and Learn: Teaching Coughing and Splinting", dueDate: "2025-06-24", platform: "coursepoint" }
    ],
    clinicalFocus: "Thu 26 Jun, 06:00-16:00"
  },
  
  // Week 9 - Integumentary II and Diabetes
  "9": {
    title: "Integumentary II & Diabetes",
    week: 9,
    chapters: "Advanced wound care, burn management, diabetic care",
    keyTopics: [
      "Burns",
      "Wound Care Management",
      "Diabetes Mellitus",
      "Glycemic Management"
    ],
    classMeeting: "Wed 2 Jul 09:05-12:10 (CC 226/227)",
    assignments: [
      { id: "integumentary-quiz", title: "Integumentary Quiz (5 pts)", dueDate: "2025-07-02", platform: "canvas" },
      { id: "diabetes-quiz", title: "Diabetes Quiz (11 pts)", dueDate: "2025-07-02", platform: "canvas" },
      { id: "prepare-class-diabetes", title: "Prepare for Class Quiz", dueDate: "2025-07-01", platform: "canvas" },
      { id: "coursepoint-diabetes", title: "One Minute Nurse: Diabetes mellitus insulin", dueDate: "2025-07-01", platform: "coursepoint" },
      { id: "coursepoint-wounds", title: "Practice and Learn: Wounds", dueDate: "2025-07-01", platform: "coursepoint" },
      { id: "vsim-skylar-hansen", title: "vSim: Skylar Hansen (Diabetes)", dueDate: "2025-07-08", platform: "coursepoint" }
    ],
    note: "No clinical on Fri 4 Jul (Independence Day)"
  },
  
  // Week 10 - Exam 3
  "10": {
    type: "exam",
    title: "Exam 3",
    week: 10,
    chapters: "Immune, Operative, Integumentary, Diabetes",
    keyTopics: [
      "Exam 3 (Modules 7-9)",
      "Immune",
      "Operative",
      "Integumentary",
      "Diabetes"
    ],
    classMeeting: "Wed 9 Jul 09:05-12:10 (CC 226/227) – EXAM DAY",
    note: "Bring #2 pencils and student ID",
    assignments: [
      { id: "adulthealth-exam3", title: "Exam 3 (50 pts)", dueDate: "2025-07-09", platform: "canvas" }
    ],
    clinicalFocus: "Thu 10 Jul, 06:00-16:00"
  },
  
  // Week 11 - GU and Musculoskeletal I
  "11": {
    title: "GU & Musculoskeletal I",
    week: 11,
    chapters: "Urinary disorders, fractures, joint disorders",
    keyTopics: [
      "Genitourinary System Overview",
      "Common GU Disorders",
      "Musculoskeletal System",
      "Common MSK Conditions"
    ],
    classMeeting: "Wed 16 Jul 09:05-12:10 (CC 226/227)",
    assignments: [
      { id: "genitourinary-quiz", title: "GU Quiz (11 pts)", dueDate: "2025-07-16", platform: "canvas" },
      { id: "prepare-class-gu", title: "Prepare for Class Quiz", dueDate: "2025-07-15", platform: "canvas" },
      { id: "coursepoint-uti", title: "One-Minute Nurse: UTI", dueDate: "2025-07-15", platform: "coursepoint" },
      { id: "coursepoint-fractures", title: "Practice and Learn: Fractures", dueDate: "2025-07-15", platform: "coursepoint" },
      { id: "coursepoint-uti-treatment", title: "Practice and Learn: Lower Urinary Tract Infection", dueDate: "2025-07-15", platform: "coursepoint" },
      { id: "vsim-marilyn-hughes", title: "vSim: Marilyn Hughes (Musculoskeletal)", dueDate: "2025-07-22", platform: "coursepoint" }
    ],
    clinicalFocus: "Thu 17 Jul, 06:00-16:00"
  },
  
  // Week 12 - Musculoskeletal II and GI
  "12": {
    title: "Musculoskeletal II & GI",
    week: 12,
    chapters: "Advanced orthopedic care, gastrointestinal disorders",
    keyTopics: [
      "Orthopedic Traumas",
      "Traction & Immobilization Devices",
      "Gastrointestinal System",
      "Common GI Disorders"
    ],
    classMeeting: "Wed 23 Jul 09:05-12:10 (CC 226/227)",
    assignments: [
      { id: "musculoskeletal-quiz", title: "MSK Quiz (10 pts)", dueDate: "2025-07-23", platform: "canvas" },
      { id: "gastrointestinal-quiz", title: "GI Quiz (12 pts)", dueDate: "2025-07-23", platform: "canvas" },
      { id: "prepare-class-gi", title: "Prepare for Class Quiz", dueDate: "2025-07-22", platform: "canvas" },
      { id: "coursepoint-pud", title: "Practice and Learn: Nursing Process: The Patient with PUD", dueDate: "2025-07-22", platform: "coursepoint" },
      { id: "coursepoint-enternal-feeding", title: "Practice and Learn: Preventing Complications of Enternal Feeding", dueDate: "2025-07-22", platform: "coursepoint" },
      { id: "vsim-stan-checketts", title: "vSim: Stan Checketts (GI)", dueDate: "2025-07-29", platform: "coursepoint" },
      { id: "critical-skills-demo", title: "Critical Skills Demonstration", dueDate: "2025-07-25", platform: "canvas" }
    ],
    note: "Critical Skills Demo (Handwashing and Manual Vital Signs) must be completed by July 25 at noon. Failure to complete will result in course incomplete.",
    clinicalFocus: "Thu 24 Jul, 06:00-16:00"
  },
  
  // Week 13 - Exam 4
  "13": {
    type: "exam",
    title: "Exam 4",
    week: 13,
    chapters: "GU, Musculoskeletal, GI",
    keyTopics: [
      "Exam 4 (Modules 11-12)",
      "GU",
      "Musculoskeletal",
      "GI"
    ],
    classMeeting: "Wed 30 Jul 09:05-12:10 (CC 226/227) – EXAM DAY",
    note: "Bring #2 pencils and student ID",
    assignments: [
      { id: "adulthealth-exam4", title: "Exam 4 (50 pts)", dueDate: "2025-07-30", platform: "canvas" }
    ],
    clinicalFocus: "Thu 31 Jul, 06:00-16:00 (Last clinical day)"
  },
  
  // Week 14 - Final Exam
  "14": {
    type: "exam",
    title: "Final Exam",
    week: 14,
    chapters: "Comprehensive final covering all course content",
    keyTopics: [
      "Comprehensive Final Exam",
      "Covers all modules from the entire course"
    ],
    classMeeting: "Wed 6 Aug 09:05-12:10 (CC 226/227) – FINAL EXAM",
    note: "Bring #2 pencils and student ID. No notes, calculators, or electronic devices allowed.",
    assignments: [
      { id: "adulthealth-final", title: "Comprehensive Final (100 pts)", dueDate: "2025-08-06", platform: "canvas" }
    ],
    clinicalFocus: "Thu 7 Aug, 06:00-16:00 (Make-up day if needed)"
  }
};  // <-- this is the closing brace of adultHealthModuleContent

/* ---------- ADD PREP-WORK CALLS ---------- */
[
  { wk:1,  date:'2025-05-05', txt:'Cardiology video • reading • cases' },
  { wk:2,  date:'2025-05-12', txt:'Neuro & Heme videos • reading • skill sheets' },
  { wk:4,  date:'2025-05-26', txt:'Fluids/URI videos • Edema concept • cases' },
  { wk:5,  date:'2025-06-02', txt:'Electrolytes video • tutorial • cases' },
  { wk:7,  date:'2025-06-16', txt:'Immune video • reading • exercise' },
  { wk:8,  date:'2025-06-23', txt:'Operative & Integ I video • reading • cases' },
  { wk:9,  date:'2025-06-30', txt:'Integ II & Diabetes video • reading • cases' },
  { wk:11, date:'2025-07-14', txt:'GU & MSK I video • reading • exercises' },
  { wk:12, date:'2025-07-21', txt:'MSK II & GI video • reading • cases' }
].forEach(addPrepWork);
/* ---------- END PREP-WORK CALLS ---------- */
export { adultHealthModuleMap, adultHealthEventColors, adultHealthEvents, adultHealthModuleContent };










