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
  Schedule,
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
      <Box sx={{ minHeight: '100vh', bgcolor: '#f7f9fb' }}>
        <Box
          sx={{
            background: 'linear-gradient(120deg, #0ea5e9 0%, #7c3aed 60%, #111827 100%)',
            color: '#fff',
            pt: 6,
            pb: 4,
          }}
        >
          <Container maxWidth="lg">
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Avatar sx={{ bgcolor: 'white', width: 52, height: 52 }}>
                <Image src="/studiora-logo.png" alt="Studiora logo" width={36} height={36} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={800}>Studiora.io</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>The calmer, clearer academic cockpit.</Typography>
              </Box>
            </Stack>

            <Grid container spacing={4} alignItems="center">
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h2" fontWeight={800} sx={{ fontSize: { xs: '2.5rem', md: '3.25rem' }, mb: 2 }}>
                  Plan less. Learn more.
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.88)', mb: 3, maxWidth: 520 }}>
                  Studiora.io blends deterministic scheduling with AI notes so your courses, due dates, and study blocks stay aligned without noise.
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
                  <Chip icon={<Schedule />} label="Deterministic scheduler" sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff' }} />
                  <Chip icon={<Description />} label="AI notes" sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff' }} />
                  <Chip icon={<School />} label="Canvas sync" sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff' }} />
                </Stack>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Google />}
                  onClick={() => signIn('google')}
                  sx={{
                    bgcolor: '#111827',
                    color: '#fff',
                    px: 4,
                    py: 1.5,
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#0f172a' },
                  }}
                >
                  Sign in with Google
                </Button>
                <Typography variant="body2" sx={{ mt: 1.5, color: 'rgba(255,255,255,0.8)' }}>
                  No credit card • Built for students • Fast onboarding
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={4} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.96)', borderRadius: 3 }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DashboardIcon color="primary" />
                      <Typography variant="subtitle1" fontWeight={700}>Schedule + Notes in one place</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Deterministic fixtures for system checks, AI summaries for each course, and automatic Canvas imports keep your calendar and notes synced.
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Card variant="outlined">
                          <CardContent>
                            <CalendarToday color="primary" sx={{ mb: 1 }} />
                            <Typography fontWeight={700}>Deterministic scheduling</Typography>
                            <Typography variant="body2" color="text.secondary">
                              One-click 2026 fixture to validate the entire scheduling flow.
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Card variant="outlined">
                          <CardContent>
                            <Description color="secondary" sx={{ mb: 1 }} />
                            <Typography fontWeight={700}>AI Notes</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Generate concise course notes and study guides instantly.
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Schedule color="primary" />
                  <Typography fontWeight={700}>Deterministic checks</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Run the 2026 fixture, see chips turn green, and confirm 88/88 tasks are scheduled.
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <TrendingUp color="secondary" />
                  <Typography fontWeight={700}>Progress at a glance</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Calm, high-contrast blocks with minimal noise so you can spot what matters now.
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <AutoAwesome color="info" />
                  <Typography fontWeight={700}>Notes + Scheduling</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Pair every scheduled block with the right notes and prep tasks, automatically.
                </Typography>
              </Paper>
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
