'use client'

import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Button,
  Paper,
  TextField,
  Divider,
} from '@mui/material'
import {
  LibraryBooks,
  Add,
  DragIndicator,
  Download,
  Visibility,
} from '@mui/icons-material'
import { useState } from 'react'

export default function TextbookCompiler() {
  const [coverTitle, setCoverTitle] = useState('')
  const [coverAuthor, setCoverAuthor] = useState('')
  const [coverCourse, setCoverCourse] = useState('')

  // TODO: Fetch instructor notes to populate chapters
  const chapters: any[] = []

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Textbook Compiler
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Organize your notes into chapters and export as a formatted PDF textbook.
      </Typography>

      <Grid container spacing={3}>
        {/* Cover Page Settings */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Cover Page
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Textbook Title"
                  value={coverTitle}
                  onChange={(e) => setCoverTitle(e.target.value)}
                  placeholder="Introduction to..."
                />
                <TextField
                  fullWidth
                  label="Author Name"
                  value={coverAuthor}
                  onChange={(e) => setCoverAuthor(e.target.value)}
                  placeholder="Your name"
                />
                <TextField
                  fullWidth
                  label="Course"
                  value={coverCourse}
                  onChange={(e) => setCoverCourse(e.target.value)}
                  placeholder="NURS 320"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Chapter List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Chapters
                </Typography>
                <Button variant="outlined" startIcon={<Add />} size="small">
                  Add Chapter
                </Button>
              </Stack>

              {chapters.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'action.hover' }}>
                  <LibraryBooks sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No Chapters Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Create lecture notes first, then add them as chapters here.
                    Drag to reorder chapters.
                  </Typography>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {}}
                  >
                    Create Notes First
                  </Button>
                </Paper>
              ) : (
                <Stack spacing={1}>
                  {chapters.map((chapter, index) => (
                    <Paper
                      key={chapter.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        cursor: 'grab',
                        '&:hover': { backgroundColor: 'action.hover' },
                      }}
                    >
                      <DragIndicator sx={{ color: 'text.disabled' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 48 }}>
                        Ch. {index + 1}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ flex: 1 }}>
                        {chapter.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {chapter.notes?.length || 0} notes
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Actions */}
      <Divider sx={{ my: 4 }} />
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<Visibility />}
          disabled={chapters.length === 0}
        >
          Preview HTML
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Download />}
          disabled={chapters.length === 0}
        >
          Export PDF
        </Button>
      </Stack>

      {/* Coming Soon Notice */}
      <Paper sx={{ p: 3, mt: 4, textAlign: 'center', backgroundColor: 'secondary.light', color: 'secondary.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          PDF Export Coming Soon
        </Typography>
        <Typography variant="body2">
          Server-side PDF generation with professional formatting, page numbers, and table of contents.
        </Typography>
      </Paper>
    </Box>
  )
}
