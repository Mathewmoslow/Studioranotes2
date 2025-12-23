'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
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
  PlayCircle,
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
  const [videoPlaying, setVideoPlaying] = useState(false)
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
            <Box sx={{ mb: 4 }}>
              <Image
                src="/logos/logo-white.svg"
                alt="Studiora"
                width={200}
                height={56}
                priority
                style={{ height: 'auto' }}
              />
            </Box>

            <Grid container spacing={6} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    }}
                  >
                    Smart schedule.
                  </Typography>
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                    }}
                  >
                    Smart study.
                  </Typography>
                  <Typography
                    variant="h3"
                    fontWeight={800}
                    sx={{
                      lineHeight: 1.1,
                      letterSpacing: '-0.02em',
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                      background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Smart semester.
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 4, maxWidth: 520 }}>
                  Schedule your entire semester, including the time needed to study and do assignments with one click. Format and organize your notes or generate Studiora-guided notes from course content.
                </Typography>
                <Button
                  component={Link}
                  href="/auth/signin"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: '#1e3a5f',
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#f1f5f9' },
                  }}
                >
                  Get Started Free
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

        {/* Hero Video Section - Apple-style with thumbnail + play button */}
        <Box
          sx={{
            bgcolor: '#0f172a',
            py: { xs: 6, md: 10 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle gradient overlay for depth */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="overline"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  letterSpacing: '0.2em',
                  fontSize: '0.75rem',
                }}
              >
                See it in action
              </Typography>
            </Box>
            <Box
              onClick={() => setVideoPlaying(true)}
              sx={{
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden',
                aspectRatio: '16/9',
                maxWidth: 900,
                mx: 'auto',
                cursor: videoPlaying ? 'default' : 'pointer',
                boxShadow: '0 25px 80px -12px rgba(0, 0, 0, 0.8)',
                transform: 'perspective(1000px) rotateX(2deg)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': videoPlaying ? {} : {
                  transform: 'perspective(1000px) rotateX(0deg) scale(1.02)',
                  boxShadow: '0 35px 100px -12px rgba(37, 99, 235, 0.4)',
                },
              }}
            >
              {videoPlaying ? (
                <video
                  autoPlay
                  controls
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                >
                  <source src="/videos/hero-student.mp4" type="video/mp4" />
                </video>
              ) : (
                <>
                  {/* Video thumbnail - first frame or custom image */}
                  <Box
                    component="video"
                    muted
                    playsInline
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  >
                    <source src="/videos/hero-student.mp4#t=0.1" type="video/mp4" />
                  </Box>
                  {/* Dark overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)',
                    }}
                  />
                  {/* Play button - centered, Apple-style */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 88,
                        height: 88,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: '0 12px 48px rgba(0,0,0,0.4)',
                        },
                      }}
                    >
                      <PlayCircle
                        sx={{
                          fontSize: 56,
                          color: '#1e3a5f',
                          ml: 0.5,
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        color: 'white',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                      }}
                    >
                      Watch the demo
                    </Typography>
                  </Box>
                  {/* Corner badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      right: 16,
                      bgcolor: 'rgba(0,0,0,0.6)',
                      backdropFilter: 'blur(8px)',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 500 }}>
                      2:08
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
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
