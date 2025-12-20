import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  ButtonGroup,
  IconButton,
  Stack,
  Card,
  CardContent,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { useScheduleStore } from '../../stores/useScheduleStore';
import { Event, BlockCategory } from '@studioranotes/types';
import { format, startOfWeek, addDays, addMinutes, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday, startOfDay } from 'date-fns';
import EventModalMUI from './EventModalMUI';
import { clinicalFilter } from '../../lib/clinicalFilter';
import { determineBlockCategory } from '../../lib/blockVisuals';

type ViewType = 'week' | 'day' | 'month';

const FALLBACK_COLOR = '#6b7280';
const COURSE_PALETTES = [
  {
    id: 'bright-study',
    label: 'Bright Study',
    // High-contrast first four to avoid near-duplicates in small course sets
    colors: ['#2563eb', '#22c55e', '#f97316', '#8b5cf6', '#0ea5e9', '#10b981', '#7ca1f3', '#db99fa', '#6ec9f2', '#f9c56d'],
  },
  {
    id: 'coastline',
    label: 'Coastline',
    colors: ['#40798c', '#70a9a1', '#b08d57', '#5b7b9a', '#8cc8d3', '#4f6f52', '#9fb7b9', '#c8af3c'],
  },
  {
    id: 'earth-heritage',
    label: 'Earth & Heritage',
    colors: ['#8b4513', '#b3874f', '#c8af3c', '#6f4e37', '#9c7b4f', '#a17c38', '#7a5733', '#c3a267'],
  },
];
const HOUR_HEIGHT = 52;
const RED_BAND = '#c53030';
const MIN_BLOCK_HEIGHT = 50;
const BAND_WIDTH = 22;
const MIN_CARD_WIDTH = 120;
const CARD_RADIUS = 1.4;
const CARD_SHADOW = '0 4px 10px rgba(0,0,0,0.06)';

type VisualKind = 'DO' | 'LECTURE' | 'EXAM' | 'DUE';

interface SchedulerViewProps {
  compact?: boolean;
}

const hexToRgba = (hex: string, opacity = 0.2) => {
  if (!hex) {
    return `rgba(107, 114, 128, ${opacity})`;
  }

  let sanitized = hex.replace('#', '');
  if (sanitized.length === 3) {
    sanitized = sanitized.split('').map(char => char + char).join('');
  }

  if (sanitized.length !== 6) {
    return `rgba(107, 114, 128, ${opacity})`;
  }

  const numeric = Number.parseInt(sanitized, 16);
  if (Number.isNaN(numeric)) {
    return `rgba(107, 114, 128, ${opacity})`;
  }

  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const isHardDeadlineType = (type?: string) => {
  if (!type) return false;
  const normalized = type.toLowerCase();
  return ['deadline', 'exam', 'quiz', 'due'].includes(normalized);
};

const sanitizeCourseColor = (color?: string) => {
  if (!color) return undefined;
  const clean = color.replace('#', '');
  if (clean.length !== 6) return undefined;
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const redDominant = r > 180 && r > g + 30 && r > b + 30;
  if (redDominant) return undefined;
  return `#${clean}`;
};

const hashId = (input?: string) => {
  if (!input) return 0;
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getApprovedPaletteColor = (courseId?: string, paletteColors: string[] = COURSE_PALETTES[0].colors) => {
  const palette = paletteColors.length > 0 ? paletteColors : COURSE_PALETTES[0].colors;
  const idx = hashId(courseId) % palette.length;
  return palette[idx] || palette[0];
};

const getDoSubcategory = (task?: any) => {
  const type = (task?.type || '').toLowerCase();
  const title = (task?.title || '').toLowerCase();

  if (/(watch|video|lecture|panopto|osmosis)/.test(title) || type === 'video') return 'WATCH';
  if (/(read|chapter|textbook|pages)/.test(title) || type === 'reading') return 'READ';
  if (/(review|recap|study guide|practice test)/.test(title)) return 'REVIEW';
  if (/(prep|prepare|pre-class|pre class|prework)/.test(title) || type === 'prep') return 'PREP';
  if (/(exam|quiz|test|midterm|final)/.test(title) || type === 'exam' || type === 'quiz') return 'PREP';
  if (
    /(assignment|project|homework|problem set|worksheet|discussion|case study|work)/.test(title) ||
    ['assignment', 'project', 'homework', 'discussion'].includes(type)
  ) {
    return 'WORK';
  }
  if (/(lab|clinical|simulation|vsim)/.test(title) || ['lab', 'clinical', 'simulation', 'vsim'].includes(type)) return 'WORK';
  if (/(study|review)/.test(title)) return 'STUDY';

  return 'STUDY';
};

const getCourseColor = (color?: string, courseId?: string, paletteColors?: string[]) =>
  sanitizeCourseColor(color) || getApprovedPaletteColor(courseId, paletteColors);

const adjustColor = (hex: string, percent: number) => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = (num >> 16) + Math.round(255 * percent);
  const g = ((num >> 8) & 0x00ff) + Math.round(255 * percent);
  const b = (num & 0x0000ff) + Math.round(255 * percent);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const toHex = (v: number) => v.toString(16).padStart(2, '0');
  return `#${toHex(clamp(r))}${toHex(clamp(g))}${toHex(clamp(b))}`;
};

const darken = (hex: string, amount = 0.15) => adjustColor(hex, -Math.abs(amount));
const lighten = (hex: string, amount = 0.2) => adjustColor(hex, Math.abs(amount));

const mixWithWhite = (hex: string, whiteRatio: number) => {
  const ratio = Math.max(0, Math.min(1, whiteRatio));
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const mix = (channel: number) => Math.round(channel * (1 - ratio) + 255 * ratio);
  return `#${mix(r).toString(16).padStart(2, '0')}${mix(g).toString(16).padStart(2, '0')}${mix(b).toString(16).padStart(2, '0')}`;
};

const mixWithBlack = (hex: string, blackRatio: number) => {
  const ratio = Math.max(0, Math.min(1, blackRatio));
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const mix = (channel: number) => Math.round(channel * (1 - ratio));
  return `#${mix(r).toString(16).padStart(2, '0')}${mix(g).toString(16).padStart(2, '0')}${mix(b).toString(16).padStart(2, '0')}`;
};

const getTextOn = (hex: string) => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#ffffff';
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0f172a' : '#ffffff';
};

const logRenderProbe = (context: string, item: any) => {
  const payload = {
    context,
    id: item?.id,
    title: item?.title,
    type: item?.type ?? item?.taskType ?? item?.visualKind,
    visualKind: item?.visualKind,
    color: item?.color,
    courseId: item?.courseId ?? item?.course?.id,
    raw: item,
  };
  console.error('[Scheduler Debug] Render probe', payload);
  return payload;
};

const safeDeriveVisual = (context: string, visualKind: VisualKind, baseColor: string, item: any) => {
  const colorToUse = baseColor && typeof baseColor === 'string' ? baseColor : FALLBACK_COLOR;
  if (!colorToUse.startsWith('#')) {
    console.warn('[Scheduler Debug] Non-hex color passed to deriveVisual', { context, visualKind, colorToUse, item });
  }
  if (!item?.type && !item?.visualKind) {
    logRenderProbe(`${context} missing type`, item);
  }
  try {
    return deriveVisual(visualKind, colorToUse || FALLBACK_COLOR);
  } catch (error) {
    console.error('[Scheduler Debug] Visual derivation failed', { context, visualKind, colorToUse, item, error });
    return deriveVisual('DO', FALLBACK_COLOR);
  }
};

