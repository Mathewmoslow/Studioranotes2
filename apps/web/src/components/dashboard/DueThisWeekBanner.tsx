'use client'

import React from 'react'
import {
  Box,
  Typography,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { useScheduleStore } from '@/stores/useScheduleStore'

// Colorful geometric shapes for the banner background
const GeometricShapes = () => (
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
    {/* Large cyan square */}
    <Box
      sx={{
        position: 'absolute',
        top: -20,
        right: 80,
        width: 120,
        height: 120,
        backgroundColor: '#06b6d4',
        transform: 'rotate(15deg)',
        borderRadius: 2,
      }}
    />
    {/* Purple rectangle */}
    <Box
      sx={{
        position: 'absolute',
        top: 20,
        right: 180,
        width: 80,
        height: 100,
        backgroundColor: '#8b5cf6',
        transform: 'rotate(-10deg)',
        borderRadius: 2,
      }}
    />
    {/* Green square */}
    <Box
      sx={{
        position: 'absolute',
        top: -30,
        right: 0,
        width: 100,
        height: 100,
        backgroundColor: '#22c55e',
        transform: 'rotate(25deg)',
        borderRadius: 2,
      }}
    />
    {/* Yellow/orange rectangle */}
    <Box
      sx={{
        position: 'absolute',
        top: 40,
        right: 40,
        width: 70,
        height: 90,
        backgroundColor: '#f59e0b',
        transform: 'rotate(-5deg)',
        borderRadius: 2,
      }}
    />
    {/* Blue square - overlapping */}
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        right: 120,
        width: 60,
        height: 80,
        backgroundColor: '#3b82f6',
        transform: 'rotate(20deg)',
        borderRadius: 2,
      }}
    />
  </Box>
)

interface DueThisWeekBannerProps {
  selectedCourses?: string[]
  onCourseToggle?: (courseId: string) => void
}

export default function DueThisWeekBanner({
  selectedCourses = [],
  onCourseToggle,
}: DueThisWeekBannerProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { courses, tasks, getUpcomingTasks } = useScheduleStore()

  // Get tasks due this week
  const upcomingTasks = getUpcomingTasks(7)

  // Filter by selected courses if any are selected
  const filteredTasks = selectedCourses.length > 0
    ? upcomingTasks.filter(t => selectedCourses.includes(t.courseId))
    : upcomingTasks

  const taskCount = filteredTasks.length

  return (
    <Box sx={{ mb: 2 }}>
      {/* Main banner */}
      <Box
        sx={{
          position: 'relative',
          backgroundColor: '#1e3a5f',
          borderRadius: 2,
          p: { xs: 2, sm: 3 },
          overflow: 'hidden',
          minHeight: { xs: 80, sm: 100 },
        }}
      >
        {/* Geometric shapes background */}
        {!isMobile && <GeometricShapes />}

        {/* Content */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography
              variant={isMobile ? 'h3' : 'h2'}
              fontWeight={800}
              sx={{ color: '#fff' }}
            >
              {taskCount}
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
            Due This Week
          </Typography>
        </Box>
      </Box>

      {/* Course filter chips */}
      {courses.length > 0 && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 1.5,
            overflowX: 'auto',
            pb: 1,
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
          }}
        >
          <Chip
            label={`All (${upcomingTasks.length})`}
            onClick={() => onCourseToggle?.('all')}
            variant={selectedCourses.length === 0 ? 'filled' : 'outlined'}
            color={selectedCourses.length === 0 ? 'primary' : 'default'}
            size="small"
            sx={{ fontWeight: 600 }}
          />
          {courses.map((course) => {
            const courseTaskCount = upcomingTasks.filter(t => t.courseId === course.id).length
            const isSelected = selectedCourses.includes(course.id)
            return (
              <Chip
                key={course.id}
                label={`${course.code || course.name.slice(0, 8)} (${courseTaskCount})`}
                onClick={() => onCourseToggle?.(course.id)}
                variant={isSelected ? 'filled' : 'outlined'}
                size="small"
                sx={{
                  fontWeight: 500,
                  borderColor: course.color || 'divider',
                  backgroundColor: isSelected ? course.color || 'primary.main' : 'transparent',
                  color: isSelected ? '#fff' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isSelected
                      ? course.color || 'primary.main'
                      : `${course.color}20` || 'action.hover',
                  },
                }}
              />
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
