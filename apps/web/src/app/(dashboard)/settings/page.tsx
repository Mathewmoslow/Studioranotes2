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
  Switch,
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

// Mock activity feed data (would come from backend in production)
const mockActivityFeed = [
  {
    avatar: 'S',
    name: 'Sarah M.',
    message: 'Started studying NURS 320 - Pharmacology',
    time: '2 min ago',
    color: '#3b82f6',
    badge: null,
  },
  {
    avatar: 'J',
    name: 'Jake T.',
    message: 'Completed 3 study blocks today!',
    time: '15 min ago',
    color: '#22c55e',
    badge: 'Grinding',
  },
  {
    avatar: 'M',
    name: 'Maria L.',
    message: 'Earned Week Crusher badge',
    time: '1 hr ago',
    color: '#f97316',
    badge: '7 Days',
  },
  {
    avatar: 'A',
    name: 'Alex K.',
    message: 'Come join me! Studying at library',
    time: '2 hrs ago',
    color: '#8b5cf6',
    badge: 'Invite',
  },
  {
    avatar: 'R',
    name: 'Rachel B.',
    message: 'Hit 50 hours studied this semester!',
    time: '3 hrs ago',
    color: '#06b6d4',
    badge: '50h',
  },
];

// Privacy setting labels
const privacyLabels: Record<string, string> = {
  shareStudySessions: 'Study sessions',
  shareTaskCompletion: 'Task completion',
  shareBadges: 'Badge achievements',
  shareMilestones: 'Metric milestones',
  shareStudyInvites: 'Study invites',
  shareStreaks: 'Streak updates',
};

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
  const { preferences, tasks, timeBlocks, events, courses, updatePreferences, activityPrivacy, updateActivityPrivacy, timeTracking, enableTimeTracking } = useScheduleStore();
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

          {/* Center Column - Profile + Activity Feed */}
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              {/* Compact Profile Card */}
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={session?.user?.image || undefined}
                      sx={{ width: 60, height: 60, bgcolor: 'primary.main', fontSize: 24 }}
                    >
                      {displayName?.charAt(0) || 'U'}
                    </Avatar>
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        width: 24,
                        height: 24,
                      }}
                    >
                      <PhotoCamera sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="baseline">
                      <TextField
                        variant="standard"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your Name"
                        InputProps={{ sx: { fontWeight: 700, fontSize: '1.1rem' } }}
                        sx={{ width: 150 }}
                      />
                      <TextField
                        variant="standard"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="Year"
                        InputProps={{ sx: { fontSize: '0.875rem', color: 'text.secondary' } }}
                        sx={{ width: 80 }}
                      />
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <TextField
                        variant="standard"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="Major"
                        InputProps={{ sx: { fontSize: '0.875rem' } }}
                        sx={{ width: 120 }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5 }}>@</Typography>
                      <TextField
                        variant="standard"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        placeholder="School"
                        InputProps={{ sx: { fontSize: '0.875rem' } }}
                        sx={{ flex: 1 }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              {/* Activity Feed */}
              <Paper sx={{ p: 2, borderRadius: 2, maxHeight: 400, overflow: 'auto' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Friend Activity
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      alert('Study invite sent! Your friends will see you\'re studying.');
                    }}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Come Join Me
                  </Button>
                </Stack>

                {/* Mock Activity Feed Items */}
                <Stack spacing={1.5}>
                  {mockActivityFeed.map((item, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        p: 1.5,
                        bgcolor: '#f8fafc',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Avatar sx={{ width: 32, height: 32, bgcolor: item.color, fontSize: 14 }}>
                        {item.avatar}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.message}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.25 }}>
                          {item.time}
                        </Typography>
                      </Box>
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          sx={{ height: 20, fontSize: '0.65rem', bgcolor: item.color, color: 'white' }}
                        />
                      )}
                    </Box>
                  ))}

                  {mockActivityFeed.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No friend activity yet.
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        Invite friends to see their study updates!
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Paper>

              {/* Privacy Controls */}
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  Activity Sharing
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                  Control what you share. You can only see what others share if you share it too.
                </Typography>
                <Stack spacing={1}>
                  {Object.entries(privacyLabels).map(([key, label]) => (
                    <Stack key={key} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">{label}</Typography>
                      <Switch
                        checked={activityPrivacy[key as keyof typeof activityPrivacy]}
                        onChange={(e) => updateActivityPrivacy({ [key]: e.target.checked })}
                        size="small"
                      />
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              {/* Badges */}
              {badges.length > 0 && (
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Badges Earned
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {badges.map((badge, i) => (
                      <Tooltip key={i} title={badge.desc}>
                        <Chip
                          icon={<span style={{ fontSize: 14 }}>{badge.icon}</span>}
                          label={badge.name}
                          size="small"
                          variant="outlined"
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
                      PDF-level protection from download & screenshots
                    </Typography>
                  </Box>
                  <Button variant="outlined" size="small" startIcon={<Share />} onClick={handleShareNotes}>
                    Share
                  </Button>
                </Stack>
              </Paper>

              {/* Study Schedule Preferences - Collapsed */}
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Study Preferences
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={4}>
                    <TextField
                      label="Start"
                      type="time"
                      fullWidth
                      size="small"
                      value={studyStart}
                      onChange={(e) => setStudyStart(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="End"
                      type="time"
                      fullWidth
                      size="small"
                      value={studyEnd}
                      onChange={(e) => setStudyEnd(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      label="Session"
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

                <Divider sx={{ my: 2 }} />

                {/* Time Tracking Opt-In */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="caption" fontWeight={600}>
                      Track Real Time
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Record actual time spent on tasks to improve DynaSchedule estimates
                    </Typography>
                  </Box>
                  <Switch
                    checked={timeTracking?.enabled || false}
                    onChange={(e) => enableTimeTracking(e.target.checked)}
                    size="small"
                  />
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