const deriveVisual = (kind: VisualKind, baseColor: string) => {
  const course = sanitizeCourseColor(baseColor) || FALLBACK_COLOR;
  const bandColor = course;
  const lectureTag = mixWithWhite(course, 0.4);
  const lectureFill = mixWithWhite(course, 0.8);
  const doFill = mixWithBlack(course, 0.15);
  const doBorder = course;
  const examFill = mixWithBlack(course, 0.45);

  switch (kind) {
    case 'EXAM':
      return {
        fill: examFill,
        border: examFill,
        band: '#ff0000',
        text: '#ffffff',
        subtle: hexToRgba(course, 0.2),
      };
    case 'DUE':
      return {
        fill: examFill,
        border: '#ff0000',
        band: '#ff0000',
        text: '#ffffff',
        subtle: hexToRgba(course, 0.2),
      };
    case 'LECTURE':
      return {
        fill: lectureFill,
        border: hexToRgba(course, 0.35),
        band: lectureTag,
        text: mixWithBlack(course, 0.25),
        subtle: hexToRgba(course, 0.18),
      };
    case 'DO':
    default:
      return {
        fill: doFill,
        border: doBorder,
        band: bandColor,
        text: getTextOn(doFill),
        subtle: hexToRgba(course, 0.18),
      };
  }
};

const resolveVisualKindForEvent = (event: Event): VisualKind => {
  const type = (event.type || '').toLowerCase();
  const title = (event.title || '').toLowerCase();
  if (type.includes('exam') || type.includes('quiz') || title.includes('exam') || title.includes('quiz')) return 'EXAM';
  if (type.includes('due') || type.includes('deadline') || title.includes('due') || title.includes('deadline')) return 'DUE';
  if (type.includes('lecture') || type.includes('class')) return 'LECTURE';
  return 'DO';
};

const resolveVisualKindForTask = (taskType?: string, isHardDeadline = false): VisualKind => {
  const type = (taskType || '').toLowerCase();
  if (type.includes('exam') || type.includes('quiz')) return 'EXAM';
  if (isHardDeadline || type.includes('due') || type.includes('deadline')) return 'DUE';
  if (type.includes('lecture') || type.includes('class')) return 'LECTURE';
  return 'DO';
};

