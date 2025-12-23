'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Box, Container, Typography, Paper, Button, Alert, CircularProgress } from '@mui/material'
import { Error as ErrorIcon } from '@mui/icons-material'
import Image from 'next/image'
import Link from 'next/link'

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'You do not have permission to sign in.'
      case 'Verification':
        return 'The sign-in link is no longer valid. It may have expired or already been used.'
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
        return 'There was a problem signing in with your provider.'
      case 'EmailCreateAccount':
        return 'Could not create an account with this email address.'
      case 'Callback':
        return 'There was an error during the sign-in process.'
      case 'EmailNotAllowed':
        return 'Only .edu email addresses are allowed for email sign-in.'
      case 'SessionRequired':
        return 'Please sign in to access this page.'
      default:
        return 'An unexpected error occurred during sign in.'
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f9fafb', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 3 }}>
            <Image src="/logos/logo-blue.svg" alt="Studiora" width={180} height={50} style={{ height: 'auto' }} />
          </Box>
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Sign-in Error
          </Typography>
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            {getErrorMessage(error)}
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Please try signing in again. If the problem persists, try a different sign-in method.
          </Typography>
          <Button
            component={Link}
            href="/auth/signin"
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
            }}
          >
            Try again
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    }>
      <ErrorContent />
    </Suspense>
  )
}
