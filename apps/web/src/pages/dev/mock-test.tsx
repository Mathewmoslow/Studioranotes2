import React, { useMemo, useState } from 'react';
import { Box, Button, Container, Paper, Stack, Typography, Chip, Divider, FormControlLabel, Switch } from '@mui/material';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { determineAssignmentType, estimateTaskHours } from '@/lib/taskHours';
import shiftedFixture from '@/lib/fixtures/canvas-shifted.json';

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
  const [showJson, setShowJson] = useState(false);
  const [lastRequest, setLastRequest] = useState<any>(null);
  const [fixtureStatus, setFixtureStatus] = useState<string | null>(null);
  const [fixtureError, setFixtureError] = useState<string | null>(null);
  const [fixtureStats, setFixtureStats] = useState<{ courses: number; tasks: number }>({ courses: 0, tasks: 0 });

  const { addCourse, addTask, deleteTask, deleteCourse } = useScheduleStore();
  const tasksStore = useScheduleStore(state => state.tasks);
  const coursesStore = useScheduleStore(state => state.courses);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLastRequest(null);
    try {
      const payload = {
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
      };
      setLastRequest(JSON.parse(payload.body));

      const res = await fetch('/api/canvas/extract-context', payload);

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
  const extractedTasks = result?.extracted?.tasks || [];

  const fixtureCourses = useMemo(() => (shiftedFixture as any)?.courses || [], []);

  const clearFixture = () => {
    setFixtureError(null);
    setFixtureStatus(null);
    try {
      const fixtureIds = new Set(fixtureCourses.map((c: any) => `fixture-${c.id}`));

      // Remove tasks
      tasksStore.forEach((t: any) => {
        if (t.source === 'fixture' || t.id?.startsWith('fixture-') || fixtureIds.has(t.courseId)) {
          deleteTask(t.id);
        }
      });

      // Remove courses
      coursesStore.forEach((c: any) => {
        if (fixtureIds.has(c.id)) {
          deleteCourse(c.id);
        }
      });
      setFixtureStats({ courses: 0, tasks: 0 });
      setFixtureStatus('Fixture data cleared.');
    } catch (e: any) {
      setFixtureError(e?.message || 'Failed to clear fixture data');
    }
  };

  const loadFixture = () => {
    setFixtureError(null);
    setFixtureStatus(null);
    try {
      clearFixture();
      const colorPalette = ['#2563eb', '#a855f7', '#f59e0b', '#0ea5e9', '#10b981'];
      let addedCourses = 0;
      let addedTasks = 0;
      fixtureCourses.forEach((course: any, idx: number) => {
        const courseId = `fixture-${course.id}`;
        addCourse({
          id: courseId,
          name: course.name || course.course_code || `Fixture Course ${course.id}`,
          code: course.course_code || `FIX-${course.id}`,
          color: colorPalette[idx % colorPalette.length],
          canvasId: `fixture-${course.id}`,
        } as any);

        addedCourses += 1;

        (course.assignments || []).forEach((a: any) => {
          const type = determineAssignmentType(a);
          const dueDate = a.due_at ? new Date(a.due_at) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const estimatedHours = estimateTaskHours({ type, title: a.name, userPreferences: { useAutoEstimation: true } });
          addTask({
            id: `fixture-task-${course.id}-${a.id}`,
            title: a.name || 'Fixture Assignment',
            courseId,
            courseName: course.name,
            type,
            dueDate,
            estimatedHours,
            priority: 'medium',
            status: 'pending',
            description: a.description || '',
            points: a.points_possible || 0,
            fromCanvas: true,
            source: 'fixture'
          } as any);
          addedTasks += 1;
        });
      });
      setFixtureStats({ courses: addedCourses, tasks: addedTasks });
      setFixtureStatus(`Loaded ${addedCourses} courses and ${addedTasks} tasks from fixture.`);
    } catch (e: any) {
      setFixtureError(e?.message || 'Failed to load fixture');
    }
  };

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
        <Chip label={`Tasks: ${extractedTasks.length || 0}`} />
        <Chip label={`Suggestions: ${suggestions.length || 0}`} />
      </Stack>

      {error && (
        <Paper sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'error.light' }}>
          <Typography color="error">Error: {error}</Typography>
        </Paper>
      )}

      {extractedTasks.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Extracted Tasks</Typography>
          <Stack spacing={1}>
            {extractedTasks.map((t: any, idx: number) => (
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

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Fixture Loader (shifted Canvas data)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Loads the locally shifted Canvas fixture (due dates +30d) into the store as if imported. Also supports clearing it.
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={loadFixture} data-testid="load-fixture-btn">Load Fixture</Button>
        <Button variant="outlined" color="error" onClick={clearFixture} data-testid="clear-fixture-btn">Clear Fixture</Button>
        <Chip label={`Fixture courses: ${fixtureCourses.length}`} />
      </Stack>
      {(fixtureStatus || fixtureError) && (
        <Paper sx={{ p: 2, mb: 2 }}>
          {fixtureStatus && (
            <Typography variant="body2" color="success.main" data-testid="fixture-status">
              {fixtureStatus} (courses loaded: {fixtureStats.courses}, tasks loaded: {fixtureStats.tasks})
            </Typography>
          )}
          {fixtureError && <Typography variant="body2" color="error.main" data-testid="fixture-error">{fixtureError}</Typography>}
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />

      <FormControlLabel
        control={<Switch checked={showJson} onChange={(e) => setShowJson(e.target.checked)} />}
        label="Show raw request/response JSON"
      />
      {showJson && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Last Request Payload</Typography>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(lastRequest || {}, null, 2)}</pre>
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2">Last Response JSON</Typography>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(result || {}, null, 2)}</pre>
          </Paper>
        </Stack>
      )}
    </Container>
  );
}
