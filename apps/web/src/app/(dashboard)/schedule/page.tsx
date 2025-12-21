'use client'

import React from 'react'
import { Box } from '@mui/material'
import SchedulerView from '@/components/scheduler/SchedulerView'

export default function SchedulePage() {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <SchedulerView />
    </Box>
  )
}
