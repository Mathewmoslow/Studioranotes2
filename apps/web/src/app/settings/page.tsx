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
} from '@mui/material';
import { useScheduleStore } from '@/stores/useScheduleStore';

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

export default function SettingsPage() {
  const { preferences, updatePreferences, updateSchedulerConfig } = useScheduleStore();
  const prefs = useMemo(() => preferences || {}, [preferences]);

  const [studyStart, setStudyStart] = useState(prefs.studyHours?.start || '09:00');
  const [studyEnd, setStudyEnd] = useState(prefs.studyHours?.end || '21:00');
  const [maxDaily, setMaxDaily] = useState(prefs.maxDailyStudyHours || 8);
  const [sessionDuration, setSessionDuration] = useState(prefs.sessionDuration || 50);
  const [shortBreak, setShortBreak] = useState(useScheduleStore.getState().schedulerConfig.breakDuration.short);
  const [longBreak, setLongBreak] = useState(useScheduleStore.getState().schedulerConfig.breakDuration.long);
  const [studyDays, setStudyDays] = useState(prefs.studyDays || {
    monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false
  });
  const [allowWeekend, setAllowWeekend] = useState(Boolean(prefs.allowWeekendStudy));
  const [preferredTimes, setPreferredTimes] = useState<any>(
    prefs.preferredStudyTimes || { morning: true, afternoon: true, evening: false, earlyMorning: false, night: false }
  );

  const toggleDay = (key: typeof dayKeys[number]) => {
    const next = { ...studyDays, [key]: !studyDays[key] };
    setStudyDays(next);
    if (key === 'saturday' || key === 'sunday') {
      setAllowWeekend(next.saturday || next.sunday);
    }
  };

  const toggleChip = (key: string) => {
    const next = { ...preferredTimes, [key]: !preferredTimes[key] };
    setPreferredTimes(next);
  };

  const handleSave = () => {
    updatePreferences({
      studyHours: { start: studyStart, end: studyEnd },
      maxDailyStudyHours: Number(maxDaily),
      sessionDuration: Number(sessionDuration),
      studyDays,
      allowWeekendStudy: allowWeekend,
      preferredStudyTimes: preferredTimes,
    });
    updateSchedulerConfig({
      breakDuration: { short: Number(shortBreak), long: Number(longBreak) },
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Settings</Typography>
            <Typography color="text.secondary">Tune your study schedule. Changes apply to future scheduling.</Typography>
          </Box>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </Box>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Study hours & days</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Start time"
                type="time"
                fullWidth
                value={studyStart}
                onChange={(e) => setStudyStart(e.target.value)}
                inputProps={{ step: 300 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="End time"
                type="time"
                fullWidth
                value={studyEnd}
                onChange={(e) => setStudyEnd(e.target.value)}
                inputProps={{ step: 300 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Max hours per day"
                type="number"
                fullWidth
                value={maxDaily}
                onChange={(e) => setMaxDaily(e.target.value)}
                inputProps={{ min: 1, max: 18 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={<Checkbox checked={allowWeekend} onChange={(e) => setAllowWeekend(e.target.checked)} />}
                label="Allow weekend study"
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
            {dayKeys.map((key) => (
              <Chip
                key={key}
                label={dayLabels[key]}
                color={studyDays[key] ? 'primary' : 'default'}
                onClick={() => toggleDay(key)}
                variant={studyDays[key] ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Sessions & breaks</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Session duration (min)"
                type="number"
                fullWidth
                value={sessionDuration}
                onChange={(e) => setSessionDuration(e.target.value)}
                inputProps={{ min: 20, max: 180 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Short break (min)"
                type="number"
                fullWidth
                value={shortBreak}
                onChange={(e) => setShortBreak(e.target.value)}
                inputProps={{ min: 1, max: 60 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Long break (min)"
                type="number"
                fullWidth
                value={longBreak}
                onChange={(e) => setLongBreak(e.target.value)}
                inputProps={{ min: 5, max: 120 }}
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Preferred times</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {studyTimeChips.map((chip) => (
              <Chip
                key={chip.key}
                label={chip.label}
                color={preferredTimes[chip.key] ? 'primary' : 'default'}
                variant={preferredTimes[chip.key] ? 'filled' : 'outlined'}
                onClick={() => toggleChip(chip.key)}
              />
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
