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
  'editorial-chic': `Editorial Chic is a sophisticated, magazine-style academic format with EXTENSIVE rich formatting.

## CSS VARIABLES (already included in styles)
--accent: #c41e3a (red accent)
--secondary: #1e3a8a (blue)
--black: #0a0a0a
--charcoal: #2a2a2a
--gray: #6a6a6a
--white: #fafafa
--line: #e5e5e5

## REQUIRED DOCUMENT STRUCTURE

### 1. COVER PAGE (Required - creates visual impact)
<div class="cover">
  <div class="label">CATEGORY / SUBJECT AREA</div>
  <h1 class="cover-title">Main Title Here</h1>
  <p class="subtitle">Comprehensive Study Notes & Clinical Guidelines</p>

  <div class="cover-stats">
    <div class="stat">
      <span class="stat-number">4</span>
      <span class="stat-label">Key Concepts</span>
    </div>
    <div class="stat">
      <span class="stat-number">12</span>
      <span class="stat-label">Learning Objectives</span>
    </div>
    <div class="stat">
      <span class="stat-number">5</span>
      <span class="stat-label">Case Studies</span>
    </div>
  </div>
</div>

### 2. CONTENT BOXES (Use liberally - minimum 8-12 throughout document)

<div class="definition-box">
  <div class="label">KEY CONCEPT</div>
  <h3>Term or Concept Name</h3>
  <p>Detailed definition and explanation. Include <strong>bold terms</strong> for emphasis.</p>
</div>

<div class="callout-box">
  <div class="label">CRITICAL INFORMATION</div>
  <p><strong>Must-know content</strong> that is essential for understanding or exams.</p>
</div>

<div class="remember-box">
  Key takeaway or memory aid. This box auto-prepends "REMEMBER" label.
</div>

<div class="warning-box">
  Critical alert, common mistake, or danger. Auto-prepends "CRITICAL" label.
  <ul>
    <li><strong>Never:</strong> Common dangerous error</li>
    <li><strong>Always:</strong> Required safety action</li>
  </ul>
</div>

### 3. TOPIC CARDS GRID (For organizing related concepts)
<div class="topic-grid">
  <div class="topic-card">
    <h4>Topic 1</h4>
    <p>Description and key points about this topic.</p>
  </div>
  <div class="topic-card">
    <h4>Topic 2</h4>
    <p>Description and key points about this topic.</p>
  </div>
  <div class="topic-card">
    <h4>Topic 3</h4>
    <p>Description and key points about this topic.</p>
  </div>
  <div class="topic-card">
    <h4>Topic 4</h4>
    <p>Description and key points about this topic.</p>
  </div>
</div>

### 4. TWO-COLUMN LAYOUT (For side-by-side content)
<div class="two-column">
  <div>
    <h3>Left Column Topic</h3>
    <p>Content for left side...</p>
  </div>
  <div>
    <h3>Right Column Topic</h3>
    <p>Content for right side...</p>
  </div>
</div>

### 5. COMPARISON COLUMNS (For comparing two things)
<div class="comparison">
  <div class="comparison-column">
    <h3>Option A / Condition 1</h3>
    <h4>Subheading</h4>
    <ul>
      <li>Feature or characteristic</li>
      <li>Another point</li>
    </ul>
  </div>
  <div class="comparison-column">
    <h3>Option B / Condition 2</h3>
    <h4>Subheading</h4>
    <ul>
      <li>Feature or characteristic</li>
      <li>Another point</li>
    </ul>
  </div>
</div>

### 6. TABLES (For data, comparisons, medications)
<table>
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
      <th>Column 3</th>
      <th>Column 4</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Row Header</strong></td>
      <td>Data point</td>
      <td>Data point</td>
      <td>Data point</td>
    </tr>
  </tbody>
</table>

### 7. LAB VALUES GRID (For laboratory/clinical values)
<div class="lab-grid">
  <div class="lab-value critical">
    <div class="lab-name">TEST NAME</div>
    <div class="lab-result">Critical: <7.0</div>
    <div class="lab-normal">Normal: 9.0-10.5 mg/dL</div>
  </div>
  <div class="lab-value">
    <div class="lab-name">TEST NAME</div>
    <div class="lab-result">Key Value</div>
    <div class="lab-normal">Normal: X-Y units</div>
  </div>
</div>

### 8. NUMBERED STEPS (For procedures with large decorative numbers)
<ol class="numbered-steps">
  <li>
    <strong>Step Title</strong><br>
    Detailed explanation of what to do in this step. Include rationale and important considerations.
  </li>
  <li>
    <strong>Step Title</strong><br>
    Next step details...
  </li>
</ol>

### 9. CASE STUDIES (Include 1-2 per document)
<div class="case-study">
  <div class="case-study-header">
    <div>
      <div class="label">CASE STUDY 1</div>
      <h3>Case Title / Patient Scenario</h3>
    </div>
    <div>
      <span class="label">CRITICAL THINKING</span>
    </div>
  </div>

  <p><strong>Patient:</strong> Name, age, presenting situation.</p>
  <p><strong>Chief Complaint:</strong> "Patient's own words about symptoms"</p>

  <div class="vitals-grid">
    <div class="vital">
      <div class="vital-label">BP</div>
      <div class="vital-value">120/80</div>
    </div>
    <div class="vital">
      <div class="vital-label">HR</div>
      <div class="vital-value">72</div>
    </div>
    <div class="vital abnormal">
      <div class="vital-label">ABNORMAL VALUE</div>
      <div class="vital-value">Critical</div>
    </div>
  </div>

  <h4>Assessment Findings:</h4>
  <ul>
    <li>Finding 1</li>
    <li>Finding 2</li>
  </ul>

  <h4>Critical Thinking Questions:</h4>
  <ol>
    <li>Question about priority intervention?</li>
    <li>Question about expected findings?</li>
  </ol>

  <div class="warning-box">
    <strong>Answer Key Points:</strong>
    <ul>
      <li>Answer to question 1</li>
      <li>Answer to question 2</li>
    </ul>
  </div>
</div>

### 10. MNEMONICS (For memory aids)
<div class="mnemonic">
  <div class="mnemonic-title">"MNEMONIC PHRASE"</div>
  <div class="mnemonic-breakdown">
    <strong>M</strong> - First word meaning<br>
    <strong>N</strong> - Second word meaning<br>
    <strong>E</strong> - Third word meaning<br>
  </div>
</div>

### 11. PRACTICE QUESTIONS (Include 3-5 NCLEX-style)
<div class="question-box">
  <div class="question-number">Question 1</div>
  <p>The nurse is caring for a patient who... Which action should the nurse take first?</p>
  <ul class="answer-choices">
    <li>A. First option</li>
    <li class="correct">B. Correct answer (mark with class="correct")</li>
    <li>C. Third option</li>
    <li>D. Fourth option</li>
  </ul>
  <div class="rationale">
    <strong>Rationale:</strong> Explanation of why B is correct and why other options are incorrect.
  </div>
</div>

## FORMATTING REQUIREMENTS:
1. ALWAYS start with a cover page with statistics
2. Use definition-box for EVERY key term/concept
3. Include at least ONE comparison section
4. Include at least ONE table with clinical data
5. Include at least ONE case study with vitals grid
6. Include at least ONE mnemonic if applicable
7. Include 3-5 practice questions with rationales
8. Use warning-box for all critical/safety information
9. End with a "Key Takeaways" section using callout-box
10. Use topic-grid for organizing multiple related concepts`,

  'vibrant-textbook': `Vibrant Textbook is a comprehensive color-coded academic study format with EXTENSIVE rich formatting.

## CSS VARIABLES (already included in styles)
--primary-dark: #2c3e50
--primary-medium: #34495e
--accent-blue: #3498db
--success-green: #27ae60
--warning-yellow: #f39c12
--danger-red: #e74c3c
Color-coded backgrounds for sections

## REQUIRED DOCUMENT STRUCTURE

### 1. HEADER (Required - dark gradient with WHITE text)
<div class="header-template">
  <h1 style="color: white; margin-bottom: 0.5rem;">Main Title Here</h1>
  <p style="color: rgba(255,255,255,0.9);">Comprehensive Study Notes & Clinical Guidelines</p>
</div>

### 2. TOPIC BLOCKS (Wrap each major section)
<div class="topic-block-template">
  <div class="topic-header-template">Major Topic Name</div>
  <div class="topic-content-template">
    <!-- Color-coded sections go inside here -->
  </div>
</div>

### 3. COLOR-CODED SECTIONS (Use ALL relevant ones - minimum 5-6 per topic)

<div class="section-theory">
  <div class="section-title">Background / Theory / Definitions</div>
  <p>Foundational concepts, pathophysiology, underlying principles.</p>
  <ul>
    <li>Key theoretical point</li>
    <li>Important definition</li>
  </ul>
</div>

<div class="section-details">
  <div class="section-title">Key Details / Clinical Findings</div>
  <ul>
    <li><strong>Sign/Symptom:</strong> Description</li>
    <li><strong>Finding:</strong> What to look for</li>
  </ul>
</div>

<div class="section-analysis">
  <div class="section-title">Analysis / Assessment / Diagnosis</div>
  <p>How to evaluate, interpret data, diagnostic criteria.</p>
  <ul>
    <li>Assessment technique</li>
    <li>Diagnostic criteria</li>
  </ul>
</div>

<div class="section-methods">
  <div class="section-title">Methods / Interventions / Treatment</div>
  <ol>
    <li><strong>First intervention:</strong> Details</li>
    <li><strong>Second intervention:</strong> Details</li>
    <li><strong>Third intervention:</strong> Details</li>
  </ol>
</div>

<div class="section-critical">
  <div class="section-title">⚠️ Critical Points / Warnings / Common Errors</div>
  <ul>
    <li><strong>NEVER:</strong> Dangerous action to avoid</li>
    <li><strong>ALWAYS:</strong> Required safety action</li>
    <li><strong>Watch for:</strong> Warning sign</li>
  </ul>
</div>

<div class="section-procedures">
  <div class="section-title">Procedures / Step-by-Step Actions</div>
  <ol>
    <li>First step with details</li>
    <li>Second step with details</li>
    <li>Third step with details</li>
  </ol>
</div>

<div class="section-summary">
  <div class="section-title">Summary / Key Takeaways</div>
  <ul>
    <li>Main point 1</li>
    <li>Main point 2</li>
    <li>Main point 3</li>
  </ul>
</div>

### 4. PRIORITY BOX (For must-know/exam content)
<div class="priority-box-template">
  <h4>⭐ High-Yield / Must-Know Information</h4>
  <ul>
    <li><strong>Critical fact 1:</strong> Details</li>
    <li><strong>Critical fact 2:</strong> Details</li>
  </ul>
</div>

### 5. CATEGORY GRID (For organizing types/categories)
<div class="category-grid">
  <div class="category-card-template">
    <h4>Category 1</h4>
    <p>Description of this category</p>
    <ul><li>Key point</li></ul>
  </div>
  <div class="category-card-template">
    <h4>Category 2</h4>
    <p>Description of this category</p>
    <ul><li>Key point</li></ul>
  </div>
  <div class="category-card-template">
    <h4>Category 3</h4>
    <p>Description of this category</p>
    <ul><li>Key point</li></ul>
  </div>
</div>

### 6. TABLES (Use table-template class)
<table class="table-template">
  <thead>
    <tr>
      <th>Category</th>
      <th>Details</th>
      <th>Values</th>
      <th>Nursing Considerations</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Item</strong></td>
      <td>Description</td>
      <td>Value/Range</td>
      <td>Action items</td>
    </tr>
  </tbody>
</table>

### 7. QUICK REFERENCE (For fast-lookup info)
<div class="quick-reference-template">
  <h3>Quick Reference</h3>
  <ul>
    <li><strong>Normal range:</strong> X-Y units</li>
    <li><strong>Critical value:</strong> >Z or <W</li>
    <li><strong>Key formula:</strong> A = B × C</li>
  </ul>
</div>

### 8. COMPARISON TABLE (For comparing conditions)
<table class="table-template">
  <thead>
    <tr>
      <th>Feature</th>
      <th>Condition A</th>
      <th>Condition B</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Pathophysiology</strong></td>
      <td>Description A</td>
      <td>Description B</td>
    </tr>
    <tr>
      <td><strong>Signs/Symptoms</strong></td>
      <td>• Finding 1<br>• Finding 2</td>
      <td>• Finding 1<br>• Finding 2</td>
    </tr>
    <tr>
      <td><strong>Treatment</strong></td>
      <td>Interventions A</td>
      <td>Interventions B</td>
    </tr>
  </tbody>
</table>

### 9. CASE STUDY FORMAT
<div class="topic-block-template">
  <div class="topic-header-template">📋 Case Study: Patient Scenario</div>
  <div class="topic-content-template">
    <div class="section-theory">
      <div class="section-title">Patient Presentation</div>
      <p><strong>Patient:</strong> Name, age, situation</p>
      <p><strong>Chief Complaint:</strong> "Patient's words"</p>
    </div>

    <div class="section-details">
      <div class="section-title">Assessment Data</div>
      <ul>
        <li><strong>Vital Signs:</strong> BP, HR, RR, Temp, SpO2</li>
        <li><strong>Lab Values:</strong> Relevant results</li>
        <li><strong>Physical Findings:</strong> Key observations</li>
      </ul>
    </div>

    <div class="section-analysis">
      <div class="section-title">Critical Thinking Questions</div>
      <ol>
        <li>What is the priority nursing intervention?</li>
        <li>What findings support your assessment?</li>
      </ol>
    </div>

    <div class="section-critical">
      <div class="section-title">Answer Key</div>
      <ul>
        <li><strong>Priority:</strong> Answer explanation</li>
        <li><strong>Rationale:</strong> Why this is correct</li>
      </ul>
    </div>
  </div>
</div>

### 10. PRACTICE QUESTIONS
<div class="priority-box-template">
  <h4>📝 Practice Question</h4>
  <p><strong>Question:</strong> A nurse is caring for a patient who... Which action is most appropriate?</p>
  <ol type="A">
    <li>First option</li>
    <li>Second option</li>
    <li>Third option (correct)</li>
    <li>Fourth option</li>
  </ol>
  <p><strong>Answer: C</strong></p>
  <p><strong>Rationale:</strong> Explanation of correct answer and why others are incorrect.</p>
</div>

## FORMATTING REQUIREMENTS:
1. ALWAYS start with header-template (white text!)
2. Wrap EVERY major topic in topic-block-template
3. Use AT LEAST 5-6 different colored sections per topic
4. Include section-critical for ALL safety/warning content
5. Include at least ONE comparison table
6. Include at least ONE case study
7. Include 2-3 practice questions with rationales
8. Use priority-box-template for high-yield content
9. Use category-grid when listing 3+ related items
10. End each topic with section-summary`
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

    // Call OpenAI with maximum tokens for comprehensive output
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 16000 // Maximum for rich, comprehensive output
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
