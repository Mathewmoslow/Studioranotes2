'use client'

import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material'
import { Archive, Close } from '@mui/icons-material'
import { useAutoArchive } from '@/hooks/useAutoArchive'

export function ArchivePrompt() {
  const { archiveStatus, showArchivePrompt, performArchive, dismissArchive } = useAutoArchive()

  if (!showArchivePrompt || !archiveStatus) {
    return null
  }

  return (
    <Dialog open={showArchivePrompt} onClose={dismissArchive} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Archive color="primary" />
        Semester Complete - Archive Courses?
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          {archiveStatus.termName} ended {archiveStatus.daysAfterEnd} days ago
        </Alert>
        <Typography variant="body1" gutterBottom>
          Would you like to archive <strong>{archiveStatus.courseCount} courses</strong> from the completed semester?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Archiving will:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <Typography component="li" variant="body2" color="text.secondary">
            Remove completed courses from your dashboard
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Clear past tasks and events from the scheduler
          </Typography>
          <Typography component="li" variant="body2" color="text.secondary">
            Keep your notes - they won't be affected
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
          You can dismiss this and continue using your current courses if needed.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={dismissArchive} startIcon={<Close />}>
          Not Now
        </Button>
        <Button
          variant="contained"
          onClick={performArchive}
          startIcon={<Archive />}
          color="primary"
        >
          Archive Courses
        </Button>
      </DialogActions>
    </Dialog>
  )
}
