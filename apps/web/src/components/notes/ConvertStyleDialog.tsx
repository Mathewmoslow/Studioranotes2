'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material';
import {
  AutoAwesome,
  CheckCircle,
  Style,
  Palette,
} from '@mui/icons-material';

interface ConvertStyleDialogProps {
  open: boolean;
  onClose: () => void;
  noteId: string;
  noteTitle: string;
  noteContent: string;
  courseName?: string;
  onConversionComplete: (convertedNote: {
    id: string;
    html: string;
    targetStyle: string;
  }) => void;
}

const TARGET_STYLES = [
  {
    id: 'editorial-chic',
    label: 'Editorial Chic',
    description: 'Elegant, magazine-style with serif typography',
    preview: {
      bg: '#f7f4ef',
      accent: '#111',
      text: '#222',
    },
    features: [
      'Sophisticated serif fonts',
      'Clean, minimal aesthetic',
      'Elegant borders and spacing',
      'Perfect for reading and studying',
    ],
  },
  {
    id: 'vibrant-textbook',
    label: 'Vibrant Textbook',
    description: 'Bold, modern study format with colored boxes',
    preview: {
      bg: '#0f172a',
      accent: '#10b981',
      text: '#e2e8f0',
    },
    features: [
      'Dark theme with gradient accents',
      'Clinical & nursing highlight boxes',
      'Medication and education sections',
      'High visual organization',
    ],
  },
];

export default function ConvertStyleDialog({
  open,
  onClose,
  noteId,
  noteTitle,
  noteContent,
  courseName,
  onConversionComplete,
}: ConvertStyleDialogProps) {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertedHtml, setConvertedHtml] = useState<string | null>(null);

  const steps = ['Select Style', 'Converting', 'Complete'];

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    setError(null);
  };

  const handleConvert = async () => {
    if (!selectedStyle) {
      setError('Please select a target style');
      return;
    }

    setLoading(true);
    setError(null);
    setActiveStep(1);

    try {
      const response = await fetch('/api/notes/convert-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          content: noteContent,
          targetStyle: selectedStyle,
          title: noteTitle,
          course: courseName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Conversion failed');
      }

      setConvertedHtml(data.html);
      setActiveStep(2);

    } catch (err) {
      console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to convert note');
      setActiveStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (convertedHtml && selectedStyle) {
      onConversionComplete({
        id: `${noteId}-${selectedStyle}`,
        html: convertedHtml,
        targetStyle: selectedStyle,
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedStyle(null);
    setActiveStep(0);
    setError(null);
    setConvertedHtml(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Style color="primary" />
        Convert to Styled Format
      </DialogTitle>

      <Divider />

      <DialogContent>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3, pt: 2 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Step 0: Select Style */}
        {activeStep === 0 && (
          <>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Choose a visual style for <strong>{noteTitle}</strong>. Your simple note will be
              reformatted with professional styling while preserving all content.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              {TARGET_STYLES.map((style) => (
                <Card
                  key={style.id}
                  variant="outlined"
                  sx={{
                    flex: 1,
                    border: 2,
                    borderColor: selectedStyle === style.id ? 'primary.main' : 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.light',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleStyleSelect(style.id)}>
                    {/* Preview Strip */}
                    <Box
                      sx={{
                        height: 80,
                        background: style.preview.bg,
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          color: style.preview.text,
                          fontFamily: style.id === 'editorial-chic'
                            ? 'Georgia, serif'
                            : 'Inter, sans-serif',
                          borderBottom: `2px solid ${style.preview.accent}`,
                          pb: 0.5,
                          display: 'inline-block',
                        }}
                      >
                        {style.label}
                      </Typography>
                    </Box>

                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Palette fontSize="small" color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {style.label}
                        </Typography>
                        {selectedStyle === style.id && (
                          <CheckCircle color="primary" fontSize="small" />
                        )}
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {style.description}
                      </Typography>

                      <Box component="ul" sx={{ m: 0, pl: 2 }}>
                        {style.features.map((feature, i) => (
                          <Typography
                            key={i}
                            component="li"
                            variant="caption"
                            color="text.secondary"
                          >
                            {feature}
                          </Typography>
                        ))}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </>
        )}

        {/* Step 1: Converting */}
        {activeStep === 1 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Converting Your Note
            </Typography>
            <Typography color="text.secondary">
              AI is reformatting your content with the{' '}
              <strong>
                {TARGET_STYLES.find(s => s.id === selectedStyle)?.label}
              </strong>{' '}
              style...
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              This may take 10-30 seconds
            </Typography>
          </Box>
        )}

        {/* Step 2: Complete */}
        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Conversion Complete!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Your note has been converted to the{' '}
              <strong>
                {TARGET_STYLES.find(s => s.id === selectedStyle)?.label}
              </strong>{' '}
              style.
            </Typography>

            {/* Preview iframe */}
            {convertedHtml && (
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                  height: 300,
                  mt: 2,
                }}
              >
                <iframe
                  srcDoc={convertedHtml}
                  style={{
                    width: '133%',
                    height: '133%',
                    border: 'none',
                    transform: 'scale(0.75)',
                    transformOrigin: 'top left',
                  }}
                  title="Converted Note Preview"
                  sandbox="allow-same-origin"
                />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>

        {activeStep === 0 && (
          <Button
            variant="contained"
            onClick={handleConvert}
            disabled={!selectedStyle || loading}
            startIcon={<AutoAwesome />}
          >
            Convert Note
          </Button>
        )}

        {activeStep === 2 && (
          <Button
            variant="contained"
            color="success"
            onClick={handleComplete}
            startIcon={<CheckCircle />}
          >
            Save Styled Note
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
