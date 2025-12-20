/**
 * Validation helper for styled notes
 * Ensures HTML structure matches expected format for each style
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StyleRequirements {
  requiredElements: string[];
  requiredClasses: string[];
  optionalClasses: string[];
}

const STYLE_REQUIREMENTS: { [key: string]: StyleRequirements } = {
  'editorial-chic': {
    requiredElements: ['article.note-body', 'h1', 'h2'],
    requiredClasses: ['note-body'],
    optionalClasses: [],
  },
  'vibrant-textbook': {
    requiredElements: ['article.note-body', 'h1', 'h2'],
    requiredClasses: ['note-body'],
    optionalClasses: [
      'clinical-box',
      'nursing-box',
      'education-box',
      'key-point-box',
      'medication-box',
    ],
  },
};

/**
 * Check if HTML string contains required element
 */
function hasElement(html: string, selector: string): boolean {
  // Simple regex-based check for element existence
  if (selector.includes('.')) {
    // Handle element.class format
    const [tag, className] = selector.split('.');
    const regex = new RegExp(`<${tag}[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>`, 'i');
    return regex.test(html);
  }
  // Simple tag check
  const regex = new RegExp(`<${selector}[^>]*>`, 'i');
  return regex.test(html);
}

/**
 * Check if HTML string contains a specific class
 */
function hasClass(html: string, className: string): boolean {
  const regex = new RegExp(`class=["'][^"']*${className}[^"']*["']`, 'i');
  return regex.test(html);
}

/**
 * Check for malformed HTML tags
 */
function checkMalformedTags(html: string): string[] {
  const errors: string[] = [];

  // Check for unclosed tags (basic check)
  const openTags = ['div', 'p', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'article', 'section'];

  for (const tag of openTags) {
    const openCount = (html.match(new RegExp(`<${tag}[^>]*>`, 'gi')) || []).length;
    const closeCount = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;

    if (openCount !== closeCount) {
      errors.push(`Mismatched ${tag} tags: ${openCount} opening, ${closeCount} closing`);
    }
  }

  // Check for self-closing tags that shouldn't be
  const selfClosingCheck = html.match(/<(div|p|span|article|section|ul|ol|li)\s*\/>/gi);
  if (selfClosingCheck) {
    errors.push(`Invalid self-closing tags found: ${selfClosingCheck.join(', ')}`);
  }

  return errors;
}

/**
 * Check if HTML has proper structure
 */
function checkStructure(html: string): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for DOCTYPE
  if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
    warnings.push('Missing DOCTYPE declaration');
  }

  // Check for html, head, body tags for full documents
  if (html.includes('<!DOCTYPE') || html.includes('<!doctype')) {
    if (!/<html[^>]*>/i.test(html)) {
      errors.push('Missing <html> tag in document');
    }
    if (!/<head[^>]*>/i.test(html)) {
      errors.push('Missing <head> tag in document');
    }
    if (!/<body[^>]*>/i.test(html)) {
      errors.push('Missing <body> tag in document');
    }
  }

  // Check for style tag
  if (!/<style[^>]*>/i.test(html)) {
    warnings.push('Missing <style> tag - styles may not be applied');
  }

  return { errors, warnings };
}

/**
 * Validate HTML content for a specific style
 */
export function validateStyledNote(
  html: string,
  targetStyle: 'editorial-chic' | 'vibrant-textbook'
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  if (!html || typeof html !== 'string') {
    result.valid = false;
    result.errors.push('HTML content is empty or invalid');
    return result;
  }

  const requirements = STYLE_REQUIREMENTS[targetStyle];
  if (!requirements) {
    result.valid = false;
    result.errors.push(`Unknown style: ${targetStyle}`);
    return result;
  }

  // Check required elements
  for (const element of requirements.requiredElements) {
    if (!hasElement(html, element)) {
      result.errors.push(`Missing required element: ${element}`);
    }
  }

  // Check required classes
  for (const className of requirements.requiredClasses) {
    if (!hasClass(html, className)) {
      result.errors.push(`Missing required class: ${className}`);
    }
  }

  // Check malformed tags
  const malformedErrors = checkMalformedTags(html);
  result.errors.push(...malformedErrors);

  // Check structure
  const structureCheck = checkStructure(html);
  result.errors.push(...structureCheck.errors);
  result.warnings.push(...structureCheck.warnings);

  // For vibrant-textbook, check if any special boxes are used
  if (targetStyle === 'vibrant-textbook') {
    const hasAnyBox = requirements.optionalClasses.some(cls => hasClass(html, cls));
    if (!hasAnyBox) {
      result.warnings.push('No special boxes (clinical, nursing, education, etc.) found - consider adding for visual appeal');
    }
  }

  // Determine validity
  result.valid = result.errors.length === 0;

  return result;
}

/**
 * Extract content from simple/editable note for conversion
 */
export function extractNoteContent(html: string): {
  title: string;
  sections: { heading: string; content: string }[];
  rawText: string;
} {
  // Extract title from h1
  const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Untitled Note';

  // Extract sections by h2 headers
  const sections: { heading: string; content: string }[] = [];
  const sectionRegex = /<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2|<\/article|<\/body|$)/gi;
  let match;

  while ((match = sectionRegex.exec(html)) !== null) {
    sections.push({
      heading: match[1].replace(/<[^>]*>/g, '').trim(),
      content: match[2].trim(),
    });
  }

  // Extract raw text (strip all HTML tags)
  const rawText = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { title, sections, rawText };
}

/**
 * Get CSS for a specific style
 */
export function getStyleCSS(style: 'editorial-chic' | 'vibrant-textbook'): string {
  const styles: { [key: string]: string } = {
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
  };

  return styles[style] || '';
}

export default validateStyledNote;
