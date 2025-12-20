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
