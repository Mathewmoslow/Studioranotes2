export type NoteStyleKey = 'editorial-chic' | 'vibrant-textbook' | 'default';

export interface NoteStyleDefinition {
  value: NoteStyleKey;
  label: string;
  description: string;
  css: string;
  prompt: string;
}

export const noteStyles: NoteStyleDefinition[] = [
  {
    value: 'editorial-chic',
    label: 'Editorial Chic',
    description: 'Serif-forward, high-contrast, magazine-inspired layout on a warm background.',
    css: `
@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Work+Sans:wght@400;500;600&display=swap');

body, .note-body {
  font-family: 'Work Sans', sans-serif;
  background: #f7f4ef;
  color: #111;
  line-height: 1.7;
}
.note-body h1, .note-body h2, .note-body h3, .note-body h4 {
  font-family: 'Libre Baskerville', serif;
  letter-spacing: 0.3px;
  margin: 16px 0 8px;
}
.note-body h1 { font-size: 28px; border-bottom: 2px solid #111; padding-bottom: 6px; }
.note-body h2 { font-size: 22px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
.note-body h3 { font-size: 18px; }
.note-body p { margin: 8px 0; }
.note-body ul, .note-body ol { padding-left: 20px; margin: 8px 0; }
.note-body li { margin: 4px 0; }
.note-body blockquote {
  border-left: 4px solid #111;
  padding-left: 12px;
  color: #333;
  font-style: italic;
  background: #f9f6f0;
}
.note-body code {
  background: #111;
  color: #f7f4ef;
  padding: 2px 4px;
  border-radius: 4px;
}
.note-body .badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  background: #111;
  color: #f7f4ef;
  font-size: 12px;
  letter-spacing: 0.2px;
}
    `.trim(),
    prompt: `
Use the "Editorial Chic" style: warm off-white background, high-contrast black text, serif headlines (Libre Baskerville), sans-serif body (Work Sans).
Structure notes with clear sections, headings, bullet lists, callouts (blockquote), and badges for key terms. Output valid, semantic HTML inside a container with class "note-body".
Do NOT include external scripts. Keep inline HTML clean and well-structured.
    `.trim(),
  },
  {
    value: 'vibrant-textbook',
    label: 'Vibrant Textbook',
    description: 'Bold gradients, cool dark background, and colorful accents with textbook clarity.',
    css: `
@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600;700&family=Source+Sans+Pro:wght@400;600;700&display=swap');

body, .note-body {
  font-family: 'Source Sans Pro', sans-serif;
  background: #0f172a;
  color: #e5e7eb;
  line-height: 1.7;
}
.note-body h1, .note-body h2, .note-body h3, .note-body h4 {
  font-family: 'EB Garamond', serif;
  margin: 14px 0 8px;
}
.note-body h1 {
  font-size: 28px;
  background: linear-gradient(90deg, #10b981, #6366f1);
  -webkit-background-clip: text;
  color: transparent;
}
.note-body h2 { font-size: 22px; color: #a5b4fc; }
.note-body h3 { font-size: 18px; color: #67e8f9; }
.note-body p { margin: 8px 0; }
.note-body ul, .note-body ol { padding-left: 20px; margin: 8px 0; }
.note-body li { margin: 4px 0; }
.note-body blockquote {
  border-left: 3px solid #22c55e;
  padding-left: 12px;
  background: rgba(34,197,94,0.1);
  color: #bbf7d0;
}
.note-body code {
  background: rgba(99,102,241,0.15);
  color: #e0e7ff;
  padding: 2px 4px;
  border-radius: 4px;
}
.note-body .pill {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(16,185,129,0.2);
  color: #a7f3d0;
  font-size: 12px;
}
    `.trim(),
    prompt: `
Use the "Vibrant Textbook" style: dark navy background, bright gradients, EB Garamond for headings and Source Sans Pro for body.
Structure notes with sections, headings, bullet lists, callouts (blockquote), and pills for key terms. Output valid semantic HTML inside a container with class "note-body".
Do NOT include external scripts. Keep inline HTML clean and well-structured.
    `.trim(),
  },
  {
    value: 'default',
    label: 'Default (Markdown)',
    description: 'Simple markdown-style notes without special styling.',
    css: '',
    prompt: 'Use simple Markdown/HTML. No special styling required.',
  },
];

export function getNoteStyle(key: NoteStyleKey) {
  return noteStyles.find((s) => s.value === key) || noteStyles.find((s) => s.value === 'default')!;
}
