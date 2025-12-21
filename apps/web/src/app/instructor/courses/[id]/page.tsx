'use client'

import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Tabs,
  Tab,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  Description,
  Assignment,
  CalendarMonth,
} from '@mui/icons-material'
import { useRouter, useParams } from 'next/navigation'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { useState } from 'react'

export default function InstructorCourseDetail() {
  const router = useRouter()
  const params = useParams()
  const courseId = params?.id as string
  const { courses, tasks } = useScheduleStore()
  const [activeTab, setActiveTab] = useState(0)

  const course = courses.find((c) => c.id === courseId)
  const courseTasks = tasks.filter((t) => t.courseId === courseId)

  if (!course) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" color="text.secondary">
          Course not found
        </Typography>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/instructor/courses')}
          sx={{ mt: 2 }}
        >
          Back to Courses
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => router.push('/instructor/courses')}
        sx={{ mb: 2 }}
      >
        Back to Courses
      </Button>

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 8,
            height: 48,
            backgroundColor: course.color || 'secondary.main',
            borderRadius: 1,
          }}
        />
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {course.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {course.code} {course.instructor && `- ${course.instructor}`}
          </Typography>
        </Box>
      </Stack>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab icon={<Description />} label="Materials" iconPosition="start" />
        <Tab icon={<Assignment />} label="Assignments" iconPosition="start" />
        <Tab icon={<CalendarMonth />} label="Schedule" iconPosition="start" />
      </Tabs>

      <Divider sx={{ mb: 3 }} />

      {activeTab === 0 && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Description sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Materials Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create lecture notes, study guides, or textbook chapters for this course.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => router.push('/instructor/notes')}
          >
            Create Materials
          </Button>
        </Card>
      )}

      {activeTab === 1 && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Assignments
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {courseTasks.length > 0
              ? `${courseTasks.length} tasks imported from Canvas`
              : 'Import from Canvas or add assignments manually.'}
          </Typography>
        </Card>
      )}

      {activeTab === 2 && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <CalendarMonth sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Course Schedule
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {course.schedule && course.schedule.length > 0
              ? `${course.schedule.length} recurring sessions`
              : 'No schedule configured for this course.'}
          </Typography>
        </Card>
      )}
    </Box>
  )
}
