// Test script to manually call the sync API and see what happens

const testData = {
  preferences: {
    studyHours: { start: "09:00", end: "21:00" },
    sessionDuration: 45,
    breakDuration: 15
  },
  onboardingCompleted: true,
  courses: [
    {
      id: "test-course-123",
      name: "Test Course",
      code: "TEST101",
      instructor: "Dr. Test",
      color: "#667eea",
      creditHours: 3,
      canvasId: "12345",
      canvasSyncEnabled: true
    }
  ],
  tasks: [
    {
      id: "test-task-456",
      courseId: "test-course-123",
      title: "Test Assignment",
      description: "This is a test",
      type: "assignment",
      dueDate: new Date("2025-12-01").toISOString(),
      estimatedHours: 2,
      priority: "medium",
      status: "not-started"
    }
  ],
  studyBlocks: [],
  notes: []
}

async function testSync() {
  try {
    console.log('📤 Sending test data to /api/sync...')

    const response = await fetch('http://localhost:3000/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': '' // Would need actual session cookie
      },
      body: JSON.stringify(testData)
    })

    console.log('📊 Response status:', response.status)

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Sync successful!')
      console.log('Result:', JSON.stringify(data, null, 2))
    } else {
      console.log('❌ Sync failed!')
      console.log('Error:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message)
  }
}

testSync()
