'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  List,
  ListItem,
  Divider,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Search,
  FilterList,
  Description,
  Star,
  StarBorder,
  Archive,
  Unarchive,
  Delete,
  AutoAwesome,
  School,
  CalendarMonth,
  ArrowUpward,
  ArrowDownward,
  ExpandMore,
  Edit,
  FolderOpen,
} from '@mui/icons-material'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { format } from 'date-fns'

// Feature flag for new UI
const USE_NEW_NOTES_UI = process.env.NEXT_PUBLIC_NEW_NOTES_UI === 'true' || true

// Import new components conditionally
import { NoteGenerationForm, NoteRenderer, RichTextEditor, ConvertStyleDialog } from '@/components/notes'
import { Style } from '@mui/icons-material'

// Legacy import for feature flag
import GenerateNoteModal from '@/components/GenerateNoteModal'

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notes-tabpanel-${index}`}
      aria-labelledby={`notes-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

// Empty state component
const EmptyState = ({ icon, title, description, action }: {
  icon: React.ReactNode
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}) => (
  <Box sx={{ textAlign: 'center', py: 6 }}>
    <Box sx={{ mb: 2, color: 'text.secondary', fontSize: '3rem' }}>{icon}</Box>
    <Typography variant="h6" gutterBottom>{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{description}</Typography>
    {action && (
      <Button variant="contained" onClick={action.onClick}>{action.label}</Button>
    )}
  </Box>
)

export default function NotesPage() {
  const { data: session } = useSession()
  const { courses } = useScheduleStore()

  // Tab state
  const [tabValue, setTabValue] = useState(0)

  // Notes state
  const [savedNotes, setSavedNotes] = useState<any[]>([])
  const [selectedNote, setSelectedNote] = useState<any | null>(null)
  const [editingNote, setEditingNote] = useState<any | null>(null)
  const [convertingNote, setConvertingNote] = useState<any | null>(null)

  // Search/filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest')

  // Legacy modal state (for feature flag fallback)
  const [legacyModalOpen, setLegacyModalOpen] = useState(false)

  // Load notes from localStorage
  useEffect(() => {
    const loadNotes = () => {
      const notes = localStorage.getItem('generated-notes')
      if (notes) {
        const parsed = JSON.parse(notes)
        const list = Object.entries(parsed).map(([id, note]: any) => ({ id, ...note }))
        setSavedNotes(list)
      }
    }
    loadNotes()

    // Listen for storage changes (cross-tab sync)
    window.addEventListener('storage', loadNotes)
    return () => window.removeEventListener('storage', loadNotes)
  }, [])

  // Persist notes to localStorage
  const persistNotes = useCallback((next: any[]) => {
    const asObject = next.reduce((acc: any, note: any) => {
      acc[note.id] = { ...note }
      delete acc[note.id].id
      return acc
    }, {})
    localStorage.setItem('generated-notes', JSON.stringify(asObject))
    setSavedNotes(next)
  }, [])

  // Handle new note generated (callback from form)
  const handleNoteGenerated = useCallback((newNote: any) => {
    setSavedNotes(prev => [newNote, ...prev])
    // Switch to Recent tab to show the new note
    setTabValue(1)
  }, [])

  // Filter and sort notes
  const filteredNotes = savedNotes
    .filter(note => {
      const matchesSearch =
        (note.topic || note.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.content || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = selectedFilter === 'all' ||
        (selectedFilter === 'starred' && note.starred) ||
        (selectedFilter === 'archived' && note.archived) ||
        (selectedFilter === 'ai' && note.aiGenerated)
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sort === 'title') return (a.topic || a.title || '').localeCompare(b.topic || b.title || '')
      const da = new Date(a.timestamp || a.createdAt || 0).getTime()
      const db = new Date(b.timestamp || b.createdAt || 0).getTime()
      return sort === 'newest' ? db - da : da - db
    })

  // Group notes by course
  const notesByCourse = courses.reduce((acc: any, course: any) => {
    const courseNotes = savedNotes.filter(n => n.courseId === course.id)
    if (courseNotes.length > 0) {
      acc[course.id] = { course, notes: courseNotes }
    }
    return acc
  }, {})

  // Add uncategorized notes
  const uncategorizedNotes = savedNotes.filter(n => !n.courseId || !courses.find((c: any) => c.id === n.courseId))
  if (uncategorizedNotes.length > 0) {
    notesByCourse['uncategorized'] = { course: { id: 'uncategorized', name: 'Uncategorized' }, notes: uncategorizedNotes }
  }

  // Actions
  const handleToggleStar = (noteId: string, currentStarred: boolean) => {
    persistNotes(savedNotes.map(n => n.id === noteId ? { ...n, starred: !currentStarred } : n))
  }

  const handleToggleArchive = (noteId: string, currentArchived: boolean) => {
    persistNotes(savedNotes.map(n => n.id === noteId ? { ...n, archived: !currentArchived } : n))
  }

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      persistNotes(savedNotes.filter(n => n.id !== noteId))
      if (selectedNote?.id === noteId) setSelectedNote(null)
    }
  }

  const handleSaveEdit = (content: string) => {
    if (editingNote) {
      persistNotes(savedNotes.map(n =>
        n.id === editingNote.id ? { ...n, content, lastEdited: new Date().toISOString() } : n
      ))
      setEditingNote(null)
    }
  }

  // Handle conversion complete - save the new styled note
  const handleConversionComplete = useCallback((convertedNote: { id: string; html: string; targetStyle: string }) => {
    // Find the original note
    const original = savedNotes.find(n => n.id === convertingNote?.id)
    if (!original) return

    // Create new styled note
    const styledNote = {
      id: `styled-${Date.now()}`,
      title: `${original.title || original.topic} (${convertedNote.targetStyle === 'editorial-chic' ? 'Editorial' : 'Textbook'})`,
      topic: original.title || original.topic,
      content: convertedNote.html,
      courseId: original.courseId,
      courseName: original.courseName,
      noteStyle: convertedNote.targetStyle,
      editable: false,
      aiGenerated: true,
      timestamp: new Date().toISOString(),
      convertedFrom: original.id,
    }

    // Add new note (keep original)
    persistNotes([styledNote, ...savedNotes])
    setConvertingNote(null)
    setSelectedNote(styledNote) // Open the new styled note
  }, [convertingNote, savedNotes, persistNotes])

  if (!session) {
    return (
      <Container>
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4">Please sign in to view your notes</Typography>
        </Box>
      </Container>
    )
  }

  // Note list component (reused in multiple tabs)
  const NotesList = ({ notes, showCourse = true }: { notes: any[]; showCourse?: boolean }) => (
    <List>
      {notes.map((note, idx) => {
        const course = courses.find((c: any) => c.id === note.courseId)
        const isEditable = note.noteStyle === 'simple-editable' || note.editable
        return (
          <React.Fragment key={note.id}>
            {idx > 0 && <Divider />}
            <ListItem
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  {isEditable && (
                    <>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingNote(note) }} title="Edit">
                        <Edit />
                      </IconButton>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setConvertingNote(note) }} title="Convert to Styled" color="secondary">
                        <Style />
                      </IconButton>
                    </>
                  )}
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleToggleStar(note.id, note.starred) }}>
                    {note.starred ? <Star color="warning" /> : <StarBorder />}
                  </IconButton>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleToggleArchive(note.id, note.archived) }}>
                    {note.archived ? <Unarchive /> : <Archive />}
                  </IconButton>
                  <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id) }}>
                    <Delete />
                  </IconButton>
                </Stack>
              }
              onClick={() => setSelectedNote(note)}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
            >
              <ListItemIcon><Description /></ListItemIcon>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={600}>
                      {note.topic || note.title || 'Untitled note'}
                    </Typography>
                    {note.aiGenerated && (
                      <Chip icon={<AutoAwesome />} label="AI" size="small" color="primary" sx={{ height: 22 }} />
                    )}
                    {isEditable && (
                      <Chip icon={<Edit />} label="Editable" size="small" color="success" sx={{ height: 22 }} />
                    )}
                  </Stack>
                }
                secondary={
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      {showCourse && course && (
                        <Chip
                          size="small"
                          label={course.code || course.name}
                          icon={<School fontSize="small" />}
                          variant="outlined"
                          sx={{ height: 22 }}
                        />
                      )}
                      <Chip
                        size="small"
                        label={format(new Date(note.timestamp || note.createdAt || Date.now()), 'MMM d, yyyy')}
                        icon={<CalendarMonth fontSize="small" />}
                        variant="outlined"
                        sx={{ height: 22 }}
                      />
                    </Stack>
                  </Stack>
                }
              />
            </ListItem>
          </React.Fragment>
        )
      })}
    </List>
  )

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          Notes Hub
        </Typography>
        <Stack direction="row" spacing={2}>
          <Chip icon={<Description />} label={`${savedNotes.length} Total`} color="primary" />
          <Chip icon={<Star />} label={`${savedNotes.filter(n => n.starred).length} Starred`} color="secondary" />
          <Chip icon={<AutoAwesome />} label={`${savedNotes.filter(n => n.aiGenerated).length} AI Generated`} />
        </Stack>
      </Box>

      {/* Tabs */}
      {USE_NEW_NOTES_UI ? (
        <>
          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab icon={<AutoAwesome />} label="Generate" iconPosition="start" />
            <Tab icon={<Description />} label="Recent Notes" iconPosition="start" />
            <Tab icon={<FolderOpen />} label="By Course" iconPosition="start" />
          </Tabs>

          {/* Tab 0: Generate */}
          <TabPanel value={tabValue} index={0}>
            <NoteGenerationForm
              variant="card"
              onNoteGenerated={handleNoteGenerated}
            />
          </TabPanel>

          {/* Tab 1: Recent Notes */}
          <TabPanel value={tabValue} index={1}>
            {/* Search and Filters */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ flexGrow: 1, maxWidth: 400 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
                }}
              />
              <Button
                startIcon={<FilterList />}
                onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              >
                Filter: {selectedFilter}
              </Button>
              <Button
                startIcon={sort === 'newest' ? <ArrowDownward /> : sort === 'oldest' ? <ArrowUpward /> : <Description />}
                onClick={() => setSort(prev => prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'title' : 'newest')}
              >
                Sort: {sort === 'newest' ? 'Newest' : sort === 'oldest' ? 'Oldest' : 'Title'}
              </Button>

              <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={() => setFilterAnchorEl(null)}
              >
                <MenuItem onClick={() => { setSelectedFilter('all'); setFilterAnchorEl(null) }}>
                  <ListItemText>All Notes</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { setSelectedFilter('starred'); setFilterAnchorEl(null) }}>
                  <ListItemIcon><Star /></ListItemIcon>
                  <ListItemText>Starred</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { setSelectedFilter('archived'); setFilterAnchorEl(null) }}>
                  <ListItemIcon><Archive /></ListItemIcon>
                  <ListItemText>Archived</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { setSelectedFilter('ai'); setFilterAnchorEl(null) }}>
                  <ListItemIcon><AutoAwesome /></ListItemIcon>
                  <ListItemText>AI Generated</ListItemText>
                </MenuItem>
              </Menu>
            </Stack>

            {filteredNotes.length === 0 ? (
              <Card>
                <CardContent>
                  <EmptyState
                    icon={<Description />}
                    title={searchTerm || selectedFilter !== 'all' ? "No notes found" : "No notes yet"}
                    description={
                      searchTerm || selectedFilter !== 'all'
                        ? "Try adjusting your search or filters"
                        : "Generate your first note using the Generate tab"
                    }
                    action={{ label: "Generate Note", onClick: () => setTabValue(0) }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card variant="outlined">
                <CardContent sx={{ p: 0 }}>
                  <NotesList notes={filteredNotes} />
                </CardContent>
              </Card>
            )}
          </TabPanel>

          {/* Tab 2: By Course */}
          <TabPanel value={tabValue} index={2}>
            {Object.keys(notesByCourse).length === 0 ? (
              <Card>
                <CardContent>
                  <EmptyState
                    icon={<FolderOpen />}
                    title="No notes organized by course"
                    description="Generate notes and they'll be organized by course here"
                    action={{ label: "Generate Note", onClick: () => setTabValue(0) }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2}>
                {Object.values(notesByCourse).map(({ course, notes }: any) => (
                  <Accordion key={course.id} defaultExpanded={notes.length <= 5}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <School color="primary" />
                        <Typography fontWeight={600}>{course.name}</Typography>
                        <Chip label={`${notes.length} notes`} size="small" />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <NotesList notes={notes} showCourse={false} />
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            )}
          </TabPanel>
        </>
      ) : (
        // Legacy UI fallback
        <>
          {/* ... Legacy code would go here ... */}
          <Button variant="contained" onClick={() => setLegacyModalOpen(true)}>
            Generate AI Note
          </Button>
          <GenerateNoteModal open={legacyModalOpen} onClose={() => setLegacyModalOpen(false)} />
        </>
      )}

      {/* View Note Dialog */}
      {selectedNote && !editingNote && (
        <Dialog
          open={Boolean(selectedNote)}
          onClose={() => setSelectedNote(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{selectedNote.topic || selectedNote.title || 'Note'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedNote.courseName || courses.find((c: any) => c.id === selectedNote.courseId)?.name || ''}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {(selectedNote.noteStyle === 'simple-editable' || selectedNote.editable) && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => { setEditingNote(selectedNote); setSelectedNote(null) }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Style />}
                    onClick={() => { setConvertingNote(selectedNote); setSelectedNote(null) }}
                  >
                    Convert to Styled
                  </Button>
                </>
              )}
              {selectedNote.courseId && (
                <Button href={`/courses/${selectedNote.courseId}`} variant="outlined" size="small">
                  Open course
                </Button>
              )}
            </Stack>
          </DialogTitle>
          <DialogContent>
            <NoteRenderer content={selectedNote.content || '<p>No content available.</p>'} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedNote(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit Note Dialog */}
      {editingNote && (
        <Dialog
          open={Boolean(editingNote)}
          onClose={() => setEditingNote(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Edit: {editingNote.topic || editingNote.title || 'Note'}
          </DialogTitle>
          <DialogContent sx={{ height: '70vh' }}>
            <RichTextEditor
              initialContent={editingNote.content || ''}
              onSave={handleSaveEdit}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingNote(null)}>Cancel</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Convert Style Dialog */}
      {convertingNote && (
        <ConvertStyleDialog
          open={Boolean(convertingNote)}
          onClose={() => setConvertingNote(null)}
          noteId={convertingNote.id}
          noteTitle={convertingNote.title || convertingNote.topic || 'Untitled'}
          noteContent={convertingNote.content || ''}
          courseName={convertingNote.courseName || courses.find((c: any) => c.id === convertingNote.courseId)?.name}
          onConversionComplete={handleConversionComplete}
        />
      )}
    </Container>
  )
}
