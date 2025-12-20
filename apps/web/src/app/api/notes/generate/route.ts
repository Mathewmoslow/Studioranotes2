import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'
import { marked } from 'marked'
import dayjs from 'dayjs'

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// Helper functions
function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Section definitions for note generation
const SECTION_DESCRIPTIONS: { [key: string]: string } = {
  overview: '## Overview\nProvide a brief introduction and context for the topic',
  keyTakeaways: '## Key Takeaways\nHighlight the most important points to remember',
  mainConcepts: '## Main Concepts\nExplore the core ideas, theories, and frameworks',
  pathophysiology: `## Pathophysiology
For EACH disease/condition, provide detailed pathophysiology:
- Core disease mechanism
- Cells/tissues affected
- Biochemical mediators
- Compensatory responses
- Long-term effects`,
  clinicalManifestations: '## Clinical Manifestations\nDescribe signs, symptoms, and assessment findings',
  diagnostics: '## Diagnostic Studies\nReview relevant tests, labs, and imaging with normal/abnormal values',
  nursingInterventions: '## Nursing Interventions\nDetail nursing care priorities and management strategies',
  medications: '## Medications & Pharmacology\nCover drugs, mechanisms, dosing, and nursing considerations',
  clinicalApplications: '## Clinical Applications\nConnect theory to practice with examples',
  complications: '## Complications & Risk Factors\nIdentify potential problems and at-risk populations',
  patientEducation: '## Patient Education\nOutline teaching points and discharge planning',
  keyTerms: '## Key Terms & Definitions\nDefine important vocabulary',
  mnemonics: '## Memory Aids & Mnemonics\nProvide memory devices and learning tricks',
  conceptMap: `## Concept Maps
Create concept maps as JSON code blocks with this structure:
\`\`\`json
{
  "central": "Main concept name",
  "pathophysiology": ["Key mechanism 1", "Key mechanism 2"],
  "riskFactors": ["Risk 1", "Risk 2"],
  "causes": ["Cause 1", "Cause 2"],
  "signsSymptoms": ["Symptom 1", "Symptom 2"],
  "diagnostics": ["Test 1: normal → abnormal", "Test 2"],
  "complications": ["Complication 1", "Complication 2"],
  "nursingInterventions": ["Intervention 1", "Intervention 2"],
  "medications": ["Medication 1", "Medication 2"],
  "treatments": ["Treatment 1", "Treatment 2"],
  "patientEducation": ["Teaching 1", "Teaching 2"]
}
\`\`\``,
  checkYourself: '## Check Yourself\nInclude self-assessment questions',
  practiceQuestions: '## Practice Questions\nGenerate 5-8 practice questions with answers and rationales',
  caseStudy: '## Case Study\nCreate a clinical scenario with patient data and discussion questions',
  clinicalPearls: '## Clinical Pearls\nShare high-yield tips and insights',
  redFlags: '## Red Flags\nHighlight critical warning signs',
  culturalConsiderations: '## Cultural Considerations\nAddress diverse patient populations',
  ethicalLegal: '## Ethical & Legal Considerations\nDiscuss relevant ethical and legal aspects'
}

// Default sections for each style
const DEFAULT_SECTIONS_BY_STYLE: { [key: string]: string[] } = {
  'editorial-chic': ['overview', 'keyTakeaways', 'mainConcepts', 'practiceQuestions'],
  'vibrant-textbook': ['overview', 'mainConcepts', 'pathophysiology', 'clinicalManifestations', 'nursingInterventions', 'practiceQuestions'],
  'simple-editable': ['overview', 'keyTakeaways', 'mainConcepts']
}

