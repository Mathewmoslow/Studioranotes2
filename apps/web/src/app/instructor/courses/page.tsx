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
  IconButton,
} from '@mui/material'
import {
  Add,
  MoreVert,
  School,
  People,
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { useScheduleStore } from '@/stores/useScheduleStore'

export default function InstructorCourses() {
  const router = useRouter()
  const { courses } = useScheduleStore()

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Courses
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your courses and class materials.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          color="secondary"
        >
          Add Course
        </Button>
      </Stack>

      {courses.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <School sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Courses Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add your first course to start creating materials.
          </Typography>
          <Button variant="contained" startIcon={<Add />} color="secondary">
            Add Course
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} md={6} lg={4} key={course.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderLeft: 4,
                  borderColor: course.color || 'secondary.main',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
                }}
                onClick={() => router.push(`/instructor/courses/${course.id}`)}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {course.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {course.code}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                      <MoreVert />
                    </IconButton>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Chip
                      icon={<People sx={{ fontSize: 16 }} />}
                      label="0 students"
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${course.notesCount || 0} notes`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
