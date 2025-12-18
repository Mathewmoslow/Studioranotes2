import React, { useMemo, useState } from 'react';
import { Box, Button, Container, Paper, Stack, Typography, Chip, Divider, FormControlLabel, Switch } from '@mui/material';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { determineAssignmentType, estimateTaskHours } from '@/lib/taskHours';
import shiftedFixture from '@/lib/fixtures/canvas-shifted.json';
import { addDays, startOfDay } from 'date-fns';

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
  const [showJson, setShowJson] = useState(false);
  const [lastRequest, setLastRequest] = useState<any>(null);
  const [fixtureStatus, setFixtureStatus] = useState<string | null>(null);
  const [fixtureError, setFixtureError] = useState<string | null>(null);
  const [fixtureStats, setFixtureStats] = useState<{ courses: number; tasks: number }>({ courses: 0, tasks: 0 });

  const { addCourse, addTask, deleteTask, deleteCourse } = useScheduleStore();
  const tasksStore = useScheduleStore(state => state.tasks);
  const coursesStore = useScheduleStore(state => state.courses);
  const eventsStore = useScheduleStore(state => state.events);
  const timeBlocksStore = useScheduleStore(state => state.timeBlocks);

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

  const openSchedulerMock = () => {
    window.open('/dev/scheduler-mock', '_blank', 'noopener,noreferrer');
  };

  const suggestions = result?.extracted?.suggestions || [];
  const extractedTasks = result?.extracted?.tasks || [];

  const fixtureCourses = useMemo(() => (shiftedFixture as any)?.courses || [], []);

  const filteredCourses = useMemo(() => {
    // Prefer courses with recent start/end dates; fallback to first 6
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const filtered = fixtureCourses.filter((c: any) => {
      const start = c.start_at ? new Date(c.start_at) : null;
      const end = c.end_at ? new Date(c.end_at) : null;
      if (start && end) {
        return start >= sixMonthsAgo || end >= sixMonthsAgo;
      }
      return false;
    });
    return filtered.length > 0 ? filtered.slice(0, 8) : fixtureCourses.slice(0, 6);
  }, [fixtureCourses]);

  const resetStore = () => {
    useScheduleStore.setState((state) => ({
      courses: [],
      tasks: [],
      timeBlocks: [],
      events: [],
      scheduleWarnings: { unscheduledTaskIds: [], message: '', details: [] },
      preferences: state.preferences,
      settings: state.settings,
    }));
  };

  const clearFixture = () => {
    setFixtureError(null);
    setFixtureStatus(null);
    try {
      resetStore();
      setFixtureStats({ courses: 0, tasks: 0 });
      setFixtureStatus('All test data cleared.');
    } catch (e: any) {
      setFixtureError(e?.message || 'Failed to clear fixture data');
    }
  };

  const loadFixture = () => {
    setFixtureError(null);
    setFixtureStatus(null);
    try {
      resetStore();
      const colorPalette = ['#2563eb', '#a855f7', '#f59e0b', '#0ea5e9', '#10b981'];
      let addedCourses = 0;
      let addedTasks = 0;
      const today = startOfDay(new Date());
      const minFutureDue = addDays(today, 3);
      filteredCourses.forEach((course: any, idx: number) => {
        const courseId = `fixture-${course.id}`;
        addCourse({
          id: courseId,
          name: course.name || course.course_code || `Fixture Course ${course.id}`,
          code: course.course_code || `FIX-${course.id}`,
          color: colorPalette[idx % colorPalette.length],
          canvasId: `fixture-${course.id}`,
          startDate: course.start_at ? new Date(course.start_at) : undefined,
          endDate: course.end_at ? new Date(course.end_at) : undefined,
        } as any);

        addedCourses += 1;

        (course.assignments || []).forEach((a: any) => {
          const type = determineAssignmentType(a);
          let dueDate = a.due_at ? new Date(a.due_at) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          if (dueDate < today) {
            // Shift historical due dates forward to keep them schedulable in the harness
            const shiftDays = 30;
            dueDate = addDays(today, shiftDays);
          }
          // Ensure a small buffer into the future so scheduling doesn't skip
          if (dueDate < minFutureDue) {
            dueDate = addDays(minFutureDue, 0);
          }
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

  const clearHistoricalCourses = () => {
    const today = startOfDay(new Date());
    const courses = useScheduleStore.getState().courses;
    const historicalIds = courses
      .filter(c => c.endDate && startOfDay(new Date(c.endDate)) < today)
      .map(c => c.id);

    if (!historicalIds.length) {
      setFixtureStatus('No historical courses to remove.');
      return;
    }

    // Remove tasks, events, blocks tied to those courses
    historicalIds.forEach(id => {
      tasksStore.forEach((t: any) => {
        if (t.courseId === id) deleteTask(t.id);
      });
      eventsStore.forEach((e: any) => {
        if (e.courseId === id) useScheduleStore.getState().deleteEvent?.(e.id);
      });
      timeBlocksStore.forEach((b: any) => {
        const task = tasksStore.find((t: any) => t.id === b.taskId);
        if (task?.courseId === id) useScheduleStore.getState().deleteTimeBlock?.(b.id);
      });
      deleteCourse(id);
    });

    setFixtureStats({
      courses: courses.length - historicalIds.length,
      tasks: useScheduleStore.getState().tasks.length,
    });
    setFixtureStatus(`Removed ${historicalIds.length} historical courses (ended before today).`);
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Shifted Canvas Test Harness</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Plain steps: load Canvas data (+30d), schedule it, view the calendar, and (optional) run the messy context extraction check.
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1">Step 1: Load Canvas data (+30d)</Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={loadFixture} data-testid="load-fixture-btn">Load Canvas data (+30d)</Button>
            <Button variant="outlined" color="error" onClick={clearFixture} data-testid="clear-fixture-btn">Clear all test data</Button>
            <Button variant="outlined" onClick={clearHistoricalCourses}>Remove historical courses</Button>
            <Chip label={`Available in file: ${fixtureCourses.length} | Loading filtered: ${filteredCourses.length}`} />
          </Stack>
          {(fixtureStatus || fixtureError) && (
            <Paper sx={{ p: 2 }}>
              {fixtureStatus && (
                <Typography variant="body2" color="success.main" data-testid="fixture-status">
                  {fixtureStatus} (courses loaded: {fixtureStats.courses}, tasks loaded: {fixtureStats.tasks})
                </Typography>
              )}
              {fixtureError && <Typography variant="body2" color="error.main" data-testid="fixture-error">{fixtureError}</Typography>}
            </Paper>
          )}
          <Typography variant="body2" color="text.secondary">
            Fixture sample (filtered): {filteredCourses.map((c: any) => c.course_code || c.name).join(', ') || 'None'}
          </Typography>

          <Typography variant="subtitle1" sx={{ pt: 1 }}>Step 2: View calendar</Typography>
          <Button variant="outlined" onClick={openSchedulerMock}>View calendar with shifted data</Button>
          <Typography variant="body2" color="text.secondary">
            On the calendar page, use the single Generate button; other harness buttons are hidden there.
          </Typography>

          <Typography variant="subtitle1" sx={{ pt: 1 }}>Step 3 (optional): Context extraction check</Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={runTest} disabled={loading}>
              {loading ? 'Running…' : 'Run extraction'}
            </Button>
            <Chip label={`Tasks: ${extractedTasks.length || 0}`} />
            <Chip label={`Suggestions: ${suggestions.length || 0}`} />
          </Stack>
        </Stack>
      </Paper>

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
