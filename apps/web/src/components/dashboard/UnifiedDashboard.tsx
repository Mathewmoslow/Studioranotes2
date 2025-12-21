'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  Today,
} from '@mui/icons-material'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'

import DashboardLayout from './DashboardLayout'
import SchedulerView from '../scheduler/SchedulerView'
import DueThisWeekBanner from './DueThisWeekBanner'
import CompactTermIndicator from './CompactTermIndicator'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { initializeAcademicTerm } from '@/stores/academicTermStore'

export default function UnifiedDashboard() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  // Initialize academic term
  useEffect(() => {
    initializeAcademicTerm()
  }, [])

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
    <DashboardLayout>
      {/* Due This Week Banner */}
      <DueThisWeekBanner
        selectedCourses={selectedCourses}
        onCourseToggle={handleCourseToggle}
      />

      {/* Schedule Header */}
      <Box sx={{ mb: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700}>
            Schedule
          </Typography>
          <CompactTermIndicator />
        </Stack>

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

          {/* Spacer for alignment */}
          <Box sx={{ width: { xs: 80, sm: 100 } }} />
        </Stack>
      </Box>

      {/* Main Schedule View */}
      <Box
        sx={{
          flex: 1,
          minHeight: { xs: 400, sm: 500, md: 600 },
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <SchedulerView
          selectedCourses={selectedCourses}
          currentWeek={currentWeek}
        />
      </Box>
    </DashboardLayout>
  )
}
