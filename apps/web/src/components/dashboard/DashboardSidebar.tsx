'use client'

import React, { useState } from 'react'
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
  Collapse,
  Chip,
  Stack,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Description as NotesIcon,
  Settings as SettingsIcon,
  Assignment as AssignmentIcon,
  ExpandMore,
  ExpandLess,
  Circle,
} from '@mui/icons-material'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { useScheduleStore } from '@/stores/useScheduleStore'

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
  const [tasksExpanded, setTasksExpanded] = useState(true)

  const { courses, tasks, getUpcomingTasks } = useScheduleStore()

  // Get upcoming tasks (next 14 days)
  const upcomingTasks = getUpcomingTasks(14)
    .filter(t => t.status !== 'completed')
    .slice(0, 8)

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

  const getTaskDueLabel = (dueDate: Date) => {
    const date = new Date(dueDate)
    if (isPast(date) && !isToday(date)) return 'Overdue'
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM d')
  }

  const getTaskDueColor = (dueDate: Date) => {
    const date = new Date(dueDate)
    if (isPast(date) && !isToday(date)) return 'error.main'
    if (isToday(date)) return 'warning.main'
    if (isTomorrow(date)) return 'warning.light'
    return 'text.secondary'
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
      <List sx={{ pt: 1 }}>
        {sidebarItems.map(renderItem)}
      </List>

      <Divider sx={{ mx: 2, my: 1 }} />

      {/* Collapsible Tasks section */}
      {!collapsed && (
        <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ListItemButton
            onClick={() => setTasksExpanded(!tasksExpanded)}
            sx={{
              mx: 1,
              borderRadius: 1,
              py: 1,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <AssignmentIcon fontSize="small" color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Tasks"
              primaryTypographyProps={{
                fontSize: 14,
                fontWeight: 600,
              }}
            />
            <Chip
              label={upcomingTasks.length}
              size="small"
              sx={{
                height: 20,
                fontSize: 11,
                mr: 1,
                bgcolor: 'primary.main',
                color: '#fff',
              }}
            />
            {tasksExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </ListItemButton>

          <Collapse in={tasksExpanded} sx={{ flex: 1, overflow: 'hidden' }}>
            <Box
              sx={{
                maxHeight: 300,
                overflowY: 'auto',
                px: 1,
                pb: 1,
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
              }}
            >
              {upcomingTasks.length === 0 ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', px: 2, py: 1 }}
                >
                  No upcoming tasks
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  {upcomingTasks.map((task) => {
                    const course = courses.find(c => c.id === task.courseId)
                    return (
                      <Box
                        key={task.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 1,
                          p: 1,
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        onClick={() => router.push(`/courses/${task.courseId}`)}
                      >
                        <Circle
                          sx={{
                            fontSize: 8,
                            mt: 0.7,
                            color: course?.color || 'primary.main',
                          }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: 13,
                            }}
                          >
                            {task.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: getTaskDueColor(task.dueDate),
                              fontWeight: 500,
                            }}
                          >
                            {getTaskDueLabel(task.dueDate)}
                          </Typography>
                        </Box>
                      </Box>
                    )
                  })}
                </Stack>
              )}
            </Box>
          </Collapse>
        </Box>
      )}

      {/* Collapsed tasks indicator */}
      {collapsed && (
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            sx={{
              minHeight: 48,
              justifyContent: 'center',
              px: 2.5,
              py: 1,
              borderRadius: 1,
              mx: 1,
              position: 'relative',
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                justifyContent: 'center',
                color: 'text.secondary',
              }}
            >
              <AssignmentIcon />
            </ListItemIcon>
            {upcomingTasks.length > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 12,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: '#fff',
                  fontSize: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                }}
              >
                {upcomingTasks.length}
              </Box>
            )}
          </ListItemButton>
        </ListItem>
      )}

      <Box sx={{ flexGrow: collapsed ? 1 : 0 }} />

      <Divider sx={{ mx: 2, mb: 1 }} />

      {/* Bottom navigation */}
      <List sx={{ pb: 2 }}>
        {bottomItems.map(renderItem)}
      </List>
    </Box>
  )
}
