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

// Section definitions for note generation - GENERIC for any subject
const SECTION_DESCRIPTIONS: { [key: string]: string } = {
  overview: `## Overview
Provide a comprehensive introduction and context for the topic:
- What is this topic and why is it important?
- Historical background or development
- Current relevance and applications
- How this connects to the broader subject area`,

  keyTakeaways: `## Key Takeaways
Highlight the 5-10 most critical points that students MUST remember:
- Use clear, concise bullet points
- Focus on exam-worthy content
- Include both facts and concepts
- Prioritize information by importance`,

  mainConcepts: `## Main Concepts
Provide detailed exploration of ALL core ideas, theories, and frameworks:
- Define each concept thoroughly with multiple paragraphs
- Explain the underlying principles and mechanisms
- Show how concepts relate to each other
- Include real-world examples for each concept
- Compare and contrast similar concepts
- Address common misconceptions`,

  theoreticalFramework: `## Theoretical Framework / Underlying Processes
For EACH major concept or process, provide detailed explanation:
- Core mechanism or principle - explain step-by-step
- Key components involved (systems, elements, factors)
- Contributing factors and variables
- Compensatory mechanisms or feedback loops
- Long-term implications and outcomes
- Visual representation where helpful`,

  practicalApplications: `## Practical Applications
Describe real-world applications, signs, and observable outcomes:
- Concrete examples of the concept in action
- How to identify or recognize the concept
- Assessment methods or evaluation criteria
- Expected vs. unexpected outcomes
- Variations and edge cases`,

  analysis: `## Analysis & Evaluation
Review analytical methods, tests, and evaluation criteria:
- Methods for analysis with step-by-step procedures
- Expected results and benchmarks
- Normal vs. abnormal ranges where applicable
- Interpretation guidelines
- Common errors in analysis`,

  actionSteps: `## Action Steps / Interventions
Detail specific actions, procedures, and management strategies:
- Prioritized list of interventions
- Step-by-step procedures with rationale
- Monitoring and follow-up actions
- Decision-making frameworks
- When to escalate or seek additional resources`,

  formulas: `## Formulas, Calculations & Technical Details
Cover key formulas, calculations, and technical specifications:
- Essential formulas with explanations
- Step-by-step calculation examples
- Common variations and applications
- Important values and constants to memorize
- Practical tips for calculations`,

  examples: `## Detailed Examples
Connect theory to practice with comprehensive examples:
- 3-5 detailed worked examples
- Show complete problem-solving process
- Include common variations
- Highlight where students often make mistakes
- Provide practice scenarios`,

  complications: `## Complications, Challenges & Risk Factors
Identify potential problems and at-risk scenarios:
- Common complications and their causes
- Risk factors and warning signs
- Prevention strategies
- Intervention when problems arise
- Long-term considerations`,

  teaching: `## Teaching Points & Study Tips
Outline key points for learning and retention:
- Must-know facts organized by priority
- Common exam topics
- Memory techniques for difficult content
- Study strategies specific to this topic`,

  keyTerms: `## Key Terms & Definitions
Define ALL important vocabulary with:
- Clear, concise definitions
- Etymology where helpful
- Related terms and distinctions
- Examples of usage`,

  mnemonics: `## Memory Aids & Mnemonics
Provide effective memory devices:
- Acronyms with full breakdown
- Visual memory techniques
- Association methods
- Songs or rhymes if applicable
- Include the reasoning behind each aid`,

  conceptMap: `## Concept Maps
Create concept maps as JSON code blocks with this structure:
\`\`\`json
{
  "central": "Main concept name",
  "keyProcesses": ["Process 1", "Process 2"],
  "riskFactors": ["Risk 1", "Risk 2"],
  "causes": ["Cause 1", "Cause 2"],
  "indicators": ["Indicator 1", "Indicator 2"],
  "analysis": ["Method 1: expected result", "Method 2"],
  "complications": ["Complication 1", "Complication 2"],
  "interventions": ["Intervention 1", "Intervention 2"],
  "formulas": ["Formula 1", "Formula 2"],
  "solutions": ["Solution 1", "Solution 2"],
  "keyPoints": ["Key point 1", "Key point 2"]
}
\`\`\``,

  selfAssessment: `## Check Yourself
Include 5-10 self-assessment questions:
- Mix of recall and application questions
- Include answers at the end
- Vary difficulty levels
- Focus on commonly tested content`,

  practiceQuestions: `## Practice Questions
Generate 8-12 exam-style questions with DETAILED rationales:

For each question include:
1. Question stem (realistic scenario or direct question)
2. 4 answer choices (A, B, C, D)
3. Correct answer clearly marked
4. Detailed rationale explaining:
   - Why the correct answer is right
   - Why EACH incorrect answer is wrong
   - Key concept being tested
   - Related information to remember`,

  caseStudy: `## Case Study / Scenario Analysis
Create a comprehensive real-world scenario:

Include:
- Detailed background/context (demographic info, setting, relevant history)
- Key data and observations
- Timeline of events
- Critical thinking questions:
  1. Analysis questions (What is happening? Why?)
  2. Priority questions (What should be addressed first?)
  3. Intervention questions (What actions should be taken?)
  4. Evaluation questions (How do we know if interventions worked?)
- Complete answer key with rationales`,

  expertTips: `## Expert Tips & High-Yield Insights
Share high-yield tips and insights:
- "Pearls" that experts know
- Common exam traps to avoid
- Real-world vs. textbook differences
- Time-saving shortcuts (where appropriate)
- Industry best practices`,

  warningsSigns: `## Warning Signs & Critical Alerts
Highlight critical warning signs:
- Red flags that require immediate attention
- Common mistakes and how to avoid them
- Safety considerations
- When to seek help or escalate`,

  diverseContexts: `## Diverse Contexts & Considerations
Address variations across different contexts:
- Cultural considerations
- Environmental factors
- Different populations or settings
- Accessibility considerations`,

  ethicalLegal: `## Ethical & Legal Considerations
Discuss relevant ethical and legal aspects:
- Key regulations or guidelines
- Ethical principles that apply
- Professional standards
- Common ethical dilemmas
- Decision-making frameworks`
}

