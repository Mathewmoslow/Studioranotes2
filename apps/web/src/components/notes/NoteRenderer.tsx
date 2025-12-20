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
          '& .note-body': {
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
          // Medical box styles for vibrant-textbook
          '& .clinical-box': {
            bgcolor: 'rgba(239,68,68,0.1)',
            border: '1px solid #ef4444',
            borderRadius: 2,
            p: 2,
            my: 2,
          },
          '& .nursing-box': {
            bgcolor: 'rgba(59,130,246,0.1)',
            border: '1px solid #3b82f6',
            borderRadius: 2,
            p: 2,
            my: 2,
          },
          '& .education-box': {
            bgcolor: 'rgba(245,158,11,0.1)',
            border: '1px solid #f59e0b',
            borderRadius: 2,
            p: 2,
            my: 2,
          },
          '& .key-point-box': {
            bgcolor: 'rgba(168,85,247,0.1)',
            borderLeft: '4px solid #a855f7',
            p: 2,
            my: 2,
          },
          '& .medication-box': {
            bgcolor: 'rgba(20,184,166,0.1)',
            border: '1px solid #14b8a6',
            borderRadius: 2,
            p: 2,
            my: 2,
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
