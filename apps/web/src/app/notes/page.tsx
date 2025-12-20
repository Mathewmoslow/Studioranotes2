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
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Alert,
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
  Download,
  MenuBook,
  SelectAll,
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

  // Export textbook state
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportCourseId, setExportCourseId] = useState<string>('all')
  const [exportSelectedNotes, setExportSelectedNotes] = useState<Set<string>>(new Set())

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

  // Download note as HTML file
  const handleDownloadNote = useCallback((note: any) => {
    const content = note.content || '<p>No content</p>'
    const title = note.title || note.topic || 'note'
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`

    // Create a Blob with the HTML content
    const blob = new Blob([content], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    // Create download link and trigger
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

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

  // Get notes filtered by course for export
  const getExportableNotes = useCallback(() => {
    let notes = savedNotes.filter(n => !n.archived)
    if (exportCourseId !== 'all') {
      notes = notes.filter(n => n.courseId === exportCourseId)
    }
    // Sort by date chronologically (oldest first for textbook order)
    return notes.sort((a, b) => {
      const da = new Date(a.timestamp || a.createdAt || 0).getTime()
      const db = new Date(b.timestamp || b.createdAt || 0).getTime()
      return da - db
    })
  }, [savedNotes, exportCourseId])

  // Open export dialog and pre-select notes
  const handleOpenExportDialog = useCallback(() => {
    const notes = getExportableNotes()
    setExportSelectedNotes(new Set(notes.map(n => n.id)))
    setExportDialogOpen(true)
  }, [getExportableNotes])

  // Toggle note selection for export
  const handleToggleExportNote = useCallback((noteId: string) => {
    setExportSelectedNotes(prev => {
      const next = new Set(prev)
      if (next.has(noteId)) {
        next.delete(noteId)
      } else {
        next.add(noteId)
      }
      return next
    })
  }, [])

  // Export textbook as combined HTML
  const handleExportTextbook = useCallback(() => {
    const exportNotes = getExportableNotes().filter(n => exportSelectedNotes.has(n.id))

    if (exportNotes.length === 0) {
      alert('Please select at least one note to export.')
      return
    }

    // Determine textbook title
    let textbookTitle = 'Study Notes Textbook'
    if (exportCourseId !== 'all') {
      const course = courses.find((c: any) => c.id === exportCourseId)
      textbookTitle = `${course?.name || 'Course'} - Complete Study Notes`
    }

    // Extract body content from each note
    const extractBodyContent = (html: string): string => {
      if (html.includes('<!DOCTYPE') || html.includes('<html')) {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        if (bodyMatch) return bodyMatch[1]
        const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
        if (articleMatch) return articleMatch[1]
      }
      return html
    }

    // Build combined HTML
    const combinedContent = exportNotes.map((note, index) => {
      const content = extractBodyContent(note.content || '<p>No content</p>')
      const noteTitle = note.title || note.topic || `Note ${index + 1}`
      const noteDate = format(new Date(note.timestamp || note.createdAt || Date.now()), 'MMMM d, yyyy')

      return `
        <section class="chapter" id="chapter-${index + 1}">
          <div class="chapter-header">
            <div class="chapter-number">Chapter ${index + 1}</div>
            <h2 class="chapter-title">${noteTitle}</h2>
            <div class="chapter-meta">${noteDate}</div>
          </div>
          <div class="chapter-content">
            ${content}
          </div>
        </section>
      `
    }).join('\n<hr class="chapter-divider" />\n')

    // Build table of contents
    const tableOfContents = exportNotes.map((note, index) => {
      const noteTitle = note.title || note.topic || `Note ${index + 1}`
      return `<li><a href="#chapter-${index + 1}">Chapter ${index + 1}: ${noteTitle}</a></li>`
    }).join('\n')

    // Complete HTML document
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${textbookTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Work+Sans:wght@300;400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.8;
      color: #2a2a2a;
      background: #f5f5f5;
    }

    .textbook-container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      box-shadow: 0 0 40px rgba(0,0,0,0.1);
    }

    /* Cover Page */
    .cover-page {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      color: white;
      padding: 80px 60px;
      text-align: center;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .cover-page h1 {
      font-family: 'Libre Baskerville', serif;
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .cover-page .subtitle {
      font-size: 1.3rem;
      opacity: 0.9;
      margin-bottom: 3rem;
    }

    .cover-page .stats {
      display: flex;
      justify-content: center;
      gap: 3rem;
      margin-top: 3rem;
    }

    .cover-page .stat {
      text-align: center;
    }

    .cover-page .stat-number {
      font-size: 3rem;
      font-weight: 700;
      color: #4ecdc4;
      display: block;
    }

    .cover-page .stat-label {
      font-size: 0.9rem;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .cover-page .generated-by {
      margin-top: 4rem;
      font-size: 0.85rem;
      opacity: 0.6;
    }

    /* Table of Contents */
    .toc {
      padding: 60px;
      page-break-after: always;
    }

    .toc h2 {
      font-family: 'Libre Baskerville', serif;
      font-size: 2rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 3px solid #1a1a2e;
    }

    .toc ol {
      list-style: none;
      counter-reset: toc-counter;
    }

    .toc li {
      counter-increment: toc-counter;
      padding: 0.75rem 0;
      border-bottom: 1px solid #eee;
    }

    .toc li a {
      color: #1a1a2e;
      text-decoration: none;
      display: flex;
      align-items: baseline;
    }

    .toc li a:hover {
      color: #3498db;
    }

    /* Chapters */
    .chapter {
      padding: 60px;
      page-break-before: always;
    }

    .chapter-header {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 3px solid #1a1a2e;
    }

    .chapter-number {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #3498db;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .chapter-title {
      font-family: 'Libre Baskerville', serif;
      font-size: 2.2rem;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.2;
    }

    .chapter-meta {
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.5rem;
    }

    .chapter-content {
      line-height: 1.8;
    }

    .chapter-content h1 { font-size: 1.8rem; margin: 2rem 0 1rem; font-family: 'Libre Baskerville', serif; }
    .chapter-content h2 { font-size: 1.5rem; margin: 2rem 0 1rem; font-family: 'Libre Baskerville', serif; border-top: 2px solid #eee; padding-top: 1.5rem; }
    .chapter-content h3 { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; color: #3498db; }
    .chapter-content h4 { font-size: 1.1rem; margin: 1rem 0 0.5rem; }

    .chapter-content p { margin-bottom: 1rem; }
    .chapter-content ul, .chapter-content ol { margin-left: 1.5rem; margin-bottom: 1rem; }
    .chapter-content li { margin-bottom: 0.5rem; }

    .chapter-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }

    .chapter-content th, .chapter-content td {
      padding: 0.75rem;
      border: 1px solid #ddd;
      text-align: left;
    }

    .chapter-content th {
      background: #1a1a2e;
      color: white;
      font-weight: 600;
    }

    .chapter-divider {
      border: none;
      height: 1px;
      background: #ddd;
      margin: 0;
    }

    /* Print styles */
    @media print {
      .textbook-container { box-shadow: none; }
      .cover-page { page-break-after: always; }
      .toc { page-break-after: always; }
      .chapter { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="textbook-container">
    <!-- Cover Page -->
    <div class="cover-page">
      <h1>${textbookTitle}</h1>
      <p class="subtitle">Comprehensive Study Notes</p>
      <div class="stats">
        <div class="stat">
          <span class="stat-number">${exportNotes.length}</span>
          <span class="stat-label">Chapters</span>
        </div>
      </div>
      <p class="generated-by">Generated with Studiora AI</p>
    </div>

    <!-- Table of Contents -->
    <div class="toc">
      <h2>Table of Contents</h2>
      <ol>
        ${tableOfContents}
      </ol>
    </div>

    <!-- Chapters -->
    ${combinedContent}
  </div>
</body>
</html>`

    // Download the file
    const filename = `${textbookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setExportDialogOpen(false)
  }, [exportSelectedNotes, exportCourseId, getExportableNotes, courses])

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
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDownloadNote(note) }} title="Download HTML">
                    <Download />
                  </IconButton>
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
      <Box sx={{ mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Notes
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip icon={<Description />} label={`${savedNotes.length} Total`} size="small" variant="outlined" />
              <Chip icon={<Star />} label={`${savedNotes.filter(n => n.starred).length} Starred`} size="small" variant="outlined" />
              <Chip icon={<AutoAwesome />} label={`${savedNotes.filter(n => n.aiGenerated).length} AI`} size="small" variant="outlined" />
            </Stack>
          </Box>
          {savedNotes.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<MenuBook />}
              onClick={handleOpenExportDialog}
            >
              Export Textbook
            </Button>
          )}
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
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ flexGrow: 1, maxWidth: 300 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
                }}
              />
              <Button
                size="small"
                startIcon={<FilterList />}
                onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              >
                {selectedFilter === 'all' ? 'Filter' : selectedFilter}
              </Button>
              <Button
                size="small"
                startIcon={sort === 'newest' ? <ArrowDownward /> : sort === 'oldest' ? <ArrowUpward /> : <Description />}
                onClick={() => setSort(prev => prev === 'newest' ? 'oldest' : prev === 'oldest' ? 'title' : 'newest')}
              >
                {sort === 'newest' ? 'Newest' : sort === 'oldest' ? 'Oldest' : 'A-Z'}
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
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleDownloadNote(selectedNote)}
              >
                Download
              </Button>
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

      {/* Export Textbook Dialog */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBook color="primary" />
          Export Textbook
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              Combine your notes into a single textbook-style HTML file with a cover page and table of contents.
            </Alert>

            {/* Course filter */}
            <FormControl fullWidth>
              <InputLabel>Filter by Course</InputLabel>
              <Select
                value={exportCourseId}
                onChange={(e) => {
                  setExportCourseId(e.target.value)
                  // Reset selection when course changes
                  const notes = savedNotes.filter(n => !n.archived && (e.target.value === 'all' || n.courseId === e.target.value))
                  setExportSelectedNotes(new Set(notes.map(n => n.id)))
                }}
                label="Filter by Course"
              >
                <MenuItem value="all">All Courses</MenuItem>
                {courses.map((course: any) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.code ? `${course.code} — ${course.name}` : course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Note selection */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">
                  Select Notes to Include ({exportSelectedNotes.size} selected)
                </Typography>
                <Button
                  size="small"
                  startIcon={<SelectAll />}
                  onClick={() => {
                    const notes = getExportableNotes()
                    if (exportSelectedNotes.size === notes.length) {
                      setExportSelectedNotes(new Set())
                    } else {
                      setExportSelectedNotes(new Set(notes.map(n => n.id)))
                    }
                  }}
                >
                  {exportSelectedNotes.size === getExportableNotes().length ? 'Deselect All' : 'Select All'}
                </Button>
              </Stack>

              <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <List dense>
                  {getExportableNotes().map((note) => {
                    const course = courses.find((c: any) => c.id === note.courseId)
                    return (
                      <ListItem
                        key={note.id}
                        onClick={() => handleToggleExportNote(note.id)}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={exportSelectedNotes.has(note.id)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => handleToggleExportNote(note.id)}
                              size="small"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {note.title || note.topic || 'Untitled'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {course?.name || 'Uncategorized'} • {format(new Date(note.timestamp || note.createdAt || Date.now()), 'MMM d, yyyy')}
                              </Typography>
                            </Box>
                          }
                          sx={{ ml: 0, width: '100%' }}
                        />
                      </ListItem>
                    )
                  })}
                  {getExportableNotes().length === 0 && (
                    <ListItem>
                      <Typography variant="body2" color="text.secondary">
                        No notes available for export.
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportTextbook}
            disabled={exportSelectedNotes.size === 0}
          >
            Export {exportSelectedNotes.size} Notes as Textbook
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
