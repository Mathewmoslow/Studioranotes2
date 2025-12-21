'use client'

import React from 'react'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  AppBar,
  IconButton,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  MenuBook,
  Description,
  CalendarMonth,
  LibraryBooks,
  Settings,
  Menu as MenuIcon,
  School,
} from '@mui/icons-material'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const drawerWidth = 240

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/instructor' },
  { label: 'Courses', icon: <MenuBook />, path: '/instructor/courses' },
  { label: 'Notes & Materials', icon: <Description />, path: '/instructor/notes' },
  { label: 'Schedule', icon: <CalendarMonth />, path: '/instructor/schedule' },
  { label: 'Textbook Compiler', icon: <LibraryBooks />, path: '/instructor/textbook' },
]

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleNavClick = (path: string) => {
    router.push(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const drawer = (
    <Box>
      <Toolbar sx={{ px: 2 }}>
        <School sx={{ mr: 1, color: 'secondary.main' }} />
        <Typography variant="h6" fontWeight={700} noWrap>
          Instructor
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={pathname === item.path}
              onClick={() => handleNavClick(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  borderRight: 3,
                  borderColor: 'secondary.main',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: pathname === item.path ? 'secondary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => handleNavClick('/settings')}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar for mobile */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: '100%',
            backgroundColor: 'background.paper',
            color: 'text.primary',
            boxShadow: 1,
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <School sx={{ mr: 1, color: 'secondary.main' }} />
            <Typography variant="h6" noWrap fontWeight={700}>
              Instructor
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Sidebar drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 8, md: 0 },
          backgroundColor: 'background.default',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
