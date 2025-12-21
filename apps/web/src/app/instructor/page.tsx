'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
  Paper,
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Assignment,
  Edit,
} from '@mui/icons-material'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'
import { useScheduleStore } from '@/stores/useScheduleStore'

// Colorful geometric shapes for the instructor banner
const InstructorGeometricShapes = () => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: '60%',
      overflow: 'hidden',
      pointerEvents: 'none',
    }}
  >
    {/* Teal rectangle */}
    <Box
      sx={{
        position: 'absolute',
        top: -10,
        right: 100,
        width: 100,
        height: 90,
        backgroundColor: '#14b8a6',
        transform: 'rotate(12deg)',
        borderRadius: 2,
      }}
    />
    {/* Indigo square */}
    <Box
      sx={{
        position: 'absolute',
        top: 30,
        right: 200,
        width: 70,
        height: 80,
        backgroundColor: '#6366f1',
        transform: 'rotate(-8deg)',
        borderRadius: 2,
      }}
    />
    {/* Rose rectangle */}
    <Box
      sx={{
        position: 'absolute',
        top: -20,
        right: 20,
        width: 80,
        height: 100,
        backgroundColor: '#f43f5e',
        transform: 'rotate(20deg)',
        borderRadius: 2,
      }}
    />
    {/* Amber square */}
    <Box
      sx={{
        position: 'absolute',
        top: 50,
        right: 60,
        width: 60,
        height: 70,
        backgroundColor: '#f59e0b',
        transform: 'rotate(-15deg)',
        borderRadius: 2,
      }}
    />
  </Box>
)

export default function InstructorDashboard() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { courses, tasks } = useScheduleStore()

  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  // Filter for instructor-specific task types
  const gradingTasks = tasks.filter(t => t.type === 'grading' && t.status !== 'completed')
  const prepTasks = tasks.filter(t => t.type === 'lecture-prep' && t.status !== 'completed')
  const totalInstructorTasks = gradingTasks.length + prepTasks.length

  const handleCourseToggle = (courseId: string) => {
    if (courseId === 'all') {
      setSelectedCourses([])
    } else {
      setSelectedCourses(prev =>
        prev.includes(courseId)
          ? prev.filter(id => id !== courseId)
          : [...prev, courseId]
      )
    }
  }

  const handlePrevWeek = () => setCurrentWeek(prev => subWeeks(prev, 1))
  const handleNextWeek = () => setCurrentWeek(prev => addWeeks(prev, 1))
  const handleToday = () => setCurrentWeek(new Date())

  const weekStart = startOfWeek(currentWeek)
  const weekEnd = endOfWeek(currentWeek)
  const weekLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`

  return (
    <Box>
      {/* Due This Week Banner - Instructor Version */}
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            position: 'relative',
            background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)',
            borderRadius: 2,
            p: { xs: 2, sm: 3 },
            overflow: 'hidden',
            minHeight: { xs: 80, sm: 100 },
          }}
        >
          {!isMobile && <InstructorGeometricShapes />}

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography
                variant={isMobile ? 'h3' : 'h2'}
                fontWeight={800}
                sx={{ color: '#fff' }}
              >
                {totalInstructorTasks}
              </Typography>
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                fontWeight={600}
                sx={{ color: '#fff' }}
              >
                Tasks
              </Typography>
            </Stack>
            <Typography
              variant={isMobile ? 'body1' : 'h6'}
              sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}
            >
              This Week
            </Typography>
          </Box>
        </Box>

        {/* Task type chips */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ mt: 1.5 }}
        >
          <Chip
            icon={<Assignment sx={{ fontSize: 16 }} />}
            label={`Grading (${gradingTasks.length})`}
            variant="outlined"
            color="warning"
            size="small"
            sx={{ fontWeight: 500 }}
          />
          <Chip
            icon={<Edit sx={{ fontSize: 16 }} />}
            label={`Prep (${prepTasks.length})`}
            variant="outlined"
            color="info"
            size="small"
            sx={{ fontWeight: 500 }}
          />
          {courses.length > 0 && courses.slice(0, 3).map((course) => (
            <Chip
              key={course.id}
              label={course.code || course.name.slice(0, 8)}
              onClick={() => handleCourseToggle(course.id)}
              variant={selectedCourses.includes(course.id) ? 'filled' : 'outlined'}
              size="small"
              sx={{
                fontWeight: 500,
                borderColor: course.color || 'divider',
                backgroundColor: selectedCourses.includes(course.id) ? course.color || 'secondary.main' : 'transparent',
                color: selectedCourses.includes(course.id) ? '#fff' : 'text.primary',
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Schedule Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} sx={{ mb: 1 }}>
          Teaching Schedule
        </Typography>

        {/* Week Navigation */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            py: 1,
            px: { xs: 0, sm: 1 },
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconButton size="small" onClick={handlePrevWeek}>
              <ChevronLeft />
            </IconButton>
            <IconButton size="small" onClick={handleToday}>
              <Today fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={handleNextWeek}>
              <ChevronRight />
            </IconButton>
          </Stack>

          <Typography
            variant={isMobile ? 'body2' : 'subtitle1'}
            fontWeight={600}
            sx={{ textAlign: 'center' }}
          >
            {weekLabel}
          </Typography>

          <Box sx={{ width: { xs: 80, sm: 100 } }} />
        </Stack>
      </Box>

      {/* Placeholder for Schedule View */}
      <Paper
        sx={{
          minHeight: { xs: 400, sm: 500, md: 600 },
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Instructor Schedule View
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Your grading deadlines, lecture prep time, and office hours will appear here.
          <br />
          Full calendar integration coming soon.
        </Typography>
      </Paper>
    </Box>
  )
}
