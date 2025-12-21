'use client'

import React, { useState, useEffect } from 'react'
import { Box } from '@mui/material'

import SchedulerView from '../scheduler/SchedulerView'
import DueThisWeekBanner from './DueThisWeekBanner'
import { initializeAcademicTerm } from '@/stores/academicTermStore'

export default function UnifiedDashboard() {
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

  return (
    <Box>
      {/* Due This Week Banner */}
      <DueThisWeekBanner
        selectedCourses={selectedCourses}
        onCourseToggle={handleCourseToggle}
      />

      {/* Main Schedule View - has its own navigation */}
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
        <SchedulerView />
      </Box>
    </Box>
  )
}
