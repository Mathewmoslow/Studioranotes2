/**
 * Note-specific theme extensions for MUI
 * Contains color definitions for medical boxes, note styles, and typography variants
 */

// Medical box colors (used in Vibrant Textbook style)
export const medicalBoxColors = {
  clinical: {
    main: '#ef4444',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '#ef4444',
  },
  nursing: {
    main: '#3b82f6',
    background: 'rgba(59, 130, 246, 0.15)',
    border: '#3b82f6',
  },
  education: {
    main: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.15)',
    border: '#f59e0b',
  },
  keyPoint: {
    main: '#a855f7',
    background: 'rgba(168, 85, 247, 0.15)',
    border: '#a855f7',
  },
  medication: {
    main: '#14b8a6',
    background: 'rgba(20, 184, 166, 0.15)',
    border: '#14b8a6',
  },
  critical: {
    main: '#dc2626',
    background: 'rgba(220, 38, 38, 0.15)',
    border: '#dc2626',
  },
}

// Note style definitions
export const noteStyles = {
  'editorial-chic': {
    name: 'Editorial Chic',
    description: 'Elegant, magazine-style with serif typography',
    editable: false,
    colors: {
      accent: '#111111',
      background: '#f7f4ef',
      text: '#222222',
      heading: '#111111',
      border: '#dddddd',
    },
    typography: {
      fontFamily: '"Playfair Display", Georgia, serif',
      headingWeight: 700,
      bodyLineHeight: 1.7,
    },
  },
  'vibrant-textbook': {
    name: 'Vibrant Textbook',
    description: 'Bold, modern study format with colored boxes',
    editable: false,
    colors: {
      accent: '#10b981',
      secondary: '#6366f1',
      background: '#0f172a',
      text: '#e2e8f0',
      heading: '#a5b4fc',
      border: '#334155',
    },
    typography: {
      fontFamily: '"Inter", -apple-system, sans-serif',
      headingWeight: 600,
      bodyLineHeight: 1.6,
    },
  },
  'simple-editable': {
    name: 'Simple/Editable',
    description: 'Clean HTML, fully editable',
    editable: true,
    colors: {
      accent: '#667eea',
      background: '#ffffff',
      text: '#333333',
      heading: '#1a1a1a',
      border: '#e5e5e5',
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      headingWeight: 600,
      bodyLineHeight: 1.6,
    },
  },
}

// Concept Map colors (for SVG visualization)
export const conceptMapColors = {
  central: {
    fill: '#667eea',
    stroke: '#4c63b6',
    text: '#ffffff',
  },
  nodes: {
    pathophysiology: '#ef4444',
    riskFactors: '#f59e0b',
    causes: '#10b981',
    signsSymptoms: '#3b82f6',
    diagnostics: '#8b5cf6',
    complications: '#ec4899',
    nursingInterventions: '#06b6d4',
    medications: '#14b8a6',
    treatments: '#6366f1',
    patientEducation: '#f97316',
  },
  connections: {
    stroke: '#94a3b8',
    strokeWidth: 2,
  },
}

// Note card elevation patterns
export const noteCardStyles = {
  default: {
    borderRadius: 12,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
  hover: {
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    transform: 'translateY(-2px)',
  },
  selected: {
    boxShadow: '0 0 0 2px #667eea, 0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
}

// Rich text editor toolbar colors
export const richTextEditorColors = {
  toolbar: {
    background: '#f8fafc',
    border: '#e2e8f0',
    buttonHover: '#e2e8f0',
    buttonActive: '#667eea',
    buttonActiveText: '#ffffff',
  },
  editor: {
    background: '#ffffff',
    placeholder: '#9ca3af',
    selection: 'rgba(102, 126, 234, 0.2)',
  },
}

// Section category colors (for section selector)
export const sectionCategoryColors = {
  core: '#667eea',
  clinical: '#ef4444',
  patient: '#10b981',
  study: '#f59e0b',
  practice: '#8b5cf6',
  additional: '#6b7280',
}

// Export type for note style keys
export type NoteStyleKey = keyof typeof noteStyles

// Helper to get style by key
export function getNoteStyle(key: NoteStyleKey) {
  return noteStyles[key]
}

// Helper to check if a style is editable
export function isStyleEditable(key: NoteStyleKey): boolean {
  return noteStyles[key]?.editable ?? false
}

// MUI theme extensions for notes
export const noteThemeExtensions = {
  components: {
    // Note-specific button variants
    MuiButton: {
      variants: [
        {
          props: { variant: 'clinical' as const },
          style: {
            backgroundColor: medicalBoxColors.clinical.background,
            borderColor: medicalBoxColors.clinical.border,
            color: medicalBoxColors.clinical.main,
            '&:hover': {
              backgroundColor: medicalBoxColors.clinical.main,
              color: '#ffffff',
            },
          },
        },
        {
          props: { variant: 'nursing' as const },
          style: {
            backgroundColor: medicalBoxColors.nursing.background,
            borderColor: medicalBoxColors.nursing.border,
            color: medicalBoxColors.nursing.main,
            '&:hover': {
              backgroundColor: medicalBoxColors.nursing.main,
              color: '#ffffff',
            },
          },
        },
      ],
    },
    // Note card styling
    MuiCard: {
      variants: [
        {
          props: { variant: 'note' as const },
          style: {
            ...noteCardStyles.default,
            transition: 'all 0.2s ease-in-out',
            '&:hover': noteCardStyles.hover,
          },
        },
      ],
    },
  },
}

export default noteStyles
