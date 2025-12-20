'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  CalendarMonth,
  Description,
  School,
  AutoAwesome,
  Assignment,
  Schedule as ScheduleIcon,
  ArrowForward,
} from '@mui/icons-material'
import { format, startOfWeek, addDays } from 'date-fns'
import { useRouter } from 'next/navigation'

import DashboardLayout from './DashboardLayout'
import SchedulerView from '../scheduler/SchedulerView'
import { useScheduleStore } from '@/stores/useScheduleStore'
import CompactTermIndicator from './CompactTermIndicator'
import { initializeAcademicTerm } from '@/stores/academicTermStore'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

export default function UnifiedDashboard() {
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  const [currentTab, setCurrentTab] = useState(0)
  const [weekView, setWeekView] = useState<Date[]>([])
  const [savedNotes, setSavedNotes] = useState<any[]>([])

  // Get data from store
  const { courses, tasks, events, getUpcomingTasks, getTasksForDate } = useScheduleStore()

  // Load notes from localStorage
  useEffect(() => {
    const notes = localStorage.getItem('generated-notes')
    if (notes) {
      const parsed = JSON.parse(notes)
      const list = Object.entries(parsed)
        .map(([id, note]: any) => ({ id, ...note }))
        .sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
      setSavedNotes(list.slice(0, 5))
    }
  }, [])

  // Calculate simple stats
  const totalNotes = savedNotes.length > 0
    ? Object.keys(JSON.parse(localStorage.getItem('generated-notes') || '{}')).length
    : 0
  const upcomingTasks = getUpcomingTasks(7)

  useEffect(() => {
    initializeAcademicTerm()
    const start = startOfWeek(new Date())
    const week = Array.from({ length: 7 }, (_, i) => addDays(start, i))
    setWeekView(week)
  }, [])

  return (
    <DashboardLayout>
      <CompactTermIndicator />

      {/* Header - Mobile responsive */}
      <Box sx={{ mb: { xs: 2, sm: 4 }, pb: { xs: 2, sm: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} gutterBottom>
          Dashboard
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1, sm: 2 }}
          sx={{ '& .MuiButton-root': { flex: isMobile ? 1 : 'none' } }}
        >
          <Button
            variant="contained"
            startIcon={<AutoAwesome />}
            onClick={() => router.push('/notes')}
            size={isMobile ? 'medium' : 'large'}
          >
            Generate Notes
          </Button>
          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => setCurrentTab(1)}
            size={isMobile ? 'medium' : 'large'}
          >
            View Schedule
          </Button>
        </Stack>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)}>
          <Tab label="Overview" />
          <Tab label="Schedule" />
        </Tabs>
      </Box>

      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          {/* Quick Stats Row */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Description color="primary" />
                  <Box>
                    <Typography variant="h4" fontWeight={700}>{totalNotes}</Typography>
                    <Typography variant="body2" color="text.secondary">Notes</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <School color="secondary" />
                  <Box>
                    <Typography variant="h4" fontWeight={700}>{courses.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Courses</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Assignment color="warning" />
                  <Box>
                    <Typography variant="h4" fontWeight={700}>{upcomingTasks.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Tasks This Week</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Week Overview */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  This Week
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: { xs: 0.5, sm: 1 },
                    mt: 1,
                    overflowX: 'auto',
                    pb: 1,
                    WebkitOverflowScrolling: 'touch',
                    '&::-webkit-scrollbar': { height: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 }
                  }}
                >
                  {weekView.map((day) => {
                    const dayTasks = getTasksForDate(day)
                    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

                    return (
                      <Box
                        key={day.toISOString()}
                        sx={{
                          p: { xs: 1, sm: 2 },
                          minWidth: { xs: 56, sm: 80 },
                          textAlign: 'center',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: isToday ? 'primary.main' : 'divider',
                          bgcolor: isToday ? 'primary.50' : 'transparent',
                          flexShrink: 0,
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        >
                          {format(day, isMobile ? 'E' : 'EEE')}
                        </Typography>
                        <Typography
                          variant={isMobile ? 'body1' : 'h6'}
                          fontWeight={600}
                        >
                          {format(day, 'd')}
                        </Typography>
                        {dayTasks.length > 0 && (
                          <Chip
                            label={dayTasks.length}
                            size="small"
                            color="primary"
                            sx={{ height: { xs: 16, sm: 18 }, fontSize: { xs: 9, sm: 10 }, mt: 0.5 }}
                          />
                        )}
                      </Box>
                    )
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Tasks */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Upcoming Tasks
                  </Typography>
                  <Button size="small" endIcon={<ArrowForward />} onClick={() => router.push('/courses')}>
                    View All
                  </Button>
                </Stack>
                {upcomingTasks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No upcoming tasks this week
                  </Typography>
                ) : (
                  <List dense disablePadding>
                    {upcomingTasks.slice(0, 5).map((task, idx) => (
                      <React.Fragment key={task.id}>
                        {idx > 0 && <Divider />}
                        <ListItem disablePadding sx={{ py: 1 }}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Assignment fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={task.title}
                            secondary={task.dueDate ? format(new Date(task.dueDate), 'MMM d') : ''}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Courses */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Your Courses
                  </Typography>
                  <Button size="small" endIcon={<ArrowForward />} onClick={() => router.push('/courses')}>
                    Manage
                  </Button>
                </Stack>
                {courses.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No courses yet. Import from Canvas or add manually.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {courses.slice(0, 4).map((course) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={course.id}>
                        <Box
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            borderLeft: `3px solid ${course.color || '#2563eb'}`,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                          onClick={() => router.push(`/courses/${course.id}`)}
                        >
                          <Typography variant="subtitle2" fontWeight={600}>
                            {course.code || course.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {course.name}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Notes - Simple list with course color only */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Recent Notes
                  </Typography>
                  <Button size="small" endIcon={<ArrowForward />} onClick={() => router.push('/notes')}>
                    View All
                  </Button>
                </Stack>
                {savedNotes.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      No notes yet
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AutoAwesome />}
                      onClick={() => router.push('/notes')}
                    >
                      Generate First Note
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {savedNotes.map((note) => {
                      const course = courses.find(c => c.id === note.courseId)
                      const courseColor = course?.color || '#9ca3af'
                      return (
                        <Box
                          key={note.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            py: 0.75,
                            px: 1,
                            borderRadius: 1,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                          onClick={() => router.push('/notes')}
                        >
                          <Box
                            sx={{
                              width: 4,
                              height: 24,
                              borderRadius: 0.5,
                              bgcolor: courseColor,
                              flexShrink: 0
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {note.title || note.topic || 'Untitled'}
                          </Typography>
                        </Box>
                      )
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={currentTab} index={1}>
        <SchedulerView />
      </TabPanel>
    </DashboardLayout>
  )
}
