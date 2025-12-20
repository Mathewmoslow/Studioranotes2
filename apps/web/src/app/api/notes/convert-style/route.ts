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

// Style descriptions for the AI - comprehensive formatting instructions
const STYLE_DESCRIPTIONS: { [key: string]: string } = {
  'editorial-chic': `Editorial Chic is a sophisticated, magazine-style academic format. Create RICHLY FORMATTED content using ALL these components:

## DESIGN PRINCIPLES
- Serif typography (Libre Baskerville headers, Work Sans body)
- Clean white background, NO rounded corners - sharp, crisp edges only
- Color palette: Blue (#1e3a8a), Brown (#7c2d12), Teal (#134e4a), Red (#991b1b), Black (#0a0a0a)

## REQUIRED STRUCTURE
1. Start with <div class="container"> wrapper
2. Use <span class="label">SECTION NAME</span> before each major section (uppercase labels)
3. Use <h2> for major sections, <h3> for subsections, <h4> for details

## CONTENT BOXES - Use liberally throughout (at least 5-8 boxes total):

<div class="definition-box">
  <span class="label">KEY CONCEPT</span>
  <p><strong>Term:</strong> Definition here</p>
</div>

<div class="info-box">
  <span class="label">ADDITIONAL CONTEXT</span>
  <p>Supporting information, examples, or related details</p>
</div>

<div class="callout-box">
  <span class="label">CRITICAL INFORMATION</span>
  <p><strong>Must-know content</strong> that is essential for understanding</p>
</div>

<div class="remember-box">
  <p><strong>Remember:</strong> Key takeaway or memory aid here</p>
</div>

<div class="warning-box">
  <span class="label">COMMON MISTAKE</span>
  <p><strong>Avoid:</strong> Common error or misconception to watch out for</p>
</div>

## LAYOUT COMPONENTS - Use for visual variety:

<div class="grid-2">
  <div class="card"><div class="card-title">Category 1</div><p>Content</p></div>
  <div class="card"><div class="card-title">Category 2</div><p>Content</p></div>
</div>

<div class="grid-3">
  <div class="card"><div class="card-title">Item 1</div><ul><li>Point</li></ul></div>
  <div class="card"><div class="card-title">Item 2</div><ul><li>Point</li></ul></div>
  <div class="card"><div class="card-title">Item 3</div><ul><li>Point</li></ul></div>
</div>

<div class="comparison">
  <div class="comparison-column"><h3>Option A</h3><ul><li>Feature 1</li></ul></div>
  <div class="comparison-column"><h3>Option B</h3><ul><li>Feature 1</li></ul></div>
</div>

## TABLES - Use for data comparison:
<table>
  <thead><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr></thead>
  <tbody><tr><td>Data</td><td>Data</td><td>Data</td></tr></tbody>
</table>

## FORMATTING RULES:
- Every major concept should have a definition-box
- Use warning-box for common mistakes/pitfalls
- Use remember-box for key takeaways at end of sections
- Use comparison layouts when comparing two things
- Use grid-3 for listing categories or types
- Include at least one table if data/values are involved`,

  'vibrant-textbook': `Vibrant Textbook is a comprehensive color-coded academic study format. Create RICHLY FORMATTED content using ALL these components:

## DESIGN PRINCIPLES
- Typography: EB Garamond serif body, Source Sans Pro for technical content
- Light gray background (#f5f6fa) with white content containers
- Blue accents (#3498db), rounded corners (8px)
- Color-coded sections for different content types

## REQUIRED STRUCTURE
1. Start with <div class="container">
2. Add header: <div class="header-template"><h1 style="color: white;">Title</h1><p style="color: rgba(255,255,255,0.9);">Subtitle</p></div>
3. Wrap major topics in topic-block-template

## TOPIC BLOCKS - Use for each major topic:
<div class="topic-block-template">
  <div class="topic-header-template">Topic Name Here</div>
  <div class="topic-content-template">
    <!-- Color-coded sections go inside -->
  </div>
</div>

## COLOR-CODED SECTIONS - Use ALL relevant ones (minimum 4-5 per topic):

<div class="section-theory">
  <div class="section-title">Background / Theory</div>
  <p>Foundational concepts, definitions, underlying principles</p>
</div>

<div class="section-details">
  <div class="section-title">Key Details</div>
  <ul><li>Specific facts</li><li>Important values</li><li>Observable characteristics</li></ul>
</div>

<div class="section-analysis">
  <div class="section-title">Analysis / Assessment</div>
  <p>How to evaluate, interpret data, diagnostic criteria</p>
</div>

<div class="section-methods">
  <div class="section-title">Methods / Approaches</div>
  <ol><li>Step one</li><li>Step two</li><li>Step three</li></ol>
</div>

<div class="section-critical">
  <div class="section-title">⚠️ Critical Points / Common Errors</div>
  <ul><li><strong>Watch out:</strong> Common mistake</li><li><strong>Never:</strong> Dangerous error</li></ul>
</div>

<div class="section-procedures">
  <div class="section-title">Procedures / Steps</div>
  <ol><li>First action</li><li>Second action</li><li>Third action</li></ol>
</div>

<div class="section-summary">
  <div class="section-title">Summary / Key Takeaways</div>
  <ul><li>Main point 1</li><li>Main point 2</li><li>Main point 3</li></ul>
</div>

## SPECIAL COMPONENTS:

<div class="priority-box-template">
  <h4>⭐ High-Yield Information</h4>
  <p>Must-memorize content, exam-critical material</p>
</div>

<div class="category-grid">
  <div class="category-card-template"><h4>Type 1</h4><p>Description</p></div>
  <div class="category-card-template"><h4>Type 2</h4><p>Description</p></div>
  <div class="category-card-template"><h4>Type 3</h4><p>Description</p></div>
</div>

<div class="quick-reference-template">
  <h3>Quick Reference</h3>
  <p>Fast-lookup information, formulas, key values</p>
</div>

## TABLES - Use table-template class:
<table class="table-template">
  <thead><tr><th>Parameter</th><th>Normal Range</th><th>Significance</th></tr></thead>
  <tbody><tr><td>Value</td><td>Range</td><td>Meaning</td></tr></tbody>
</table>

## FORMATTING RULES:
- ALWAYS start with header-template (white text on dark gradient)
- Wrap each major topic in topic-block-template
- Use AT LEAST 4-5 different colored sections per topic
- Include priority-box-template for must-know content
- Use category-grid when listing types/categories
- Include tables for any numerical data or comparisons
- End topics with section-summary`
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
    const systemPrompt = `You are an expert at creating beautifully styled, richly formatted HTML study notes.

## Your Task
Transform the provided note content into a RICHLY FORMATTED "${targetStyle}" styled document.
DO NOT just wrap content in basic tags - use ALL the special formatting components described below.

## Target Style: ${targetStyle}
${styleDescription}

## Required HTML Structure
Your output MUST:
1. Be a complete HTML document with <!DOCTYPE html>
2. Include <head> with <meta charset>, <title>, and the CSS in a <style> tag
3. Use the specialized box/section components EXTENSIVELY (not just plain text)
4. Have proper heading hierarchy (h1 > h2 > h3 > h4)

## CSS to Include in <style> tag:
${styleCSS}

## CRITICAL FORMATTING REQUIREMENTS:
${targetStyle === 'editorial-chic' ? `
- Use definition-box for EVERY key term or concept definition
- Use callout-box for critical/must-know information
- Use warning-box for common mistakes or pitfalls
- Use info-box for supplementary context
- Use remember-box at the end of each section for takeaways
- Use grid-2 or grid-3 layouts to organize related items
- Use comparison layouts when comparing options
- Include at least ONE table if there are any values/data
- Minimum: 5-8 styled boxes throughout the document
` : `
- START with header-template containing h1 (white text!) and subtitle
- Wrap EACH major topic in topic-block-template
- Inside each topic, use AT LEAST 4-5 different colored section types
- Use section-theory for background/definitions
- Use section-details for specific facts and values
- Use section-analysis for evaluation/interpretation
- Use section-methods for procedures/approaches
- Use section-critical for warnings and common errors
- Use section-summary at end of each topic
- Use priority-box-template for high-yield/exam content
- Use category-grid for categorizing items
- Use table-template for any data/values
- The header-template background is dark - h1 MUST have style="color: white;"
`}

## Reference Example (follow this formatting style):
\`\`\`html
${styleExample ? styleExample.slice(0, 6000) : '(See component examples above)'}
\`\`\`

## Output Rules:
1. PRESERVE all original content - don't remove information
2. ENHANCE with rich formatting - don't just use plain paragraphs
3. Use MULTIPLE different box/section types throughout
4. Output pure HTML only - no markdown
5. Ensure all tags are properly closed`

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

    // Call OpenAI with increased tokens for rich formatting
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4, // Slightly higher for more creative formatting
      max_tokens: 12000 // Increased for richer output
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

    // Always ensure we have a complete HTML document
    const css = getStyleCSS(targetStyle as 'editorial-chic' | 'vibrant-textbook')

    // Check if AI returned a full document or just content
    if (!styledHtml.includes('<!DOCTYPE') && !styledHtml.includes('<html')) {
      // Wrap in document structure
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
    <h1>${escapeHtml(noteTitle)}</h1>
    ${styledHtml}
  </article>
</body>
</html>`
    }

    // Validate (now just for warnings, not blocking)
    const validation = validateStyledNote(styledHtml, targetStyle as 'editorial-chic' | 'vibrant-textbook')
    if (validation.warnings.length > 0) {
      console.warn('Style conversion warnings:', validation.warnings)
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
