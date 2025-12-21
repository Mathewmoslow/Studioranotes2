'use client';

import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Divider,
  InputAdornment,
  LinearProgress,
  Tooltip,
  Card,
  CardContent,
} from '@mui/material';
import {
  PhotoCamera,
  Search,
  Share,
  IosShare,
  Lock,
  TrendingUp,
  TrendingDown,
  LocalFireDepartment,
  CheckCircle,
  Schedule,
  MenuBook,
  Science,
  Quiz,
  Description,
  EmojiEvents,
} from '@mui/icons-material';
import { useScheduleStore } from '@/stores/useScheduleStore';
import { useSession } from 'next-auth/react';
import { format, differenceInDays, startOfDay, isAfter, isBefore, subDays } from 'date-fns';

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

// Real-talk status messages based on metrics
const getStatusMessage = (metrics: any) => {
  const { completionRate, streak, hoursThisWeek, overdueCount } = metrics;

  if (overdueCount > 5) return { text: "overwhelmed FML", color: "#ef4444", icon: "😵" };
  if (overdueCount > 2) return { text: "behind but recoverable", color: "#f97316", icon: "😰" };
  if (completionRate < 30) return { text: "you're really sucking bro", color: "#ef4444", icon: "💀" };
  if (completionRate < 50) return { text: "step it up", color: "#f97316", icon: "😤" };
  if (streak >= 7 && completionRate > 80) return { text: "absolute legend", color: "#22c55e", icon: "👑" };
  if (streak >= 5) return { text: "on fire rn", color: "#22c55e", icon: "🔥" };
  if (completionRate > 80) return { text: "come on kick ass", color: "#22c55e", icon: "💪" };
  if (hoursThisWeek > 30) return { text: "busy af", color: "#8b5cf6", icon: "📚" };
  if (hoursThisWeek > 20) return { text: "grinding hard", color: "#3b82f6", icon: "⚡" };
  if (completionRate > 60) return { text: "doing alright", color: "#3b82f6", icon: "👍" };
  return { text: "just getting started", color: "#6b7280", icon: "🌱" };
};

// Badge definitions
const getBadges = (metrics: any) => {
  const badges = [];

  if (metrics.streak >= 30) badges.push({ name: "Month Warrior", icon: "🏆", desc: "30 day streak" });
  else if (metrics.streak >= 14) badges.push({ name: "Two Week Terror", icon: "⚔️", desc: "14 day streak" });
  else if (metrics.streak >= 7) badges.push({ name: "Week Crusher", icon: "💪", desc: "7 day streak" });

  if (metrics.totalHours >= 200) badges.push({ name: "200 Club", icon: "🎯", desc: "200+ hours studied" });
  else if (metrics.totalHours >= 100) badges.push({ name: "Century", icon: "💯", desc: "100+ hours studied" });
  else if (metrics.totalHours >= 50) badges.push({ name: "Halfway There", icon: "🌟", desc: "50+ hours studied" });

  if (metrics.notesCount >= 50) badges.push({ name: "Note Machine", icon: "📝", desc: "50+ notes generated" });
  else if (metrics.notesCount >= 20) badges.push({ name: "Scribe", icon: "✍️", desc: "20+ notes generated" });

  if (metrics.completionRate >= 95) badges.push({ name: "Perfectionist", icon: "✨", desc: "95%+ completion" });
  else if (metrics.completionRate >= 80) badges.push({ name: "Reliable", icon: "🎖️", desc: "80%+ completion" });

  if (metrics.examReadiness >= 90) badges.push({ name: "Exam Ready", icon: "🧠", desc: "90%+ exam prep" });

  return badges;
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  progress?: number;
}

const MetricCard = ({ title, value, subtitle, icon, color = '#3b82f6', trend, progress }: MetricCardProps) => (
  <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
        {trend && (
          trend === 'up' ? <TrendingUp sx={{ color: '#22c55e', fontSize: 18 }} /> :
          trend === 'down' ? <TrendingDown sx={{ color: '#ef4444', fontSize: 18 }} /> : null
        )}
      </Stack>
      <Typography variant="h4" fontWeight={800} sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="subtitle2" fontWeight={600} color="text.primary">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
      {progress !== undefined && (
        <LinearProgress
          variant="determinate"
          value={Math.min(100, progress)}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: `${color}20`,
            '& .MuiLinearProgress-bar': { bgcolor: color }
          }}
        />
      )}
    </Stack>
  </Paper>
);

