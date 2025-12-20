'use client';

import React from 'react';
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Stack,
} from '@mui/material';
import { ExpandMore, CheckCircle } from '@mui/icons-material';

// Section definitions matching NotesAI's approach
const SECTION_CATEGORIES = {
  core: {
    label: 'Core Content',
    sections: [
      { id: 'overview', label: 'Overview', description: 'Introduction and key concepts' },
      { id: 'keyTakeaways', label: 'Key Takeaways', description: 'Main learning points' },
      { id: 'mainConcepts', label: 'Main Concepts', description: 'Detailed concept explanations' },
      { id: 'pathophysiology', label: 'Pathophysiology', description: 'Disease mechanisms and processes' },
    ],
  },
  clinical: {
    label: 'Clinical',
    sections: [
      { id: 'clinicalManifestations', label: 'Clinical Manifestations', description: 'Signs and symptoms' },
      { id: 'diagnostics', label: 'Diagnostics', description: 'Tests and diagnostic criteria' },
      { id: 'nursingInterventions', label: 'Nursing Interventions', description: 'Care actions and rationales' },
      { id: 'medications', label: 'Medications', description: 'Drug information and dosing' },
    ],
  },
  patient: {
    label: 'Patient Care',
    sections: [
      { id: 'clinicalApplications', label: 'Clinical Applications', description: 'Real-world scenarios' },
      { id: 'complications', label: 'Complications', description: 'Potential adverse outcomes' },
      { id: 'patientEducation', label: 'Patient Education', description: 'Teaching points for patients' },
    ],
  },
  study: {
    label: 'Study Aids',
    sections: [
      { id: 'keyTerms', label: 'Key Terms', description: 'Vocabulary and definitions' },
      { id: 'mnemonics', label: 'Mnemonics', description: 'Memory aids and tricks' },
      { id: 'conceptMap', label: 'Concept Map', description: 'Visual relationship diagram (JSON)' },
    ],
  },
  practice: {
    label: 'Practice',
    sections: [
      { id: 'checkYourself', label: 'Check Yourself', description: 'Self-assessment questions' },
      { id: 'practiceQuestions', label: 'Practice Questions', description: 'NCLEX-style questions' },
      { id: 'caseStudy', label: 'Case Study', description: 'Clinical scenario analysis' },
    ],
  },
  additional: {
    label: 'Additional',
    sections: [
      { id: 'clinicalPearls', label: 'Clinical Pearls', description: 'Expert tips and insights' },
      { id: 'redFlags', label: 'Red Flags', description: 'Warning signs to watch for' },
      { id: 'culturalConsiderations', label: 'Cultural Considerations', description: 'Diversity and inclusion' },
      { id: 'ethicalLegal', label: 'Ethical/Legal', description: 'Ethical and legal considerations' },
    ],
  },
};

// Default selected sections for a balanced note
const DEFAULT_SECTIONS = [
  'overview',
  'keyTakeaways',
  'mainConcepts',
  'pathophysiology',
  'clinicalManifestations',
  'nursingInterventions',
  'practiceQuestions',
];

interface SectionSelectorProps {
  selectedSections: string[];
  onSectionsChange: (sections: string[]) => void;
}

export default function SectionSelector({ selectedSections, onSectionsChange }: SectionSelectorProps) {
  const handleSectionToggle = (sectionId: string) => {
    if (selectedSections.includes(sectionId)) {
      onSectionsChange(selectedSections.filter(s => s !== sectionId));
    } else {
      onSectionsChange([...selectedSections, sectionId]);
    }
  };

  const handleSelectAll = (categoryKey: string) => {
    const category = SECTION_CATEGORIES[categoryKey as keyof typeof SECTION_CATEGORIES];
    const categoryIds = category.sections.map(s => s.id);
    const allSelected = categoryIds.every(id => selectedSections.includes(id));

    if (allSelected) {
      // Deselect all in category
      onSectionsChange(selectedSections.filter(s => !categoryIds.includes(s)));
    } else {
      // Select all in category
      const newSections = [...new Set([...selectedSections, ...categoryIds])];
      onSectionsChange(newSections);
    }
  };

  const handleReset = () => {
    onSectionsChange(DEFAULT_SECTIONS);
  };

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          <Typography>Customize Sections</Typography>
          <Chip
            size="small"
            label={`${selectedSections.length} selected`}
            color={selectedSections.length > 0 ? 'primary' : 'default'}
            icon={<CheckCircle />}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <Chip
              label="Reset to Default"
              onClick={handleReset}
              variant="outlined"
              size="small"
            />
            <Chip
              label="Select All"
              onClick={() => {
                const allIds = Object.values(SECTION_CATEGORIES)
                  .flatMap(cat => cat.sections.map(s => s.id));
                onSectionsChange(allIds);
              }}
              variant="outlined"
              size="small"
            />
            <Chip
              label="Clear All"
              onClick={() => onSectionsChange([])}
              variant="outlined"
              size="small"
            />
          </Box>

          {Object.entries(SECTION_CATEGORIES).map(([key, category]) => (
            <Box key={key}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" color="primary">
                  {category.label}
                </Typography>
                <Chip
                  label="Toggle All"
                  size="small"
                  variant="outlined"
                  onClick={() => handleSelectAll(key)}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
              <FormGroup row sx={{ pl: 1 }}>
                {category.sections.map(section => (
                  <FormControlLabel
                    key={section.id}
                    control={
                      <Checkbox
                        checked={selectedSections.includes(section.id)}
                        onChange={() => handleSectionToggle(section.id)}
                        size="small"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">{section.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {section.description}
                        </Typography>
                      </Box>
                    }
                    sx={{
                      width: { xs: '100%', sm: '48%', md: '32%' },
                      mr: 0,
                      mb: 1,
                    }}
                  />
                ))}
              </FormGroup>
            </Box>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export { SECTION_CATEGORIES, DEFAULT_SECTIONS };
