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

// Section definitions - GENERIC for any subject (not medical-specific)
const SECTION_CATEGORIES = {
  core: {
    label: 'Core Content',
    sections: [
      { id: 'overview', label: 'Overview', description: 'Introduction and context' },
      { id: 'keyTakeaways', label: 'Key Takeaways', description: 'Main learning points' },
      { id: 'mainConcepts', label: 'Main Concepts', description: 'Detailed concept explanations' },
      { id: 'theoreticalFramework', label: 'Underlying Processes', description: 'Core mechanisms and principles' },
    ],
  },
  application: {
    label: 'Application',
    sections: [
      { id: 'practicalApplications', label: 'Practical Applications', description: 'Real-world usage and examples' },
      { id: 'analysis', label: 'Analysis & Evaluation', description: 'Methods for analysis and assessment' },
      { id: 'actionSteps', label: 'Action Steps', description: 'Procedures and interventions' },
      { id: 'formulas', label: 'Formulas & Calculations', description: 'Technical details and computations' },
    ],
  },
  examples: {
    label: 'Examples & Applications',
    sections: [
      { id: 'examples', label: 'Detailed Examples', description: 'Worked problems and scenarios' },
      { id: 'complications', label: 'Challenges & Pitfalls', description: 'Common problems and risks' },
      { id: 'teaching', label: 'Study Tips', description: 'Learning strategies and priorities' },
    ],
  },
  study: {
    label: 'Study Aids',
    sections: [
      { id: 'keyTerms', label: 'Key Terms', description: 'Vocabulary and definitions' },
      { id: 'mnemonics', label: 'Mnemonics', description: 'Memory aids and tricks' },
      { id: 'conceptMap', label: 'Concept Map', description: 'Visual relationship diagram' },
    ],
  },
  practice: {
    label: 'Practice & Assessment',
    sections: [
      { id: 'selfAssessment', label: 'Self-Assessment', description: 'Quick check questions' },
      { id: 'practiceQuestions', label: 'Practice Questions', description: 'Exam-style questions with rationales' },
      { id: 'caseStudy', label: 'Case Study / Scenario', description: 'Real-world scenario analysis' },
    ],
  },
  additional: {
    label: 'Additional Topics',
    sections: [
      { id: 'expertTips', label: 'Expert Tips', description: 'High-yield insights and pearls' },
      { id: 'warningsSigns', label: 'Warning Signs', description: 'Critical alerts and red flags' },
      { id: 'diverseContexts', label: 'Diverse Contexts', description: 'Variations across settings' },
      { id: 'ethicalLegal', label: 'Ethical & Legal', description: 'Ethical and legal considerations' },
    ],
  },
};

// Default selected sections for a balanced note
const DEFAULT_SECTIONS = [
  'overview',
  'keyTakeaways',
  'mainConcepts',
  'theoreticalFramework',
  'practicalApplications',
  'actionSteps',
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
