'use client'

import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  Paper,
  Button,
} from '@mui/material'
import {
  CalendarMonth,
  Assignment,
  Edit,
  Event,
} from '@mui/icons-material'
import { useScheduleStore } from '@/stores/useScheduleStore'

export default function InstructorSchedule() {
  const { tasks, events } = useScheduleStore()

  // Filter for instructor-specific tasks
  const gradingTasks = tasks.filter((t) => t.type === 'grading' && t.status !== 'completed')
  const prepTasks = tasks.filter((t) => t.type === 'lecture-prep' && t.status !== 'completed')
  const officeHours = events.filter((e) => e.type === 'office-hours')

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Teaching Schedule
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage grading deadlines, lecture prep, and office hours.
      </Typography>

      <Grid container spacing={3}>
        {/* Grading Queue */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Assignment sx={{ color: 'warning.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Grading Queue
                </Typography>
                <Chip
                  label={gradingTasks.length}
                  color="warning"
                  size="small"
                />
              </Stack>
              {gradingTasks.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No grading tasks scheduled. Add grading tasks from your course assignments.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {gradingTasks.slice(0, 5).map((task) => (
                    <Paper key={task.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="subtitle2">{task.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Lecture Prep */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Edit sx={{ color: 'info.main' }} />
                <Typography variant="h6" fontWeight={600}>
                  Lecture Prep
                </Typography>
                <Chip
                  label={prepTasks.length}
                  color="info"
                  size="small"
                />
              </Stack>
              {prepTasks.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No prep tasks scheduled. Add preparation time for upcoming lectures.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {prepTasks.slice(0, 5).map((task) => (
                    <Paper key={task.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="subtitle2">{task.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Office Hours */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Event sx={{ color: 'success.main' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Office Hours
                  </Typography>
                </Stack>
                <Button variant="outlined" size="small">
                  Configure
                </Button>
              </Stack>
              {officeHours.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No office hours configured. Set up recurring office hours to block time in your schedule.
                </Typography>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {officeHours.map((event) => (
                    <Chip
                      key={event.id}
                      label={`${event.title} - ${new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      variant="outlined"
                      color="success"
                    />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Coming Soon */}
      <Paper sx={{ p: 3, mt: 4, textAlign: 'center', backgroundColor: 'action.hover' }}>
        <CalendarMonth sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Full Calendar View Coming Soon
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and manage all your teaching activities in a visual calendar.
        </Typography>
      </Paper>
    </Box>
  )
}
