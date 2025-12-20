'use client';

import React from 'react';
import { Box, Button, Typography, Paper, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Home as HomeIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error} reset={() => this.setState({ hasError: false })} />;
      }

      return <DefaultErrorFallback error={this.state.error} reset={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error }: { error?: Error; reset: () => void }) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      p: 3
    }}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%' }}>
        <Typography variant="h4" gutterBottom color="error">
          Something went wrong
        </Typography>

        <Alert severity="error" sx={{ mb: 3 }}>
          The application encountered an error while loading this content.
        </Alert>

        <Typography variant="body1" paragraph>
          This usually happens when note content is corrupted or incompatible. You can try:
        </Typography>

        <Box component="ul" sx={{ mb: 3 }}>
          <Typography component="li" variant="body2">
            Refreshing the page
          </Typography>
          <Typography component="li" variant="body2">
            Going back to the main page and regenerating the note
          </Typography>
          <Typography component="li" variant="body2">
            Clearing your browser cache
          </Typography>
        </Box>

        {error && (
          <details style={{ marginBottom: '20px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
              <Typography variant="caption">Technical details</Typography>
            </summary>
            <Box sx={{
              background: '#f5f5f5',
              p: 2,
              borderRadius: 1,
              fontSize: '12px',
              fontFamily: 'monospace',
              overflow: 'auto'
            }}>
              {error.toString()}
              {error.stack && (
                <pre style={{ margin: 0, fontSize: '11px' }}>
                  {error.stack}
                </pre>
              )}
            </Box>
          </details>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleGoHome}
            startIcon={<HomeIcon />}
          >
            Go to Main Page
          </Button>
          <Button
            variant="outlined"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
          >
            Refresh Page
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default ErrorBoundary;