// Style-specific CSS
const STYLE_CSS: { [key: string]: string } = {
  'editorial-chic': `
    :root { --accent: #111; --bg: #f7f4ef; }
    body { font-family: 'Playfair Display', Georgia, serif; background: var(--bg); color: #222; line-height: 1.7; }
    .note-body { max-width: 800px; margin: 0 auto; padding: 2rem; }
    .note-body h1 { font-size: 2.5rem; border-bottom: 3px solid var(--accent); padding-bottom: 0.5rem; }
    .note-body h2 { font-size: 1.8rem; color: var(--accent); margin-top: 2rem; }
    .note-body h3 { font-size: 1.3rem; font-style: italic; }
    .note-body blockquote { border-left: 4px solid var(--accent); padding-left: 1rem; font-style: italic; }
    .note-body code { background: #111; color: #f7f4ef; padding: 2px 6px; border-radius: 3px; }
    .note-body ul, .note-body ol { margin-left: 1.5rem; }
    .note-body table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    .note-body th, .note-body td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
    .note-body th { background: var(--accent); color: white; }
  `,
  'vibrant-textbook': `
    :root { --primary: #10b981; --secondary: #6366f1; --bg: #0f172a; --text: #e2e8f0; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
    .note-body { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .note-body h1 { font-size: 2.2rem; background: linear-gradient(90deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .note-body h2 { font-size: 1.6rem; color: #a5b4fc; border-bottom: 2px solid #334155; padding-bottom: 0.5rem; }
    .note-body h3 { font-size: 1.2rem; color: #67e8f9; }
    .note-body code { background: #1e293b; color: #f472b6; padding: 2px 8px; border-radius: 4px; }
    .note-body pre { background: #1e293b; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    .note-body blockquote { border-left: 4px solid var(--primary); padding-left: 1rem; background: rgba(16,185,129,0.1); }
    .note-body table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    .note-body th { background: linear-gradient(90deg, var(--primary), var(--secondary)); color: white; padding: 0.75rem; }
    .note-body td { border: 1px solid #334155; padding: 0.75rem; }
    .clinical-box { background: rgba(239,68,68,0.15); border: 1px solid #ef4444; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    .nursing-box { background: rgba(59,130,246,0.15); border: 1px solid #3b82f6; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    .education-box { background: rgba(245,158,11,0.15); border: 1px solid #f59e0b; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    .key-point-box { background: rgba(168,85,247,0.15); border-left: 4px solid #a855f7; padding: 1rem; margin: 1rem 0; }
    .medication-box { background: rgba(20,184,166,0.15); border: 1px solid #14b8a6; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
  `,
  'simple-editable': `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .note-body { max-width: 800px; margin: 0 auto; padding: 1.5rem; }
    .note-body h1 { font-size: 1.8rem; color: #1a1a1a; border-bottom: 2px solid #e5e5e5; padding-bottom: 0.5rem; }
    .note-body h2 { font-size: 1.4rem; color: #333; margin-top: 1.5rem; }
    .note-body h3 { font-size: 1.1rem; color: #555; }
    .note-body ul, .note-body ol { margin-left: 1.5rem; }
    .note-body code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    .note-body blockquote { border-left: 3px solid #ddd; padding-left: 1rem; color: #666; }
  `
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      course,
      courseName,
      module,
      source,
      sections,
      noteStyle = 'editorial-chic',
      // Legacy support
      topic,
      context,
      sourceText,
      style
    } = body

    // Use title or topic
    const noteTitle = title || topic || 'Untitled Note'
    // Use source or sourceText
    const sourceContent = source || sourceText || ''
    // Use noteStyle or style
    const selectedStyle = noteStyle || style || 'editorial-chic'

    if (!openai) {
      // Return mock response if OpenAI not configured
      return NextResponse.json({
        success: true,
        html: `<div class="note-body"><h1>${escapeHtml(noteTitle)}</h1><p>OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.</p></div>`,
        markdown: `# ${noteTitle}\n\nOpenAI API key not configured.`,
        content: `<div class="note-body"><h1>${escapeHtml(noteTitle)}</h1><p>OpenAI API key not configured.</p></div>`
      })
    }

    // Build sections list
    const selectedSections = sections || DEFAULT_SECTIONS_BY_STYLE[selectedStyle] || DEFAULT_SECTIONS_BY_STYLE['editorial-chic']
    const includedSections = selectedSections
      .map((key: string) => SECTION_DESCRIPTIONS[key])
      .filter(Boolean)
      .join('\n\n')

    // Build style-specific prompt additions
    const stylePrompts: { [key: string]: string } = {
      'editorial-chic': 'Create elegant, magazine-style notes with serif typography feel. Focus on clarity and visual hierarchy. Use sophisticated language.',
      'vibrant-textbook': `Create comprehensive medical study notes with visual organization. Use these HTML boxes strategically:
- <div class="clinical-box"><h4>🏥 Clinical Point</h4><p>...</p></div>
- <div class="nursing-box"><h4>👩‍⚕️ Nursing Focus</h4><p>...</p></div>
- <div class="education-box"><h4>📚 Patient Education</h4><p>...</p></div>
- <div class="key-point-box"><h4>💡 Key Point</h4><p>...</p></div>
- <div class="medication-box"><h4>💊 Medication</h4><p>...</p></div>`,
      'simple-editable': 'Create clean, simple notes that are easy to edit. Use basic markdown formatting. Keep it minimal and functional.'
    }

    // System prompt
    const systemPrompt = `You are an expert note generator for students.

## Style: ${selectedStyle}
${stylePrompts[selectedStyle] || stylePrompts['editorial-chic']}

## Sections to Include:
${includedSections}

## Guidelines:
- Use markdown format (headings, lists, bold, code blocks)
- Be specific and detailed - no generic statements
- Include examples and applications
- For concept maps, output as JSON code blocks
- Focus on helping students understand and retain information

## Context
Date: ${dayjs().format('MMMM D, YYYY')}
Course: ${course || courseName || 'General'}
${module ? `Module: ${module}` : ''}`

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: sourceContent
            ? `Generate study notes on "${noteTitle}" based on this source material:\n\n${sourceContent}`
            : `Generate comprehensive study notes on the topic: "${noteTitle}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    })

    const markdownContent = completion.choices[0]?.message?.content || ''

    if (!markdownContent.trim()) {
      return NextResponse.json(
        { error: 'Failed to generate notes - empty response' },
        { status: 500 }
      )
    }

    // Convert markdown to HTML
    const htmlBody = await marked.parse(markdownContent)

    // Get CSS for style
    const css = STYLE_CSS[selectedStyle] || STYLE_CSS['simple-editable']

    // Create full HTML document
    const slug = `${dayjs().format('YYYY-MM-DD')}-${slugify(noteTitle)}`
    const dateStr = dayjs().format('MMMM D, YYYY')

    const fullHtml = `<!DOCTYPE html>
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
      <small>${escapeHtml(course || courseName || '')} • ${escapeHtml(dateStr)}</small>
    </header>
    <h1>${escapeHtml(noteTitle)}</h1>
    ${htmlBody}
  </article>
</body>
</html>`

    // Return response
    return NextResponse.json({
      success: true,
      slug,
      title: noteTitle,
      course: course || courseName,
      date: dayjs().format('YYYY-MM-DD'),
      markdown: markdownContent,
      html: fullHtml,
      content: fullHtml, // Legacy compatibility
      noteStyle: selectedStyle,
      editable: selectedStyle === 'simple-editable',
      originalInput: {
        title: noteTitle,
        course: course || courseName,
        module: module || '',
        source: sourceContent,
        sections: selectedSections,
        noteStyle: selectedStyle,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Note generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return NextResponse.json(
        { error: 'OpenAI API quota exceeded. Please check your account.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate notes', details: errorMessage },
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
