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
  Button,
  Paper,
} from '@mui/material'
import {
  Add,
  Description,
  MenuBook,
  Quiz,
  Slideshow,
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'

const noteTemplates = [
  {
    id: 'lecture',
    label: 'Lecture Notes',
    description: 'Learning objectives, key concepts, discussion questions',
    icon: <Slideshow sx={{ fontSize: 40 }} />,
    color: 'primary.main',
  },
  {
    id: 'study-guide',
    label: 'Study Guide',
    description: 'Chapter summary, key terms, practice questions for students',
    icon: <MenuBook sx={{ fontSize: 40 }} />,
    color: 'secondary.main',
  },
  {
    id: 'textbook',
    label: 'Textbook Chapter',
    description: 'Formal academic structure with theory and examples',
    icon: <Description sx={{ fontSize: 40 }} />,
    color: 'info.main',
  },
  {
    id: 'exam',
    label: 'Exam Materials',
    description: 'Review topics, sample questions, answer key, rubric',
    icon: <Quiz sx={{ fontSize: 40 }} />,
    color: 'warning.main',
  },
]

export default function InstructorNotes() {
  const router = useRouter()

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Notes & Materials
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Create lecture materials, study guides, and textbook chapters using AI assistance.
      </Typography>

      {/* Template Selection */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Create New Material
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {noteTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={3} key={template.id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
              }}
              onClick={() => {
                // TODO: Navigate to note creation with template
                console.log('Create note with template:', template.id)
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Box sx={{ color: template.color, mb: 2 }}>{template.icon}</Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {template.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {template.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Notes */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Recent Materials
      </Typography>
      <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'action.hover' }}>
        <Description sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Materials Created Yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select a template above to create your first instructor material.
        </Typography>
      </Paper>
    </Box>
  )
}
