'use client';

import React from 'react';
import {
  Box,
  Stack,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Popover,
  IconButton,
  Tooltip,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ViewAgenda as BandsIcon,
  ViewList as TextIcon,
  FormatBold as FillIcon,
  FormatItalic as OutlineIcon,
} from '@mui/icons-material';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { SchedulerViewStyle, DOTagStyle, DOTagFill } from '@studioranotes/types';

export default function SchedulerViewSettings() {
  const { schedulerViewPrefs, updateSchedulerViewPrefs } = useScheduleStore();
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="View Settings">
        <IconButton onClick={handleOpen} size="small">
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, minWidth: 280 }}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            View Settings
          </Typography>

          <Stack spacing={2}>
            {/* View Style: Bands vs Text */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Block Style
              </Typography>
              <ToggleButtonGroup
                value={schedulerViewPrefs.viewStyle}
                exclusive
                onChange={(_, value) => value && updateSchedulerViewPrefs({ viewStyle: value as SchedulerViewStyle })}
                size="small"
                fullWidth
              >
                <ToggleButton value="bands">
                  <BandsIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  Bands
                </ToggleButton>
                <ToggleButton value="text">
                  <TextIcon sx={{ mr: 0.5, fontSize: 18 }} />
                  Text
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Divider />

            {/* DO Tag Style: Lettered vs Plain */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                DO Tags
              </Typography>
              <ToggleButtonGroup
                value={schedulerViewPrefs.doTagStyle}
                exclusive
                onChange={(_, value) => value && updateSchedulerViewPrefs({ doTagStyle: value as DOTagStyle })}
                size="small"
                fullWidth
              >
                <ToggleButton value="lettered">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '4px',
                      bgcolor: '#3b82f6',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      R
                    </Box>
                    Lettered
                  </Box>
                </ToggleButton>
                <ToggleButton value="plain">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '4px',
                      bgcolor: '#3b82f6',
                    }} />
                    Plain
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* DO Tag Fill: Fill vs Outline */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                Tag Fill
              </Typography>
              <ToggleButtonGroup
                value={schedulerViewPrefs.doTagFill}
                exclusive
                onChange={(_, value) => value && updateSchedulerViewPrefs({ doTagFill: value as DOTagFill })}
                size="small"
                fullWidth
              >
                <ToggleButton value="fill">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '4px',
                      bgcolor: '#22c55e',
                    }} />
                    Fill
                  </Box>
                </ToggleButton>
                <ToggleButton value="outline">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '4px',
                      border: '2px solid #22c55e',
                      bgcolor: 'transparent',
                    }} />
                    Outline
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Divider />

            {/* Additional Settings */}
            <FormControlLabel
              control={
                <Switch
                  checked={schedulerViewPrefs.showTimeOnBlocks}
                  onChange={(e) => updateSchedulerViewPrefs({ showTimeOnBlocks: e.target.checked })}
                  size="small"
                />
              }
              label={<Typography variant="body2">Show time on blocks</Typography>}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={schedulerViewPrefs.compactMode}
                  onChange={(e) => updateSchedulerViewPrefs({ compactMode: e.target.checked })}
                  size="small"
                />
              }
              label={<Typography variant="body2">Compact mode</Typography>}
            />
          </Stack>

          {/* Preview */}
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Preview
            </Typography>
            <Stack spacing={0.5}>
              {/* Sample DUE item - always red */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '4px',
                  bgcolor: '#ef4444',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  D
                </Box>
                <Typography variant="caption" fontWeight={600}>DUE: Assignment</Typography>
              </Box>

              {/* Sample DO items */}
              {schedulerViewPrefs.viewStyle === 'text' ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '4px',
                      bgcolor: schedulerViewPrefs.doTagFill === 'fill' ? '#3b82f6' : 'transparent',
                      border: schedulerViewPrefs.doTagFill === 'outline' ? '2px solid #3b82f6' : 'none',
                      color: schedulerViewPrefs.doTagFill === 'fill' ? 'white' : '#3b82f6',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {schedulerViewPrefs.doTagStyle === 'lettered' ? 'R' : ''}
                    </Box>
                    <Typography variant="caption">Chapter 1 Reading</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '4px',
                      bgcolor: schedulerViewPrefs.doTagFill === 'fill' ? '#22c55e' : 'transparent',
                      border: schedulerViewPrefs.doTagFill === 'outline' ? '2px solid #22c55e' : 'none',
                      color: schedulerViewPrefs.doTagFill === 'fill' ? 'white' : '#22c55e',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {schedulerViewPrefs.doTagStyle === 'lettered' ? 'W' : ''}
                    </Box>
                    <Typography variant="caption">Problem Set 1</Typography>
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{
                    p: 0.75,
                    borderRadius: 1,
                    bgcolor: '#3b82f6',
                    color: 'white',
                  }}>
                    <Typography variant="caption" fontWeight={600}>Chapter 1 Reading</Typography>
                    {schedulerViewPrefs.showTimeOnBlocks && (
                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', fontSize: 10 }}>
                        9:00 AM - 10:00 AM
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{
                    p: 0.75,
                    borderRadius: 1,
                    bgcolor: '#22c55e',
                    color: 'white',
                  }}>
                    <Typography variant="caption" fontWeight={600}>Problem Set 1</Typography>
                  </Box>
                </>
              )}
            </Stack>
          </Box>
        </Box>
      </Popover>
    </>
  );
}
