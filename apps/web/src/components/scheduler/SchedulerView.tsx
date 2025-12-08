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
  Tooltip
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useScheduleStore } from '../../stores/useScheduleStore';
import { Event, BlockCategory } from '@studioranotes/types';
import { format, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns';
import EventModalMUI from './EventModalMUI';
import LegendFiltersModal from './LegendFiltersModal';
import { clinicalFilter } from '../../lib/clinicalFilter';
import { determineBlockCategory } from '../../lib/blockVisuals';

type ViewType = 'week' | 'day' | 'month';

const FALLBACK_COLOR = '#6b7280';
const HOUR_HEIGHT = 52;
const RED_BAND = '#c53030';
const MIN_BLOCK_HEIGHT = 54;
const BAND_WIDTH = 18;

type VisualKind = 'DO' | 'LECTURE' | 'EXAM' | 'DUE';

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

const getCourseColor = (color?: string) => color || FALLBACK_COLOR;

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

const deriveVisual = (kind: VisualKind, baseColor: string) => {
  const course = getCourseColor(baseColor);
  const courseDark = darken(course, 0.2);
  const courseLight = lighten(course, 0.48);
  const outline = hexToRgba(course, 0.7);

  switch (kind) {
    case 'EXAM':
      return {
        fill: courseDark,
        border: courseDark,
        band: RED_BAND,
        text: '#ffffff',
        subtle: '#e2e8f0',
      };
    case 'DUE':
      return {
        fill: courseDark,
        border: RED_BAND,
        band: RED_BAND,
        text: '#ffffff',
        subtle: '#e2e8f0',
      };
    case 'LECTURE':
      return {
        fill: lighten(course, 0.6),
        border: hexToRgba(course, 0.35),
        band: course,
        text: darken(course, 0.55),
        subtle: darken(course, 0.25),
      };
    case 'DO':
    default:
      return {
        fill: '#ffffff',
        border: outline,
        band: course,
        text: darken(course, 0.45),
        subtle: darken(course, 0.35),
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

const SchedulerView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('week');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedBlockCats, setSelectedBlockCats] = useState<BlockCategory[]>([]);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const {
    timeBlocks,
    tasks,
    events,
    courses,
    updateEvent,
    updateTimeBlock,
    updateTask,
    generateSmartSchedule,
  } = useScheduleStore();
  
  const ensureDate = (date: Date | string): Date => {
    return typeof date === 'string' ? new Date(date) : date;
  };
  
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
  
  const hoursRange = useMemo(() => {
    const startTs = days[0] ? new Date(days[0]) : new Date();
    const endTs = days[days.length - 1] ? addDays(days[days.length - 1], 1) : new Date();

    const allTimes: number[] = [];
    [...events, ...timeBlocks].forEach(item => {
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

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleBlockFilter = (cat: BlockCategory) => {
    setSelectedBlockCats((prev) =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

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

  const typesInRange = useMemo(() => {
    const typeSet = new Set<string>();
    const rangeStart = days[0] ? new Date(days[0]) : new Date();
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = days[days.length - 1] ? addDays(days[days.length - 1], 1) : new Date();

    const taskMap = new Map(tasks.map(t => [t.id, t]));

    events.forEach(evt => {
      const start = ensureDate(evt.startTime);
      if (start >= rangeStart && start <= rangeEnd && evt.type) {
        typeSet.add(evt.type);
      }
    });

    timeBlocks.forEach(block => {
      const start = ensureDate(block.startTime);
      if (start >= rangeStart && start <= rangeEnd) {
        const task = taskMap.get(block.taskId);
        if (task?.type) typeSet.add(task.type);
      }
    });

    return Array.from(typeSet);
  }, [days, events, timeBlocks, tasks]);

  const blocksInRange = useMemo(() => {
    const blockSet = new Set<BlockCategory>();
    const rangeStart = days[0] ? new Date(days[0]) : new Date();
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = days[days.length - 1] ? addDays(days[days.length - 1], 1) : new Date();

    const taskMap = new Map(tasks.map(t => [t.id, t]));

    events.forEach(evt => {
      const start = ensureDate(evt.startTime);
      if (start >= rangeStart && start <= rangeEnd) {
        const cat = determineBlockCategory(evt.type || 'event', isHardDeadlineType(evt.type));
        blockSet.add(cat);
      }
    });

    timeBlocks.forEach(block => {
      const start = ensureDate(block.startTime);
      if (start >= rangeStart && start <= rangeEnd) {
        const task = taskMap.get(block.taskId);
        const cat = determineBlockCategory(task?.type || 'assignment', Boolean(task?.isHardDeadline));
        blockSet.add(cat);
      }
    });

    return Array.from(blockSet);
  }, [days, events, timeBlocks, tasks]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks
      .filter(t => t.status === 'overdue' || (new Date(t.dueDate) < today && t.status !== 'completed'))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks]);
  
  const getUniqueEventsForDay = (day: Date) => {
    let dayEvents = events.filter(event => isSameDay(ensureDate(event.startTime), day));
    
    // Filter clinical events to show only actual clinical sessions and deadlines
    dayEvents = dayEvents.filter(event => {
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
      if (selectedCourseId && evt.courseId !== selectedCourseId) return false;
      if (selectedTypes.length > 0 && evt.type && !selectedTypes.includes(evt.type)) return false;
      const cat = determineBlockCategory(evt.type || 'event', isHardDeadlineType(evt.type));
      if (selectedBlockCats.length > 0 && !selectedBlockCats.includes(cat)) return false;
      return true;
    });

    const uniqueEvents = Array.from(
      new Map(dayEvents.map(event => [event.id, event])).values()
    );
    return uniqueEvents;
  };
  
  const getUniqueBlocksForDay = (day: Date) => {
    let dayBlocks = timeBlocks.filter(block => isSameDay(ensureDate(block.startTime), day));
    
    // Filter clinical-related study blocks
    dayBlocks = dayBlocks.filter(block => {
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
      if (selectedTypes.length > 0 && task?.type && !selectedTypes.includes(task.type)) return false;
      const cat = determineBlockCategory(task?.type || 'assignment', Boolean(task?.isHardDeadline));
      if (selectedBlockCats.length > 0 && !selectedBlockCats.includes(cat)) return false;
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
  
  const getEventColor = (event: Event) => {
    const course = getCourseForEvent(event);

    // Always use course color if available
    if (course?.color) {
      return course.color;
    }

    // Fallback colors for different event types when no course color
    switch (event.type) {
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
    generateSmartSchedule(new Date(), addDays(new Date(), 14));
  };

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
  };
  
  const handleBlockClick = (block: any) => {
    const task = getTaskForBlock(block.id);
    setSelectedTimeBlock({ block, task });
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
                
                // Combine and detect overlaps
                const allItems = [...dayEvents, ...dayBlocks];
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
                      {dayEvents.map(event => {
                        const positionData = itemsWithPositions.get(event.id || event);
                        const startTime = ensureDate(event.startTime);
                        const endTime = ensureDate(event.endTime);
                        const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                        const endHour = endTime.getHours() + endTime.getMinutes() / 60;
                        const duration = endHour - startHour;
                        const course = getCourseForEvent(event);
                        const baseColor = getEventColor(event);
                        const visualKind = resolveVisualKindForEvent(event);
                        const visual = deriveVisual(visualKind, baseColor);
                        const bandLabel = getBandLabelForEvent(event);
                        const cardHeight = Math.max(MIN_BLOCK_HEIGHT, duration * HOUR_HEIGHT - 4);
                        const column = positionData?.column || 0;
                        const totalColumns = positionData?.totalColumns || 1;
                        const width = `calc(${100 / totalColumns}% - 4px)`;
                        const leftPosition = `${(column * 100) / totalColumns}%`;

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

                        return (
                          <Tooltip key={event.id} title={`${event.title} - ${course?.name || 'Unknown Course'}`}>
                            <Card
                              draggable
                              onDragStart={(e) => handleDragStart(e, event, 'event')}
                              onDragEnd={handleDragEnd}
                              sx={{
                                position: 'absolute',
                                top: `${(startHour - hoursRange.start) * HOUR_HEIGHT}px`,
                                height: `${cardHeight}px`,
                                left: leftPosition,
                                width,
                                backgroundColor: visual.fill,
                                color: visual.text,
                                cursor: 'move',
                                zIndex: event.type === 'deadline' ? 3 : 2,
                                mx: 0.1,
                                borderRadius: 0.5,
                                border: `1px solid ${visualKind === 'DUE' ? RED_BAND : visual.border}`,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                                overflow: 'hidden',
                                '&:hover': {
                                  boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                                  transition: 'all 0.12s'
                                }
                              }}
                              onClick={() => handleEventClick(event)}
                          >
                            <CardContent sx={{ p: 0.5, '&:last-child': { pb: 0.5 }, height: '100%', display: 'flex', gap: 0.5, alignItems: 'stretch' }}>
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
                                      {event.title}
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
                                      width: BAND_WIDTH,
                                      minWidth: BAND_WIDTH,
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
                                      px: 0.2
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
                                      {event.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '9.5px' }} noWrap>
                                      {format(startTime, 'h:mm a')} – {format(endTime, 'h:mm a')}
                                    </Typography>
                                    {course?.code && (
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
                    
                    {/* Study Blocks */}
                    {dayBlocks.map(block => {
                      const positionData = itemsWithPositions.get(block.id || block);
                      const task = getTaskForBlock(block.id);
                      const course = task ? getCourse(task.courseId) : null;
                      const startTime = ensureDate(block.startTime);
                      const endTime = ensureDate(block.endTime);
                      const startHour = startTime.getHours() + startTime.getMinutes() / 60;
                      const endHour = endTime.getHours() + endTime.getMinutes() / 60;
                      const duration = endHour - startHour;
                      const courseColor = getCourseColor(course?.color);
                      const isExamStudy = ((task?.type || '').toLowerCase().includes('exam') || (task?.title || '').toLowerCase().includes('exam'));
                      const visualKind: VisualKind = isExamStudy ? 'DO' : resolveVisualKindForTask(task?.type, Boolean(task?.isHardDeadline));
                      const visual = deriveVisual(visualKind, courseColor);
                      const cardHeight = Math.max(MIN_BLOCK_HEIGHT, duration * HOUR_HEIGHT - 4);
                        const bandLabel = visualKind === 'DUE'
                          ? 'DUE'
                          : visualKind === 'LECTURE'
                          ? 'LECTURE'
                          : 'STUDY';

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
                            draggable
                            onDragStart={(e) => handleDragStart(e, block, 'block')}
                            onDragEnd={handleDragEnd}
                            sx={{
                              position: 'absolute',
                              top: `${(startHour - hoursRange.start) * HOUR_HEIGHT}px`,
                              height: `${cardHeight}px`,
                              left: leftPosition,
                              width,
                              backgroundColor: visual.fill,
                              color: visual.text,
                              borderRadius: 0.5,
                              overflow: 'hidden',
                              cursor: 'move',
                              zIndex: visualKind === 'EXAM' || visualKind === 'DUE' ? 3 : 1,
                              mx: 0.1,
                              border: `1px solid ${visualKind === 'DUE' ? RED_BAND : visual.border}`,
                              boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                              '&:hover': {
                                boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                                transition: 'all 0.12s'
                              }
                            }}
                            onClick={() => handleBlockClick(block)}
                          >
                            <CardContent sx={{ p: 0.5, '&:last-child': { pb: 0.5 }, height: '100%', display: 'flex', gap: 0.5, alignItems: 'stretch' }}>
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
                                      width: BAND_WIDTH,
                                      minWidth: BAND_WIDTH,
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
                                      px: 0.2
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
                    const visualKind = resolveVisualKindForTask(task?.type, Boolean(task?.isHardDeadline));
                    return {
                      id: block.id,
                      title: task?.title || 'Study',
                      subtitle: `${format(ensureDate(block.startTime), 'h:mm a')}${course?.code ? ` • ${course.code}` : ''}`,
                      startTime: ensureDate(block.startTime),
                      visualKind,
                      color: getCourseColor(course?.color),
                      onClick: () => handleBlockClick(block),
                    };
                  }),
                ].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
                
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
                        {dayItems.slice(0, 3).map(item => {
                          const visual = deriveVisual(item.visualKind, item.color);
                          const bandLabel =
                            item.visualKind === 'DUE'
                              ? 'DUE'
                              : item.visualKind === 'EXAM'
                              ? 'EXAM'
                              : item.visualKind === 'LECTURE'
                              ? 'LECTURE'
                              : 'DO';

                          return (
                            <Card
                              key={item.id}
                              onClick={item.onClick}
                              sx={{
                                minHeight: MIN_BLOCK_HEIGHT,
                                display: 'flex',
                                alignItems: 'stretch',
                                border: `1px solid ${visual.border}`,
                                borderRadius: 1,
                                boxShadow: 'none',
                                cursor: 'pointer',
                                backgroundColor: visual.fill,
                                color: visual.text,
                                overflow: 'hidden'
                              }}
                            >
                              <Box
                                sx={{
                                  width: BAND_WIDTH,
                                  minWidth: BAND_WIDTH,
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

                        {dayItems.length === 0 && (
                          <Typography variant="caption" color="text.disabled">
                            No items
                          </Typography>
                        )}

                        {dayItems.length > 3 && (
                          <Typography variant="caption" color="text.secondary">
                            +{dayItems.length - 3} more
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
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon />}
              onClick={() => setFiltersOpen(true)}
            >
              Legend & Filters
            </Button>
          </Box>
        </Box>

        {overdueTasks.length > 0 && (
          <Paper variant="outlined" sx={{ p: 1.25, mb: 1.5, borderColor: 'error.light', bgcolor: 'error.lighter' }}>
            <Typography variant="subtitle2" color="error" fontWeight={700} sx={{ mb: 0.5 }}>
              Overdue — needs your attention
            </Typography>
            <Stack spacing={0.5}>
              {overdueTasks.slice(0, 4).map(task => (
                <Stack key={task.id} direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                    {task.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Due {format(new Date(task.dueDate), 'MMM d')}
                  </Typography>
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
            }}
          />
        )}

        <LegendFiltersModal
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          courses={courses}
          typesInRange={typesInRange}
          blocksInRange={blocksInRange}
          selectedCourseId={selectedCourseId}
          onSelectCourse={setSelectedCourseId}
          selectedTypes={selectedTypes}
          onToggleType={toggleTypeFilter}
          selectedBlocks={selectedBlockCats}
          onToggleBlock={toggleBlockFilter}
        />
      </Container>
    </Box>
  );
};

export default SchedulerView;
