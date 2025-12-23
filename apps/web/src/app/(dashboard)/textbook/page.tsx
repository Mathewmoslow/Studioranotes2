'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Button,
  Paper,
  TextField,
  Divider,
  Alert,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Chip,
} from '@mui/material'
import {
  LibraryBooks,
  Add,
  DragIndicator,
  Download,
  Visibility,
  Delete,
  Edit,
  MoreVert,
  Description,
  AutoAwesome,
  Upload,
} from '@mui/icons-material'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Chapter {
  id: string
  title: string
  noteIds: string[]
}

interface TextbookState {
  coverTitle: string
  coverAuthor: string
  coverCourse: string
  chapters: Chapter[]
}

function SortableChapter({ chapter, index, notes, onEdit, onDelete, onRemoveNote }: {
  chapter: Chapter
  index: number
  notes: any[]
  onEdit: () => void
  onDelete: () => void
  onRemoveNote: (noteId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: chapter.id })
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const chapterNotes = notes.filter(n => chapter.noteIds.includes(n.id))

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      variant="outlined"
      sx={{ p: 2, '&:hover': { backgroundColor: 'action.hover' } }}
    >
      <Stack direction="row" alignItems="flex-start" gap={2}>
        <Box {...attributes} {...listeners} sx={{ cursor: 'grab', pt: 0.5 }}>
          <DragIndicator sx={{ color: 'text.disabled' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="text.secondary">
                Chapter {index + 1}
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {chapter.title}
              </Typography>
            </Box>
            <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
              <MoreVert />
            </IconButton>
          </Stack>
          {chapterNotes.length > 0 ? (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
              {chapterNotes.map(note => (
                <Chip
                  key={note.id}
                  label={note.title}
                  size="small"
                  onDelete={() => onRemoveNote(note.id)}
                  icon={<Description sx={{ fontSize: 16 }} />}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              No notes added yet
            </Typography>
          )}
        </Box>
      </Stack>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { onEdit(); setAnchorEl(null) }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          Edit Chapter
        </MenuItem>
        <MenuItem onClick={() => { onDelete(); setAnchorEl(null) }} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
          Delete Chapter
        </MenuItem>
      </Menu>
    </Paper>
  )
}

export default function TextbookPage() {
  const storeNotes = useScheduleStore((state) => state.notes)
  const storeCourses = useScheduleStore((state) => state.courses)
  const notes = storeNotes ?? []
  const courses = storeCourses ?? []

  // Track if component is mounted (for SSR safety)
  const [mounted, setMounted] = useState(false)

  // Textbook state - will be persisted to localStorage
  const [textbook, setTextbook] = useState<TextbookState>({
    coverTitle: '',
    coverAuthor: '',
    coverCourse: '',
    chapters: [],
  })

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('studiora_textbook')
    if (saved) {
      try {
        setTextbook(JSON.parse(saved))
      } catch {}
    }
  }, [])

  // Dialog states
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [addNotesDialogOpen, setAddNotesDialogOpen] = useState(false)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Save to localStorage
  const saveTextbook = (updated: TextbookState) => {
    setTextbook(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('studiora_textbook', JSON.stringify(updated))
    }
  }

  // Get notes not yet assigned to any chapter
  const availableNotes = useMemo(() => {
    const assignedIds = new Set(textbook.chapters.flatMap(c => c.noteIds))
    return notes.filter(n => !assignedIds.has(n.id))
  }, [notes, textbook.chapters])

  // Handler for drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = textbook.chapters.findIndex(c => c.id === active.id)
      const newIndex = textbook.chapters.findIndex(c => c.id === over.id)
      saveTextbook({
        ...textbook,
        chapters: arrayMove(textbook.chapters, oldIndex, newIndex),
      })
    }
  }

  // Add/edit chapter
  const handleSaveChapter = () => {
    if (!newChapterTitle.trim()) return

    if (editingChapter) {
      saveTextbook({
        ...textbook,
        chapters: textbook.chapters.map(c =>
          c.id === editingChapter.id ? { ...c, title: newChapterTitle } : c
        ),
      })
    } else {
      saveTextbook({
        ...textbook,
        chapters: [
          ...textbook.chapters,
          { id: crypto.randomUUID(), title: newChapterTitle, noteIds: [] },
        ],
      })
    }
    setChapterDialogOpen(false)
    setNewChapterTitle('')
    setEditingChapter(null)
  }

  // Delete chapter
  const handleDeleteChapter = (chapterId: string) => {
    saveTextbook({
      ...textbook,
      chapters: textbook.chapters.filter(c => c.id !== chapterId),
    })
  }

  // Add notes to chapter
  const handleAddNotesToChapter = () => {
    if (!selectedChapterId || selectedNoteIds.length === 0) return

    saveTextbook({
      ...textbook,
      chapters: textbook.chapters.map(c =>
        c.id === selectedChapterId
          ? { ...c, noteIds: [...c.noteIds, ...selectedNoteIds] }
          : c
      ),
    })
    setAddNotesDialogOpen(false)
    setSelectedNoteIds([])
    setSelectedChapterId(null)
  }

  // Remove note from chapter
  const handleRemoveNote = (chapterId: string, noteId: string) => {
    saveTextbook({
      ...textbook,
      chapters: textbook.chapters.map(c =>
        c.id === chapterId
          ? { ...c, noteIds: c.noteIds.filter(id => id !== noteId) }
          : c
      ),
    })
  }

  // Get all notes for a chapter
  const getChapterNotes = (chapter: Chapter) => {
    return notes.filter(n => chapter.noteIds.includes(n.id))
  }

  // Calculate total word count
  const totalWordCount = useMemo(() => {
    const assignedNoteIds = new Set(textbook.chapters.flatMap(c => c.noteIds))
    return notes
      .filter(n => assignedNoteIds.has(n.id))
      .reduce((sum, n) => sum + (n.content?.split(/\s+/).length || 0), 0)
  }, [notes, textbook.chapters])

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Textbook Compiler
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Organize your notes into chapters and export as a formatted PDF textbook.
      </Typography>

      <Grid container spacing={3}>
        {/* Cover Page Settings */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Cover Page
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Textbook Title"
                  value={textbook.coverTitle}
                  onChange={(e) => saveTextbook({ ...textbook, coverTitle: e.target.value })}
                  placeholder="Introduction to..."
                />
                <TextField
                  fullWidth
                  label="Author Name"
                  value={textbook.coverAuthor}
                  onChange={(e) => saveTextbook({ ...textbook, coverAuthor: e.target.value })}
                  placeholder="Your name"
                />
                <TextField
                  fullWidth
                  label="Course"
                  value={textbook.coverCourse}
                  onChange={(e) => saveTextbook({ ...textbook, coverCourse: e.target.value })}
                  placeholder="NURS 320"
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Textbook Stats
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Chapters</Typography>
                  <Typography variant="body2" fontWeight={600}>{textbook.chapters.length}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Notes included</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {textbook.chapters.reduce((sum, c) => sum + c.noteIds.length, 0)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Est. word count</Typography>
                  <Typography variant="body2" fontWeight={600}>{totalWordCount.toLocaleString()}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Est. pages</Typography>
                  <Typography variant="body2" fontWeight={600}>{Math.ceil(totalWordCount / 300)}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Chapter List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>
                  Chapters
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  size="small"
                  onClick={() => {
                    setEditingChapter(null)
                    setNewChapterTitle('')
                    setChapterDialogOpen(true)
                  }}
                >
                  Add Chapter
                </Button>
              </Stack>

              {textbook.chapters.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: 'action.hover' }}>
                  <LibraryBooks sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No Chapters Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {notes.length > 0
                      ? 'Start by adding chapters, then assign your notes to each chapter.'
                      : 'Create notes first, then organize them into chapters here.'}
                  </Typography>
                  {notes.length > 0 ? (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => {
                        setEditingChapter(null)
                        setNewChapterTitle('')
                        setChapterDialogOpen(true)
                      }}
                    >
                      Create First Chapter
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      startIcon={<AutoAwesome />}
                      href="/notes"
                    >
                      Create Notes First
                    </Button>
                  )}
                </Paper>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={textbook.chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    <Stack spacing={1}>
                      {textbook.chapters.map((chapter, index) => (
                        <Box key={chapter.id}>
                          <SortableChapter
                            chapter={chapter}
                            index={index}
                            notes={notes}
                            onEdit={() => {
                              setEditingChapter(chapter)
                              setNewChapterTitle(chapter.title)
                              setChapterDialogOpen(true)
                            }}
                            onDelete={() => handleDeleteChapter(chapter.id)}
                            onRemoveNote={(noteId) => handleRemoveNote(chapter.id, noteId)}
                          />
                          <Button
                            size="small"
                            startIcon={<Add />}
                            sx={{ mt: 0.5, ml: 5 }}
                            onClick={() => {
                              setSelectedChapterId(chapter.id)
                              setSelectedNoteIds([])
                              setAddNotesDialogOpen(true)
                            }}
                            disabled={availableNotes.length === 0}
                          >
                            Add Notes
                          </Button>
                        </Box>
                      ))}
                    </Stack>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Export Actions */}
      <Divider sx={{ my: 4 }} />
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<Visibility />}
          disabled={textbook.chapters.length === 0}
        >
          Preview HTML
        </Button>
        <Button
          variant="contained"
          startIcon={<Download />}
          disabled={textbook.chapters.length === 0}
          sx={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
          }}
        >
          Export PDF
        </Button>
      </Stack>

      {/* Coming Soon Notice */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          PDF Export Coming Soon
        </Typography>
        <Typography variant="body2">
          Server-side PDF generation with professional formatting, page numbers, and table of contents.
        </Typography>
      </Alert>

      {/* Add/Edit Chapter Dialog */}
      <Dialog open={chapterDialogOpen} onClose={() => setChapterDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingChapter ? 'Edit Chapter' : 'Add New Chapter'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Chapter Title"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            placeholder="e.g., Introduction to Anatomy"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChapterDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveChapter} variant="contained" disabled={!newChapterTitle.trim()}>
            {editingChapter ? 'Save' : 'Add Chapter'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Notes to Chapter Dialog */}
      <Dialog open={addNotesDialogOpen} onClose={() => setAddNotesDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Notes to Chapter</DialogTitle>
        <DialogContent>
          {availableNotes.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }}>
              All notes have already been assigned to chapters.
            </Typography>
          ) : (
            <List>
              {availableNotes.map(note => (
                <ListItem key={note.id} disablePadding>
                  <ListItemButton onClick={() => {
                    setSelectedNoteIds(prev =>
                      prev.includes(note.id)
                        ? prev.filter(id => id !== note.id)
                        : [...prev, note.id]
                    )
                  }}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedNoteIds.includes(note.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={note.title}
                      secondary={note.courseName || 'No course'}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddNotesDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddNotesToChapter}
            variant="contained"
            disabled={selectedNoteIds.length === 0}
          >
            Add {selectedNoteIds.length} Note{selectedNoteIds.length !== 1 ? 's' : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
