'use client';

import React, { useMemo } from 'react';
import ConceptMap from './ConceptMap';
import { Box, Paper } from '@mui/material';

interface ConceptMapData {
  central: string;
  pathophysiology?: string[];
  riskFactors?: string[];
  causes?: string[];
  signsSymptoms?: string[];
  diagnostics?: string[];
  complications?: string[];
  nursingInterventions?: string[];
  medications?: string[];
  treatments?: string[];
  patientEducation?: string[];
}

interface NoteRendererProps {
  content: string;
}

const NoteRenderer: React.FC<NoteRendererProps> = ({ content }) => {
  // Extract body content from full HTML document
  const extractBodyContent = (html: string): string => {
    // If it's a full HTML document, extract just the body content
    if (html.includes('<!DOCTYPE') || html.includes('<html')) {
      // Try to get content between <body> tags
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        return bodyMatch[1];
      }
      // Fallback: try to get article.note-body content
      const articleMatch = html.match(/<article[^>]*class="note-body"[^>]*>([\s\S]*?)<\/article>/i);
      if (articleMatch) {
        return `<article class="note-body">${articleMatch[1]}</article>`;
      }
    }
    return html;
  };

  // Extract embedded styles from full HTML document
  const extractStyles = (html: string): string => {
    const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatches) {
      return styleMatches.map(s => {
        const content = s.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        return content ? content[1] : '';
      }).join('\n');
    }
    return '';
  };

  // Function to extract and parse ALL concept maps from HTML content
  const extractConceptMaps = (html: string) => {
    const conceptMaps: Array<{ title: string; data: ConceptMapData; originalBlock: string }> = [];

    // Decode HTML entities helper
    const decodeEntities = (str: string) => str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&#x27;/g, "'");

    // Pattern 1: <pre><code class="language-json">...</code></pre>
    const codeBlockRegex = /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi;
    let match;

    while ((match = codeBlockRegex.exec(html)) !== null) {
      const codeContent = decodeEntities(match[1]);

      // Check if this looks like concept map JSON (has "central" key)
      if (codeContent.includes('"central"')) {
        try {
          const jsonMatch = codeContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const mapData = JSON.parse(jsonMatch[0]);
            if (mapData.central) {
              conceptMaps.push({
                title: mapData.central,
                data: mapData,
                originalBlock: match[0]
              });
            }
          }
        } catch (e) {
          console.error('Failed to parse concept map JSON:', e);
        }
      }
    }

    // Pattern 2: Raw JSON blocks (```json ... ```) that marked converted to code
    const jsonBlockRegex = /```json\s*([\s\S]*?)```/gi;
    while ((match = jsonBlockRegex.exec(html)) !== null) {
      const jsonContent = decodeEntities(match[1]);
      if (jsonContent.includes('"central"')) {
        try {
          const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const mapData = JSON.parse(jsonMatch[0]);
            if (mapData.central) {
              conceptMaps.push({
                title: mapData.central,
                data: mapData,
                originalBlock: match[0]
              });
            }
          }
        } catch (e) {
          console.error('Failed to parse concept map JSON:', e);
        }
      }
    }

    return conceptMaps;
  };

  // Memoize extracted data
  const { bodyContent, styles, conceptMaps } = useMemo(() => {
    const body = extractBodyContent(content);
    const css = extractStyles(content);
    const maps = extractConceptMaps(body);
    return { bodyContent: body, styles: css, conceptMaps: maps };
  }, [content]);

  // Remove concept map code blocks from content
  const contentWithoutCodeBlocks = useMemo(() => {
    let modified = bodyContent;

    // Remove concept map code blocks
    conceptMaps.forEach(map => {
      if (map.originalBlock) {
        modified = modified.replace(map.originalBlock, '');
      }
    });

    // Also remove h2 Concept Maps header if all maps were extracted
    if (conceptMaps.length > 0) {
      modified = modified.replace(/<h2[^>]*>\s*Concept Maps?\s*<\/h2>/gi, '');
    }

    // Clean up empty pre tags
    modified = modified.replace(/<pre>\s*<\/pre>/g, '');

    return modified;
  }, [bodyContent, conceptMaps]);

  return (
    <Box className="note-renderer">
      {/* Inject extracted styles */}
      {styles && (
        <style dangerouslySetInnerHTML={{ __html: styles }} />
      )}

      {/* Render main HTML content */}
      <Box
        className="note-content"
        sx={{
          '& .note-body, & .container': {
            maxWidth: '100%',
            padding: 0,
          },
          '& h1': { fontSize: '1.8rem', fontWeight: 700, mb: 2 },
          '& h2': { fontSize: '1.4rem', fontWeight: 600, mt: 3, mb: 1.5 },
          '& h3': { fontSize: '1.2rem', fontWeight: 600, mt: 2, mb: 1 },
          '& p': { mb: 1.5, lineHeight: 1.7 },
          '& ul, & ol': { pl: 3, mb: 2 },
          '& li': { mb: 0.5 },
          '& blockquote': {
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            pl: 2,
            ml: 0,
            fontStyle: 'italic',
            color: 'text.secondary'
          },
          '& table': {
            width: '100%',
            borderCollapse: 'collapse',
            mb: 2,
          },
          '& th, & td': {
            border: '1px solid',
            borderColor: 'divider',
            p: 1,
            textAlign: 'left',
          },
          '& th': {
            bgcolor: 'action.hover',
            fontWeight: 600,
          },
          '& code': {
            bgcolor: 'action.hover',
            px: 0.5,
            borderRadius: 0.5,
            fontFamily: 'monospace',
            fontSize: '0.9em',
          },
          '& pre': {
            bgcolor: 'action.hover',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            '& code': {
              bgcolor: 'transparent',
              p: 0,
            }
          },
          // Editorial Chic box styles
          '& .definition-box': {
            borderLeft: '4px solid #1e3a8a',
            p: 2,
            bgcolor: '#eff6ff',
            my: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          },
          '& .info-box': {
            borderLeft: '4px solid #7c2d12',
            p: 2,
            bgcolor: '#fef9f5',
            my: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          },
          '& .callout-box': {
            border: '2px solid #0a0a0a',
            p: 2,
            bgcolor: '#ffffff',
            my: 2,
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          },
          '& .remember-box': {
            borderLeft: '4px solid #134e4a',
            border: '1px solid #e5e5e5',
            p: 2,
            bgcolor: '#fafafa',
            my: 2,
          },
          '& .warning-box': {
            borderLeft: '6px solid #991b1b',
            borderTop: '1px solid #991b1b',
            borderBottom: '1px solid #991b1b',
            p: 2,
            bgcolor: '#fef2f2',
            my: 2,
          },
          '& .label': {
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: '#6a6a6a',
            fontWeight: 600,
            mb: 0.5,
            display: 'block',
          },
          // Vibrant Textbook section styles
          '& .section-theory': {
            bgcolor: '#e8f8f5',
            p: 2.5,
            borderRadius: 2,
            my: 2,
          },
          '& .section-details': {
            bgcolor: '#fef9e7',
            p: 2.5,
            borderRadius: 2,
            my: 2,
          },
          '& .section-analysis': {
            bgcolor: '#ebf5fb',
            p: 2.5,
            borderRadius: 2,
            my: 2,
          },
          '& .section-methods': {
            bgcolor: '#fdf2e9',
            p: 2.5,
            borderRadius: 2,
            my: 2,
          },
          '& .section-critical': {
            bgcolor: '#fadbd8',
            p: 2.5,
            borderRadius: 2,
            my: 2,
            border: '2px solid #e74c3c',
          },
          '& .section-procedures': {
            bgcolor: '#eafaf1',
            p: 2.5,
            borderRadius: 2,
            my: 2,
          },
          '& .section-summary': {
            bgcolor: '#f4ecf7',
            p: 2.5,
            borderRadius: 2,
            my: 2,
          },
          '& .section-title': {
            fontSize: '1.2rem',
            fontWeight: 600,
            color: '#2c3e50',
            mb: 1,
            pb: 0.5,
            borderBottom: '2px solid #3498db',
          },
          '& .header-template': {
            background: 'linear-gradient(135deg, #2c3e50, #34495e)',
            color: 'white',
            p: 5,
            textAlign: 'center',
            mb: 3,
            '& h1': {
              color: 'white !important',
              fontSize: '2.5rem',
              mb: 1,
            },
            '& p': {
              color: 'rgba(255,255,255,0.9)',
              fontSize: '1.1rem',
            },
          },
          '& .topic-block-template': {
            border: '2px solid #e1e8ed',
            borderRadius: 2,
            my: 3,
            overflow: 'hidden',
          },
          '& .topic-header-template': {
            bgcolor: '#3498db',
            color: 'white',
            p: 2,
            fontSize: '1.4rem',
            fontWeight: 600,
          },
          '& .topic-content-template': {
            p: 3,
          },
          '& .priority-box-template': {
            bgcolor: '#fff3cd',
            border: '2px solid #f39c12',
            p: 2.5,
            my: 2,
            borderRadius: 2,
          },
          '& .category-grid': {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 2,
            my: 2,
          },
          '& .category-card-template': {
            border: '1px solid #e1e8ed',
            borderRadius: 2,
            p: 2,
            bgcolor: 'white',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          },
          '& .quick-reference-template': {
            background: 'linear-gradient(135deg, #f5f7fa, #c3cfe2)',
            p: 3,
            borderRadius: 2,
            my: 3,
          },
          '& .table-template': {
            width: '100%',
            borderCollapse: 'collapse',
            my: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            borderRadius: 2,
            overflow: 'hidden',
            '& th': {
              bgcolor: '#34495e',
              color: 'white',
              p: 1.5,
              textAlign: 'left',
              fontWeight: 600,
            },
            '& td': {
              p: 1.25,
              border: '1px solid #e1e8ed',
            },
            '& tr:nth-of-type(even)': {
              bgcolor: '#f8f9fa',
            },
          },
          // Grid layouts for Editorial Chic
          '& .grid-2': {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            my: 2,
          },
          '& .grid-3': {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1.5,
            my: 2,
          },
          '& .card': {
            p: 2,
            bgcolor: '#fafafa',
            border: '1px solid #e5e5e5',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          },
          '& .comparison': {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            my: 2,
          },
          '& .comparison-column': {
            p: 2,
            bgcolor: '#fafafa',
            border: '1px solid #e5e5e5',
          },
          // ========================================
          // RICH FORMATTING COMPONENTS
          // ========================================

          // Cover Page Styles (Editorial Chic)
          '& .cover': {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            color: 'white',
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              pointerEvents: 'none',
            },
            '& h1': {
              color: 'white !important',
              fontSize: '2.8rem',
              fontWeight: 700,
              mb: 1,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            },
          },
          '& .subtitle': {
            fontSize: '1.3rem',
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 300,
            letterSpacing: '0.05em',
            mb: 3,
          },
          '& .cover-stats': {
            display: 'flex',
            justifyContent: 'center',
            gap: 4,
            mt: 4,
            flexWrap: 'wrap',
          },
          '& .stat': {
            textAlign: 'center',
            p: 2,
            minWidth: '120px',
          },
          '& .stat-number': {
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#4ecdc4',
            display: 'block',
            lineHeight: 1,
            mb: 0.5,
          },
          '& .stat-label': {
            fontSize: '0.85rem',
            color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          },

          // Topic Grid Styles
          '& .topic-grid': {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 3,
            my: 3,
          },
          '& .topic-card': {
            bgcolor: 'white',
            borderRadius: 2,
            p: 3,
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #e8e8e8',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            },
            '& h3': {
              color: '#2c3e50',
              fontSize: '1.1rem',
              fontWeight: 600,
              mb: 1.5,
              pb: 1,
              borderBottom: '2px solid #3498db',
            },
          },

          // Two-Column Layout
          '& .two-column': {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 3,
            my: 3,
            '@media (max-width: 768px)': {
              gridTemplateColumns: '1fr',
            },
          },

          // Case Study Styles
          '& .case-study': {
            bgcolor: '#f8fafc',
            borderRadius: 2,
            overflow: 'hidden',
            my: 3,
            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
          },
          '& .case-study-header': {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            p: 2.5,
            '& h3': {
              color: 'white !important',
              fontSize: '1.2rem',
              fontWeight: 600,
              m: 0,
            },
          },
          '& .case-study-content': {
            p: 3,
          },
          '& .vitals-grid': {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 2,
            my: 2,
          },
          '& .vital': {
            bgcolor: 'white',
            p: 1.5,
            borderRadius: 1,
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            '&.abnormal': {
              bgcolor: '#fef2f2',
              borderColor: '#fecaca',
              '& .vital-value': {
                color: '#dc2626',
                fontWeight: 700,
              },
            },
          },
          '& .vital-label': {
            fontSize: '0.75rem',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            mb: 0.5,
            display: 'block',
          },
          '& .vital-value': {
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#1e293b',
          },

          // Mnemonic Styles
          '& .mnemonic': {
            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            borderRadius: 2,
            p: 3,
            my: 3,
            boxShadow: '0 4px 15px rgba(252, 182, 159, 0.3)',
          },
          '& .mnemonic-title': {
            fontSize: '1.4rem',
            fontWeight: 700,
            color: '#c2410c',
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            '&::before': {
              content: '"💡"',
              fontSize: '1.2rem',
            },
          },
          '& .mnemonic-breakdown': {
            bgcolor: 'rgba(255,255,255,0.7)',
            borderRadius: 1,
            p: 2,
            '& p': {
              mb: 0.75,
              fontSize: '1rem',
              '& strong': {
                color: '#c2410c',
                fontSize: '1.1rem',
              },
            },
          },

          // Lab Value Grid Styles
          '& .lab-grid': {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 2,
            my: 3,
          },
          '& .lab-value': {
            bgcolor: 'white',
            borderRadius: 1.5,
            p: 2,
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
            '&.critical': {
              bgcolor: '#fef2f2',
              borderColor: '#f87171',
              borderWidth: '2px',
              '& .lab-result': {
                color: '#dc2626',
                fontWeight: 700,
              },
            },
            '&.abnormal': {
              bgcolor: '#fffbeb',
              borderColor: '#fbbf24',
            },
          },
          '& .lab-name': {
            fontSize: '0.8rem',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            mb: 0.5,
            display: 'block',
          },
          '& .lab-result': {
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1e293b',
            mb: 0.25,
          },
          '& .lab-normal': {
            fontSize: '0.75rem',
            color: '#94a3b8',
          },

          // Numbered Steps Styles
          '& .numbered-steps': {
            counterReset: 'step-counter',
            listStyle: 'none',
            pl: 0,
            my: 3,
            '& li': {
              counterIncrement: 'step-counter',
              position: 'relative',
              pl: 6,
              pb: 2,
              mb: 2,
              borderLeft: '2px solid #e2e8f0',
              '&::before': {
                content: 'counter(step-counter)',
                position: 'absolute',
                left: '-18px',
                top: 0,
                width: '36px',
                height: '36px',
                bgcolor: '#3b82f6',
                color: 'white',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
              },
              '&:last-child': {
                borderLeft: 'none',
                pb: 0,
              },
            },
          },

          // Question Box Styles (NCLEX Practice)
          '& .question-box': {
            bgcolor: '#f0f9ff',
            borderRadius: 2,
            p: 3,
            my: 3,
            border: '1px solid #bae6fd',
            boxShadow: '0 4px 15px rgba(14, 165, 233, 0.1)',
          },
          '& .question-number': {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            bgcolor: '#0ea5e9',
            color: 'white',
            borderRadius: '50%',
            fontWeight: 700,
            fontSize: '0.9rem',
            mr: 1.5,
            mb: 1.5,
          },
          '& .question-text': {
            fontSize: '1.05rem',
            fontWeight: 500,
            color: '#0c4a6e',
            mb: 2,
          },
          '& .answer-choices': {
            listStyle: 'none',
            pl: 0,
            mb: 2,
            '& li': {
              p: 1.5,
              mb: 1,
              bgcolor: 'white',
              borderRadius: 1,
              border: '1px solid #e0e7ff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: '#f8fafc',
                borderColor: '#3b82f6',
              },
              '&.correct': {
                bgcolor: '#dcfce7',
                borderColor: '#22c55e',
                '&::after': {
                  content: '" ✓"',
                  color: '#16a34a',
                  fontWeight: 700,
                },
              },
              '&.incorrect': {
                bgcolor: '#fef2f2',
                borderColor: '#f87171',
              },
            },
          },
          '& .rationale': {
            bgcolor: '#ecfdf5',
            borderRadius: 1,
            p: 2,
            mt: 2,
            borderLeft: '4px solid #10b981',
            '& strong': {
              color: '#047857',
            },
          },

          // Expert Tip / Key Point Box (alias: clinical-pearl for backward compatibility)
          '& .clinical-pearl, & .expert-tip': {
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: 2,
            p: 3,
            my: 3,
            borderLeft: '4px solid #f59e0b',
            boxShadow: '0 4px 15px rgba(245, 158, 11, 0.2)',
            '& h4': {
              color: '#92400e',
              fontSize: '1.1rem',
              fontWeight: 700,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&::before': {
                content: '"⭐"',
              },
            },
          },

          // Action Step / Process Box (alias: nursing-intervention for backward compatibility)
          '& .nursing-intervention, & .action-step-box, & .process-box': {
            bgcolor: '#f0fdf4',
            borderRadius: 2,
            p: 3,
            my: 3,
            border: '1px solid #86efac',
            '& h4': {
              color: '#166534',
              fontSize: '1.1rem',
              fontWeight: 600,
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&::before': {
                content: '"📋"',
              },
            },
          },

          // Formula / Technical Box (alias: medication-box for backward compatibility)
          '& .medication-box, & .formula-box, & .technical-box': {
            bgcolor: '#faf5ff',
            borderRadius: 2,
            p: 3,
            my: 3,
            border: '1px solid #d8b4fe',
            '& h4': {
              color: '#7c3aed',
              fontSize: '1.1rem',
              fontWeight: 600,
              mb: 1.5,
            },
          },

          // Concept Box (key theories, definitions)
          '& .concept-box': {
            bgcolor: '#eff6ff',
            borderRadius: 2,
            p: 3,
            my: 3,
            borderLeft: '4px solid #3b82f6',
            '& h4': {
              color: '#1e40af',
              fontSize: '1.1rem',
              fontWeight: 600,
              mb: 1.5,
            },
          },

          // Example Box (worked examples, applications)
          '& .example-box': {
            bgcolor: '#fefce8',
            borderRadius: 2,
            p: 3,
            my: 3,
            border: '1px solid #fde047',
            '& h4': {
              color: '#854d0e',
              fontSize: '1.1rem',
              fontWeight: 600,
              mb: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&::before': {
                content: '"💡"',
              },
            },
          },
          '& .med-name': {
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#5b21b6',
          },
          '& .med-class': {
            fontSize: '0.85rem',
            color: '#8b5cf6',
            fontStyle: 'italic',
          },
          '& .med-details': {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 2,
            mt: 2,
            '& > div': {
              bgcolor: 'white',
              p: 1.5,
              borderRadius: 1,
            },
          },

          // Pathophysiology Flow
          '& .patho-flow': {
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            my: 3,
            '& .patho-step': {
              bgcolor: 'white',
              p: 2,
              borderRadius: 1,
              border: '1px solid #e5e7eb',
              position: 'relative',
              ml: 3,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '-24px',
                top: '50%',
                width: '16px',
                height: '2px',
                bgcolor: '#3b82f6',
              },
              '&::after': {
                content: '"→"',
                position: 'absolute',
                left: '-12px',
                top: 'calc(100% + 4px)',
                color: '#3b82f6',
                fontSize: '1.2rem',
              },
              '&:last-child::after': {
                display: 'none',
              },
            },
          },

          // Quick Reference Table
          '& .quick-ref': {
            bgcolor: '#f8fafc',
            borderRadius: 2,
            p: 3,
            my: 3,
            border: '1px solid #cbd5e1',
            '& h4': {
              fontSize: '1.1rem',
              fontWeight: 600,
              color: '#334155',
              mb: 2,
              pb: 1,
              borderBottom: '2px solid #3b82f6',
            },
            '& table': {
              width: '100%',
              '& th': {
                bgcolor: '#1e40af',
                color: 'white',
              },
            },
          },

          // Priority/Emergency Box
          '& .priority-alert': {
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            borderRadius: 2,
            p: 3,
            my: 3,
            borderLeft: '6px solid #dc2626',
            boxShadow: '0 4px 15px rgba(220, 38, 38, 0.15)',
            '& h4': {
              color: '#991b1b',
              fontSize: '1.1rem',
              fontWeight: 700,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&::before': {
                content: '"🚨"',
              },
            },
          },

          // Summary/Key Points Box
          '& .summary-box': {
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            borderRadius: 2,
            p: 3,
            my: 3,
            border: '1px solid #93c5fd',
            '& h4': {
              color: '#1e40af',
              fontSize: '1.1rem',
              fontWeight: 600,
              mb: 1.5,
            },
            '& ul': {
              '& li': {
                mb: 1,
                pl: 1,
                '&::marker': {
                  color: '#3b82f6',
                },
              },
            },
          },

          // Timeline Component
          '& .timeline': {
            position: 'relative',
            pl: 4,
            my: 3,
            '&::before': {
              content: '""',
              position: 'absolute',
              left: '12px',
              top: 0,
              bottom: 0,
              width: '2px',
              bgcolor: '#e5e7eb',
            },
            '& .timeline-item': {
              position: 'relative',
              pb: 3,
              '&::before': {
                content: '""',
                position: 'absolute',
                left: '-28px',
                top: '4px',
                width: '12px',
                height: '12px',
                bgcolor: '#3b82f6',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 0 0 2px #3b82f6',
              },
            },
          },

          // Comparison Table
          '& .comparison-table': {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 0,
            my: 3,
            border: '1px solid #e5e7eb',
            borderRadius: 2,
            overflow: 'hidden',
            '& .comparison-header': {
              p: 2,
              fontWeight: 600,
              textAlign: 'center',
              '&:first-of-type': {
                bgcolor: '#dcfce7',
                color: '#166534',
              },
              '&:last-of-type': {
                bgcolor: '#fee2e2',
                color: '#991b1b',
              },
            },
            '& .comparison-row': {
              display: 'contents',
              '& > div': {
                p: 1.5,
                borderTop: '1px solid #e5e7eb',
                '&:first-of-type': {
                  borderRight: '1px solid #e5e7eb',
                },
              },
            },
          },

          // Highlight/Emphasis Text
          '& .highlight': {
            bgcolor: '#fef08a',
            px: 0.5,
            borderRadius: 0.5,
          },
          '& .critical-text': {
            color: '#dc2626',
            fontWeight: 700,
          },
          '& .important-text': {
            color: '#ea580c',
            fontWeight: 600,
          },
        }}
        dangerouslySetInnerHTML={{ __html: contentWithoutCodeBlocks }}
      />

      {/* Render visual concept maps */}
      {conceptMaps.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Box component="h2" sx={{ fontSize: '1.4rem', fontWeight: 600, mb: 2 }}>
            Concept Maps
          </Box>
          {conceptMaps.map((map, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                mb: 3,
                p: 2,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Box component="h3" sx={{ fontSize: '1.1rem', fontWeight: 600, mb: 2, textAlign: 'center' }}>
                {map.title}
              </Box>
              <ConceptMap data={map.data} />
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default NoteRenderer;
