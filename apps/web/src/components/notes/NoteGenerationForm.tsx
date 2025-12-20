'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Collapse,
} from '@mui/material';
import {
  AutoAwesome,
  School,
  CloudUpload,
  Description,
  Edit,
  Palette,
} from '@mui/icons-material';
import { useScheduleStore } from '@/stores/useScheduleStore';
import SectionSelector, { DEFAULT_SECTIONS } from './SectionSelector';

// Note style options with editability info
const NOTE_STYLES = [
  {
    id: 'editorial-chic',
    label: 'Editorial Chic',
    description: 'Serif-forward, magazine-inspired',
    editable: false,
    color: '#111',
  },
  {
    id: 'vibrant-textbook',
    label: 'Vibrant Textbook',
    description: 'Bold gradients, colorful accents',
    editable: false,
    color: '#6366f1',
  },
  {
    id: 'simple-editable',
    label: 'Simple/Editable',
    description: 'Clean HTML, fully editable',
    editable: true,
    color: '#059669',
  },
];

interface NoteGenerationFormProps {
  preSelectedCourse?: { id: string; name: string; code?: string };
  onNoteGenerated?: (note: any) => void;
  variant?: 'inline' | 'card';
}

export default function NoteGenerationForm({
  preSelectedCourse,
  onNoteGenerated,
  variant = 'inline',
}: NoteGenerationFormProps) {
  const { courses } = useScheduleStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [formData, setFormData] = useState({
    courseId: preSelectedCourse?.id || '',
    courseName: preSelectedCourse?.name || '',
    title: '',
    sourceText: '',
    noteStyle: 'editorial-chic',
    sections: DEFAULT_SECTIONS,
  });

  const handleStyleChange = (_event: React.MouseEvent<HTMLElement>, newStyle: string | null) => {
    if (newStyle) {
      setFormData({ ...formData, noteStyle: newStyle });
    }
  };

  const handleGenerate = async () => {
    // Validation
    if (!preSelectedCourse && !formData.courseId) {
      setError('Please select a course for this note.');
      return;
    }
    if (!formData.title.trim()) {
      setError('Please enter a topic/title for your note.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const selectedCourse =
        preSelectedCourse ||
        courses.find((c: any) => c.id === formData.courseId);

      const response = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          course: selectedCourse?.code || selectedCourse?.id || formData.courseId,
          courseName: selectedCourse?.name || formData.courseName,
          source: formData.sourceText,
          sections: formData.sections,
          noteStyle: formData.noteStyle,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate note');
      }

      const data = await response.json();

      // Create note object
      const noteId = `note-${Date.now()}`;
      const newNote = {
        id: noteId,
        title: formData.title,
        topic: formData.title,
        content: data.html || data.content,
        markdown: data.markdown,
        courseId: selectedCourse?.id || formData.courseId,
        courseName: selectedCourse?.name || formData.courseName,
        noteStyle: formData.noteStyle,
        sections: formData.sections,
        timestamp: new Date().toISOString(),
        editable: formData.noteStyle === 'simple-editable',
        aiGenerated: true,
      };

      // Save to localStorage
      const existingNotes = JSON.parse(localStorage.getItem('generated-notes') || '{}');
      existingNotes[noteId] = newNote;
      localStorage.setItem('generated-notes', JSON.stringify(existingNotes));

      setSuccess(true);

      // Callback with new note (no page reload!)
      if (onNoteGenerated) {
        onNoteGenerated(newNote);
      }

      // Reset form after success
      setFormData({
        ...formData,
        title: '',
        sourceText: '',
      });

    } catch (err) {
      console.error('Failed to generate note:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedStyle = NOTE_STYLES.find(s => s.id === formData.noteStyle);

  const FormContent = (
    <Stack spacing={3}>
      {/* Success/Error alerts */}
      <Collapse in={!!error}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Collapse>

      <Collapse in={success}>
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Note generated successfully!
        </Alert>
      </Collapse>

      {/* Course Selection */}
      {preSelectedCourse ? (
        <Alert severity="info" icon={<School />}>
          Generating note for: <strong>{preSelectedCourse.name}</strong>
        </Alert>
      ) : (
        <FormControl fullWidth required>
          <InputLabel>Course</InputLabel>
          <Select
            value={formData.courseId}
            onChange={(e) => {
              const selected = courses.find((c: any) => c.id === e.target.value);
              setFormData({
                ...formData,
                courseId: e.target.value as string,
                courseName: selected?.name || '',
              });
            }}
            label="Course"
          >
            {courses.map((course: any) => (
              <MenuItem key={course.id} value={course.id}>
                {course.code ? `${course.code} — ${course.name}` : course.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Topic/Title */}
      <TextField
        label="Topic / Title"
        fullWidth
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="e.g., Cardiovascular System, Heart Failure, Diabetes Management"
        required
        helperText="What topic should this note cover?"
      />

      {/* Source Material */}
      <TextField
        label="Source Material (Optional)"
        fullWidth
        multiline
        rows={4}
        value={formData.sourceText}
        onChange={(e) => setFormData({ ...formData, sourceText: e.target.value })}
        placeholder="Paste lecture notes, textbook content, or any material you want to transform into notes..."
        helperText="Leave empty to generate notes from AI knowledge"
        InputProps={{
          sx: { fontFamily: 'monospace', fontSize: '0.9rem' },
        }}
      />

      {/* Note Style Selection - Chip-based toggle */}
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Palette fontSize="small" />
          Note Style
        </Typography>
        <ToggleButtonGroup
          value={formData.noteStyle}
          exclusive
          onChange={handleStyleChange}
          aria-label="note style"
          sx={{ flexWrap: 'wrap', gap: 1 }}
        >
          {NOTE_STYLES.map((style) => (
            <ToggleButton
              key={style.id}
              value={style.id}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                border: '2px solid',
                borderColor: formData.noteStyle === style.id ? style.color : 'divider',
                '&.Mui-selected': {
                  bgcolor: `${style.color}15`,
                  borderColor: style.color,
                  color: style.color,
                },
              }}
            >
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" fontWeight="bold">
                  {style.label}
                  {style.editable && (
                    <Chip
                      label="Editable"
                      size="small"
                      icon={<Edit sx={{ fontSize: 12 }} />}
                      sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                    />
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {style.description}
                </Typography>
              </Box>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {selectedStyle?.editable && (
          <Alert severity="info" sx={{ mt: 1 }} icon={<Edit />}>
            Simple/Editable notes can be modified after generation and later converted to styled formats.
          </Alert>
        )}
      </Box>

      {/* Section Selector */}
      <SectionSelector
        selectedSections={formData.sections}
        onSectionsChange={(sections) => setFormData({ ...formData, sections })}
      />

      {/* Generate Button */}
      <Button
        variant="contained"
        size="large"
        onClick={handleGenerate}
        disabled={loading || !formData.title.trim()}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
        sx={{ py: 1.5 }}
      >
        {loading ? 'Generating...' : 'Generate Note'}
      </Button>

      {loading && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Creating your personalized notes with AI...
        </Typography>
      )}
    </Stack>
  );

  if (variant === 'card') {
    return (
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" />
          Generate AI Note
        </Typography>
        {FormContent}
      </Paper>
    );
  }

  return FormContent;
}
