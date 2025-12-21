'use client'

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { AutoSyncProvider } from '@/components/AutoSyncProvider'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb', // Clean blue
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#7c3aed', // Purple accent
      light: '#8b5cf6',
      dark: '#6d28d9',
    },
    background: {
      default: '#f9fafb', // Subtle gray background
      paper: '#ffffff',
    },
    divider: '#e5e7eb',
    text: {
      primary: '#111827',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 6, // Flatter corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 6,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 6,
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        },
        elevation2: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          border: '1px solid #e5e7eb',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 2,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AutoSyncProvider>
            {children}
          </AutoSyncProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}