export default function MyStudiora() {
  const { data: session } = useSession();
  const { preferences, tasks, timeBlocks, events, courses, updatePreferences } = useScheduleStore();
  const prefs = useMemo(() => preferences || {}, [preferences]);

  const [searchQuery, setSearchQuery] = useState('');
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

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = startOfDay(new Date());
    const weekAgo = subDays(today, 7);
    const semesterStart = subDays(today, 120); // Approximate semester

    // Completed vs total tasks
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    // Overdue tasks
    const overdueCount = tasks.filter(t =>
      t.status !== 'completed' && isBefore(new Date(t.dueDate), today)
    ).length;

    // Hours studied (from completed timeBlocks)
    const completedBlocks = timeBlocks.filter(b => b.completed);
    const totalMinutes = completedBlocks.reduce((sum, b) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return sum + (end.getTime() - start.getTime()) / 60000;
    }, 0);
    const totalHours = Math.round(totalMinutes / 60);

    // Hours this week
    const weekBlocks = completedBlocks.filter(b => isAfter(new Date(b.startTime), weekAgo));
    const weekMinutes = weekBlocks.reduce((sum, b) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return sum + (end.getTime() - start.getTime()) / 60000;
    }, 0);
    const hoursThisWeek = Math.round(weekMinutes / 60);

    // Study streak (consecutive days with completed blocks)
    let streak = 0;
    let checkDate = today;
    while (true) {
      const dayBlocks = completedBlocks.filter(b => {
        const blockDate = startOfDay(new Date(b.startTime));
        return blockDate.getTime() === checkDate.getTime();
      });
      if (dayBlocks.length > 0) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // DO count (scheduled study blocks) and DUE count
    const doCount = timeBlocks.filter(b => !b.completed && isAfter(new Date(b.startTime), today)).length;
    const dueCount = events.filter(e =>
      e.type === 'deadline' && isAfter(new Date(e.startTime), today)
    ).length;

    // Exam readiness (% of exam prep tasks completed)
    const examTasks = tasks.filter(t => t.type === 'exam');
    const completedExamTasks = examTasks.filter(t => t.status === 'completed');
    const examReadiness = examTasks.length > 0
      ? Math.round((completedExamTasks.length / examTasks.length) * 100)
      : 100;

    // Lab/Skills score (hours spent on labs)
    const labBlocks = completedBlocks.filter(b => {
      const task = tasks.find(t => t.id === b.taskId);
      return task?.type === 'lab' || task?.type === 'clinical';
    });
    const labMinutes = labBlocks.reduce((sum, b) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return sum + (end.getTime() - start.getTime()) / 60000;
    }, 0);
    const skillsHours = Math.round(labMinutes / 60);

    // Notes count (placeholder - would come from notes store)
    const notesCount = 12; // TODO: Get from actual notes storage

    return {
      completionRate,
      overdueCount,
      totalHours,
      hoursThisWeek,
      streak,
      doCount,
      dueCount,
      examReadiness,
      skillsHours,
      notesCount,
      completedTasks: completedTasks.length,
      totalTasks,
    };
  }, [tasks, timeBlocks, events]);

  const status = getStatusMessage(metrics);
  const badges = getBadges(metrics);

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

  const handleShareSnapshot = () => {
    const snapshotText = `My Studiora Stats:\n${metrics.totalHours}h studied | ${metrics.streak} day streak | ${metrics.completionRate}% done\n${status.icon} ${status.text}`;
    if (navigator.share) {
      navigator.share({
        title: 'My Studiora Snapshot',
        text: snapshotText,
        url: 'https://studiora.io',
      });
    } else {
      navigator.clipboard.writeText(snapshotText);
      alert('Snapshot copied to clipboard!');
    }
  };

  const handleShareNotes = () => {
    alert('Notes sharing coming soon! Your notes will be protected from downloads and screenshots.');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', pb: 6 }}>
      {/* Search Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
        <Container maxWidth="lg">
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a' }}>
              myStudiora
            </Typography>
            <TextField
              fullWidth
              placeholder="Search friends..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                maxWidth: 400,
                '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#f1f5f9' }
              }}
            />
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pt: 3 }}>
        {/* Status Banner */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: `${status.color}10`,
            border: `1px solid ${status.color}30`
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h4">{status.icon}</Typography>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: status.color }}>
                  {status.text}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {metrics.streak} day streak • {metrics.completionRate}% complete • {metrics.hoursThisWeek}h this week
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="outlined"
              startIcon={<IosShare />}
              onClick={handleShareSnapshot}
              sx={{ borderColor: status.color, color: status.color }}
            >
              Share Snapshot
            </Button>
          </Stack>
        </Paper>

        {/* Main Grid: Metrics | Profile | Metrics */}
        <Grid container spacing={3}>
          {/* Left Metrics Column */}
          <Grid item xs={12} md={3}>
            <Stack spacing={2}>
              <MetricCard
                title="Hours This Semester"
                value={metrics.totalHours}
                subtitle={`${metrics.hoursThisWeek}h this week`}
                icon={<Schedule />}
                color="#3b82f6"
                trend={metrics.hoursThisWeek > 15 ? 'up' : 'neutral'}
              />
              <MetricCard
                title="Getting It Done"
                value={`${metrics.completionRate}%`}
                subtitle={`${metrics.completedTasks}/${metrics.totalTasks} tasks`}
                icon={<CheckCircle />}
                color={metrics.completionRate >= 70 ? '#22c55e' : metrics.completionRate >= 40 ? '#f97316' : '#ef4444'}
                progress={metrics.completionRate}
              />
              <MetricCard
                title="Study Streak"
                value={metrics.streak}
                subtitle="consecutive days"
                icon={<LocalFireDepartment />}
                color={metrics.streak >= 7 ? '#f97316' : '#6b7280'}
              />
              <MetricCard
                title="DO Blocks"
                value={metrics.doCount}
                subtitle="scheduled ahead"
                icon={<MenuBook />}
                color="#8b5cf6"
              />
            </Stack>
          </Grid>

          {/* Center Profile Column */}
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              {/* Profile Card */}
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Stack direction="row" spacing={3} alignItems="flex-start">
                  <Box sx={{ textAlign: 'center' }}>
                    <Avatar
                      src={session?.user?.image || undefined}
                      sx={{ width: 100, height: 100, mb: 1, bgcolor: 'primary.main', fontSize: 40 }}
                    >
                      {displayName?.charAt(0) || 'U'}
                    </Avatar>
                    <IconButton size="small" color="primary">
                      <PhotoCamera fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Grid container spacing={2}>
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
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Major"
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Year"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Stack>
              </Paper>

              {/* Badges */}
              {badges.length > 0 && (
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Badges Earned
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {badges.map((badge, i) => (
                      <Tooltip key={i} title={badge.desc}>
                        <Chip
                          icon={<span>{badge.icon}</span>}
                          label={badge.name}
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      </Tooltip>
                    ))}
                  </Stack>
                </Paper>
              )}

              {/* Share Notes */}
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Share My Notes
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <Lock sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                      Protected from download & screenshots
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small" startIcon={<Share />} onClick={handleShareNotes}>
                    Share with Friends
                  </Button>
                </Stack>
              </Paper>

              {/* Study Schedule Preferences */}
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Study Preferences
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      label="Start"
                      type="time"
                      fullWidth
                      size="small"
                      value={studyStart}
                      onChange={(e) => setStudyStart(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      label="End"
                      type="time"
                      fullWidth
                      size="small"
                      value={studyEnd}
                      onChange={(e) => setStudyEnd(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Session (min)"
                      type="number"
                      fullWidth
                      size="small"
                      value={sessionDuration}
                      onChange={(e) => setSessionDuration(Number(e.target.value))}
                      inputProps={{ min: 20, max: 120 }}
                    />
                  </Grid>
                </Grid>

                <Typography variant="caption" fontWeight={600} sx={{ mt: 2, mb: 1, display: 'block' }}>
                  Study Days
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {dayKeys.map((key) => (
                    <Chip
                      key={key}
                      label={dayLabels[key]}
                      size="small"
                      color={studyDays[key] ? 'primary' : 'default'}
                      onClick={() => toggleDay(key)}
                      variant={studyDays[key] ? 'filled' : 'outlined'}
                    />
                  ))}
                </Stack>

                <Typography variant="caption" fontWeight={600} sx={{ mt: 2, mb: 1, display: 'block' }}>
                  Preferred Times
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {studyTimeChips.map((chip) => (
                    <Chip
                      key={chip.key}
                      label={chip.label}
                      size="small"
                      color={preferredTimes[chip.key] ? 'primary' : 'default'}
                      variant={preferredTimes[chip.key] ? 'filled' : 'outlined'}
                      onClick={() => toggleChip(chip.key)}
                    />
                  ))}
                </Stack>

                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSave}
                  sx={{ mt: 2 }}
                >
                  Save Preferences
                </Button>
              </Paper>
            </Stack>
          </Grid>

          {/* Right Metrics Column */}
          <Grid item xs={12} md={3}>
            <Stack spacing={2}>
              <MetricCard
                title="DUE Soon"
                value={metrics.dueCount}
                subtitle="deadlines ahead"
                icon={<Quiz />}
                color={metrics.dueCount > 5 ? '#ef4444' : '#f97316'}
              />
              <MetricCard
                title="Exam Readiness"
                value={`${metrics.examReadiness}%`}
                subtitle="exam prep complete"
                icon={<EmojiEvents />}
                color={metrics.examReadiness >= 80 ? '#22c55e' : metrics.examReadiness >= 50 ? '#f97316' : '#ef4444'}
                progress={metrics.examReadiness}
              />
              <MetricCard
                title="Skills Score"
                value={`${metrics.skillsHours}h`}
                subtitle="lab & clinical time"
                icon={<Science />}
                color="#06b6d4"
              />
              <MetricCard
                title="Notes Generated"
                value={metrics.notesCount}
                subtitle="by ContextGenie"
                icon={<Description />}
                color="#8b5cf6"
              />
            </Stack>
          </Grid>
        </Grid>

        {/* Task Duration Defaults */}
        <Paper sx={{ p: 3, mt: 3, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Task Duration Defaults (hours)
          </Typography>
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
      </Container>
    </Box>
  );
}
