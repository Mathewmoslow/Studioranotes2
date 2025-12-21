'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  PhotoCamera,
  PersonAdd,
  Share,
  School,
} from '@mui/icons-material';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { useSession } from 'next-auth/react';

const studyTimeChips = [
  { key: 'earlyMorning', label: 'Early Morning' },
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
  { key: 'night', label: 'Night' },
];

const dayKeys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const dayLabels: Record<typeof dayKeys[number], string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export default function MyStudiora() {
  const { data: session } = useSession();
  const { preferences, updatePreferences, updateSchedulerConfig } = useScheduleStore();
  const prefs = useMemo(() => preferences || {}, [preferences]);

  // Profile state
  const [displayName, setDisplayName] = useState(session?.user?.name || '');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [school, setSchool] = useState('');

  // Preferences state
  const [studyStart, setStudyStart] = useState(prefs.studyHours?.start || '09:00');
  const [studyEnd, setStudyEnd] = useState(prefs.studyHours?.end || '21:00');
  const [sessionDuration, setSessionDuration] = useState(prefs.sessionDuration || 50);
  const [studyDays, setStudyDays] = useState(prefs.studyDays || {
    monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false
  });
  const [preferredTimes, setPreferredTimes] = useState<any>(
    prefs.preferredStudyTimes || { morning: true, afternoon: true, evening: false, earlyMorning: false, night: false }
  );
  const [defaultDurations, setDefaultDurations] = useState({
    assignment: prefs.defaultHoursPerType?.assignment || 3,
    exam: prefs.defaultHoursPerType?.exam || 8,
    project: prefs.defaultHoursPerType?.project || 10,
    reading: prefs.defaultHoursPerType?.reading || 2,
    quiz: prefs.defaultHoursPerType?.quiz || 2,
    lab: prefs.defaultHoursPerType?.lab || 4,
  });

  const toggleDay = (key: typeof dayKeys[number]) => {
    setStudyDays({ ...studyDays, [key]: !studyDays[key] });
  };

  const toggleChip = (key: string) => {
    setPreferredTimes({ ...preferredTimes, [key]: !preferredTimes[key] });
  };

  const handleSave = () => {
    updatePreferences({
      studyHours: { start: studyStart, end: studyEnd },
      sessionDuration: Number(sessionDuration),
      studyDays,
      preferredStudyTimes: preferredTimes,
      defaultHoursPerType: defaultDurations,
    });
  };

  const handleInviteFriends = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Studiora',
        text: 'Check out Studiora - AI-powered study scheduling!',
        url: 'https://studiora.io',
      });
    } else {
      navigator.clipboard.writeText('https://studiora.io');
      alert('Link copied to clipboard!');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f7f9fb', pb: 6 }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(120deg, #0ea5e9 0%, #7c3aed 70%)',
          color: '#fff',
          py: 4,
          mb: 3,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h4" fontWeight={800}>myStudiora</Typography>
          <Typography color="rgba(255,255,255,0.85)">Your profile and study preferences</Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Stack spacing={3}>
          {/* Profile Section */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Profile</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
              {/* Avatar */}
              <Box sx={{ textAlign: 'center' }}>
                <Avatar
                  src={session?.user?.image || undefined}
                  sx={{ width: 100, height: 100, mb: 1, bgcolor: 'primary.main' }}
                >
                  {displayName?.charAt(0) || 'U'}
                </Avatar>
                <IconButton size="small" color="primary">
                  <PhotoCamera fontSize="small" />
                </IconButton>
              </Box>

              {/* Profile Fields */}
              <Grid container spacing={2} sx={{ flex: 1 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="School"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    size="small"
                    placeholder="University of..."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Major"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    size="small"
                    placeholder="Computer Science"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    size="small"
                    placeholder="Junior"
                  />
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          {/* Invite Friends */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Connect with Friends</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Invite classmates to Studiora and study together.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<Share />}
                onClick={handleInviteFriends}
              >
                Share Invite Link
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonAdd />}
                disabled
              >
                Find Classmates (Coming Soon)
              </Button>
            </Stack>
          </Paper>

          {/* Study Schedule */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Study Schedule</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="Start time"
                  type="time"
                  fullWidth
                  size="small"
                  value={studyStart}
                  onChange={(e) => setStudyStart(e.target.value)}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  label="End time"
                  type="time"
                  fullWidth
                  size="small"
                  value={studyEnd}
                  onChange={(e) => setStudyEnd(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Session duration (min)"
                  type="number"
                  fullWidth
                  size="small"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                  inputProps={{ min: 20, max: 120 }}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Study Days</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {dayKeys.map((key) => (
                <Chip
                  key={key}
                  label={dayLabels[key]}
                  color={studyDays[key] ? 'primary' : 'default'}
                  onClick={() => toggleDay(key)}
                  variant={studyDays[key] ? 'filled' : 'outlined'}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Preferred Times</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {studyTimeChips.map((chip) => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  color={preferredTimes[chip.key] ? 'primary' : 'default'}
                  variant={preferredTimes[chip.key] ? 'filled' : 'outlined'}
                  onClick={() => toggleChip(chip.key)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Paper>

          {/* Task Defaults */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Task Duration Defaults (hours)</Typography>
            <Grid container spacing={2}>
              {Object.entries(defaultDurations).map(([key, value]) => (
                <Grid item xs={6} sm={4} md={2} key={key}>
                  <TextField
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    type="number"
                    fullWidth
                    size="small"
                    value={value}
                    onChange={(e) => setDefaultDurations({ ...defaultDurations, [key]: Number(e.target.value) })}
                    inputProps={{ min: 0.5, max: 20, step: 0.5 }}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Save Button */}
          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            sx={{ alignSelf: 'flex-end' }}
          >
            Save Changes
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
