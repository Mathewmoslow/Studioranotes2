'use client'

import React, { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  LinearProgress,
  Stack,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  School,
  Schedule,
  Assignment,
  MoreVert,
  CalendarMonth,
  FilterList,
  CheckCircle,
  Archive,
  RadioButtonUnchecked,
  Upcoming
} from '@mui/icons-material'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { useAcademicTermStore, useTermDisplay } from '@/stores/academicTermStore'
import { formatTermName } from '@/lib/academic-terms'
// Inline EmptyState component
const EmptyState = ({ icon, title, description, action }) => (
  <Box sx={{ textAlign: 'center', py: 6 }}>
    <Box sx={{ mb: 2, color: 'text.secondary' }}>
      {icon}
    </Box>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      {description}
    </Typography>
    {action && (
      <Button variant="contained" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </Box>
)

export default function CoursesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))

  const { courses, tasks, addCourse, updateCourse, deleteCourse } = useScheduleStore()
  const { currentTerm, selectedSystem, getAvailableTerms } = useAcademicTermStore()
  const { termName } = useTermDisplay()
  const availableTerms = getAvailableTerms()
  const dayLabels = isMobile ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const meetingTypes: Array<{ value: 'lecture' | 'lab' | 'clinical' | 'tutorial' | 'seminar'; label: string }> = [
    { value: 'lecture', label: 'Lecture' },
    { value: 'lab', label: 'Lab' },
    { value: 'clinical', label: 'Clinical' },
    { value: 'tutorial', label: 'Tutorial' },
    { value: 'seminar', label: 'Seminar' }
  ]

  const [openDialog, setOpenDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [scheduleDraft, setScheduleDraft] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '10:00',
    type: 'lecture' as 'lecture' | 'lab' | 'clinical' | 'tutorial' | 'seminar',
    location: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    instructor: '',
    creditHours: 3,
    termId: currentTerm?.id || '',
    color: '#667eea',
    status: 'ACTIVE',
    schedule: [] as Array<{
      dayOfWeek: number
      startTime: string
      endTime: string
      type: 'lecture' | 'lab' | 'clinical' | 'tutorial' | 'seminar'
      location?: string
    }>
  })

  const handleSubmit = () => {
    const selectedTerm = availableTerms.find(t => t.id === formData.termId)
    const courseData = {
      id: editingCourse?.id || `course-${Date.now()}`,
      userId: session?.user?.email || 'demo',
      ...formData,
      semester: selectedTerm ? formatTermName(selectedTerm) : formData.semester,
      year: selectedTerm ? selectedTerm.startDate.getFullYear() : new Date().getFullYear(),
      createdAt: editingCourse?.createdAt || new Date(),
      updatedAt: new Date()
    }

    if (editingCourse) {
      updateCourse(editingCourse.id, courseData)
    } else {
      addCourse(courseData)
    }

    setOpenDialog(false)
    setEditingCourse(null)
    setFormData({
      name: '',
      code: '',
      instructor: '',
      creditHours: 3,
      termId: currentTerm?.id || '',
      color: '#667eea',
      status: 'ACTIVE',
      schedule: []
    })
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      code: course.code,
      instructor: course.instructor || '',
      creditHours: course.creditHours || 3,
      termId: course.termId || currentTerm?.id || '',
      color: course.color,
      status: course.status || 'ACTIVE',
      schedule: course.schedule || []
    })
    setOpenDialog(true)
  }

  const handleStatusChange = async (courseId, newStatus) => {
    try {
      const response = await fetch('/api/courses/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, status: newStatus })
      })

      if (response.ok) {
        const updatedCourse = await response.json()
        updateCourse(courseId, updatedCourse)
      }
    } catch (error) {
      console.error('Error updating course status:', error)
    }
  }

  const addScheduleItem = () => {
    setFormData((prev) => ({
      ...prev,
      schedule: [
        ...prev.schedule,
        { ...scheduleDraft, dayOfWeek: Number(scheduleDraft.dayOfWeek) }
      ]
    }))
  }

  const removeScheduleItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((_, i) => i !== index)
    }))
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <RadioButtonUnchecked sx={{ fontSize: 16 }} />
      case 'COMPLETED': return <CheckCircle sx={{ fontSize: 16 }} />
      case 'ARCHIVED': return <Archive sx={{ fontSize: 16 }} />
      case 'UPCOMING': return <Upcoming sx={{ fontSize: 16 }} />
      default: return <RadioButtonUnchecked sx={{ fontSize: 16 }} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'COMPLETED': return 'info'
      case 'ARCHIVED': return 'default'
      case 'UPCOMING': return 'warning'
      default: return 'default'
    }
  }

  const handleDelete = (courseId) => {
    if (confirm('Are you sure you want to delete this course?')) {
      deleteCourse(courseId)
    }
  }

  const dueSoonByCourse = useMemo(() => {
    const now = new Date()
    const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return tasks
      .filter(t => t.status !== 'completed')
      .filter(t => {
        const due = t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate)
        return due >= now && due <= weekOut
      })
      .reduce<Record<string, number>>((acc, task) => {
        acc[task.courseId] = (acc[task.courseId] || 0) + 1
        return acc
      }, {})
  }, [tasks])

  // Filter courses by status
  const filteredCourses = statusFilter === 'ALL'
    ? courses
    : courses.filter(course => (course.status || 'ACTIVE') === statusFilter)

  const totalCredits = filteredCourses.reduce((sum, course) => sum + (course.creditHours || 0), 0)

  if (!session) {
    return (
      <Container>
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4">Please sign in to view your courses</Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header - Mobile responsive */}
      <Box sx={{ mb: { xs: 2, sm: 4 }, pb: { xs: 2, sm: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} gutterBottom>
          Courses
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          <Stack direction="row" spacing={1}>
            <Chip
              icon={<School />}
              label={`${filteredCourses.length} Courses`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`${totalCredits} Credits`}
              size="small"
              variant="outlined"
            />
          </Stack>
          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 130 } }}
          >
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="ARCHIVED">Archived</MenuItem>
            <MenuItem value="UPCOMING">Upcoming</MenuItem>
            <MenuItem value="ALL">All</MenuItem>
          </TextField>
        </Stack>
      </Box>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<School />}
              title={statusFilter === 'ALL' || courses.length === 0 ? "No courses yet" : `No ${statusFilter.toLowerCase()} courses`}
              description={statusFilter === 'ALL' || courses.length === 0
                ? "Add your first course to start organizing your academic schedule"
                : `You don't have any courses with status: ${statusFilter}`
              }
              action={statusFilter === 'ALL' || courses.length === 0 ? {
                label: "Add Course",
                onClick: () => setOpenDialog(true)
              } : null}
            />
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredCourses.map((course) => (
            <Grid key={course.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  borderLeft: `3px solid ${course.color}`,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => router.push(`/courses/${course.id}`)}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {course.code || course.name}
                  </Typography>

                  {course.code && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {course.name}
                    </Typography>
                  )}

                  {course.instructor && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {course.instructor}
                    </Typography>
                  )}

                  <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                    <Chip
                      size="small"
                      label={course.status || 'ACTIVE'}
                      color={getStatusColor(course.status || 'ACTIVE')}
                      variant="outlined"
                    />
                    {dueSoonByCourse[course.id] && (
                      <Chip
                        size="small"
                        color="error"
                        label={`${dueSoonByCourse[course.id]} due soon`}
                      />
                    )}
                    {course.creditHours && (
                      <Chip
                        size="small"
                        label={`${course.creditHours} credits`}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </CardContent>

                <CardActions onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => handleEdit(course)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDelete(course.id)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Course FAB */}
      <Fab
        color="primary"
        aria-label="add course"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => setOpenDialog(true)}
      >
        <Add />
      </Fab>

      {/* Add/Edit Course Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCourse ? 'Edit Course' : 'Add New Course'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Course Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
              required
              placeholder="e.g., CS 101"
            />
            <TextField
              label="Course Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Introduction to Computer Science"
            />
            <TextField
              label="Instructor"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              fullWidth
              placeholder="e.g., Dr. Smith"
            />
            <TextField
              label="Credit Hours"
              type="number"
              value={formData.creditHours}
              onChange={(e) => setFormData({ ...formData, creditHours: parseInt(e.target.value) })}
              fullWidth
              inputProps={{ min: 0, max: 6 }}
            />
            <TextField
              label="Academic Term"
              select
              value={formData.termId}
              onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
              fullWidth
              required
            >
              {availableTerms.map((term) => (
                <MenuItem key={term.id} value={term.id}>
                  {formatTermName(term)} ({new Date(term.startDate).toLocaleDateString()} - {new Date(term.endDate).toLocaleDateString()})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Course Status"
              select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              fullWidth
              required
              helperText="Set course status for scheduling and organization"
            >
              <MenuItem value="ACTIVE">
                <Stack direction="row" spacing={1} alignItems="center">
                  <RadioButtonUnchecked sx={{ fontSize: 16 }} />
                  <span>Active - Currently enrolled</span>
                </Stack>
              </MenuItem>
              <MenuItem value="COMPLETED">
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircle sx={{ fontSize: 16 }} />
                  <span>Completed - Finished course</span>
                </Stack>
              </MenuItem>
              <MenuItem value="ARCHIVED">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Archive sx={{ fontSize: 16 }} />
                  <span>Archived - Hide from dashboard</span>
                </Stack>
              </MenuItem>
              <MenuItem value="UPCOMING">
                <Stack direction="row" spacing={1} alignItems="center">
                  <Upcoming sx={{ fontSize: 16 }} />
                  <span>Upcoming - Future semester</span>
                </Stack>
              </MenuItem>
            </TextField>

            {/* Meeting schedule input */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Meeting Schedule
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    label="Day"
                    value={scheduleDraft.dayOfWeek}
                    onChange={(e) => setScheduleDraft({ ...scheduleDraft, dayOfWeek: Number(e.target.value) })}
                    fullWidth
                  >
                    {dayLabels.map((label, idx) => (
                      <MenuItem key={idx} value={idx}>{label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Start"
                    type="time"
                    value={scheduleDraft.startTime}
                    onChange={(e) => setScheduleDraft({ ...scheduleDraft, startTime: e.target.value })}
                    fullWidth
                    inputProps={{ step: 300 }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="End"
                    type="time"
                    value={scheduleDraft.endTime}
                    onChange={(e) => setScheduleDraft({ ...scheduleDraft, endTime: e.target.value })}
                    fullWidth
                    inputProps={{ step: 300 }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    select
                    label="Type"
                    value={scheduleDraft.type}
                    onChange={(e) => setScheduleDraft({ ...scheduleDraft, type: e.target.value as any })}
                    fullWidth
                  >
                    {meetingTypes.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={10}>
                  <TextField
                    label="Location (optional)"
                    value={scheduleDraft.location}
                    onChange={(e) => setScheduleDraft({ ...scheduleDraft, location: e.target.value })}
                    fullWidth
                    placeholder="Building / room / link"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button fullWidth variant="outlined" onClick={addScheduleItem}>
                    Add
                  </Button>
                </Grid>
              </Grid>

              {formData.schedule.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                  {formData.schedule.map((item, index) => (
                    <Chip
                      key={`${item.dayOfWeek}-${item.startTime}-${index}`}
                      label={`${dayLabels[item.dayOfWeek]} ${item.startTime}-${item.endTime} (${item.type})`}
                      onDelete={() => removeScheduleItem(index)}
                    />
                  ))}
                </Stack>
              )}
            </Box>

            <TextField
              label="Color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCourse ? 'Update' : 'Add'} Course
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
