import React, { useState } from 'react';
import { Box, Button, Container, Paper, Stack, Typography, Chip, Divider } from '@mui/material';

const SAMPLE_CONTEXT = `
Reproductive Health Disorders: Women’s and Men’s Health Pre-Class Videos
Watch: Chapter 12: Management of Oncologic Disorders (33:23)
Watch: Chapters 51: Cervical Cancer (10:43)
Watch: Chapters 52: Breast Cancer (15:01)
Watch: Chapters 53: Male Reproductive System Disorders and Management (11:46)

Read Chapters 5-7 and Chapter 10
Chapter 5: Pain Assessment in Children (pp. 101-120)
`;

export default function MockTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [schedulerOutput, setSchedulerOutput] = useState<string[]>([]);
  const [schedulerRunning, setSchedulerRunning] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/canvas/extract-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabus: SAMPLE_CONTEXT,
          additionalContext: SAMPLE_CONTEXT,
          courseName: 'Mock Test Course',
          moduleDescriptions: [],
          assignmentDescriptions: [],
          pages: [],
          announcements: [],
          discussions: [],
          existingAssignments: [],
          existingEvents: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const json = await res.json();
      setResult(json);
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const runSchedulerMock = async () => {
    setSchedulerRunning(true);
    setSchedulerOutput([]);
    try {
      const res = await fetch('/dev/scheduler-mock');
      if (!res.ok) {
        throw new Error(`Scheduler mock failed (${res.status})`);
      }
      setSchedulerOutput([
        'Opened /dev/scheduler-mock. Open devtools console to view Scheduler Debug logs.',
        'Use the UI to click "Load Raw Fixture" and verify colors/layout.',
      ]);
    } catch (e: any) {
      setSchedulerOutput([e?.message || 'Unknown error']);
    } finally {
      setSchedulerRunning(false);
    }
  };

  const suggestions = result?.extracted?.suggestions || [];
  const tasks = result?.extracted?.tasks || [];

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Mock Context Extraction Test
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Runs the context extraction endpoint using a hardcoded messy narrative (videos + chapters) and shows the returned tasks/suggestions.
        Uses your configured OpenAI key unless MOCK_EXTRACTION=true.
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button variant="contained" onClick={runTest} disabled={loading}>
          {loading ? 'Running…' : 'Run Extraction'}
        </Button>
        <Chip label={`Tasks: ${tasks.length || 0}`} />
        <Chip label={`Suggestions: ${suggestions.length || 0}`} />
      </Stack>

      {error && (
        <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'error.light' }}>
          <Typography color="error">Error: {error}</Typography>
        </Paper>
      )}

      {tasks.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Extracted Tasks</Typography>
          <Stack spacing={1}>
            {tasks.map((t: any, idx: number) => (
              <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography fontWeight={700}>{t.title || 'Untitled'}</Typography>
                <Typography variant="body2">Type: {t.type || 'unknown'} | Due: {t.dueDate || 'n/a'} | Source: {t.source || 'AI'}</Typography>
                {t.description && <Typography variant="body2" color="text.secondary">{t.description}</Typography>}
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {suggestions.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Suggestions (needs review)</Typography>
          <Stack spacing={1}>
            {suggestions.map((s: any, idx: number) => (
              <Box key={idx} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography fontWeight={700}>{s.title || 'Suggestion'}</Typography>
                <Typography variant="body2">Type: {s.type || 'unknown'} | Est. Hours: {s.estimatedHours || 'n/a'} | Source: {s.source || 'context-augmentor'}</Typography>
                {s.description && <Typography variant="body2" color="text.secondary">{s.description}</Typography>}
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Scheduler Mock Quick Launch
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Opens /dev/scheduler-mock so you can visually confirm event/task rendering, colors, and debug logs.
        Use the browser console to see Scheduler Debug output.
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={runSchedulerMock} disabled={schedulerRunning}>
          {schedulerRunning ? 'Opening…' : 'Open Scheduler Mock'}
        </Button>
      </Stack>
      {schedulerOutput.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Stack spacing={1}>
            {schedulerOutput.map((line, idx) => (
              <Typography key={idx} variant="body2">{line}</Typography>
            ))}
          </Stack>
        </Paper>
      )}
    </Container>
  );
}
