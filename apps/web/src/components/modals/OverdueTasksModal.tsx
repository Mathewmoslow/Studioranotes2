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
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from '@mui/material'
import {
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { differenceInDays, format, addDays } from 'date-fns'

interface OverdueTasksModalProps {
  open: boolean
  onClose: () => void
  overdueTasks: Array<{
    id: string
    title: string
    dueDate: Date | string
    courseId: string
    estimatedHours: number
  }>
}

type ActionType = 'auto-schedule' | 'mark-complete' | 'review'

export default function OverdueTasksModal({ open, onClose, overdueTasks }: OverdueTasksModalProps) {
  const [selectedAction, setSelectedAction] = useState<ActionType>('auto-schedule')
  const [processing, setProcessing] = useState(false)
  const { scheduleTask, completeTask, generateSmartSchedule } = useScheduleStore()

  const totalOverdueHours = overdueTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0)
  const averageDaysOverdue = Math.round(
    overdueTasks.reduce((sum, task) => {
      const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate
      return sum + Math.abs(differenceInDays(new Date(), dueDate))
    }, 0) / overdueTasks.length
  )

  const handleProceed = async () => {
    setProcessing(true)

    try {
      if (selectedAction === 'auto-schedule') {
        // Auto schedule all overdue tasks with catch-up logic
        console.log('🔄 Auto-scheduling catch-up for', overdueTasks.length, 'overdue tasks...')

        // Use generateSmartSchedule which will handle all tasks including overdue ones
        // Schedule for the next 14 days starting from today
        const today = new Date()
        const endDate = addDays(today, 14)
        generateSmartSchedule(today, endDate)

        console.log('✅ Catch-up schedule created successfully')
      } else if (selectedAction === 'mark-complete') {
        // Mark all overdue tasks as complete
        console.log('✅ Marking', overdueTasks.length, 'tasks as complete...')

        for (const task of overdueTasks) {
          completeTask(task.id)
        }

        console.log('✅ All overdue tasks marked complete')
      } else if (selectedAction === 'review') {
        // Close modal and let user review individually
        console.log('👀 User will review tasks individually')
      }

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500))

      onClose()
    } catch (error) {
      console.error('Error processing overdue tasks:', error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundImage: 'linear-gradient(135deg, #fef3f2 0%, #fff 100%)',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1.5}>
          <WarningIcon sx={{ fontSize: 32, color: 'warning.main' }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Needs Attention
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {overdueTasks.length} overdue {overdueTasks.length === 1 ? 'task' : 'tasks'} detected
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={500}>
            You have <strong>{overdueTasks.length} tasks</strong> that are overdue by an average of{' '}
            <strong>{averageDaysOverdue} days</strong>, totaling approximately{' '}
            <strong>{totalOverdueHours} hours</strong> of work.
          </Typography>
        </Alert>

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Overdue Tasks:
        </Typography>

        <Box
          sx={{
            maxHeight: 200,
            overflowY: 'auto',
            mb: 3,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <List dense>
            {overdueTasks.slice(0, 10).map((task) => {
              const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate
              const daysOverdue = Math.abs(differenceInDays(new Date(), dueDate))

              return (
                <ListItem key={task.id}>
                  <ListItemText
                    primary={task.title}
                    secondary={
                      <Box component="span" display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Chip
                          label={`${daysOverdue}d overdue`}
                          size="small"
                          color="error"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {task.estimatedHours}h · Due {format(dueDate, 'MMM d')}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              )
            })}
            {overdueTasks.length > 10 && (
              <ListItem>
                <ListItemText
                  secondary={
                    <Typography variant="caption" color="text.secondary" fontStyle="italic">
                      + {overdueTasks.length - 10} more tasks...
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </Box>

        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          How would you like to proceed?
        </Typography>

        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value as ActionType)}
          >
            <Box
              sx={{
                border: '2px solid',
                borderColor: selectedAction === 'auto-schedule' ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 2,
                mb: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => setSelectedAction('auto-schedule')}
            >
              <FormControlLabel
                value="auto-schedule"
                control={<Radio />}
                label={
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ScheduleIcon color="primary" />
                      <Typography variant="body1" fontWeight={600}>
                        Auto Schedule Catch-Up
                      </Typography>
                      <Chip label="Recommended" size="small" color="primary" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                      Automatically create study blocks for all overdue tasks over the next 3-7 days.
                      Tasks will be prioritized and scheduled during your optimal study times.
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, alignItems: 'flex-start' }}
              />
            </Box>

            <Box
              sx={{
                border: '2px solid',
                borderColor: selectedAction === 'mark-complete' ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 2,
                mb: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => setSelectedAction('mark-complete')}
            >
              <FormControlLabel
                value="mark-complete"
                control={<Radio />}
                label={
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircleIcon color="success" />
                      <Typography variant="body1" fontWeight={600}>
                        Mark All Complete
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                      Mark all overdue tasks as completed. Use this if you've already finished them
                      or if they're no longer relevant.
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, alignItems: 'flex-start' }}
              />
            </Box>

            <Box
              sx={{
                border: '2px solid',
                borderColor: selectedAction === 'review' ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => setSelectedAction('review')}
            >
              <FormControlLabel
                value="review"
                control={<Radio />}
                label={
                  <Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EditIcon color="action" />
                      <Typography variant="body1" fontWeight={600}>
                        Review Individually
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, ml: 4 }}>
                      Review each task manually and decide whether to keep, complete, or reschedule
                      them individually.
                    </Typography>
                  </Box>
                }
                sx={{ m: 0, alignItems: 'flex-start' }}
              />
            </Box>
          </RadioGroup>
        </FormControl>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={processing}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleProceed}
          disabled={processing}
          startIcon={processing && <CircularProgress size={16} />}
        >
          {processing ? 'Processing...' : 'Proceed'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
