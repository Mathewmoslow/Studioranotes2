import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'
import { validateStyledNote, extractNoteContent, getStyleCSS } from '@/lib/validateStyledNote'
import { readFileSync } from 'fs'
import { join } from 'path'
import dayjs from 'dayjs'

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// Helper to escape HTML
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Load style example from file
function loadStyleExample(style: string): string {
  try {
    const examplePath = join(process.cwd(), 'src/lib/styleExamples', `${style}-example.html`)
    return readFileSync(examplePath, 'utf-8')
  } catch (error) {
    console.warn(`Could not load example for style ${style}:`, error)
    return ''
  }
}

// Style descriptions for the AI
const STYLE_DESCRIPTIONS: { [key: string]: string } = {
  'editorial-chic': `Editorial Chic is an elegant, magazine-style format with:
- Serif typography (Playfair Display)
- Cream/off-white background (#f7f4ef)
- Black accent color (#111)
- Clean borders and elegant spacing
- Sophisticated, minimal aesthetic
- NO special colored boxes - use blockquotes for emphasis instead`,

  'vibrant-textbook': `Vibrant Textbook is a bold, modern study format with:
- Sans-serif typography (Inter)
- Dark blue background (#0f172a)
- Gradient accents (emerald to indigo)
- Light text (#e2e8f0)
- MUST include special colored boxes strategically:
  - clinical-box (red border): Clinical points and medical information
  - nursing-box (blue border): Nursing-specific interventions and focus areas
  - education-box (yellow border): Patient education and teaching points
  - key-point-box (purple left border): Important concepts to remember
  - medication-box (teal border): Drug information and nursing considerations`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { noteId, content, targetStyle, title, course } = body

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    if (!targetStyle || !['editorial-chic', 'vibrant-textbook'].includes(targetStyle)) {
      return NextResponse.json(
        { error: 'Invalid target style. Must be "editorial-chic" or "vibrant-textbook"' },
        { status: 400 }
      )
    }

    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Extract content from simple note
    const extracted = extractNoteContent(content)
    const noteTitle = title || extracted.title || 'Untitled Note'

    // Load style example
    const styleExample = loadStyleExample(targetStyle)
    const styleDescription = STYLE_DESCRIPTIONS[targetStyle]
    const styleCSS = getStyleCSS(targetStyle as 'editorial-chic' | 'vibrant-textbook')

    // Build system prompt
    const systemPrompt = `You are an expert at formatting educational notes into beautifully styled HTML documents.

## Your Task
Convert the provided note content into the "${targetStyle}" style format.

## Target Style: ${targetStyle}
${styleDescription}

## Required HTML Structure
Your output MUST follow this exact structure:
1. Complete HTML document with <!DOCTYPE html>
2. <head> with <meta charset>, <title>, and <style> tag
3. <body> with <article class="note-body">
4. Header with course info and date
5. <h1> for the main title
6. <h2> for section headings
7. <h3> for sub-sections if needed
8. Properly nested lists, tables, and other content

## CSS to Include
\`\`\`css
${styleCSS}
\`\`\`

${targetStyle === 'vibrant-textbook' ? `
## CRITICAL: You MUST use the special box classes
Add these boxes strategically throughout the content:
- <div class="clinical-box"><h4>Clinical Point</h4><p>...</p></div>
- <div class="nursing-box"><h4>Nursing Focus</h4><p>...</p></div>
- <div class="education-box"><h4>Patient Education</h4><p>...</p></div>
- <div class="key-point-box"><h4>Key Point</h4><p>...</p></div>
- <div class="medication-box"><h4>Medication</h4><p>...</p></div>

Include AT LEAST 3-5 of these boxes in appropriate places.
` : ''}

## Example of Target Style
Here is an example of how the final HTML should look:

${styleExample ? `\`\`\`html
${styleExample.slice(0, 3000)}...
\`\`\`` : '(Example not available - follow the structure described above)'}

## Important Guidelines
1. Preserve ALL the original content - don't remove any information
2. Improve formatting and organization where appropriate
3. Use proper semantic HTML
4. Ensure all tags are properly closed
5. Do NOT include any markdown - output pure HTML only
6. The output should be a complete, valid HTML document`

    // Build user prompt with the content to convert
    const userPrompt = `Convert the following note to the "${targetStyle}" style.

Title: ${noteTitle}
Course: ${course || 'General'}
Date: ${dayjs().format('MMMM D, YYYY')}

## Original Content to Convert:
${extracted.rawText.slice(0, 8000)}

${extracted.sections.length > 0 ? `
## Sections Found:
${extracted.sections.map(s => `- ${s.heading}`).join('\n')}
` : ''}

Generate the complete styled HTML document now. Output ONLY the HTML, nothing else.`

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 8000
    })

    let styledHtml = completion.choices[0]?.message?.content || ''

    if (!styledHtml.trim()) {
      return NextResponse.json(
        { error: 'Failed to convert note - empty response from AI' },
        { status: 500 }
      )
    }

    // Clean up the response - extract HTML if wrapped in code blocks
    if (styledHtml.includes('```html')) {
      const match = styledHtml.match(/```html\s*([\s\S]*?)\s*```/)
      if (match) {
        styledHtml = match[1]
      }
    } else if (styledHtml.includes('```')) {
      const match = styledHtml.match(/```\s*([\s\S]*?)\s*```/)
      if (match) {
        styledHtml = match[1]
      }
    }

    // Validate the output
    const validation = validateStyledNote(styledHtml, targetStyle as 'editorial-chic' | 'vibrant-textbook')

    if (!validation.valid) {
      console.warn('Styled note validation failed:', validation.errors)

      // Try to fix common issues
      if (!styledHtml.includes('<!DOCTYPE html>')) {
        // Wrap in document structure if missing
        const css = getStyleCSS(targetStyle as 'editorial-chic' | 'vibrant-textbook')
        styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(noteTitle)} — Studiora Notes</title>
  <style>${css}</style>
</head>
<body>
  <article class="note-body">
    <header style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid currentColor; opacity: 0.6;">
      <small>${escapeHtml(course || '')} • ${dayjs().format('MMMM D, YYYY')}</small>
    </header>
    ${styledHtml}
  </article>
</body>
</html>`
      }

      // Re-validate after fix attempt
      const revalidation = validateStyledNote(styledHtml, targetStyle as 'editorial-chic' | 'vibrant-textbook')
      if (!revalidation.valid) {
        return NextResponse.json({
          success: false,
          error: 'Generated HTML failed validation',
          validationErrors: revalidation.errors,
          validationWarnings: revalidation.warnings,
          html: styledHtml // Return anyway for debugging
        }, { status: 422 })
      }
    }

    // Success response
    return NextResponse.json({
      success: true,
      noteId,
      originalTitle: noteTitle,
      targetStyle,
      html: styledHtml,
      validation: {
        passed: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings
      },
      convertedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Style conversion error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your account.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to convert note style', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