const SchedulerView: React.FC<SchedulerViewProps> = ({ compact = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('week');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isDuePreview, setIsDuePreview] = useState(false);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const cleanupRan = useRef(false);
  const [dueModal, setDueModal] = useState<{ open: boolean; items: any[]; date?: Date }>({ open: false, items: [] });
  const [health, setHealth] = useState<{ openaiEnabled: boolean; fixtureEnabled: boolean; mockExtraction: boolean } | null>(null);

  const {
    preferences,
    timeBlocks,
    tasks,
    events,
    courses,
    updateEvent,
    updateTimeBlock,
    updateTask,
    removeHistoricalCourses,
    scheduleTask,
    generateSmartSchedule,
    scheduleWarnings,
  } = useScheduleStore();

  // Responsive scaling for tighter/mobile views
  const minBlockHeight = compact ? Math.max(44, MIN_BLOCK_HEIGHT - 6) : MIN_BLOCK_HEIGHT;
  const bandWidth = compact ? BAND_WIDTH - 2 : BAND_WIDTH;
  const cardRadius = compact ? CARD_RADIUS * 0.75 : CARD_RADIUS;
  const cardPadding = compact ? 0.32 : 0.4;
  const cardGap = compact ? 0.32 : 0.4;
  const cardShadow = CARD_SHADOW;
  const activePaletteColors = useMemo(() => {
    const palette = COURSE_PALETTES.find(p => p.id === preferences?.themePaletteId);
    return palette?.colors || COURSE_PALETTES[0].colors;
  }, [preferences?.themePaletteId]);
  
  const isDevMode = process.env.NODE_ENV !== 'production';
  const ensureDate = (date: Date | string): Date => {
    return typeof date === 'string' ? new Date(date) : date;
  };

  const loggedEventWarn = useRef(false);
  const loggedBlockWarn = useRef(false);
  const isDebugLogging = isDevMode && process.env.NEXT_PUBLIC_SCHEDULER_DEBUG === 'true';
  const subscribedToStore = useRef(false);

  useEffect(() => {
    if (!isDebugLogging || subscribedToStore.current) return;
    const unsubscribe = useScheduleStore.subscribe(
      (state, prev) => {
        console.groupCollapsed('[Scheduler Debug] Store change');
        console.log('diff', {
          tasks: { prev: prev?.tasks?.length, next: state?.tasks?.length },
          events: { prev: prev?.events?.length, next: state?.events?.length },
          timeBlocks: { prev: prev?.timeBlocks?.length, next: state?.timeBlocks?.length },
          courses: { prev: prev?.courses?.length, next: state?.courses?.length },
        });
        console.log('prev snapshot', {
          tasks: prev?.tasks,
          events: prev?.events,
          timeBlocks: prev?.timeBlocks,
          courses: prev?.courses,
        });
        console.log('next snapshot', {
          tasks: state?.tasks,
          events: state?.events,
          timeBlocks: state?.timeBlocks,
          courses: state?.courses,
        });
        console.groupEnd();
      },
      (state) => state
    );
    subscribedToStore.current = true;
    return () => unsubscribe();
  }, [isDebugLogging]);

  useEffect(() => {
    if (!isDebugLogging) return;
    const logKey = (event: KeyboardEvent) => {
      console.info('[Scheduler Debug] Key press', {
        key: event.key,
        code: event.code,
        ctrl: event.ctrlKey,
        meta: event.metaKey,
        shift: event.shiftKey,
        alt: event.altKey,
        target: (event.target as HTMLElement)?.tagName,
      });
    };
    window.addEventListener('keydown', logKey, true);
    return () => window.removeEventListener('keydown', logKey, true);
  }, [isDebugLogging]);

  const getDaysToDisplay = () => {
    switch (viewType) {
      case 'day':
        return [currentDate];
      case 'week':
        const weekStart = startOfWeek(currentDate);
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      case 'month':
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        return eachDayOfInterval({ start: monthStart, end: monthEnd });
      default:
        return [];
    }
  };
  
  const days = getDaysToDisplay();
  const safeEvents = useMemo(() => (events || []).filter((e): e is Event => Boolean(e)), [events]);
  const safeBlocks = useMemo(() => (timeBlocks || []).filter((b): b is any => Boolean(b)), [timeBlocks]);
  
  const hoursRange = useMemo(() => {
    const startTs = days[0] ? new Date(days[0]) : new Date();
    const endTs = days[days.length - 1] ? addDays(days[days.length - 1], 1) : new Date();

    const allTimes: number[] = [];
    [...safeEvents, ...safeBlocks].forEach(item => {
      const start = ensureDate((item as any).startTime);
      const end = ensureDate((item as any).endTime);
      if (start >= startTs && start <= endTs) {
        allTimes.push(start.getHours() + start.getMinutes() / 60);
      }
      if (end >= startTs && end <= endTs) {
        allTimes.push(end.getHours() + end.getMinutes() / 60);
      }
    });

    const minHour = allTimes.length ? Math.max(6, Math.floor(Math.min(...allTimes)) - 1) : 6;
    const computedMax = allTimes.length ? Math.ceil(Math.max(...allTimes)) + 1 : 22;
    const maxHour = Math.min(22, Math.max(minHour + 4, computedMax));
    return { start: minHour, end: maxHour };
  }, [days, events, timeBlocks]);

  const hours = useMemo(() => {
    return Array.from({ length: hoursRange.end - hoursRange.start + 1 }, (_, i) => hoursRange.start + i);
  }, [hoursRange]);

const getBandLabelForEvent = (event: Event) => {
  const type = (event.type || '').toLowerCase();
  const title = (event.title || '').toLowerCase();
  if (type.includes('exam') || title.includes('exam')) return 'EXAM';
  if (type.includes('quiz') || title.includes('quiz')) return 'QUIZ';
  if (type.includes('deadline') || type.includes('due') || title.includes('deadline') || title.includes('due')) return 'DUE';
  if (type.includes('lecture') || type.includes('class')) return 'LECTURE';
  if (type.includes('clinical')) return 'CLINICAL';
  if (type.includes('lab')) return 'LAB';
  return 'EVENT';
};

const getBandLabelForBlock = (taskType?: string, category?: BlockCategory) => {
  const type = (taskType || '').toLowerCase();
  if (category === 'DUE') return 'DUE';
  if (type.includes('exam') || type.includes('quiz')) return 'EXAM';
  if (type.includes('lecture') || type.includes('class')) return 'LECTURE';
  if (type.includes('reading') || type === 'read') return 'READ';
  if (type.includes('prep')) return 'PREP';
  if (type.includes('practice')) return 'PRACTICE';
  if (type.includes('video')) return 'VIDEO';
  if (type.includes('review')) return 'REVIEW';
  if (type.includes('project') || type.includes('work')) return 'WORK';
  return 'STUDY';
};

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks
      .filter(t => t.status === 'overdue' || (new Date(t.dueDate) < today && t.status !== 'completed'))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks]);
  
  const getUniqueEventsForDay = (day: Date) => {
    let dayEvents = safeEvents.filter(event => event && isSameDay(ensureDate(event.startTime), day));
    
    // Filter clinical events to show only actual clinical sessions and deadlines
    dayEvents = dayEvents.filter(event => {
      if (!event) return false;
      const course = getCourseForEvent(event);
      const isClinicalCourse = course && (
        course.name.toLowerCase().includes('clinical') ||
        course.code.toLowerCase().includes('clinical')
      );
      
      if (isClinicalCourse) {
        // Only show clinical sessions, exams, and deadlines
        return event.type === 'clinical' || 
               event.type === 'exam' || 
               event.type === 'deadline' ||
               event.title.toLowerCase().includes('reflection');
      }
      
      return true; // Show all non-clinical events
    });
    
    // Filters: course, type, block category
    dayEvents = dayEvents.filter(evt => {
      if (!evt) return false;
      if (selectedCourseId && evt.courseId !== selectedCourseId) return false;
      return true;
    });

    const uniqueEvents = Array.from(
      new Map(dayEvents.map(event => [event.id, event])).values()
    );
    return uniqueEvents;
  };
  
  const getUniqueBlocksForDay = (day: Date) => {
    let dayBlocks = safeBlocks.filter(block => block && isSameDay(ensureDate(block.startTime), day));
    
    // Filter clinical-related study blocks
    dayBlocks = dayBlocks.filter(block => {
      if (!block) return false;
      const task = getTaskForBlock(block.id);
      if (!task) return true;
      
      const course = getCourse(task.courseId);
      const isClinicalCourse = course && (
        course.name.toLowerCase().includes('clinical') ||
        course.code.toLowerCase().includes('clinical')
      );
      
      if (isClinicalCourse) {
        // For clinical courses, only show reflection-related tasks
        return task.title.toLowerCase().includes('reflection') ||
               task.title.toLowerCase().includes('clinical prep') ||
               task.type === 'exam';
      }
      
      return true; // Show all non-clinical blocks
    });
    
    // Filters: course, type, block category
    dayBlocks = dayBlocks.filter(block => {
      const task = getTaskForBlock(block.id);
      if (selectedCourseId && task?.courseId !== selectedCourseId) return false;
      return true;
    });

    const uniqueBlocks = Array.from(
      new Map(dayBlocks.map(block => [block.id, block])).values()
    );
    return uniqueBlocks;
  };
  
  const getTaskForBlock = (blockId: string) => {
    const block = timeBlocks.find(b => b.id === blockId);
    return tasks.find(t => t.id === block?.taskId);
  };
  
  const getCourseForEvent = (event: Event) => {
    return courses.find(c => c.id === event.courseId);
  };
  
  const getCourse = (courseId: string) => {
    return courses.find(c => c.id === courseId);
  };

  const visibleCourseIds = useMemo(() => {
    const ids = new Set<string>();
    const rangeStart = days[0] ? startOfDay(days[0]) : startOfDay(new Date());
    const rangeEnd = days[days.length - 1] ? addDays(days[days.length - 1], 1) : addDays(new Date(), 1);

    safeEvents.forEach(event => {
      if (!event?.courseId) return;
      const start = ensureDate(event.startTime);
      if (start >= rangeStart && start <= rangeEnd) {
        ids.add(event.courseId);
      }
    });

    safeBlocks.forEach(block => {
      const start = ensureDate(block.startTime);
      if (start >= rangeStart && start <= rangeEnd) {
        const task = tasks.find(t => t.id === block.taskId);
        if (task?.courseId) ids.add(task.courseId);
      }
    });

    return ids;
  }, [days, safeEvents, safeBlocks, tasks]);

  const visibleCourses = useMemo(
    () => courses.filter(course => visibleCourseIds.has(course.id)),
    [courses, visibleCourseIds]
  );
  
  const getEventColor = (event: Event) => {
    const course = getCourseForEvent(event);
    const paletteColor = getCourseColor(course?.color, course?.id || event.courseId || event.title, activePaletteColors);
    if (paletteColor) return paletteColor;

    const safeType = event.type || (event as any)?.event_type || 'meeting';

    // Fallback colors for different event types when no course color
    switch (safeType) {
      case 'deadline': return '#ef4444'; // Bright red for deadlines
      case 'exam': return '#dc2626'; // Dark red for exams
      case 'clinical': return '#7c3aed'; // Purple for clinical
      case 'lab': return '#f59e0b'; // Amber for labs
      case 'simulation': return '#06b6d4'; // Cyan for simulations
      case 'lecture': return '#6b7280'; // Gray for lectures
      case 'review': return '#10b981'; // Green for review
      default: return '#3b82f6'; // Blue default
    }
  };
  
  const navigateDate = (direction: number) => {
    switch (viewType) {
      case 'day':
        setCurrentDate(addDays(currentDate, direction));
        break;
      case 'week':
        setCurrentDate(addDays(currentDate, direction * 7));
        break;
      case 'month':
        setCurrentDate(addDays(currentDate, direction * 30));
        break;
    }
  };

  const handleGenerateSchedule = () => {
    generateSmartSchedule();
  };

  const handleClearHistorical = () => {
    const confirmed = window.confirm(
      'Remove courses and items that ended in the past? This keeps only active courses based on due dates and events.'
    );
    if (confirmed) {
      removeHistoricalCourses();
    }
  };

  // Auto-clean historical courses/items (grace window: 10 days)
  useEffect(() => {
    if (cleanupRan.current) return;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 10);
    removeHistoricalCourses(cutoff);
    cleanupRan.current = true;
  }, [removeHistoricalCourses]);

  useEffect(() => {
    // Health indicators (OpenAI, fixture/mock status)
    fetch('/api/health')
      .then(res => res.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  // Detect and handle overlapping events - only group actually overlapping items
  const detectOverlaps = (items: any[]) => {
    const sortedItems = [...items].sort((a, b) => {
      const aStart = ensureDate(a.startTime).getTime();
      const bStart = ensureDate(b.startTime).getTime();
      return aStart - bStart;
    });

    // Group items into overlap clusters
    const overlapGroups: any[][] = [];
    const processedItems = new Set();
    
    sortedItems.forEach(item => {
      if (processedItems.has(item.id || item)) return;
      
      const itemStart = ensureDate(item.startTime).getTime();
      const itemEnd = ensureDate(item.endTime).getTime();
      
      // Find all items that overlap with this one
      const overlappingItems = [item];
      processedItems.add(item.id || item);
      
      // Check for items that overlap with any item in the group
      let i = 0;
      while (i < overlappingItems.length) {
        const currentItem = overlappingItems[i];
        const currentStart = ensureDate(currentItem.startTime).getTime();
        const currentEnd = ensureDate(currentItem.endTime).getTime();
        
        sortedItems.forEach(otherItem => {
          if (processedItems.has(otherItem.id || otherItem)) return;
          
          const otherStart = ensureDate(otherItem.startTime).getTime();
          const otherEnd = ensureDate(otherItem.endTime).getTime();
          
          // Check if items overlap
          if ((otherStart < currentEnd && otherEnd > currentStart)) {
            overlappingItems.push(otherItem);
            processedItems.add(otherItem.id || otherItem);
          }
        });
        i++;
      }
      
      if (overlappingItems.length > 0) {
        overlapGroups.push(overlappingItems);
      }
    });
    
    // Assign positions within each overlap group
    const itemsWithPositions = new Map();
    
    overlapGroups.forEach(group => {
      if (group.length === 1) {
        // No overlap, full width
        itemsWithPositions.set(group[0].id || group[0], {
          ...group[0],
          column: 0,
          totalColumns: 1
        });
      } else {
        // Assign columns within the group
        const columns: any[][] = [];
        
        group.forEach(item => {
          const itemStart = ensureDate(item.startTime).getTime();
          const itemEnd = ensureDate(item.endTime).getTime();
          
          let placed = false;
          for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            let canPlace = true;
            
            for (const colItem of column) {
              const colStart = ensureDate(colItem.startTime).getTime();
              const colEnd = ensureDate(colItem.endTime).getTime();
              
              if (itemStart < colEnd && itemEnd > colStart) {
                canPlace = false;
                break;
              }
            }
            
            if (canPlace) {
              column.push(item);
              placed = true;
              break;
            }
          }
          
          if (!placed) {
            columns.push([item]);
          }
        });
        
        // Assign positions
        columns.forEach((column, colIndex) => {
          column.forEach(item => {
            itemsWithPositions.set(item.id || item, {
              ...item,
              column: colIndex,
              totalColumns: columns.length
            });
          });
        });
      }
    });
    
    return itemsWithPositions;
  };

  // Filter events and blocks based on selected course
  const filterByCourse = (items: any[], courseField = 'courseId') => {
    if (!selectedCourseId) return items;
    return items.filter(item => item[courseField] === selectedCourseId);
  };
  
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDuePreview(false);
  };
  
  const handleBlockClick = (block: any) => {
    const task = getTaskForBlock(block.id);
    setSelectedTimeBlock({ block, task });
    setIsDuePreview(false);
  };

  const handleRescheduleOverdue = (task: any) => {
    const bufferDays = Math.max(3, task?.bufferDays || 3);
    const newDueDate = addDays(startOfDay(new Date()), bufferDays);
    updateTask(task.id, { dueDate: newDueDate, status: 'not-started' });
    setTimeout(() => scheduleTask(task.id), 0);
  };

  const handleViewDueForTask = (task: any) => {
    if (!task?.dueDate) return;
    const dueDate = new Date(task.dueDate);
    if (Number.isNaN(dueDate.getTime())) return;
    const dueEvent = {
      id: `due-${task.id}`,
      type: 'deadline',
      title: task.title || 'Due Item',
      startTime: dueDate,
      endTime: addMinutes(dueDate, 60),
      courseId: task.courseId,
      location: task.location || '',
      description: task.description || '',
      completed: task.status === 'completed',
    } as Event;
    setSelectedEvent(dueEvent);
    setSelectedTimeBlock(null);
    setIsDuePreview(true);
  };
  
  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, item: any, type: 'event' | 'block') => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ ...item, type });
    // Add visual feedback
    (e.target as HTMLElement).style.opacity = '0.5';
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    (e.target as HTMLElement).style.opacity = '1';
    setDraggedItem(null);
    setDragOverDate(null);
    setDragOverHour(null);
  };
  
  const handleDragOver = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(day);
    setDragOverHour(hour);
  };
  
  const handleDrop = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;
    
    // Calculate new start time based on drop position
    const newStartTime = new Date(day);
    newStartTime.setHours(hour, 0, 0, 0);
    
    // Calculate duration
    const originalStart = ensureDate(draggedItem.startTime);
    const originalEnd = ensureDate(draggedItem.endTime);
    const duration = originalEnd.getTime() - originalStart.getTime();
    
    const newEndTime = new Date(newStartTime.getTime() + duration);
    
    // Update the item based on type
    if (draggedItem.type === 'event') {
      updateEvent(draggedItem.id, {
        startTime: newStartTime,
        endTime: newEndTime
      });
    } else if (draggedItem.type === 'block') {
      updateTimeBlock(draggedItem.id, {
        startTime: newStartTime,
        endTime: newEndTime
      });
    }
    
    // Reset drag state
    setDraggedItem(null);
    setDragOverDate(null);
    setDragOverHour(null);
  };
  
  const WeekDayView = () => {
    const days = getDaysToDisplay();
    
    return (
      <Paper elevation={0} sx={{ p: 1, border: '1px solid', borderColor: 'divider', overflow: 'auto', maxHeight: '80vh' }}>
        <Box sx={{ display: 'flex' }}>
          {/* Time Column */}
          <Box sx={{ width: '80px', flexShrink: 0 }}>
            <Box sx={{ height: 40 }} /> {/* Spacer for day headers */}
            {hours.map(hour => (
              <Box key={hour} sx={{ height: HOUR_HEIGHT, display: 'flex', alignItems: 'center', pr: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </Typography>
              </Box>
            ))}
          </Box>
          
          {/* Days */}
          <Box sx={{ flex: 1, display: 'flex' }}>
              {days.map(day => {
                const allDayEvents = getUniqueEventsForDay(day);
                const allDayBlocks = getUniqueBlocksForDay(day);
                
                // Filter by selected course
                const dayEvents = filterByCourse(allDayEvents);
                const dayBlocks = filterByCourse(allDayBlocks.map(block => {
                  const task = getTaskForBlock(block.id);
                  return { ...block, courseId: task?.courseId };
                }));

                const normalizedDayEvents = dayEvents.filter(Boolean).map((event, idx) => {
                  const fallbackType = (event as any)?.event_type ?? 'meeting';
                  const type = event?.type || fallbackType;
                  if (!event?.type) {
                    console.warn('Injected default event type', { index: idx, event, type });
                  }
                  return { ...event, type };
                });
                const normalizedDayBlocks = dayBlocks.filter(Boolean).map((block, idx) => {
                  const task = getTaskForBlock(block.id);
                  const fallbackType = block?.type || task?.type || 'study';
                  if (!block?.type) {
                    console.warn('Injected default block type', { index: idx, block, fallbackType });
                  }
                  return { ...block, type: fallbackType };
                });

                const dueBlocks = normalizedDayBlocks.filter(b => b.type === 'due' || b.type === 'deadline');
                const remainingBlocks = normalizedDayBlocks.filter(b => b.type !== 'due' && b.type !== 'deadline');

                // Group DUE events/blocks by course and due day (ignore time to collapse 11:59pm piles)
                const groupedDue = new Map<string, any[]>();
                const addDue = (item: any, course: any) => {
                  const startKey = format(ensureDate(item.startTime), 'yyyy-MM-dd');
                  const key = `${course?.id || course?.code || 'unknown'}-${startKey}`;
                  if (!groupedDue.has(key)) groupedDue.set(key, []);
                  groupedDue.get(key)!.push(item);
                };

                normalizedDayEvents.forEach(evt => {
                  const kind = resolveVisualKindForEvent(evt);
                  if (kind !== 'DUE') return;
                  const course = getCourseForEvent(evt);
                  addDue(evt, course);
                });

                dueBlocks.forEach(block => {
                  const task = getTaskForBlock(block.id);
                  const course = task ? getCourse(task.courseId) : null;
                  const start = ensureDate(block.startTime);
                  addDue({
                    ...block,
                    startTime: start,
                    endTime: ensureDate(block.endTime || addMinutes(start, 30)),
                    title: task?.title || 'Due',
                    courseId: task?.courseId,
                  }, course);
                });

                const collapsedDueItems: any[] = [];
                groupedDue.forEach((list, key) => {
                  const first = list[0];
                  const course = getCourseForEvent(first) || getCourse((first as any).courseId || key);
                  const titleBase = course?.code || course?.name || 'Due';
                  const earliest = list.reduce((acc: Date, item: any) => {
                    const st = ensureDate(item.startTime);
                    return st < acc ? st : acc;
                  }, ensureDate(list[0].startTime));
                  const compact = list.length > 3;
                  collapsedDueItems.push({
                    ...first,
                    id: `due-group-${key}-${day.toISOString()}`,
                    type: 'deadline',
                    title: compact ? `${titleBase}` : list.length > 1 ? `${titleBase} • ${list.length} due` : first.title,
                    startTime: earliest,
                    endTime: addMinutes(earliest, 30),
                    isDueGroup: true,
                    dueCount: list.length,
                    courseId: course?.id,
                    onClick: () => setDueModal({
                      open: true,
                      items: list.map((d: any) => ({
                        id: d.id,
                        title: d.title,
                        subtitle: format(ensureDate(d.startTime), 'h:mm a'),
                        course
                      })),
                      date: day
                    }),
                    compact,
                  });
                });

                const nonDueEvents = normalizedDayEvents.filter(evt => resolveVisualKindForEvent(evt) !== 'DUE');
                const normalizedDayEventsWithGroups = [...nonDueEvents, ...collapsedDueItems];

                const allItems = [...normalizedDayEventsWithGroups, ...remainingBlocks];
                allItems.forEach((item, idx) => {
                  if (!item || !item.type) {
                    console.error('Bad calendar item before render', { index: idx, item });
                  }
                });
                const itemsWithPositions = detectOverlaps(allItems);
                
                const columnWidth = viewType === 'day' ? '100%' : `${100 / 7}%`;
                
                return (
                  <Box sx={{ width: columnWidth, minWidth: 0 }} key={day.toISOString()}>
                    {/* Day Header */}
                    <Box sx={{ 
                      height: 40, 
                      borderBottom: '1px solid',
                      borderLeft: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isToday(day) ? 'primary.light' : 'background.paper',
                      color: isToday(day) ? 'white' : 'text.primary',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Typography variant="caption" fontWeight={500}>
                        {format(day, 'EEE')}
                      </Typography>
                      <Typography variant="body2" fontWeight={isToday(day) ? 600 : 400}>
                        {format(day, 'd')}
                      </Typography>
                    </Box>
                    
                    {/* Day Grid */}
                    <Box sx={{ position: 'relative', borderLeft: '1px solid', borderColor: 'divider' }}>
                      {hours.map(hour => (
                        <Box 
                          key={hour} 
                          sx={{ 
                            height: HOUR_HEIGHT, 
                            borderBottom: '1px solid', 
                            borderColor: 'divider',
                            backgroundColor: dragOverDate && isSameDay(dragOverDate, day) && dragOverHour === hour + 5 
                              ? 'action.hover' 
                              : 'transparent',
                            transition: 'background-color 0.2s'
                          }}
                          onDragOver={(e) => handleDragOver(e, day, hour + 5)}
                          onDrop={(e) => handleDrop(e, day, hour + 5)}
                        />
                      ))}
                      
                    {/* Events */}
                    {normalizedDayEventsWithGroups.map(event => {
                      const positionData = itemsWithPositions.get(event.id || event);
                      const startTime = ensureDate(event.startTime);
                      const endTime = ensureDate(event.endTime);
                      const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                      const endHour = endTime.getHours() + endTime.getMinutes() / 60;
                      const duration = endHour - startHour;
                      const course = getCourseForEvent(event);
                      const loggedEvent = {
                        id: event?.id,
                        title: event?.title,
                        type: event?.type,
                        color: getEventColor(event),
                      };
                      if (!loggedEvent.type) {
                        console.warn('Event payload before render', JSON.stringify(loggedEvent));
                      }
                      const baseColor = loggedEvent.color;
                      if (!baseColor || typeof baseColor !== 'string' || !baseColor.startsWith('#')) {
                        console.warn('Event base color invalid', {
                          event: loggedEvent,
                          computed: baseColor,
                        });
                      }
                      const visualKind = resolveVisualKindForEvent(event);
                      const visual = safeDeriveVisual('week-event', visualKind, baseColor, event);
                      const bandLabel = getBandLabelForEvent(event);
                      const cardHeight = Math.max(minBlockHeight, duration * HOUR_HEIGHT - 4);
                      const column = positionData?.column || 0;
                      const totalColumns = positionData?.totalColumns || 1;
                      const width = `calc(${100 / totalColumns}% - 4px)`;
                      const leftPosition = `${(column * 100) / totalColumns}%`;
                      const isDueGroup = (event as any).isDueGroup;
                      const dueCount = (event as any).dueCount || 0;
                      const isCompactDue = isDueGroup && (event as any).compact;
                      const groupTitle = isDueGroup
                        ? `${event.title}${dueCount > 1 ? ` (+${dueCount - 1} more)` : ''}`
                        : event.title;

                        const datePill =
                          visualKind === 'DUE' ? (
                            <Box
                              sx={{
                                width: 52,
                                minWidth: 52,
                                backgroundColor: visual.band,
                                color: '#fff',
                                borderRadius: 0.5,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 0.1,
                                textTransform: 'uppercase',
                                letterSpacing: 0.4,
                                fontWeight: 800,
                                py: 0.25
                              }}
                            >
                              <Typography variant="caption" sx={{ lineHeight: 1, fontWeight: 800, fontSize: '10px' }}>
                                DUE
                              </Typography>
                              <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 900, fontSize: 16 }}>
                                {format(startTime, 'd')}
                              </Typography>
                              <Typography variant="caption" sx={{ lineHeight: 1, fontWeight: 800, fontSize: '10px' }}>
                                {format(startTime, 'MMM').toUpperCase()}
                              </Typography>
                            </Box>
                          ) : null;

                        if (isCompactDue) {
                          return (
                            <Tooltip key={event.id} title={groupTitle}>
                              <Card
                                sx={{
                                  position: 'absolute',
                                  top: `${(startHour - hoursRange.start) * HOUR_HEIGHT}px`,
                                  height: 70,
                                  width: 70,
                                  left: leftPosition,
                                  backgroundColor: visual.fill,
                                  color: visual.text,
                                  border: `1px solid ${RED_BAND}`,
                                  borderRadius: 1,
                                  boxShadow: CARD_SHADOW,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                }}
                                onClick={(event as any).onClick}
                              >
                                <Stack spacing={0.3} alignItems="center">
                                  <Typography variant="caption" fontWeight={800} sx={{ lineHeight: 1, color: RED_BAND }}>
                                    DUE
                                  </Typography>
                                  <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1.1 }} noWrap>
                                    {course?.code || 'Course'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                                    +{dueCount} due
                                  </Typography>
                                </Stack>
                              </Card>
                            </Tooltip>
                          );
                        }

                        return (
                          <Tooltip key={event.id} title={`${groupTitle} - ${course?.name || 'Unknown Course'}`}>
                            <Card
                              data-testid="schedule-item"
                              draggable
                              onDragStart={(e) => handleDragStart(e, event, 'event')}
                              onDragEnd={handleDragEnd}
                              sx={{
                                position: 'absolute',
                                top: `${(startHour - hoursRange.start) * HOUR_HEIGHT}px`,
                                height: `${cardHeight}px`,
                                left: leftPosition,
                                width,
                                minWidth: MIN_CARD_WIDTH,
                                backgroundColor: visual.fill,
                                color: visual.text,
                                cursor: 'move',
                                zIndex: event.type === 'deadline' ? 3 : 2,
                                borderRadius: cardRadius,
                                border: `1px solid ${visualKind === 'DUE' ? RED_BAND : visual.border}`,
                                boxShadow: CARD_SHADOW,
                                overflow: 'hidden',
                                '&:hover': {
                                  boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
                                  transition: 'all 0.12s'
                                }
                              }}
                              onClick={() => {
                                if ((event as any).onClick) {
                                  (event as any).onClick();
                                } else {
                                  handleEventClick(event);
                                }
                              }}
                          >
                            <CardContent sx={{ pl: 0, pr: cardPadding, py: cardPadding, '&:last-child': { pb: cardPadding }, height: '100%', display: 'flex', gap: cardGap, alignItems: 'stretch' }}>
                              {visualKind === 'DUE' ? (
                                <>
                                  {datePill}
                                  <Stack spacing={0.15} sx={{ minWidth: 0, alignSelf: 'center' }}>
                                    <Typography 
                                      variant="caption" 
                                      fontWeight={800} 
                                      noWrap
                                      sx={{ fontSize: '11px', letterSpacing: 0.3, color: '#fff' }}
                                    >
                                      {isDueGroup ? groupTitle : event.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '9px', color: '#fff' }} noWrap>
                                      {format(startTime, 'h:mm a')}
                                    </Typography>
                                    {course?.code && (
                                      <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '9px', color: '#fff' }} noWrap>
                                        {course.code}
                                      </Typography>
                                    )}
                                    {isDueGroup && dueCount > 1 && (
                                      <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '9px', color: '#fff' }} noWrap>
                                        +{dueCount - 1} more
                                      </Typography>
                                    )}
                                  </Stack>
                                </>
                              ) : (
                                <>
                                    <Box
                                    sx={{
                                      width: bandWidth,
                                      minWidth: bandWidth,
                                      flexShrink: 0,
                                      backgroundColor: visual.band,
                                      color: getTextOn(visual.band),
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      writingMode: 'vertical-rl',
                                      textTransform: 'uppercase',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      letterSpacing: 0.5,
                                      px: 0.2,
                                      borderTopLeftRadius: cardRadius,
                                      borderBottomLeftRadius: cardRadius
                                    }}
                                  >
                                    {bandLabel}
                                  </Box>
                                  <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                                    <Typography 
                                      variant="caption" 
                                      fontWeight={800} 
                                      noWrap
                                      sx={{ fontSize: '11px', letterSpacing: 0.3 }}
                                    >
                                      {isDueGroup ? groupTitle : event.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '9.5px' }} noWrap>
                                      {format(startTime, 'h:mm a')} – {format(endTime, 'h:mm a')}
                                    </Typography>
                                    {course?.code && (
                                      <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '9px' }} noWrap>
                                        {course.code}
                                      </Typography>
                                    )}
                                    {isDueGroup && dueCount > 1 && (
                                      <Typography variant="caption" color="text.secondary" noWrap>
                                        +{dueCount - 1} more
                                      </Typography>
                                    )}
                                  </Stack>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        </Tooltip>
                      );
                    })}
                    
                    {/* Study Blocks */}
                    {normalizedDayBlocks.map(block => {
                      const positionData = itemsWithPositions.get(block.id || block);
                      const task = getTaskForBlock(block.id);
                      const course = task ? getCourse(task.courseId) : null;
                      const startTime = ensureDate(block.startTime);
                      const endTime = ensureDate(block.endTime);
                      const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                      const endHour = endTime.getHours() + endTime.getMinutes() / 60;
                      const duration = endHour - startHour;
                      const courseColor = getCourseColor(course?.color, course?.id || task?.courseId || task?.title, activePaletteColors);
                      const blockLog = {
                        id: block?.id,
                        taskId: block?.taskId,
                        type: block?.type,
                        color: courseColor,
                      };
                      if (!blockLog.type) {
                        console.warn('Block payload before render', JSON.stringify(blockLog));
                      }
                      if (!courseColor || typeof courseColor !== 'string' || !courseColor.startsWith('#')) {
                        console.warn('Block course color invalid', courseColor);
                      }
                      const visualKind: VisualKind = block?.type === 'due' ? 'DUE' : 'DO';
                      const visual = safeDeriveVisual('week-block', visualKind, courseColor, {
                        ...block,
                        taskType: task?.type,
                        course,
                      });
                      const cardHeight = Math.max(minBlockHeight, duration * HOUR_HEIGHT - 4);
                      const blockLabel = getDoSubcategory(task);
                      const bandLabel = visualKind === 'DUE'
                        ? 'DUE'
                        : visualKind === 'LECTURE'
                          ? 'LECTURE'
                          : blockLabel;

                      const column = positionData?.column || 0;
                      const totalColumns = positionData?.totalColumns || 1;
                      const width = `calc(${100 / totalColumns}% - 4px)`;
                      const leftPosition = `${(column * 100) / totalColumns}%`;

                      const datePill = visualKind === 'DUE' && (
                        <Box
                          sx={{
                            width: 52,
                            minWidth: 52,
                            backgroundColor: visual.band,
                            color: '#fff',
                            borderRadius: 0.5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 0.1,
                            textTransform: 'uppercase',
                            letterSpacing: 0.4,
                            fontWeight: 800,
                            py: 0.25
                          }}
                        >
                          <Typography variant="caption" sx={{ lineHeight: 1, fontWeight: 800, fontSize: '10px' }}>
                            DUE
                          </Typography>
                          <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 900, fontSize: 16 }}>
                            {format(startTime, 'd')}
                          </Typography>
                          <Typography variant="caption" sx={{ lineHeight: 1, fontWeight: 800, fontSize: '10px' }}>
                            {format(startTime, 'MMM').toUpperCase()}
                          </Typography>
                        </Box>
                      );

                      return (
                        <Tooltip key={block.id} title={`${task?.type || 'Study'}: ${task?.title || 'Study Session'}`}>
                          <Card
                            data-testid="schedule-item"
                            draggable
                            onDragStart={(e) => handleDragStart(e, block, 'block')}
                            onDragEnd={handleDragEnd}
                            sx={{
                              position: 'absolute',
                              top: `${(startHour - hoursRange.start) * HOUR_HEIGHT}px`,
                              height: `${cardHeight}px`,
                              left: leftPosition,
                              width,
                              minWidth: MIN_CARD_WIDTH,
                              backgroundColor: visual.fill,
                              color: visual.text,
                              borderRadius: cardRadius,
                              overflow: 'hidden',
                              cursor: 'move',
                              zIndex: visualKind === 'EXAM' || visualKind === 'DUE' ? 3 : 1,
                              border: `1px solid ${visualKind === 'DUE' ? RED_BAND : visual.border}`,
                              boxShadow: CARD_SHADOW,
                              '&:hover': {
                                boxShadow: '0 6px 12px rgba(0,0,0,0.08)',
                                transition: 'all 0.12s'
                              }
                            }}
                            onClick={() => handleBlockClick(block)}
                          >
                            <CardContent sx={{ pl: 0, pr: cardPadding, py: cardPadding, '&:last-child': { pb: cardPadding }, height: '100%', display: 'flex', gap: cardGap, alignItems: 'stretch' }}>
                              {visualKind === 'DUE' ? (
                                <>
                                  {datePill}
                                  <Stack spacing={0.15} sx={{ minWidth: 0, alignSelf: 'center' }}>
                                    <Typography
                                      variant="caption"
                                      fontWeight={800}
                                      noWrap
                                      sx={{ fontSize: '11px', letterSpacing: 0.3, color: '#fff' }}
                                    >
                                      {task?.title || 'Deadline'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '9px', color: '#fff' }} noWrap>
                                      {format(startTime, 'h:mm a')}
                                    </Typography>
                                    {course?.code && (
                                      <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '9px', color: '#fff' }} noWrap>
                                        {course.code}
                                      </Typography>
                                    )}
                                  </Stack>
                                </>
                              ) : (
                                <>
                                  <Box
                                    sx={{
                                      width: bandWidth,
                                      minWidth: bandWidth,
                                      flexShrink: 0,
                                      backgroundColor: visual.band,
                                      color: getTextOn(visual.band),
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      writingMode: 'vertical-rl',
                                      textTransform: 'uppercase',
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      letterSpacing: 0.5,
                                      px: 0.2,
                                      borderTopLeftRadius: cardRadius,
                                      borderBottomLeftRadius: cardRadius
                                    }}
                                  >
                                    {bandLabel}
                                  </Box>
                                  <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                                    <Typography
                                      variant="caption"
                                      fontWeight={800}
                                      noWrap
                                      sx={{ fontSize: '11px', letterSpacing: 0.3 }}
                                    >
                                      {task?.title || 'Study Session'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '9.5px' }} noWrap>
                                      {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                                    </Typography>
                                    {course && (
                                      <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '9px' }} noWrap>
                                        {course.code}
                                      </Typography>
                                    )}
                                  </Stack>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              );
            })}
        </Box>
      </Box>
    </Paper>
    );
  };
  
  const MonthView = () => {
    const weeks = [];
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    let currentWeekStart = startOfWeek(monthStart);
    
    while (currentWeekStart <= monthEnd) {
      const week = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
      weeks.push(week);
      currentWeekStart = addDays(currentWeekStart, 7);
    }
    
    return (
      <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
        {/* Day Headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Box key={day} sx={{ p: 1, borderBottom: '2px solid', borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="subtitle2" fontWeight={500}>
                {day}
              </Typography>
            </Box>
          ))}
        </Box>
        
        {/* Month Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map(day => {
                const dayEvents = getUniqueEventsForDay(day);
                const dayBlocks = getUniqueBlocksForDay(day);
                const isCurrentMonth = day >= monthStart && day <= monthEnd;
                const dayItems = [
                  ...dayEvents.map(event => ({
                    id: event.id,
                    title: event.title,
                    subtitle: format(ensureDate(event.startTime), 'h:mm a'),
                    startTime: ensureDate(event.startTime),
                    visualKind: resolveVisualKindForEvent(event),
                    color: getEventColor(event),
                    onClick: () => handleEventClick(event),
                  })),
                  ...dayBlocks.map(block => {
                    const task = getTaskForBlock(block.id);
                    const course = task ? getCourse(task.courseId) : null;
                    const visualKind: VisualKind = block?.type === 'due' ? 'DUE' : 'DO';
                    const blockLabel = getDoSubcategory(task);
                    return {
                      id: block.id,
                      title: task?.title || 'Study',
                      subtitle: `${format(ensureDate(block.startTime), 'h:mm a')}${course?.code ? ` • ${course.code}` : ''}`,
                      startTime: ensureDate(block.startTime),
                      visualKind,
                      blockLabel,
                      color: getCourseColor(course?.color, course?.id, activePaletteColors),
                      onClick: () => handleBlockClick(block),
                    };
                  }),
                ].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

                const dueItems = dayItems.filter(item => item.visualKind === 'DUE');
                const nonDueItems = dayItems.filter(item => item.visualKind !== 'DUE');
                const collapsedDueItems: any[] = [];
                if (dueItems.length > 0) {
                  const first = dueItems[0];
                  collapsedDueItems.push({
                    ...first,
                    title: dueItems.length > 1 ? `Due: ${dueItems.length} items` : first.title,
                    subtitle: dueItems.length > 1 ? `${format(first.startTime, 'h:mm a')} • +${dueItems.length - 1} more` : first.subtitle,
                    onClick: () => setDueModal({ open: true, items: dueItems, date: day }),
                  });
                }
                const renderItems = [...nonDueItems, ...collapsedDueItems].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
                
                return (
                  <Box key={day.toISOString()} sx={{
                    minHeight: 150,
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: !isCurrentMonth ? 'grey.50' : isToday(day) ? 'primary.lighter' : 'background.paper',
                    opacity: !isCurrentMonth ? 0.65 : 1
                  }}>
                      <Typography 
                        variant="body2" 
                        fontWeight={isToday(day) ? 700 : 500}
                        color={isToday(day) ? 'primary.main' : 'text.primary'}
                      >
                        {format(day, 'd')}
                      </Typography>
                      
                      <Stack spacing={0.75} sx={{ mt: 1 }}>
                        {renderItems.slice(0, 3).map(item => {
                          const visual = safeDeriveVisual('month-item', item.visualKind, item.color, item);
                          const bandLabel =
                            item.visualKind === 'DUE'
                              ? 'DUE'
                              : item.visualKind === 'EXAM'
                              ? 'EXAM'
                              : item.visualKind === 'LECTURE'
                              ? 'LECTURE'
                              : item.blockLabel || 'STUDY';

                          return (
                            <Card
                              key={item.id}
                              onClick={item.onClick}
                              sx={{
                                minHeight: minBlockHeight,
                                display: 'flex',
                                alignItems: 'stretch',
                                border: `1px solid ${visual.border}`,
                                borderRadius: 1,
                                boxShadow: 'none',
                                cursor: 'pointer',
                                backgroundColor: visual.fill,
                                color: visual.text,
                                overflow: 'hidden',
                                minWidth: MIN_CARD_WIDTH
                              }}
                            >
                              <Box
                                sx={{
                                  width: bandWidth,
                                  minWidth: bandWidth,
                                  borderRight: `1px solid ${visual.border}`,
                                  backgroundColor: visual.band,
                                  color: getTextOn(visual.band),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  writingMode: 'vertical-rl',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  letterSpacing: 0.5,
                                  px: 0.5
                                }}
                              >
                                {bandLabel}
                              </Box>
                              <Stack spacing={0.35} sx={{ p: 0.75, minWidth: 0, flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ fontSize: '12px' }}>
                                  {item.title}
                                </Typography>
                                <Typography variant="caption" sx={{ opacity: 0.85, fontSize: '10px' }} noWrap>
                                  {item.subtitle}
                                </Typography>
                              </Stack>
                              {item.visualKind === 'DUE' && (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 0.85,
                                    backgroundColor: '#fff',
                                    color: '#0f172a',
                                    borderLeft: `1px solid ${visual.border}`,
                                    minWidth: 50
                                  }}
                                >
                                  <Stack spacing={0} sx={{ textAlign: 'center' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, lineHeight: 1 }}>
                                      {format(item.startTime, 'd')}
                                    </Typography>
                                    <Typography variant="caption" sx={{ fontSize: '10px', lineHeight: 1 }}>
                                      {format(item.startTime, 'MMM').toUpperCase()}
                                    </Typography>
                                  </Stack>
                                </Box>
                              )}
                            </Card>
                          );
                        })}

                        {renderItems.length === 0 && (
                          <Typography variant="caption" color="text.disabled">
                            No items
                          </Typography>
                        )}

                        {renderItems.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{renderItems.length - 3} more
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                );
              })}
            </React.Fragment>
          ))}
        </Box>
      </Paper>
    );
  };
  
  // Hide top harness buttons when navigated from mock-test to avoid confusion
  const hideHarnessControls = Boolean(typeof window !== 'undefined' && window.location.pathname.includes('/dev/scheduler-mock'));

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 2 }}>
          <Typography variant="h4" fontWeight={600} color="text.primary">
            Schedule
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Button variant="contained" size="small" onClick={handleGenerateSchedule}>
              Generate
            </Button>
            <Button variant="outlined" size="small" color="warning" onClick={handleClearHistorical}>
              Remove past courses
            </Button>
            <ButtonGroup variant="outlined" size="small">
              <Button
                variant={viewType === 'day' ? 'contained' : 'outlined'}
                onClick={() => setViewType('day')}
              >
                Day
              </Button>
              <Button
                variant={viewType === 'week' ? 'contained' : 'outlined'}
                onClick={() => setViewType('week')}
              >
                Week
              </Button>
              <Button
                variant={viewType === 'month' ? 'contained' : 'outlined'}
                onClick={() => setViewType('month')}
              >
                Month
              </Button>
            </ButtonGroup>
            {health && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Chip size="small" label="OpenAI" color={health.openaiEnabled ? 'success' : 'error'} />
                <Chip size="small" label="Fixture" color={health.fixtureEnabled ? 'success' : 'error'} />
                <Chip
                  size="small"
                  label="Mock"
                  color={health.mockExtraction ? 'error' : 'success'}
                />
              </Stack>
            )}
          </Box>
        </Box>

        {hideHarnessControls && (
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <Alert severity="info" sx={{ flex: 1 }}>
              Data already loaded from mock-test. Use the Generate button above to reschedule; top harness buttons are hidden.
            </Alert>
          </Box>
        )}

        {overdueTasks.length > 0 && (
          <Paper variant="outlined" sx={{ p: 1.25, mb: 1.5, borderColor: 'error.light', bgcolor: 'error.lighter' }}>
            <Typography variant="subtitle2" color="error" fontWeight={700} sx={{ mb: 0.5 }}>
              Overdue — needs your attention
            </Typography>
            <Stack spacing={0.5}>
              {overdueTasks.slice(0, 4).map(task => (
                <Stack key={task.id} direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleViewDueForTask(task)}
                    sx={{ textTransform: 'none', justifyContent: 'flex-start', flex: 1 }}
                  >
                    <Typography variant="body2" noWrap sx={{ textAlign: 'left', width: '100%' }}>
                      {task.title}
                    </Typography>
                  </Button>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Due {format(new Date(task.dueDate), 'MMM d')}
                  </Typography>
                  <Button size="small" variant="outlined" onClick={() => handleRescheduleOverdue(task)}>
                    Reschedule
                  </Button>
                  <Button size="small" color="success" onClick={() => updateTask(task.id, { status: 'completed' })}>
                    Mark done
                  </Button>
                </Stack>
              ))}
              {overdueTasks.length > 4 && (
                <Typography variant="caption" color="text.secondary">
                  +{overdueTasks.length - 4} more overdue
                </Typography>
              )}
            </Stack>
          </Paper>
        )}

        {scheduleWarnings.unscheduledTaskIds.length > 0 && (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            {scheduleWarnings.message}
          </Alert>
        )}
        {scheduleWarnings.details && scheduleWarnings.details.length > 0 && (
          <Paper variant="outlined" sx={{ p: 1.25, mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
              Unscheduled details
            </Typography>
            <Stack spacing={0.5}>
              {scheduleWarnings.details.slice(0, 8).map((d) => (
                <Stack key={d.taskId} direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                    {d.title || 'Task'} — {Math.ceil(d.remainingMinutes / 60 * 10) / 10}h remaining
                  </Typography>
                  {d.dueDate && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      Due {format(new Date(d.dueDate), 'MMM d')}
                    </Typography>
                  )}
                </Stack>
              ))}
              {scheduleWarnings.details.length > 8 && (
                <Typography variant="caption" color="text.secondary">
                  +{scheduleWarnings.details.length - 8} more
                </Typography>
              )}
            </Stack>
          </Paper>
        )}

        {visibleCourses.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            {visibleCourses.map(course => {
              const color = getCourseColor(course.color, course.id, activePaletteColors);
              return (
                <Box
                  key={course.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1,
                    py: 0.5,
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: color || FALLBACK_COLOR
                    }}
                  />
                  <Typography variant="caption" fontWeight={600} noWrap>
                    {course.code}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
        
        {/* Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
          <IconButton onClick={() => navigateDate(-1)}>
            <ChevronLeftIcon />
          </IconButton>
          
          <Typography variant="h6" sx={{ flex: 1, textAlign: 'center' }}>
            {viewType === 'month' 
              ? format(currentDate, 'MMMM yyyy')
              : viewType === 'week'
              ? `${format(startOfWeek(currentDate), 'MMM d')} - ${format(addDays(startOfWeek(currentDate), 6), 'MMM d, yyyy')}`
              : format(currentDate, 'EEEE, MMMM d, yyyy')
            }
          </Typography>
          
          <IconButton onClick={() => navigateDate(1)}>
            <ChevronRightIcon />
          </IconButton>
          
          <Button
            variant="outlined"
            startIcon={<TodayIcon />}
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </Box>
        
        {/* Calendar View */}
        {viewType === 'month' ? <MonthView /> : <WeekDayView />}

        {/* Event Modal */}
        {(selectedEvent || selectedTimeBlock) && (
          <EventModalMUI
            event={selectedEvent}
            timeBlock={selectedTimeBlock}
            courses={courses}
            onClose={() => {
              setSelectedEvent(null);
              setSelectedTimeBlock(null);
              setIsDuePreview(false);
            }}
            onViewDue={
              selectedTimeBlock?.task?.dueDate
                ? () => handleViewDueForTask(selectedTimeBlock.task)
                : undefined
            }
            readOnly={isDuePreview}
          />
        )}

        <Dialog open={dueModal.open} onClose={() => setDueModal({ open: false, items: [] })} maxWidth="sm" fullWidth>
          <DialogTitle>Due items{dueModal.date ? ` — ${format(dueModal.date, 'MMM d')}` : ''}</DialogTitle>
          <DialogContent dividers>
            <List dense>
              {dueModal.items.map((d) => (
                <ListItem key={d.id}>
                  <ListItemText
                    primary={d.title}
                    secondary={d.subtitle || format(d.startTime, 'h:mm a')}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDueModal({ open: false, items: [] })}>Close</Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
};

export default SchedulerView;
