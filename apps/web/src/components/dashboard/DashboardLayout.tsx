'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Container,
  Avatar,
  Tooltip,
  Stack,
  Breadcrumbs,
  Link,
} from '@mui/material'
import {
  Menu as MenuIcon,
  AccountCircle,
  ArrowBack,
  Home,
} from '@mui/icons-material'
import DashboardSidebar from './DashboardSidebar'

const DRAWER_WIDTH = 280
const DRAWER_WIDTH_COLLAPSED = 72

// Route to breadcrumb mapping
const ROUTE_NAMES: { [key: string]: string } = {
  '/': 'Dashboard',
  '/courses': 'Courses',
  '/notes': 'Notes',
  '/schedule': 'Schedule',
  '/settings': 'Settings',
}

interface DashboardLayoutProps {
  children?: React.ReactNode
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const theme = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Parse pathname for breadcrumbs
  const pathSegments = pathname.split('/').filter(Boolean)
  const isHome = pathname === '/'
  const canGoBack = !isHome

  useEffect(() => {
    if (isTablet) {
      setSidebarCollapsed(true)
    } else if (!isMobile) {
      setSidebarCollapsed(false)
    }
  }, [isTablet, isMobile])

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  const drawerWidth = sidebarCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          bgcolor: 'background.paper',
          borderBottom: `1px solid`,
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Back button - shows on non-home pages */}
          {canGoBack && (
            <Tooltip title="Go back">
              <IconButton
                color="inherit"
                onClick={() => router.back()}
                sx={{ mr: 1 }}
              >
                <ArrowBack />
              </IconButton>
            </Tooltip>
          )}

          {/* Breadcrumbs */}
          <Breadcrumbs
            aria-label="breadcrumb"
            sx={{
              flexGrow: 1,
              '& .MuiBreadcrumbs-separator': { mx: 0.5 },
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            <Link
              component="button"
              underline="hover"
              color={isHome ? 'text.primary' : 'inherit'}
              onClick={() => router.push('/')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontWeight: isHome ? 600 : 400,
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                fontSize: 'inherit',
              }}
            >
              <Home sx={{ mr: 0.5, fontSize: 18 }} />
              Dashboard
            </Link>
            {pathSegments.map((segment, index) => {
              const path = '/' + pathSegments.slice(0, index + 1).join('/')
              const isLast = index === pathSegments.length - 1
              const name = ROUTE_NAMES[path] || segment.charAt(0).toUpperCase() + segment.slice(1)

              return (
                <Link
                  key={path}
                  component="button"
                  underline={isLast ? 'none' : 'hover'}
                  color={isLast ? 'text.primary' : 'inherit'}
                  onClick={() => !isLast && router.push(path)}
                  sx={{
                    fontWeight: isLast ? 600 : 400,
                    cursor: isLast ? 'default' : 'pointer',
                    border: 'none',
                    background: 'none',
                    fontSize: 'inherit',
                  }}
                >
                  {name}
                </Link>
              )
            })}
          </Breadcrumbs>

          {/* Mobile title */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              display: { xs: 'block', sm: 'none' }
            }}
          >
            {ROUTE_NAMES[pathname] || 'Studiora'}
          </Typography>

          <Tooltip title="Profile">
            <IconButton>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <AccountCircle />
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
              borderRight: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.paper,
            },
          }}
        >
          <DashboardSidebar collapsed={sidebarCollapsed && !isMobile} />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          mt: 8,
          minWidth: 0, // Prevent flex item overflow
        }}
      >
        <Box sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 0, sm: 1 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
