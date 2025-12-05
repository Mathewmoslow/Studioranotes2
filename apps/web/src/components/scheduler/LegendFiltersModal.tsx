import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Chip,
  Stack,
  Typography,
  alpha,
  useTheme
} from '@mui/material'
import {
  Circle as CircleIcon,
  Assignment as AssignmentIcon,
  Quiz as QuizIcon,
  MenuBook as ReadingIcon,
  Computer as ProjectIcon,
  Science as LabIcon,
  School as LectureIcon,
  LocalHospital as ClinicalIcon,
  Psychology as SimulationIcon,
  VideoLibrary as VideoIcon,
  CalendarToday as DeadlineIcon
} from '@mui/icons-material'
import { BlockCategory } from '@studioranotes/types'
import { getBlockStyling, getBlockIcon } from '../../lib/blockVisuals'

interface Course {
  id: string
  code: string
  name: string
  color: string
}

interface LegendFiltersModalProps {
  open: boolean
  onClose: () => void
  courses: Course[]
  typesInRange: string[]
  blocksInRange: BlockCategory[]
  selectedCourseId?: string
  onSelectCourse?: (courseId: string) => void
  selectedTypes?: string[]
  onToggleType?: (type: string) => void
  selectedBlocks?: BlockCategory[]
  onToggleBlock?: (cat: BlockCategory) => void
}

const TASK_TYPES = [
  { type: 'assignment', label: 'Assignment', icon: AssignmentIcon, color: '#34C759' },
  { type: 'exam', label: 'Exam', icon: QuizIcon, color: '#FF3B30' },
  { type: 'reading', label: 'Reading', icon: ReadingIcon, color: '#007AFF' },
  { type: 'project', label: 'Project', icon: ProjectIcon, color: '#FF9500' },
  { type: 'lab', label: 'Lab', icon: LabIcon, color: '#32D74B' },
  { type: 'lecture', label: 'Lecture', icon: LectureIcon, color: '#5856D6' },
  { type: 'clinical', label: 'Clinical', icon: ClinicalIcon, color: '#AF52DE' },
  { type: 'simulation', label: 'Simulation', icon: SimulationIcon, color: '#FF453A' },
  { type: 'quiz', label: 'Quiz', icon: QuizIcon, color: '#FFD60A' },
  { type: 'video', label: 'Video', icon: VideoIcon, color: '#FF6B9D' },
  { type: 'deadline', label: 'Deadline', icon: DeadlineIcon, color: '#dc2626' }
]

const BLOCK_CATEGORY_DETAILS: Array<{ category: BlockCategory; label: string; description: string }> = [
  { category: 'DO', label: 'DO Blocks', description: 'Study sessions, assignments, readings' },
  { category: 'DUE', label: 'DUE Blocks', description: 'Hard deadlines like exams or submissions' },
  { category: 'CLASS', label: 'CLASS Blocks', description: 'Lectures, labs, tutorials' },
  { category: 'CLINICAL', label: 'CLINICAL Blocks', description: 'Clinical rotations and practicums' }
]

export function LegendFiltersModal({
  open,
  onClose,
  courses,
  typesInRange,
  blocksInRange,
  selectedCourseId,
  onSelectCourse,
  selectedTypes = [],
  onToggleType,
  selectedBlocks = [],
  onToggleBlock
}: LegendFiltersModalProps) {
  const [tab, setTab] = React.useState(0)
  const theme = useTheme()

  const buildBlockStyles = (category: BlockCategory) => {
    const { style } = getBlockStyling(category, theme.palette.primary.main)
    return {
      backgroundColor: style.backgroundColor || alpha(theme.palette.primary.main, category === 'DUE' ? 0.75 : 0.2),
      backgroundImage: style.backgroundImage,
      backgroundSize: style.backgroundSize || 'cover',
      border: `${style.borderWidth || '2px'} ${style.borderStyle || 'solid'} ${style.borderColor || theme.palette.primary.main}`,
      opacity: style.opacity ?? 1
    }
  }

  const filteredTypes = TASK_TYPES.filter(t => typesInRange.includes(t.type))
  const filteredBlocks = BLOCK_CATEGORY_DETAILS.filter(b => blocksInRange.includes(b.category))

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Legend & Filters</DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Courses" />
          <Tab label="Types" />
          <Tab label="Blocks" />
        </Tabs>

        {tab === 0 && (
          <Stack spacing={1}>
            {courses.map(course => {
              const active = selectedCourseId === course.id
              return (
                <Box
                  key={course.id}
                  onClick={() => onSelectCourse && onSelectCourse(active ? '' : course.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 0.75,
                    borderRadius: 1,
                    border: `1px solid ${alpha(course.color, active ? 0.9 : 0.4)}`,
                    backgroundColor: alpha(course.color, active ? 0.15 : 0.08),
                    cursor: onSelectCourse ? 'pointer' : 'default'
                  }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: course.color,
                      flexShrink: 0
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {course.code}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {course.name}
                    </Typography>
                  </Box>
                  {active && (
                    <Typography variant="caption" color="primary" sx={{ ml: 'auto' }}>
                      Active
                    </Typography>
                  )}
                </Box>
              )
            })}
            {courses.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No courses in this view.
              </Typography>
            )}
          </Stack>
        )}

        {tab === 1 && (
          <Stack spacing={1}>
            {filteredTypes.map(({ type, label, icon: Icon, color }) => {
              const active = selectedTypes.includes(type)
              return (
                <Chip
                  key={type}
                  label={label}
                  icon={<Icon sx={{ fontSize: 16 }} />}
                  onClick={() => onToggleType && onToggleType(type)}
                  sx={{
                    justifyContent: 'flex-start',
                    backgroundColor: alpha(color, active ? 0.2 : 0.1),
                    color,
                    border: `1px solid ${alpha(color, active ? 0.8 : 0.4)}`,
                    '& .MuiChip-icon': { color },
                    opacity: active || selectedTypes.length === 0 ? 1 : 0.6,
                    cursor: onToggleType ? 'pointer' : 'default'
                  }}
                />
              )
            })}
            {filteredTypes.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No task types in this view.
              </Typography>
            )}
          </Stack>
        )}

        {tab === 2 && (
          <Stack spacing={1.5}>
            {filteredBlocks.map(({ category, label, description }) => {
              const styles = buildBlockStyles(category)
              const active = selectedBlocks.includes(category)
              return (
                <Box
                  key={category}
                  onClick={() => onToggleBlock && onToggleBlock(category)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 0.5,
                    borderRadius: 1,
                    border: `1px solid ${alpha(theme.palette.primary.main, active ? 0.8 : 0.3)}`,
                    cursor: onToggleBlock ? 'pointer' : 'default'
                  }}
                >
                  <Box sx={{ width: 48, height: 26, borderRadius: 0.5, ...styles }} />
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {getBlockIcon(category)} {label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {description}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
            {filteredBlocks.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No block categories in this view.
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default LegendFiltersModal
