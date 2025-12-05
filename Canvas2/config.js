// ========== SHARED CONFIGURATION ==========

// Common event colors shared across all courses
const commonEventColors = {
  lecture: '#3788d8',    // Standard lectures (blue)
  clinical: '#20c997',   // Clinical activities (teal)
  exam: '#dc3545',       // Exams (red)
  drill: '#fd7e14',      // Practice questions (orange)
  prep: '#6f42c1',       // Preparation work (purple)
  remediation: '#e83e8c',// Remediation activities (pink)
  review: '#6c757d',     // Review sessions (gray)
  admin: '#adb5bd',      // Administrative events (light gray)
  plan: '#a97c50',       // Planning activities (brown)
  project: '#17a2b8'     // Project work (light blue)
};

// Platform URLs for assignments
const platformUrls = {
  'canvas': {
    'obgyn': 'https://ahu.instructure.com/courses/12345',
    'adulthealth': 'https://ahu.instructure.com/courses/23456',
    'nclex': 'https://ahu.instructure.com/courses/34567',
    'geronto': 'https://ahu.instructure.com/courses/nurs315'
  },
  'sherpath': 'https://sherpath.elsevier.com/#/course-plan',
  'coursepoint': {
    'obgyn': 'https://thepoint.lww.com/Course/123456',
    'adulthealth': 'https://phoenix-ccm.thepoint.lww.com/courses/g1M5RZEE5A592/assignments#due-in-7-days',
    'nclex': 'https://thepoint.lww.com/Course/345678',
    'geronto': 'https://thepoint.lww.com/Course/345678'
  }
};

// Course homepage URLs
const courseUrls = {
  obgyn: 'https://studyhubmatt.neocities.org/SummerSchedule2025/obgyn-planner',
  adulthealth: 'https://studyhubmatt.neocities.org/SummerSchedule2025/adulthealth-planner',
  nclex: 'https://studyhubmatt.neocities.org/SummerSchedule2025/nclex-immersion',
  geronto: 'https://ahu.instructure.com/courses/nurs315'
};

// Week-specific URLs
const weekUrls = {
  obgyn: 'https://studyhubmatt.neocities.org/SummerSchedule2025/obgyn-planner#week-',
  adulthealth: 'https://studyhubmatt.neocities.org/SummerSchedule2025/adulthealth-planner#week-',
  nclex: 'https://studyhubmatt.neocities.org/SummerSchedule2025/nclex-immersion#week-',
  geronto: 'https://ahu.instructure.com/courses/nurs315/modules#module_'
};

// Course name mappings for display
const courseNames = {
  'obgyn': 'OB/Childbearing Family',
  'adulthealth': 'Adult Health I',
  'nclex': 'NCLEX-RN Immersion',
  'geronto': 'Gerontological Nursing'
};

// Export all configurations
export { 
  commonEventColors, 
  platformUrls, 
  courseUrls, 
  weekUrls,
  courseNames
};