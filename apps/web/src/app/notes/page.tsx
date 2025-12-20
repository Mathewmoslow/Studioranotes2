'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
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
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Search,
  Add,
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
  LocalOffer,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material'
import { useScheduleStore } from '@/stores/useScheduleStore'
import GenerateNoteModal from '@/components/GenerateNoteModal'

// Inline EmptyState component
const EmptyState = ({ icon, title, description, action }: {
  icon: React.ReactNode,
  title: string,
  description: string,
  action?: { label: string, onClick: () => void }
}) => (
  <Box sx={{ textAlign: 'center', py: 6 }}>
    <Box sx={{ mb: 2, color: 'text.secondary', fontSize: '3rem' }}>
      {icon}
    </Box>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      {description}
    </Typography>
    {action && (
      <Button variant="contained" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </Box>
)
import { format } from 'date-fns'

export default function NotesPage() {
  const { data: session } = useSession()
  const { courses } = useScheduleStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [savedNotes, setSavedNotes] = useState<any[]>([])
  const [selectedNote, setSelectedNote] = useState<any | null>(null)
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest')

  useEffect(() => {
    const notes = localStorage.getItem('generated-notes')
    if (notes) {
      const parsed = JSON.parse(notes)
      const list = Object.entries(parsed).map(([id, note]: any) => ({ id, ...note }))
      setSavedNotes(list)
    }
  }, [])

  const persistNotes = (next: any[]) => {
    const asObject = next.reduce((acc: any, note: any) => {
      acc[note.id] = { ...note }
      delete acc[note.id].id
      return acc
    }, {})
    localStorage.setItem('generated-notes', JSON.stringify(asObject))
    setSavedNotes(next)
  }

  const filteredNotes = savedNotes
    .filter(note => {
      const matchesSearch =
        (note.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.content || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCourse = !selectedCourse || note.courseId === selectedCourse
      const matchesFilter = selectedFilter === 'all' ||
                            (selectedFilter === 'starred' && note.starred) ||
                            (selectedFilter === 'archived' && note.archived) ||
                            (selectedFilter === 'ai' && note.aiGenerated)
      return matchesSearch && matchesCourse && matchesFilter
    })
    .sort((a, b) => {
      if (sort === 'title') return (a.topic || '').localeCompare(b.topic || '')
      const da = new Date(a.timestamp || a.createdAt || 0).getTime()
      const db = new Date(b.timestamp || b.createdAt || 0).getTime()
      return sort === 'newest' ? db - da : da - db
    })

  const handleToggleStar = (noteId: string, currentStarred: boolean) => {
    const next = savedNotes.map(n => n.id === noteId ? { ...n, starred: !currentStarred } : n)
    persistNotes(next)
  }

  const handleToggleArchive = (noteId: string, currentArchived: boolean) => {
    const next = savedNotes.map(n => n.id === noteId ? { ...n, archived: !currentArchived } : n)
    persistNotes(next)
  }

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      const next = savedNotes.filter(n => n.id !== noteId)
      persistNotes(next)
    }
  }

  const handleGenerateNote = () => {
    setNoteModalOpen(true)
  }

  if (!session) {
    return (
      <Container>
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h4">Please sign in to view your notes</Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom>
          My Notes
        </Typography>

        {/* Search and Filters */}
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, maxWidth: 400 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
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
            onClick={() => {
              setSort(prev => prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'title' : 'newest')
            }}
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

        {/* Stats */}
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Chip
            icon={<Description />}
            label={`${savedNotes.length} Total Notes`}
            color="primary"
          />
          <Chip
            icon={<Star />}
            label={`${savedNotes.filter(n => n.starred).length} Starred`}
            color="secondary"
          />
          <Chip
            icon={<AutoAwesome />}
            label={`${savedNotes.filter(n => n.aiGenerated).length} AI Generated`}
          />
        </Stack>
      </Box>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Description />}
              title={searchTerm || selectedFilter !== 'all' ? "No notes found" : "No notes yet"}
              description={
                searchTerm || selectedFilter !== 'all'
                  ? "Try adjusting your search or filters"
                  : "Create your first note or generate one with AI"
              }
              action={{
                label: "Generate AI Note",
                onClick: () => setNoteModalOpen(true)
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card variant="outlined">
          <CardContent sx={{ p: 0 }}>
            <List>
              {filteredNotes.map((note, idx) => {
                const course = courses.find(c => c.id === note.courseId)
                return (
                  <React.Fragment key={note.id}>
                    {idx > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" onClick={() => handleToggleStar(note.id, note.starred)}>
                            {note.starred ? <Star color="warning" /> : <StarBorder />}
                          </IconButton>
                          <IconButton size="small" onClick={() => handleToggleArchive(note.id, note.archived)}>
                            {note.archived ? <Unarchive /> : <Archive />}
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteNote(note.id)}>
                            <Delete />
                          </IconButton>
                        </Stack>
                      }
                      onClick={() => setSelectedNote(note)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon>
                        <Description />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography fontWeight={600}>
                              {note.topic || note.title || 'Untitled note'}
                            </Typography>
                            {note.aiGenerated && (
                              <Chip
                                icon={<AutoAwesome />}
                                label="AI"
                                size="small"
                                color="primary"
                                sx={{ height: 22 }}
                              />
                            )}
                          </Stack>
                        }
                        secondary={
                          <Stack spacing={0.5}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              {course && (
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
                              {(note.tags || []).slice(0, 2).map(tag => (
                                <Chip key={tag} size="small" label={tag} variant="outlined" sx={{ height: 22 }} />
                              ))}
                            </Stack>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {(note.summary || note.customPrompt || note.sourceText || '').slice(0, 160) || 'Generated note'}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                )
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Generate Note FAB */}
      <Fab
        color="primary"
        variant="extended"
        aria-label="generate note"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={handleGenerateNote}
      >
        <AutoAwesome sx={{ mr: 1 }} />
        Generate AI Note
      </Fab>

      {/* Note Generation Modal */}
      <GenerateNoteModal
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
      />

      {/* View Note Dialog */}
      {selectedNote && (
        <Dialog
          open={Boolean(selectedNote)}
          onClose={() => setSelectedNote(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                {selectedNote.topic || selectedNote.title || 'Note'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedNote.courseName || courses.find(c => c.id === selectedNote.courseId)?.name || ''}
              </Typography>
            </Box>
            {selectedNote.courseId && (
              <Button
                href={`/courses/${selectedNote.courseId}`}
                variant="outlined"
                size="small"
              >
                Open course
              </Button>
            )}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                '& .note-body': { fontSize: '0.95rem' },
                '& .note-body p': { marginBottom: '10px' },
              }}
              dangerouslySetInnerHTML={{ __html: selectedNote.content || '<p>No content available.</p>' }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedNote(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  )
}
