/**
 * Mock Data Population Script
 *
 * Copy and paste this entire script into the browser console while on the Studiora app.
 * This will populate courses, assignments, exams, and events simulating Canvas data.
 *
 * Run after completing onboarding to test schedule generation and notes.
 */

(function() {
  // Get current date and create semester-relative dates
  const now = new Date();
  const semesterStart = new Date(now);
  semesterStart.setMonth(semesterStart.getMonth() - 1); // Started 1 month ago

  const semesterEnd = new Date(now);
  semesterEnd.setMonth(semesterEnd.getMonth() + 3); // Ends in 3 months

  // Helper to create dates relative to now
  const daysFromNow = (days) => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date;
  };

  const hoursFromNow = (hours) => {
    const date = new Date(now);
    date.setHours(date.getHours() + hours);
    return date;
  };

  // Course colors
  const colors = ['#2563eb', '#7c3aed', '#dc2626', '#16a34a', '#ea580c', '#0891b2'];

  // Mock Courses (simulating Canvas import)
  const courses = [
    {
      id: 'canvas-course-101',
      name: 'Introduction to Computer Science',
      code: 'CS 101',
      instructor: 'Dr. Sarah Chen',
      creditHours: 4,
      color: colors[0],
      status: 'ACTIVE',
      room: 'Science Building 201',
      schedule: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '10:30', type: 'lecture', location: 'Science Building 201' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '10:30', type: 'lecture', location: 'Science Building 201' },
        { dayOfWeek: 5, startTime: '14:00', endTime: '16:00', type: 'lab', location: 'Computer Lab 105' }
      ],
      // Announcement with embedded assignment for AI extraction testing
      announcements: [
        {
          id: 'announce-cs101-1',
          title: 'Important: Extra Credit Opportunity & Upcoming Project',
          postedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          content: `Hello everyone!

I hope you're all doing well with the programming assignments. I wanted to share some exciting news and an important update.

First, we have an extra credit opportunity! I'd like you to complete a "Code Review Reflection" assignment where you'll review a classmate's code from Assignment 1 and write a 500-word reflection on coding best practices you observed. This is worth 15 extra points toward your final grade. Please submit this by ${daysFromNow(9).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} at 11:59 PM through the Canvas dropbox.

Additionally, don't forget that your Group Project Proposal is coming up. You'll need to form teams of 3-4 students and submit a 2-page proposal outlining your final project idea. The proposal should include: project title, team members, problem statement, proposed solution, and a rough timeline. This is due on ${daysFromNow(16).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} by midnight. I estimate this should take about 4-5 hours of collaborative work.

Remember, office hours are Tuesday and Thursday 2-4 PM if you need help!

Best,
Dr. Chen`
        }
      ],
      createdAt: semesterStart,
      updatedAt: now
    },
    {
      id: 'canvas-course-201',
      name: 'Data Structures and Algorithms',
      code: 'CS 201',
      instructor: 'Prof. Michael Torres',
      creditHours: 3,
      color: colors[1],
      status: 'ACTIVE',
      room: 'Engineering Hall 302',
      schedule: [
        { dayOfWeek: 2, startTime: '11:00', endTime: '12:30', type: 'lecture', location: 'Engineering Hall 302' },
        { dayOfWeek: 4, startTime: '11:00', endTime: '12:30', type: 'lecture', location: 'Engineering Hall 302' }
      ],
      announcements: [
        {
          id: 'announce-cs201-1',
          title: 'Algorithm Analysis Workshop - Required Attendance',
          postedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          content: `Dear Students,

Quick reminder about our upcoming Algorithm Analysis Workshop next week. This is a MANDATORY session that will count toward your participation grade.

The workshop will be held on ${daysFromNow(5).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} from 3:00 PM to 5:00 PM in the Computer Science Lab (Room 150). We'll be working through Big-O analysis problems together, and you'll need to complete a worksheet during the session.

Also, I'm assigning a new "Algorithm Comparison Report" that wasn't on the original syllabus. You'll need to implement and compare the performance of at least 3 sorting algorithms (your choice) on datasets of varying sizes, then write a 3-page analysis report with graphs. This assignment is due ${daysFromNow(13).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} by 11:59 PM. I'd budget about 6-8 hours for this one - it's more involved than usual.

Please bring your laptops to the workshop!

- Prof. Torres`
        }
      ],
      createdAt: semesterStart,
      updatedAt: now
    },
    {
      id: 'canvas-course-301',
      name: 'Calculus II',
      code: 'MATH 152',
      instructor: 'Dr. Emily Watson',
      creditHours: 4,
      color: colors[2],
      status: 'ACTIVE',
      room: 'Mathematics Building 110',
      schedule: [
        { dayOfWeek: 1, startTime: '13:00', endTime: '14:00', type: 'lecture', location: 'Mathematics Building 110' },
        { dayOfWeek: 3, startTime: '13:00', endTime: '14:00', type: 'lecture', location: 'Mathematics Building 110' },
        { dayOfWeek: 5, startTime: '13:00', endTime: '14:00', type: 'lecture', location: 'Mathematics Building 110' }
      ],
      createdAt: semesterStart,
      updatedAt: now
    },
    {
      id: 'canvas-course-401',
      name: 'Technical Writing',
      code: 'ENG 215',
      instructor: 'Prof. James Miller',
      creditHours: 3,
      color: colors[3],
      status: 'ACTIVE',
      room: 'Humanities 405',
      schedule: [
        { dayOfWeek: 2, startTime: '14:00', endTime: '15:30', type: 'lecture', location: 'Humanities 405' },
        { dayOfWeek: 4, startTime: '14:00', endTime: '15:30', type: 'lecture', location: 'Humanities 405' }
      ],
      createdAt: semesterStart,
      updatedAt: now
    }
  ];

  // Mock Tasks/Assignments (simulating Canvas assignments)
  const tasks = [
    // CS 101 Assignments
    {
      id: 'task-cs101-hw1',
      title: 'Programming Assignment 1: Hello World',
      courseId: 'canvas-course-101',
      type: 'assignment',
      dueDate: daysFromNow(3),
      estimatedHours: 2,
      complexity: 2,
      status: 'not-started',
      description: 'Write your first Python program. Create a simple hello world application.',
      bufferDays: 1
    },
    {
      id: 'task-cs101-hw2',
      title: 'Programming Assignment 2: Variables and Types',
      courseId: 'canvas-course-101',
      type: 'assignment',
      dueDate: daysFromNow(10),
      estimatedHours: 4,
      complexity: 3,
      status: 'not-started',
      description: 'Work with variables, data types, and basic operations.',
      bufferDays: 2
    },
    {
      id: 'task-cs101-read1',
      title: 'Chapter 1-3 Reading: Fundamentals',
      courseId: 'canvas-course-101',
      type: 'reading',
      dueDate: daysFromNow(5),
      estimatedHours: 3,
      complexity: 2,
      status: 'not-started',
      description: 'Read chapters 1-3 of the textbook covering programming fundamentals.',
      bufferDays: 1
    },
    {
      id: 'task-cs101-quiz1',
      title: 'Quiz 1: Python Basics',
      courseId: 'canvas-course-101',
      type: 'quiz',
      dueDate: daysFromNow(7),
      estimatedHours: 2,
      complexity: 3,
      status: 'not-started',
      description: 'Online quiz covering Python syntax and basic concepts.',
      bufferDays: 1
    },

    // CS 201 Assignments
    {
      id: 'task-cs201-hw1',
      title: 'Linked List Implementation',
      courseId: 'canvas-course-201',
      type: 'assignment',
      dueDate: daysFromNow(6),
      estimatedHours: 6,
      complexity: 4,
      status: 'not-started',
      description: 'Implement a doubly linked list with all standard operations.',
      bufferDays: 2
    },
    {
      id: 'task-cs201-hw2',
      title: 'Binary Search Tree Project',
      courseId: 'canvas-course-201',
      type: 'project',
      dueDate: daysFromNow(14),
      estimatedHours: 10,
      complexity: 5,
      status: 'not-started',
      description: 'Build a BST with insert, delete, search, and traversal methods.',
      bufferDays: 3
    },
    {
      id: 'task-cs201-read1',
      title: 'Chapter 4: Tree Structures',
      courseId: 'canvas-course-201',
      type: 'reading',
      dueDate: daysFromNow(4),
      estimatedHours: 2,
      complexity: 3,
      status: 'not-started',
      description: 'Read chapter 4 on tree data structures.',
      bufferDays: 1
    },

    // MATH 152 Assignments
    {
      id: 'task-math152-hw1',
      title: 'Problem Set 5: Integration Techniques',
      courseId: 'canvas-course-301',
      type: 'assignment',
      dueDate: daysFromNow(4),
      estimatedHours: 4,
      complexity: 4,
      status: 'not-started',
      description: 'Complete problems 1-20 on integration by parts and substitution.',
      bufferDays: 1
    },
    {
      id: 'task-math152-hw2',
      title: 'Problem Set 6: Series',
      courseId: 'canvas-course-301',
      type: 'assignment',
      dueDate: daysFromNow(11),
      estimatedHours: 5,
      complexity: 4,
      status: 'not-started',
      description: 'Infinite series and convergence tests.',
      bufferDays: 2
    },
    {
      id: 'task-math152-study',
      title: 'Midterm Exam Preparation',
      courseId: 'canvas-course-301',
      type: 'exam',
      dueDate: daysFromNow(18),
      estimatedHours: 12,
      complexity: 5,
      status: 'not-started',
      description: 'Study for midterm covering chapters 1-6.',
      bufferDays: 5
    },

    // ENG 215 Assignments
    {
      id: 'task-eng215-essay1',
      title: 'Technical Report Draft',
      courseId: 'canvas-course-401',
      type: 'assignment',
      dueDate: daysFromNow(8),
      estimatedHours: 5,
      complexity: 3,
      status: 'not-started',
      description: 'Write first draft of technical report (1500 words).',
      bufferDays: 2
    },
    {
      id: 'task-eng215-peer',
      title: 'Peer Review Session',
      courseId: 'canvas-course-401',
      type: 'assignment',
      dueDate: daysFromNow(12),
      estimatedHours: 2,
      complexity: 2,
      status: 'not-started',
      description: 'Review and provide feedback on two peer papers.',
      bufferDays: 1
    },
    {
      id: 'task-eng215-final',
      title: 'Final Technical Report',
      courseId: 'canvas-course-401',
      type: 'project',
      dueDate: daysFromNow(21),
      estimatedHours: 8,
      complexity: 4,
      status: 'not-started',
      description: 'Submit final version of technical report with revisions.',
      bufferDays: 3
    }
  ];

  // Mock Events (Exams from Canvas calendar)
  const events = [
    {
      id: 'exam-cs101-midterm',
      title: 'CS 101 Midterm Exam',
      type: 'exam',
      courseId: 'canvas-course-101',
      startTime: daysFromNow(21),
      endTime: new Date(daysFromNow(21).getTime() + 2 * 60 * 60 * 1000), // 2 hours
      location: 'Science Building 201',
      description: 'Covers chapters 1-5, programming fundamentals'
    },
    {
      id: 'exam-cs201-midterm',
      title: 'CS 201 Midterm Exam',
      type: 'exam',
      courseId: 'canvas-course-201',
      startTime: daysFromNow(24),
      endTime: new Date(daysFromNow(24).getTime() + 2 * 60 * 60 * 1000),
      location: 'Engineering Hall 302',
      description: 'Covers linked lists, stacks, queues, trees'
    },
    {
      id: 'exam-math152-midterm',
      title: 'Calculus II Midterm',
      type: 'exam',
      courseId: 'canvas-course-301',
      startTime: daysFromNow(18),
      endTime: new Date(daysFromNow(18).getTime() + 2 * 60 * 60 * 1000),
      location: 'Mathematics Building 110',
      description: 'Integration techniques, applications, series intro'
    },
    {
      id: 'exam-eng215-presentation',
      title: 'Technical Presentation',
      type: 'exam',
      courseId: 'canvas-course-401',
      startTime: daysFromNow(28),
      endTime: new Date(daysFromNow(28).getTime() + 1.5 * 60 * 60 * 1000),
      location: 'Humanities 405',
      description: 'Present technical report to class'
    }
  ];

  // Load into schedule-store (localStorage)
  const existingStore = localStorage.getItem('schedule-store');
  let storeData = existingStore ? JSON.parse(existingStore) : { state: {} };

  // Merge with existing data or replace
  storeData.state.courses = courses;
  storeData.state.tasks = tasks.map(t => ({
    ...t,
    scheduledBlocks: [],
    bufferPercentage: 20
  }));
  storeData.state.events = events;

  // Save back to localStorage
  localStorage.setItem('schedule-store', JSON.stringify(storeData));

  // Count announcements with embedded assignments
  const announcementCount = courses.reduce((acc, c) => acc + (c.announcements?.length || 0), 0);

  console.log('✅ Mock data loaded successfully!');
  console.log(`📚 ${courses.length} courses added`);
  console.log(`📝 ${tasks.length} assignments/tasks added`);
  console.log(`📅 ${events.length} exam events added`);
  console.log(`📣 ${announcementCount} announcements with hidden assignments (for AI extraction testing)`);
  console.log('');
  console.log('🔄 Refresh the page to see the data.');
  console.log('💡 Go to Dashboard and click "View Schedule" to generate study blocks.');
  console.log('');
  console.log('📣 ANNOUNCEMENTS FOR AI EXTRACTION TESTING:');
  courses.forEach(c => {
    if (c.announcements?.length) {
      c.announcements.forEach(a => {
        console.log(`   [${c.code}] "${a.title}"`);
        console.log(`   Contains: Extra assignments mentioned in narrative form`);
      });
    }
  });

  // Return summary for console
  return {
    courses: courses.map(c => c.code),
    tasks: tasks.map(t => ({ title: t.title, due: t.dueDate.toLocaleDateString() })),
    events: events.map(e => ({ title: e.title, date: e.startTime.toLocaleDateString() })),
    announcements: courses.flatMap(c => (c.announcements || []).map(a => ({ course: c.code, title: a.title })))
  };
})();
