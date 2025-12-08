import { CALENDAR_BLOCK_COLORS, BLOCK_TYPE_LABELS, CalendarBlockType } from '../../types/calendar';

export const resolveCalendarBlockType = (type?: CalendarBlockType): CalendarBlockType => {
  if (type && CALENDAR_BLOCK_COLORS[type] && BLOCK_TYPE_LABELS[type]) {
    return type;
  }
  return 'other';
};

export const getCalendarBlockColors = (type?: CalendarBlockType) => {
  const safeType = resolveCalendarBlockType(type);
  return {
    type: safeType,
    colors: CALENDAR_BLOCK_COLORS[safeType],
    label: BLOCK_TYPE_LABELS[safeType],
  };
};
