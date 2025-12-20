'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Chip,
  Avatar,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  School,
  Schedule as ScheduleIcon,
  Description,
  AutoAwesome,
  TrendingUp,
  AccessTime,
  CalendarToday,
  Assignment,
  CloudUpload,
  Google,
} from '@mui/icons-material'
import Image from 'next/image'
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { useDatabaseSync } from '@/lib/db-sync'
import { getCanvasAutoSync } from '@/lib/canvas-auto-sync'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [loading, setLoading] = useState(true)
  const { courses, tasks, events } = useScheduleStore()

  // Enable database sync when user is logged in
  useDatabaseSync()

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboarding = async () => {
      if (session?.user?.email) {
        const completed = localStorage.getItem(`onboarding_${session.user.email}`)
        setOnboardingComplete(!!completed)
      }
      setLoading(false)
    }

    if (status === 'authenticated') {
      checkOnboarding()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [session, status])

  // Landing page for unauthenticated users
  if (status === 'unauthenticated') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f9fafb' }}>
        {/* Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
            color: '#fff',
            pt: 8,
            pb: 8,
          }}
        >
          <Container maxWidth="lg">
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
              <Avatar sx={{ bgcolor: 'white', width: 44, height: 44 }}>
                <Image src="/studiora-logo.png" alt="Studiora logo" width={28} height={28} />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>Studiora</Typography>
            </Stack>

            <Grid container spacing={6} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography variant="h3" fontWeight={800} sx={{ mb: 2 }}>
                  AI-powered study notes.<br />Smart scheduling.
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 4, maxWidth: 480 }}>
                  Generate comprehensive study notes with AI and keep your courses, assignments, and schedule organized in one place.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Google />}
                  onClick={() => signIn('google')}
                  sx={{
                    bgcolor: 'white',
                    color: '#1e3a5f',
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#f1f5f9' },
                  }}
                >
                  Sign in with Google
                </Button>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={2}>
                  <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <AutoAwesome />
                      <Box>
                        <Typography fontWeight={600}>AI Note Generation</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Create detailed study notes from any topic
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <ScheduleIcon />
                      <Box>
                        <Typography fontWeight={600}>Schedule Management</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Track assignments and due dates
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <School />
                      <Box>
                        <Typography fontWeight={600}>Canvas Integration</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Import courses and assignments automatically
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h5" fontWeight={700} textAlign="center" sx={{ mb: 4 }}>
            Everything you need to study smarter
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Description color="primary" sx={{ mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Smart Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generate comprehensive study notes with AI. Multiple styles and formats available.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <CalendarToday color="primary" sx={{ mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Task Tracking
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Keep track of assignments, exams, and due dates. Never miss a deadline.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <CloudUpload color="primary" sx={{ mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Canvas Sync
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connect to Canvas LMS and import your courses and assignments automatically.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    )
  }

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <LinearProgress sx={{ width: 200 }} />
          <Typography>Loading StudiOra Notes...</Typography>
        </Stack>
      </Box>
    )
  }

  // Onboarding flow for new users
  if (!onboardingComplete) {
    return (
      <OnboardingFlow
        onComplete={() => {
          if (session?.user?.email) {
            localStorage.setItem(`onboarding_${session.user.email}`, 'true')
            setOnboardingComplete(true)
          }
        }}
      />
    )
  }

  // Main dashboard for authenticated users
  return <UnifiedDashboard />
}
