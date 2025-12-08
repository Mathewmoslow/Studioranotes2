"use client";

import React from 'react';
import { notFound } from 'next/navigation';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import SchedulerView from '@/components/scheduler/SchedulerView';
import { loadRawCanvasFixture } from '@/lib/fixtures/fixtureHarness';
import { rawCanvasFixture } from '@/lib/fixtures/rawCanvasFixture';
import { useScheduleStore } from '@/stores/useScheduleStore';

const enabled = process.env.NEXT_PUBLIC_ENABLE_FIXTURE === 'true';

export default function SchedulerMockPage() {
  if (!enabled) return notFound();

  const { generateSmartSchedule } = useScheduleStore();

  const handleLoadRaw = () => {
    try {
      console.group('[DEBUG] Raw Canvas fixture payload');
      rawCanvasFixture.courses.forEach((course) => {
        const events = course.calendar_events || [];
        console.log(`Course ${course.id} events:`, events);
        const missingType = events.filter(evt => !evt.event_type && !evt.title?.toLowerCase?.().includes('exam'));
        if (missingType.length) {
          console.warn(`Course ${course.id} missing event types`, missingType);
        }
      });
    } finally {
      console.groupEnd();
    }
    loadRawCanvasFixture(rawCanvasFixture);
  };

  const handleGenerate = () => {
    generateSmartSchedule();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 2, mb: 2 }} elevation={0}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>Scheduler Mock (compact)</Typography>
            <Typography variant="body2" color="text.secondary">
              Load the raw fixture and generate a schedule to preview compact/mobile-friendly block styling.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={handleLoadRaw}>Load Raw Fixture</Button>
            <Button variant="outlined" onClick={handleGenerate}>Generate Schedule</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}>
        <SchedulerView compact />
      </Paper>
    </Container>
  );
}
