// use client
"use client";

import React from 'react';
import { notFound } from 'next/navigation';
import { Box, Button, Container, Paper, Stack, Typography, Divider, Alert } from '@mui/material';
import { canvasFixture } from '@/lib/fixtures/canvasFixture';
import { loadFixtureIntoStore, loadRawCanvasFixture, runFixtureAssertions, runRawFixtureAssertions } from '@/lib/fixtures/fixtureHarness';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { rawCanvasFixture } from '@/lib/fixtures/rawCanvasFixture';

const enabled = process.env.NEXT_PUBLIC_ENABLE_FIXTURE === 'true';

export default function FixturePage() {
  if (!enabled) return notFound();

  const [log, setLog] = React.useState<string[]>([]);
  const [stateSnapshot, setStateSnapshot] = React.useState<any>(null);
  const [lastFixture, setLastFixture] = React.useState<'simple' | 'raw'>('simple');

  const handleLoad = () => {
    loadFixtureIntoStore(canvasFixture);
    setLog((prev) => ['Fixture loaded'].concat(prev));
    setStateSnapshot(useScheduleStore.getState());
    setLastFixture('simple');
  };

  const handleLoadRaw = () => {
    loadRawCanvasFixture(rawCanvasFixture);
    setLog((prev) => ['Raw Canvas fixture loaded (pipeline sim)'].concat(prev));
    setStateSnapshot(useScheduleStore.getState());
    setLastFixture('raw');
  };

  const handleAssert = () => {
    if (lastFixture === 'raw') {
      const results = runRawFixtureAssertions(rawCanvasFixture);
      const messages = results.map(r => `${r.ok ? '✅' : '❌'} ${r.message}`);
      setLog((prev) => messages.concat(prev));
    } else {
      const result = runFixtureAssertions(canvasFixture);
      const messages = result.results.map(r => `${r.ok ? '✅' : '❌'} ${r.message}`);
      setLog((prev) => messages.concat(prev));
    }
    setStateSnapshot(useScheduleStore.getState());
  };

  const handleClear = () => {
    useScheduleStore.setState({
      courses: [],
      tasks: [],
      events: [],
      timeBlocks: [],
      preferences: useScheduleStore.getState().preferences,
      settings: useScheduleStore.getState().settings,
    });
    setLog((prev) => ['Cleared store'].concat(prev));
    setStateSnapshot(useScheduleStore.getState());
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>
            Fixture Harness (Canvas-style)
          </Typography>
          <Alert severity="info">
            Dev-only page. Set NEXT_PUBLIC_ENABLE_FIXTURE=true to enable. Loads deterministic courses with lectures, exams, due dates, and context.
          </Alert>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleLoad}>Load Fixture</Button>
            <Button variant="contained" color="secondary" onClick={handleLoadRaw}>Load Raw Canvas Fixture</Button>
            <Button variant="outlined" onClick={handleAssert}>Run Assertions</Button>
            <Button variant="text" onClick={handleClear}>Clear</Button>
          </Stack>
          <Divider />
          <Typography variant="subtitle1">Log</Typography>
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 220, overflow: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
            {log.length === 0 ? 'No entries yet.' : log.map((entry, idx) => <Box key={idx}>{entry}</Box>)}
          </Paper>
          <Divider />
          <Typography variant="subtitle1">Snapshot</Typography>
          <Paper variant="outlined" sx={{ p: 2, maxHeight: 320, overflow: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(stateSnapshot, null, 2)}</pre>
          </Paper>
        </Stack>
      </Paper>
    </Container>
  );
}
