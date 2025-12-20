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

// Style-specific CSS - from user's style guides
const STYLE_CSS: { [key: string]: string } = {
  'editorial-chic': `
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Work+Sans:wght@300;400;500;600&display=swap');
    :root { --accent: #1e3a8a; --accent-light: #eff6ff; --secondary: #7c2d12; --secondary-light: #fef9f5; --tertiary: #134e4a; --tertiary-light: #f0fdfa; --red: #991b1b; --red-light: #fef2f2; --black: #0a0a0a; --charcoal: #2a2a2a; --gray: #6a6a6a; --white: #fafafa; --line: #e5e5e5; }
    body { font-family: 'Work Sans', sans-serif; line-height: 1.7; color: var(--charcoal); background: #ffffff; }
    .container { max-width: 1100px; margin: 0 auto; }
    h1, h2, h3, h4 { font-family: 'Libre Baskerville', serif; font-weight: 700; line-height: 1.2; color: var(--black); }
    h1 { font-size: 2.5rem; letter-spacing: -0.02em; margin-bottom: 1rem; }
    h2 { font-size: 2rem; margin: 2.5rem 0 1.5rem 0; padding-bottom: 1rem; padding-top: 1.5rem; border-top: 3px solid var(--black); position: relative; }
    h2::after { content: ''; position: absolute; top: -3px; left: 0; width: 80px; height: 3px; background: var(--accent); }
    h3 { font-size: 1.5rem; margin: 2rem 0 1rem 0; color: var(--accent); }
    h4 { font-size: 1.25rem; margin: 1.5rem 0 0.75rem 0; }
    .label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--gray); font-weight: 600; margin-bottom: 0.5rem; display: block; }
    .definition-box { border-left: 4px solid var(--accent); padding: 1.5rem; background: var(--accent-light); margin: 2rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.06); }
    .definition-box .label { margin-bottom: 1rem; color: var(--accent); }
    .info-box { border-left: 4px solid var(--secondary); padding: 1.5rem; background: var(--secondary-light); margin: 2rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.06); }
    .info-box .label { margin-bottom: 1rem; color: var(--secondary); }
    .callout-box { border: 2px solid var(--black); padding: 1.5rem; margin: 2rem 0; background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.06); }
    .callout-box .label { color: var(--black); }
    .remember-box { background: var(--white); border: 1px solid var(--line); border-left: 4px solid var(--tertiary); padding: 1.5rem; margin: 2rem 0; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .warning-box { background: var(--red-light); border-left: 6px solid var(--red); padding: 1.5rem; margin: 2rem 0; box-shadow: 0 2px 8px rgba(153, 27, 27, 0.12); border-top: 1px solid var(--red); border-bottom: 1px solid var(--red); }
    .warning-box .label { color: var(--red); font-weight: 700; }
    ul { margin-left: 1.5rem; margin-bottom: 1rem; }
    li { margin-bottom: 0.5rem; line-height: 1.7; }
    table { width: 100%; border-collapse: collapse; margin: 2rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.06); }
    thead { background-color: var(--black); color: #fff; }
    th { padding: 1rem 1.25rem; text-align: left; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; }
    td { padding: 1rem 1.25rem; border-bottom: 1px solid var(--line); }
    tbody tr:hover { background-color: var(--white); }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin: 2rem 0; }
    .card { padding: 1.5rem; background-color: var(--white); border: 1px solid var(--line); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .card-title { font-family: 'Libre Baskerville', serif; font-size: 1.125rem; font-weight: 700; color: var(--black); margin-bottom: 0.75rem; }
    strong { font-weight: 600; color: var(--black); }
    .comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0; }
    .comparison-column { padding: 1.5rem; background: var(--white); border: 1px solid var(--line); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    @media (max-width: 768px) { .grid-2, .grid-3, .comparison { grid-template-columns: 1fr; } h1 { font-size: 2rem; } h2 { font-size: 1.75rem; } }
  `,
  'vibrant-textbook': `
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600;700&display=swap');
    :root { --primary-dark: #2c3e50; --primary-medium: #34495e; --primary-light: #7f8c8d; --accent-blue: #3498db; --accent-blue-dark: #2874a6; --success-green: #27ae60; --warning-yellow: #f39c12; --danger-red: #e74c3c; --info-blue: #3498db; --bg-theory: #e8f8f5; --bg-details: #fef9e7; --bg-analysis: #ebf5fb; --bg-methods: #fdf2e9; --bg-critical: #fadbd8; --bg-procedures: #eafaf1; --bg-summary: #f4ecf7; --bg-neutral: #f7f7f7; }
    body { font-family: 'EB Garamond', 'Garamond', serif; font-size: 16px; line-height: 1.8; color: #2c3e50; background: #f5f6fa; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
    h1 { font-size: 2.5rem; font-weight: 700; color: var(--primary-dark); margin-bottom: 1rem; }
    h2 { font-size: 2rem; font-weight: 600; color: var(--primary-dark); margin: 40px 0 20px; padding: 15px; background: #ecf0f1; border-left: 5px solid var(--accent-blue); }
    h3 { font-size: 1.5rem; font-weight: 600; color: var(--primary-medium); margin: 30px 0 15px; padding-left: 10px; border-left: 3px solid var(--accent-blue); }
    h4 { font-size: 1.3rem; font-weight: 600; color: var(--primary-light); margin: 25px 0 10px; }
    .header-template { background: linear-gradient(135deg, #2c3e50, #34495e); color: white; padding: 40px; text-align: center; }
    .topic-block-template { border: 2px solid #e1e8ed; border-radius: 10px; margin: 30px 0; overflow: hidden; }
    .topic-header-template { background: var(--accent-blue); color: white; padding: 15px 20px; font-size: 1.4rem; font-weight: 600; }
    .topic-content-template { padding: 25px; }
    .section-theory { background: var(--bg-theory); padding: 20px; border-radius: 8px; margin: 15px 0; }
    .section-details { background: var(--bg-details); padding: 20px; border-radius: 8px; margin: 15px 0; }
    .section-analysis { background: var(--bg-analysis); padding: 20px; border-radius: 8px; margin: 15px 0; }
    .section-methods { background: var(--bg-methods); padding: 20px; border-radius: 8px; margin: 15px 0; }
    .section-critical { background: var(--bg-critical); padding: 20px; border-radius: 8px; margin: 15px 0; border: 2px solid var(--danger-red); }
    .section-procedures { background: var(--bg-procedures); padding: 20px; border-radius: 8px; margin: 15px 0; }
    .section-summary { background: var(--bg-summary); padding: 20px; border-radius: 8px; margin: 15px 0; }
    .section-title { font-size: 1.2rem; font-weight: 600; color: var(--primary-dark); margin: 20px 0 10px; padding-bottom: 5px; border-bottom: 2px solid var(--accent-blue); }
    .table-template { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border-radius: 8px; overflow: hidden; }
    .table-template th { background: var(--primary-medium); color: white; padding: 12px; text-align: left; font-weight: 600; }
    .table-template td { padding: 10px 12px; border: 1px solid #e1e8ed; }
    .table-template tr:nth-child(even) { background: #f8f9fa; }
    .formula-box-template { background: var(--bg-neutral); border: 2px dashed #95a5a6; padding: 15px; margin: 20px 0; font-family: 'Source Sans Pro', sans-serif; border-radius: 5px; }
    .priority-box-template { background: #fff3cd; border: 2px solid var(--warning-yellow); padding: 20px; margin: 20px 0; border-radius: 8px; }
    .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
    .category-card-template { border: 1px solid #e1e8ed; border-radius: 8px; padding: 15px; background: white; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .category-card-template h4 { color: var(--accent-blue); margin-bottom: 10px; font-size: 1.1rem; }
    .quick-reference-template { background: linear-gradient(135deg, #f5f7fa, #c3cfe2); padding: 25px; border-radius: 10px; margin: 30px 0; }
    ul { margin-left: 1.5rem; margin-bottom: 1rem; }
    li { margin-bottom: 0.5rem; }
    @media (max-width: 768px) { .category-grid { grid-template-columns: 1fr; } h1 { font-size: 2rem; } h2 { font-size: 1.6rem; } h3 { font-size: 1.3rem; } }
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
      'editorial-chic': `Create elegant, magazine-style notes using the Editorial Chic style guide.

REQUIRED: Use these EXACT HTML box classes strategically:
- <div class="definition-box"><span class="label">KEY CONCEPT</span><p>...</p></div> - For definitions, key concepts (blue left border)
- <div class="info-box"><span class="label">ADDITIONAL INFO</span><p>...</p></div> - For secondary info, context (brown left border)
- <div class="callout-box"><span class="label">CRITICAL</span><p>...</p></div> - For must-know information (black border)
- <div class="remember-box"><p><strong>Remember:</strong> ...</p></div> - For key takeaways (teal left border)
- <div class="warning-box"><span class="label">WARNING</span><p>...</p></div> - For common mistakes, critical alerts (red border)

Use <span class="label">LABEL TEXT</span> for uppercase category labels.
Use serif typography feel. Focus on clarity, visual hierarchy, and sophisticated design.`,
      'vibrant-textbook': `Create comprehensive study notes using the Vibrant Textbook style guide with color-coded sections.

REQUIRED: Use these EXACT HTML section classes for color-coded organization:
- <div class="section-theory"><div class="section-title">Theory / Background</div>...</div> - Light mint green for foundational concepts
- <div class="section-details"><div class="section-title">Key Details</div>...</div> - Light yellow for specific facts, evidence
- <div class="section-analysis"><div class="section-title">Analysis</div>...</div> - Light blue for evaluation, assessment
- <div class="section-methods"><div class="section-title">Methods / Solutions</div>...</div> - Light orange for approaches, techniques
- <div class="section-critical"><div class="section-title">Critical Points</div>...</div> - Light red for warnings, common errors
- <div class="section-procedures"><div class="section-title">Procedures</div>...</div> - Light green for step-by-step actions
- <div class="section-summary"><div class="section-title">Summary</div>...</div> - Light purple for key takeaways

Other available components:
- <div class="topic-block-template"><div class="topic-header-template">Topic Name</div><div class="topic-content-template">...</div></div> - For major topic containers
- <div class="priority-box-template"><h4>Important</h4>...</div> - Yellow box for priority information
- <table class="table-template">...</table> - For data tables
- <div class="category-grid"><div class="category-card-template"><h4>Category</h4>...</div></div> - For card layouts`,
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
