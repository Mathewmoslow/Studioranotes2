'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Avatar,
  alpha,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Description as NotesIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'

interface SidebarItem {
  title: string
  icon: React.ReactNode
  path: string
}

interface DashboardSidebarProps {
  collapsed?: boolean
}

export default function DashboardSidebar({ collapsed = false }: DashboardSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Simplified navigation - one clear path to each feature
  const sidebarItems: SidebarItem[] = [
    { title: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { title: 'Courses', icon: <SchoolIcon />, path: '/courses' },
    { title: 'Notes', icon: <NotesIcon />, path: '/notes' },
  ]

  const bottomItems: SidebarItem[] = [
    { title: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ]

  const renderItem = (item: SidebarItem) => {
    const isActive = pathname === item.path

    return (
      <ListItem key={item.title} disablePadding sx={{ display: 'block' }}>
        <ListItemButton
          onClick={() => router.push(item.path)}
          sx={{
            minHeight: 48,
            justifyContent: collapsed ? 'center' : 'initial',
            px: 2.5,
            py: 1,
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            backgroundColor: isActive ? alpha('#2563eb', 0.08) : 'transparent',
            color: isActive ? 'primary.main' : 'text.primary',
            '&:hover': {
              backgroundColor: alpha('#2563eb', 0.04),
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: collapsed ? 0 : 2,
              justifyContent: 'center',
              color: isActive ? 'primary.main' : 'text.secondary',
            }}
          >
            {item.icon}
          </ListItemIcon>
          {!collapsed && (
            <ListItemText
              primary={item.title}
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
              }}
            />
          )}
        </ListItemButton>
      </ListItem>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 2, pt: 3 }}>
        {!collapsed ? (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, px: 1 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', mr: 1.5 }}>
              <SchoolIcon fontSize="small" />
            </Avatar>
            <Typography variant="h6" fontWeight={700}>
              Studiora
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
              <SchoolIcon fontSize="small" />
            </Avatar>
          </Box>
        )}
      </Box>

      <Divider sx={{ mx: 2, mb: 1 }} />

      {/* Main navigation */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {sidebarItems.map(renderItem)}
      </List>

      <Divider sx={{ mx: 2, mb: 1 }} />

      {/* Bottom navigation */}
      <List sx={{ pb: 2 }}>
        {bottomItems.map(renderItem)}
      </List>
    </Box>
  )
}