// Default sections for each style
const DEFAULT_SECTIONS_BY_STYLE: { [key: string]: string[] } = {
  'editorial-chic': ['overview', 'keyTakeaways', 'mainConcepts', 'examples', 'practiceQuestions'],
  'vibrant-textbook': ['overview', 'mainConcepts', 'theoreticalFramework', 'practicalApplications', 'actionSteps', 'practiceQuestions', 'caseStudy'],
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

## REQUIRED HTML Box Classes (USE STRATEGICALLY THROUGHOUT):

### Concept Boxes (use for key definitions, theories, frameworks):
<div class="definition-box">
  <span class="label">KEY CONCEPT</span>
  <p><strong>Term:</strong> Definition here...</p>
</div>

### Information Boxes (use for supporting details, context, examples):
<div class="info-box">
  <span class="label">ADDITIONAL INFO</span>
  <p>Supporting information here...</p>
</div>

### Critical Boxes (use for must-know, exam-essential information):
<div class="callout-box">
  <span class="label">CRITICAL</span>
  <p>Essential information that must be remembered...</p>
</div>

### Remember Boxes (use for takeaways, summaries):
<div class="remember-box">
  <p><strong>Remember:</strong> Key point to memorize...</p>
</div>

### Warning Boxes (use for common mistakes, pitfalls, errors):
<div class="warning-box">
  <span class="label">⚠️ WARNING</span>
  <p>Common mistake or critical alert...</p>
</div>

### Expert Tips (use for high-yield insights):
<div class="clinical-pearl">
  <h4>Expert Tip</h4>
  <p>High-yield insight here...</p>
</div>

### Comparison Tables:
<div class="comparison">
  <div class="comparison-column">
    <h4>Option A</h4>
    <ul><li>Point 1</li><li>Point 2</li></ul>
  </div>
  <div class="comparison-column">
    <h4>Option B</h4>
    <ul><li>Point 1</li><li>Point 2</li></ul>
  </div>
</div>

### Card Grids (use for organizing related items):
<div class="grid-2">
  <div class="card">
    <div class="card-title">Card Title</div>
    <p>Card content...</p>
  </div>
  <div class="card">
    <div class="card-title">Card Title</div>
    <p>Card content...</p>
  </div>
</div>

Use <span class="label">LABEL TEXT</span> for uppercase category labels.
Focus on clarity, visual hierarchy, and sophisticated design.
Include tables, grids, and visual organization throughout.`,

      'vibrant-textbook': `Create COMPREHENSIVE study notes using the Vibrant Textbook style guide with color-coded sections.

## REQUIRED: Color-Coded Section Boxes (USE ALL RELEVANT ONES):

### Theory Section (mint green - for foundational concepts):
<div class="section-theory">
  <div class="section-title">Theoretical Background</div>
  <p>Foundational concepts and underlying principles...</p>
</div>

### Details Section (yellow - for specific facts, evidence):
<div class="section-details">
  <div class="section-title">Key Details</div>
  <ul><li>Specific fact 1</li><li>Specific fact 2</li></ul>
</div>

### Analysis Section (blue - for evaluation, assessment):
<div class="section-analysis">
  <div class="section-title">Analysis & Evaluation</div>
  <p>How to analyze, assess, evaluate...</p>
</div>

### Methods Section (orange - for approaches, techniques, solutions):
<div class="section-methods">
  <div class="section-title">Methods & Solutions</div>
  <ol><li>Step 1</li><li>Step 2</li></ol>
</div>

### Critical Section (red border - for warnings, errors):
<div class="section-critical">
  <div class="section-title">⚠️ Critical Points</div>
  <p>Common mistakes, warnings, red flags...</p>
</div>

### Procedures Section (green - for step-by-step actions):
<div class="section-procedures">
  <div class="section-title">Step-by-Step Procedures</div>
  <ol><li>First, do this...</li><li>Then, do this...</li></ol>
</div>

### Summary Section (purple - for key takeaways):
<div class="section-summary">
  <div class="section-title">Summary</div>
  <ul><li>Key takeaway 1</li><li>Key takeaway 2</li></ul>
</div>

## Additional Components:

### Topic Blocks (for major sections):
<div class="topic-block-template">
  <div class="topic-header-template">Major Topic Name</div>
  <div class="topic-content-template">
    Content here...
  </div>
</div>

### Priority Box (yellow highlight for important info):
<div class="priority-box-template">
  <h4>⭐ Important</h4>
  <p>Priority information here...</p>
</div>

### Quick Reference (gradient background for reference tables):
<div class="quick-reference-template">
  <h4>Quick Reference</h4>
  <table class="table-template">
    <thead><tr><th>Item</th><th>Value</th><th>Notes</th></tr></thead>
    <tbody><tr><td>Example</td><td>123</td><td>Normal range</td></tr></tbody>
  </table>
</div>

### Category Cards (for organizing related items):
<div class="category-grid">
  <div class="category-card-template">
    <h4>Category 1</h4>
    <ul><li>Item 1</li><li>Item 2</li></ul>
  </div>
  <div class="category-card-template">
    <h4>Category 2</h4>
    <ul><li>Item 1</li><li>Item 2</li></ul>
  </div>
</div>

### Data Tables:
<table class="table-template">
  <thead><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr></thead>
  <tbody>
    <tr><td>Data</td><td>Data</td><td>Data</td></tr>
  </tbody>
</table>

Use these components liberally throughout to create visually rich, organized notes.
Every section should have visual elements - not just plain text.`,

      'simple-editable': `Create clean, simple notes that are easy to edit.

Use basic markdown formatting:
- ## for main headings
- ### for subheadings
- **bold** for emphasis
- - for bullet lists
- 1. for numbered lists
- > for quotes or important notes
- \`code\` for technical terms
- Tables where appropriate using | syntax

Keep formatting minimal and functional. Focus on clear content organization.
This format is designed to be edited by users after generation.`
    }

    // System prompt - COMPREHENSIVE NotesAI-level prompt
    const systemPrompt = `You are an expert academic note generator creating COMPREHENSIVE, EXAM-READY study materials for students. Your notes should be so thorough that they could serve as a student's ONLY study resource for the topic.

## OUTPUT STYLE: ${selectedStyle}
${stylePrompts[selectedStyle] || stylePrompts['editorial-chic']}

## SECTIONS TO INCLUDE:
${includedSections}

---

## CRITICAL REQUIREMENTS FOR CONTENT DEPTH:

### 1. EXHAUSTIVE COVERAGE
- Cover EVERY aspect of the topic - leave nothing out
- For each concept, explain: What it is, Why it matters, How it works, When it applies
- Include historical context, current applications, and future trends where relevant
- Address variations, exceptions, and edge cases

### 2. MULTI-PARAGRAPH EXPLANATIONS
- Each major concept requires 3-5 detailed paragraphs minimum
- Explain underlying mechanisms step-by-step
- Include cause-and-effect relationships
- Connect concepts to real-world applications
- Address common misconceptions directly

### 3. SPECIFIC, CONCRETE EXAMPLES
- Provide 2-3 detailed examples for every major concept
- Include realistic scenarios with specific details
- Show complete problem-solving processes
- Demonstrate application of concepts

### 4. NUMERICAL DATA & SPECIFICS
- Include all relevant values, ranges, measurements, and statistics
- Provide normal vs. abnormal benchmarks where applicable
- Include formulas with worked examples
- Reference specific standards, guidelines, or criteria

### 5. COMPREHENSIVE COMPARISONS
- Create comparison tables for related concepts
- Use "vs" analysis for commonly confused topics
- Highlight key differentiating factors
- Include pros/cons or advantages/disadvantages

### 6. STEP-BY-STEP PROCEDURES
- Number all procedural steps clearly
- Include rationale for each step
- Note common errors at each step
- Provide decision points and alternative paths

### 7. CRITICAL THINKING & REASONING
- Explain WHY, not just WHAT
- Include cause-effect chains
- Address "what if" scenarios
- Explain decision-making frameworks

### 8. PRACTICE QUESTIONS (if section included)
For EACH practice question:
- Write realistic, scenario-based stems
- Provide 4 answer choices (A, B, C, D)
- Mark the correct answer clearly
- Provide DETAILED rationale explaining:
  * Why the correct answer is right (with specific reasoning)
  * Why EACH wrong answer is incorrect (specific to each option)
  * The key concept being tested
  * Related facts to remember

### 9. MEMORY AIDS & MNEMONICS
- Create memorable acronyms with full explanations
- Include visual memory techniques
- Explain the reasoning behind each mnemonic
- Make them relevant and easy to remember

### 10. CASE STUDIES / SCENARIOS (if section included)
Create COMPREHENSIVE scenarios including:
- Detailed background (age, context, relevant history)
- Specific data points and observations
- Timeline of events
- Multiple analysis questions with complete answers
- Decision-making exercises
- Follow-up and outcome discussion

---

## VISUAL ORGANIZATION REQUIREMENTS:
- Use the HTML box classes provided for your style LIBERALLY
- Every major section should have visual elements (boxes, tables, grids)
- Break up long text with organized components
- Use tables for any comparative or multi-item data
- Create visual hierarchy with proper heading levels

## FORMAT:
- Use markdown format with HTML box classes as specified above
- Use ## for main sections, ### for subsections, #### for minor headings
- Use **bold** for key terms on first mention
- Use bullet lists for 3+ related items
- Use numbered lists for sequences or procedures
- For concept maps, output as JSON code blocks with the specified structure

## CONTEXT:
- Date: ${dayjs().format('MMMM D, YYYY')}
- Course: ${course || courseName || 'General'}
${module ? `- Module: ${module}` : ''}

## FINAL INSTRUCTION:
Generate notes that are SIGNIFICANTLY more detailed and comprehensive than typical study materials. A student should be able to read these notes and feel fully prepared for any exam on this topic. Do not summarize or abbreviate - EXPAND and ELABORATE on every point.`

    // Call OpenAI - No max_tokens limit for comprehensive content (like NotesAI)
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: sourceContent
            ? `Generate COMPREHENSIVE, EXAM-READY study notes on "${noteTitle}" based on this source material.

SOURCE MATERIAL:
${sourceContent}

REQUIREMENTS:
- Cover ALL aspects of the topic exhaustively
- Be extremely thorough - this should be the DEFINITIVE study resource
- Include detailed explanations, examples, and applications
- Use the visual formatting components specified in the system prompt
- Generate practice questions if that section is included
- Create case studies/scenarios if that section is included`
            : `Generate COMPREHENSIVE, EXAM-READY study notes on the topic: "${noteTitle}"

REQUIREMENTS:
- Cover ALL aspects of this topic exhaustively
- Be extremely thorough - this should be the DEFINITIVE study resource
- Include theoretical foundations, practical applications, and real-world examples
- Address common misconceptions and frequently tested concepts
- Use the visual formatting components specified in the system prompt
- Generate practice questions if that section is included
- Create case studies/scenarios if that section is included
- Include all relevant data, formulas, and specific values`
        }
      ],
      temperature: 0.2 // Lower temperature for more consistent, thorough output (like NotesAI)
      // No max_tokens - allow full comprehensive output
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
