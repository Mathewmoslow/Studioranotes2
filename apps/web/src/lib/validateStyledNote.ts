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
    requiredElements: ['h1'], // Only require h1, be lenient
    requiredClasses: [], // Don't require specific classes
    optionalClasses: [
      'note-body',
      'container',
      'definition-box',
      'info-box',
      'callout-box',
      'remember-box',
      'warning-box',
      'label',
      'grid-2',
      'grid-3',
      'card',
      'card-title',
      'comparison',
      'comparison-column',
    ],
  },
  'vibrant-textbook': {
    requiredElements: ['h1'], // Only require h1, be lenient
    requiredClasses: [], // Don't require specific classes
    optionalClasses: [
      'note-body',
      'container',
      'header-template',
      'topic-block-template',
      'topic-header-template',
      'topic-content-template',
      'section-theory',
      'section-details',
      'section-analysis',
      'section-methods',
      'section-critical',
      'section-procedures',
      'section-summary',
      'section-title',
      'table-template',
      'formula-box-template',
      'priority-box-template',
      'category-grid',
      'category-card-template',
      'quick-reference-template',
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

  // Check malformed tags - as warnings, not errors (AI output can be imperfect)
  const malformedErrors = checkMalformedTags(html);
  result.warnings.push(...malformedErrors);

  // Check structure - as warnings only
  const structureCheck = checkStructure(html);
  result.warnings.push(...structureCheck.errors);
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
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Work+Sans:wght@300;400;500;600&display=swap');
    :root { --accent: #1e3a8a; --accent-light: #eff6ff; --secondary: #7c2d12; --secondary-light: #fef9f5; --tertiary: #134e4a; --tertiary-light: #f0fdfa; --red: #991b1b; --red-light: #fef2f2; --black: #0a0a0a; --charcoal: #2a2a2a; --gray: #6a6a6a; --white: #fafafa; --line: #e5e5e5; }
    body { font-family: 'Work Sans', sans-serif; line-height: 1.7; color: var(--charcoal); background: #ffffff; }
    .container { max-width: 1100px; margin: 0 auto; padding: 2rem; }
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
    .container { max-width: 1200px; margin: 0 auto; background: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1); padding: 40px; }
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
  };

  return styles[style] || '';
}

export default validateStyledNote;
