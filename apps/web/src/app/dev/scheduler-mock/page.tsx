"use client";

import React from 'react';
import { notFound } from 'next/navigation';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import SchedulerView from '@/components/scheduler/SchedulerView';
import { loadRawCanvasFixture } from '@/lib/fixtures/fixtureHarness';
import shifted from '@/lib/fixtures/canvas-shifted.json';
import { useScheduleStore } from '@/stores/useScheduleStore';

const enabled = process.env.NEXT_PUBLIC_ENABLE_FIXTURE === 'true';

export default function SchedulerMockPage() {
  if (!enabled) return notFound();

  const { generateSmartSchedule } = useScheduleStore();

  const handleLoadFiltered = () => {
    // Use the filtered subset (same logic as /dev/mock-test)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const courses: any[] = (shifted as any)?.courses || [];
    const filtered = courses.filter((c: any) => {
      const start = c.start_at ? new Date(c.start_at) : null;
      const end = c.end_at ? new Date(c.end_at) : null;
      if (start && end) {
        return start >= sixMonthsAgo || end >= sixMonthsAgo;
      }
      return false;
    });
    const subset = filtered.length > 0 ? filtered.slice(0, 8) : courses.slice(0, 6);
    const fixtureLike = {
      courses: subset.map((c: any) => ({
        id: c.id,
        name: c.name,
        course_code: c.course_code,
        calendar_events: c.calendar_events || [],
        assignments: (c.assignments || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          due_at: a.due_at,
          points_possible: a.points_possible,
          description: a.description,
          submission_types: a.submission_types,
        })),
      })),
    } as any;

    loadRawCanvasFixture(fixtureLike);
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
              Load the filtered (recent) fixture and generate a schedule to preview compact/mobile-friendly block styling.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={handleLoadFiltered}>Load Filtered Fixture</Button>
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
