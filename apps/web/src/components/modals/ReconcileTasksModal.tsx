'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  Checkbox,
  FormControlLabel,
  Alert,
  Chip,
  Divider,
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { format, isPast } from 'date-fns'

interface ReconcileTasksModalProps {
  open: boolean
  onClose: () => void
  overdueTasks: Array<{
    id: string
    title: string
    dueDate: Date | string
    courseId: string
    courseName?: string
    estimatedHours: number
    type: string
  }>
}

export default function ReconcileTasksModal({ open, onClose, overdueTasks }: ReconcileTasksModalProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const { completeTask, courses, dynamicReschedule, autoRescheduleEnabled } = useScheduleStore()

  const handleToggle = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedTasks.size === overdueTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(overdueTasks.map(t => t.id)))
    }
  }

  const handleMarkComplete = () => {
    console.log(`🔄 Batch completing ${selectedTasks.size} tasks...`)

    // Mark selected tasks as complete WITHOUT triggering individual reschedules
    selectedTasks.forEach(taskId => {
      completeTask(taskId, true) // skipReschedule = true
    })

    // Trigger a single reschedule after all tasks are marked complete
    if (autoRescheduleEnabled && selectedTasks.size > 0) {
      console.log(`✅ Batch completion done. Triggering single reschedule for remaining tasks...`)
      dynamicReschedule()
    }

    // Close modal
    onClose()
  }

  const handleKeepAll = () => {
    // Don't mark anything as complete, just close
    // Tasks will remain visible with overdue flag
    onClose()
  }

  const getCourse = (courseId: string) => {
    return courses.find(c => c.id === courseId)
  }

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1.5}>
          <WarningIcon sx={{ fontSize: 32, color: 'warning.main' }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Task Reconciliation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {overdueTasks.length} tasks from past dates
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            These tasks have past due dates. Check off items you've already completed.
            Unchecked items will remain scheduled with an overdue indicator.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {selectedTasks.size} of {overdueTasks.length} selected
          </Typography>
          <Button size="small" onClick={handleSelectAll}>
            {selectedTasks.size === overdueTasks.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>

        <Box
          sx={{
            maxHeight: 400,
            overflowY: 'auto',
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <List dense sx={{ p: 0 }}>
            {overdueTasks.map((task, index) => {
              const course = getCourse(task.courseId)
              const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate
              const isChecked = selectedTasks.has(task.id)

              return (
                <React.Fragment key={task.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      cursor: 'pointer',
                    }}
                    onClick={() => handleToggle(task.id)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 1.5 }}>
                      <Checkbox
                        checked={isChecked}
                        onChange={() => handleToggle(task.id)}
                        sx={{ mt: -0.5 }}
                      />

                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body1"
                          fontWeight={500}
                          sx={{
                            textDecoration: isChecked ? 'line-through' : 'none',
                            opacity: isChecked ? 0.6 : 1,
                          }}
                        >
                          {task.title}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                          {course && (
                            <Chip
                              label={course.name}
                              size="small"
                              sx={{
                                bgcolor: course.color || 'primary.main',
                                color: 'white',
                                fontSize: '0.7rem',
                                height: 20,
                              }}
                            />
                          )}
                          <Chip
                            label={task.type}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Due: {format(dueDate, 'MMM d, yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {task.estimatedHours}h
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                </React.Fragment>
              )
            })}
          </List>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleKeepAll} variant="outlined">
          Keep All (I'll do these)
        </Button>
        <Button
          onClick={handleMarkComplete}
          variant="contained"
          disabled={selectedTasks.size === 0}
          startIcon={<CheckCircleIcon />}
        >
          Mark {selectedTasks.size} Complete
        </Button>
      </DialogActions>
    </Dialog>
  )
}
