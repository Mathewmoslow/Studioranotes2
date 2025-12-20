'use client'

import React, { useState, useEffect } from 'react'
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
  Badge,
  Tooltip,
  alpha,
  Stack,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Search as SearchIcon,
  DarkMode,
  LightMode,
} from '@mui/icons-material'
import DashboardSidebar from './DashboardSidebar'
import DashboardWidgets from './DashboardWidgets'
import QuickActions from './QuickActions'

const DRAWER_WIDTH = 280
const DRAWER_WIDTH_COLLAPSED = 72

interface DashboardLayoutProps {
  children?: React.ReactNode
  onThemeToggle?: () => void
  isDarkMode?: boolean
}

export default function DashboardLayout({
  children,
  onThemeToggle,
  isDarkMode = false
}: DashboardLayoutProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [notifications, setNotifications] = useState(3)

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
          backdropFilter: 'blur(10px)',
          background: 'linear-gradient(120deg, #0ea5e9 0%, #7c3aed 70%)',
          borderBottom: `1px solid ${alpha('#fff', 0.18)}`,
          color: '#fff',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, color: '#fff' }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              color: '#fff',
              fontWeight: 600,
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Studiora.io Dashboard
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Search">
              <IconButton sx={{ color: 'rgba(255,255,255,0.85)' }}>
                <SearchIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Toggle theme">
              <IconButton onClick={onThemeToggle} sx={{ color: 'rgba(255,255,255,0.85)' }}>
                {isDarkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton sx={{ color: 'rgba(255,255,255,0.85)' }}>
                <Badge badgeContent={notifications} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Profile">
              <IconButton sx={{ ml: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  <AccountCircle />
                </Avatar>
              </IconButton>
            </Tooltip>
          </Stack>
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
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          mt: 8,
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 2 } }}>
          <QuickActions />
          {children || <DashboardWidgets />}
        </Container>
      </Box>
    </Box>
  )
}
