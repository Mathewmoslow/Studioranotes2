'use client'

import React from 'react'
import { Box, Container, Typography, Paper, Button } from '@mui/material'
import { Email } from '@mui/icons-material'
import Image from 'next/image'
import Link from 'next/link'

export default function VerifyRequestPage() {
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
            A sign-in link has been sent to your email address.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Click the link in the email to sign in to your account.
            The link will expire in 24 hours.
          </Typography>
          <Button
            component={Link}
            href="/auth/signin"
            variant="outlined"
          >
            Back to sign in
          </Button>
        </Paper>
      </Container>
    </Box>
  )
}
