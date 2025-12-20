'use client';

import React from 'react';
import ConceptMap from './ConceptMap';
import { Box } from '@mui/material';

interface ConceptMapData {
  central: string;
  pathophysiology: string[];
  riskFactors: string[];
  causes: string[];
  signsSymptoms: string[];
  diagnostics: string[];
  complications: string[];
  nursingInterventions: string[];
  medications: string[];
  treatments: string[];
  patientEducation: string[];
}

interface NoteRendererProps {
  content: string;
}

const NoteRenderer: React.FC<NoteRendererProps> = ({ content }) => {
  // Function to extract and parse ALL concept maps from HTML content
  const extractConceptMaps = (html: string) => {
    const conceptMaps: Array<{ title: string; data: ConceptMapData }> = [];

    // Find all h3 headers that indicate concept maps and their following code blocks
    const conceptMapSectionRegex = /<h3[^>]*>(?:Concept Map:?\s*)([^<]+)<\/h3>[\s\S]*?<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g;
    let sectionMatch;

    while ((sectionMatch = conceptMapSectionRegex.exec(html)) !== null) {
      const mapTitle = sectionMatch[1].trim();
      const codeContent = sectionMatch[2];

      // Decode HTML entities
      const decodedContent = codeContent
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');

      try {
        // Extract JSON
        const jsonMatch = decodedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const mapData = JSON.parse(jsonMatch[0]);
          conceptMaps.push({ title: mapTitle, data: mapData });
        }
      } catch (e) {
        console.error(`Failed to parse concept map for ${mapTitle}:`, e);
      }
    }

    // Also try to find concept maps without h3 headers (legacy format)
    if (conceptMaps.length === 0) {
      const codeBlockRegex = /<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g;
      let match;

      while ((match = codeBlockRegex.exec(html)) !== null) {
        const codeContent = match[1];
        const decodedContent = codeContent
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&');

        // Check if this looks like our concept map JSON
        if (decodedContent.includes('"central"') &&
            decodedContent.includes('"pathophysiology"') &&
            decodedContent.includes('"nursingInterventions"')) {
          try {
            const jsonMatch = decodedContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const mapData = JSON.parse(jsonMatch[0]);
              // Use the central condition name as title
              conceptMaps.push({
                title: mapData.central || 'Concept Map',
                data: mapData
              });
            }
          } catch (e) {
            console.error('Failed to parse concept map JSON:', e);
          }
        }
      }
    }

    return conceptMaps;
  };

  // Function to render content with multiple concept maps
  const renderContent = () => {
    const conceptMaps = extractConceptMaps(content);

    if (!conceptMaps || conceptMaps.length === 0) {
      // If no concept maps found, return content as-is
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }

    // Remove all concept map JSON code blocks and replace with visual maps
    let modifiedContent = content;

    // Remove all h3 concept map sections with their JSON
    modifiedContent = modifiedContent.replace(
      /<h3[^>]*>(?:Concept Map:?\s*)[^<]+<\/h3>[\s\S]*?<pre><code[^>]*>[\s\S]*?<\/code><\/pre>/g,
      ''
    );

    // Also remove h2 Concept Maps section if it exists (for the header)
    modifiedContent = modifiedContent.replace(
      /<h2[^>]*>Concept Maps?<\/h2>/g,
      ''
    );

    // Find where to insert the visual concept maps
    // Look for where the concept map section was
    const insertionPoint = modifiedContent.search(/<h2[^>]*>(?:Check Yourself|Practice Questions|Case Study|Patient Education)/);

    if (insertionPoint > 0) {
      // Insert concept maps before the next major section
      const beforeMaps = modifiedContent.substring(0, insertionPoint);
      const afterMaps = modifiedContent.substring(insertionPoint);

      return (
        <>
          <div dangerouslySetInnerHTML={{ __html: beforeMaps }} />

          {/* Render all visual concept maps */}
          <Box sx={{ my: 4 }}>
            <h2>Concept Maps</h2>
            {conceptMaps.map((map, index) => (
              <Box key={index} sx={{ mb: 4 }}>
                <h3>{map.title}</h3>
                <ConceptMap data={map.data} />
              </Box>
            ))}
          </Box>

          <div dangerouslySetInnerHTML={{ __html: afterMaps }} />
        </>
      );
    }

    // Fallback: append concept maps at the end
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: modifiedContent }} />
        <Box sx={{ my: 4 }}>
          <h2>Concept Maps</h2>
          {conceptMaps.map((map, index) => (
            <Box key={index} sx={{ mb: 4 }}>
              <h3>{map.title}</h3>
              <ConceptMap data={map.data} />
            </Box>
          ))}
        </Box>
      </>
    );
  };

  return <>{renderContent()}</>;
};

export default NoteRenderer;
