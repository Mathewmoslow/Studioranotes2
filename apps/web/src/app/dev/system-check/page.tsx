"use client";

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { Box, Button, Container, Paper, Stack, Typography, Chip } from '@mui/material';
import SchedulerView from '@/components/scheduler/SchedulerView';
import { loadDeterministicFixture } from '@/lib/fixtures/fixtureHarness';
import { useScheduleStore } from '@/stores/useScheduleStore';

const enabled = process.env.NEXT_PUBLIC_ENABLE_FIXTURE === 'true';

export default function SystemCheckPage() {
  if (!enabled) return notFound();

  const { generateSmartSchedule } = useScheduleStore();
  const [status, setStatus] = useState<string>('Ready to load deterministic 2026 fixture.');
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [health, setHealth] = useState<{ openaiEnabled: boolean; fixtureEnabled: boolean; mockExtraction: boolean } | null>(null);

  const handleLoadAndSchedule = async () => {
    setLoading(true);
    try {
      const res = loadDeterministicFixture();
      setStatus(`Loaded ${res.coursesLoaded} courses and ${res.tasksLoaded} tasks. Scheduling...`);
      await generateSmartSchedule();
      setStatus(`Scheduled. Courses: ${res.coursesLoaded}, Tasks: ${res.tasksLoaded}.`);
    } catch (err: any) {
      setStatus(err?.message || 'Failed to load/schedule fixture.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearTestData = async () => {
    setClearing(true);
    try {
      // Wipe the persisted Zustand store and in-memory entities
      (useScheduleStore as any)?.persist?.clearStorage?.();
      useScheduleStore.setState((state) => ({
        ...state,
        courses: [],
        tasks: [],
        timeBlocks: [],
        events: [],
        scheduleWarnings: { unscheduledTaskIds: [], message: '', details: [] },
      }));

      // Also clear browser storage to remove stray IndexedDB/localStorage data
      if (typeof window !== 'undefined') {
        try {
          window.localStorage?.clear?.();
          window.sessionStorage?.clear?.();
          window.indexedDB?.deleteDatabase?.('schedule-db');
          window.indexedDB?.deleteDatabase?.('StudioraDB');
        } catch (err) {
          console.warn('Clear test data (storage) failed:', err);
        }
      }

      setStatus('Cleared local test data. Reload or click Load & Schedule 2026 Fixture.');
    } catch (err: any) {
      setStatus(err?.message || 'Failed to clear local test data.');
    } finally {
      setClearing(false);
    }
  };
  
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const json = await res.json();
          setHealth({
            openaiEnabled: Boolean(json.openaiEnabled),
            fixtureEnabled: Boolean(json.fixtureEnabled),
            mockExtraction: Boolean(json.mockExtraction),
          });
        }
      } catch (e) {
        // swallow; pills just won't render
      }
    };
    fetchHealth();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 2, mb: 2 }} elevation={0}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={700}>Deterministic System Check</Typography>
            <Typography variant="body2" color="text.secondary">
              One dataset. One button. Loads the Jan–Mar 2026 fixture (4 courses, ≥20 tasks each) and schedules it.
            </Typography>
          </Box>
          {health && (
            <Stack direction="row" spacing={1}>
              <Chip size="small" label="OpenAI" color={health.openaiEnabled ? 'success' : 'error'} />
              <Chip size="small" label="Fixture" color={health.fixtureEnabled ? 'success' : 'error'} />
              <Chip size="small" label="Mock" color={health.mockExtraction ? 'error' : 'success'} />
            </Stack>
          )}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mt={2}>
          <Button variant="contained" onClick={handleLoadAndSchedule} disabled={loading}>
            {loading ? 'Loading & Scheduling…' : 'Load & Schedule 2026 Fixture'}
          </Button>
          <Button variant="outlined" onClick={handleClearTestData} disabled={loading || clearing}>
            {clearing ? 'Clearing…' : 'Clear test data'}
          </Button>
          <Typography variant="body2" color="text.secondary">{status}</Typography>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 1 }}>
        <SchedulerView compact />
      </Paper>
    </Container>
  );
}
