'use client'

import React, { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Divider,
  Paper,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material'
import { Google, Microsoft, Email } from '@mui/icons-material'
import Image from 'next/image'

function SignInContent() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState('')

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailLoading(true)
    setEmailError('')

    try {
      const result = await signIn('email', {
        email,
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        setEmailError('Failed to send sign-in link. Please try again.')
      } else {
        setEmailSent(true)
      }
    } catch (err) {
      setEmailError('An error occurred. Please try again.')
    } finally {
      setEmailLoading(false)
    }
  }

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'OAuthSignin':
      case 'OAuthCallback':
        return 'There was a problem signing in with your provider. Please try again.'
      case 'OAuthCreateAccount':
        return 'Could not create account. Please try a different sign-in method.'
      case 'EmailCreateAccount':
        return 'Could not create account with this email.'
      case 'Callback':
        return 'There was an error during sign in. Please try again.'
      case 'EmailNotAllowed':
        return 'Only .edu email addresses are allowed for email sign-in.'
      case 'AccessDenied':
        return 'Access denied. You may not have permission to sign in.'
      default:
        return errorCode ? 'An error occurred during sign in.' : null
    }
  }

  if (emailSent) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f9fafb', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <Image src="/logos/logo-blue.svg" alt="Studiora" width={180} height={50} style={{ height: 'auto' }} />
            </Box>
            <Email sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Check your email
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We sent a sign-in link to <strong>{email}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click the link in the email to sign in. The link expires in 24 hours.
            </Typography>
            <Button
              variant="text"
              onClick={() => setEmailSent(false)}
              sx={{ mt: 3 }}
            >
              Use a different email
            </Button>
          </Paper>
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f9fafb', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Image src="/logos/logo-blue.svg" alt="Studiora" width={180} height={50} style={{ height: 'auto' }} />
          </Box>

          <Typography variant="h5" fontWeight={700} textAlign="center" gutterBottom>
            Sign in to Studiora
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            Smart schedule. Smart study. Smart semester.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {getErrorMessage(error)}
            </Alert>
          )}

          <Stack spacing={2}>
            {/* Google Sign In */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Google />}
              onClick={() => signIn('google', { callbackUrl })}
              sx={{
                py: 1.5,
                borderColor: '#e2e8f0',
                color: 'text.primary',
                '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
              }}
            >
              Continue with Google
            </Button>

            {/* Microsoft Sign In */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Microsoft />}
              onClick={() => signIn('azure-ad', { callbackUrl })}
              sx={{
                py: 1.5,
                borderColor: '#e2e8f0',
                color: 'text.primary',
                '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
              }}
            >
              Continue with Microsoft
            </Button>
          </Stack>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Email Magic Link */}
          <form onSubmit={handleEmailSignIn}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                type="email"
                label="Email address"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                error={!!emailError}
                helperText={emailError || "We'll send you a sign-in link"}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={emailLoading || !email}
                startIcon={emailLoading ? <CircularProgress size={20} /> : <Email />}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
                }}
              >
                {emailLoading ? 'Sending...' : 'Sign in with Email'}
              </Button>
            </Stack>
          </form>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    }>
      <SignInContent />
    </Suspense>
  )
}
