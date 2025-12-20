import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'
import { getNoteStyle, NoteStyleKey } from '@/lib/noteStyles'

// Initialize OpenAI client (will use env variable when available)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

type NoteType = 'outline' | 'summary' | 'flashcards' | 'concept_map' | 'qa'
type NoteContext = 'pre-lecture' | 'post-lecture' | 'assignment' | 'study-guide' | 'lecture' | 'textbook' | 'clinical' | 'lab'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!openai) {
      // Return a mock response if OpenAI is not configured
      return NextResponse.json({
        success: true,
        note: {
          title: 'Sample Generated Note',
          content: '# Sample Note\n\nThis is a placeholder note. To enable AI-generated notes, please add your OpenAI API key to the environment variables.',
          style: 'comprehensive',
          type: 'outline'
        }
      })
    }

    const body = await request.json()
    const {
      // Context (when/what)
      context, // 'pre-lecture', 'post-lecture', 'assignment', 'study-guide', 'lecture', 'textbook', etc.
      // Style (how detailed)
      style = 'comprehensive',
      // Type (format)
      type = 'outline', // 'outline', 'summary', 'flashcards', 'concept_map', 'qa'
      // Content
      courseName,
      topic,
      syllabus,
      assignment,
      existingNotes,
      additionalContext,
      sourceText // For textbook/document parsing
    } = body

    const styleKey = (style as NoteStyleKey) || 'default'
    const styleDef = getNoteStyle(styleKey)

    // Build style instructions
    const styleInstructions = {
      comprehensive: 'Create extremely detailed and thorough notes covering all aspects. Include examples, explanations, context, and related concepts. Leave no stone unturned.',
      concise: 'Create brief, to-the-point notes focusing only on key concepts and essential information. Be succinct and clear.',
      exploratory: 'Create notes that encourage discovery and deeper thinking. Include thought-provoking questions, connections to other topics, and areas for further exploration.',
      guided: 'Create structured notes with clear guidance for studying. Include step-by-step explanations, study tips, and learning objectives.',
      flexible: 'Create adaptable notes that can be used in multiple ways. Balance detail with brevity, include various perspectives.',
      'editorial-chic': styleDef.prompt,
      'vibrant-textbook': styleDef.prompt,
      default: 'Use simple, clear study notes with headings, bullets, and concise explanations.',
    }

    // Build format instructions
    const formatInstructions = {
      outline: 'Format as a hierarchical outline with main topics, subtopics, and bullet points.',
      summary: 'Format as concise paragraphs summarizing key concepts.',
      flashcards: 'Format as Q&A flashcards with questions and detailed answers.',
      concept_map: 'Format as a concept map showing relationships between ideas (use markdown headers and lists to show connections).',
      qa: 'Format as comprehensive questions and answers covering the material.'
    }

    // Generate appropriate prompt based on context and style
    let prompt = `${styleInstructions[styleKey] || styleInstructions.default}\n\n${formatInstructions[type as NoteType] || formatInstructions.outline}\n\n`

    switch (context) {
      case 'pre-lecture':
        prompt = `Generate comprehensive pre-lecture notes for a ${courseName} class on "${topic}".

        Include:
        - Key concepts and definitions
        - Important formulas or principles
        - Historical context if relevant
        - Questions to consider during lecture
        - Areas to focus on

        ${syllabus ? `Course syllabus excerpt: ${syllabus}` : ''}
        ${additionalContext ? `Additional context: ${additionalContext}` : ''}

        Format the notes as semantic HTML (headings, lists, paragraphs) inside a container with class "note-body".`
        break

      case 'lecture':
      case 'post-lecture':
        prompt += `Enhance the following lecture notes for ${courseName} on "${topic}":


        ${existingNotes || 'No existing notes provided'}

        Please:
        - Clarify any unclear concepts
        - Add examples and applications
        - Create summary points
        - Generate practice questions
        - Identify key takeaways

        ${additionalContext ? `Additional context: ${additionalContext}` : ''}

        Format as comprehensive study notes in HTML inside a container with class "note-body".`
        break

      case 'textbook':
        prompt += `Create study notes from the following textbook content for ${courseName}:\n\n${sourceText || topic}\n\nFocus on: Key concepts, important definitions, formulas, and applications.\n\nFormat in HTML (headings, lists, paragraphs) inside a container with class "note-body".`
        break

      case 'clinical':
      case 'lab':
        prompt += `Create practical notes for ${context === 'clinical' ? 'clinical' : 'laboratory'} work in ${courseName} on "${topic}".\n\nInclude:\n- Procedures and protocols\n- Safety considerations\n- Key observations to make\n- Common pitfalls\n- Clinical/lab skills needed\n\n${additionalContext ? `Context: ${additionalContext}` : ''}\n\nFormat in HTML with headings, lists, and callouts.`
        break

      case 'assignment':
        prompt += `Create study notes to help complete the following assignment for ${courseName}:

        Assignment: ${assignment?.name || topic}
        ${assignment?.description ? `Description: ${assignment.description}` : ''}
        ${assignment?.dueDate ? `Due: ${new Date(assignment.dueDate).toLocaleDateString()}` : ''}

        Include:
        - Relevant concepts and theories
        - Step-by-step approach
        - Important formulas or methods
        - Common pitfalls to avoid
        - Resources for further study

        Format in HTML with clear sections.`
        break

      case 'study-guide':
        prompt += `Create a comprehensive study guide for ${courseName} covering "${topic}".

        ${existingNotes ? `Based on these notes: ${existingNotes}` : ''}

        Include:
        - Topic overview
        - Key concepts and definitions
        - Important dates/figures/formulas
        - Practice questions with answers
        - Summary points
        - Study tips

        ${syllabus ? `Course syllabus: ${syllabus}` : ''}

        Format as a complete study guide in HTML inside a container with class "note-body".`
        break

      default:
        prompt += `Generate helpful study notes for ${courseName} on "${topic}". Format in semantic HTML inside a container with class "note-body".`
    }

    // Generate note using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert academic note-taker and study assistant. Generate notes in the ${styleKey} style using the ${type} format. Focus on helping students understand and retain information effectively. Output clean semantic HTML only; no scripts.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })

    const generatedContent = completion.choices[0]?.message?.content || ''
    const cssBlock = styleDef?.css ? `<style>${styleDef.css}</style>` : ''
    const htmlWrapped = cssBlock
      ? `${cssBlock}<article class="note-body">${generatedContent}</article>`
      : generatedContent

    return NextResponse.json({
      success: true,
      note: {
        title: `${context === 'pre-lecture' ? 'Pre-Lecture' : context === 'post-lecture' ? 'Post-Lecture' : context === 'assignment' ? 'Assignment' : context === 'textbook' ? 'Textbook' : 'Study'} Notes: ${topic}`,
        content: htmlWrapped,
        style: styleKey,
        type,
        context,
        courseName,
        topic,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Note generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate note' },
      { status: 500 }
    )
  }
}
