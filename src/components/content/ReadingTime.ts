/**
 * ReadingTime.ts
 * Pure utility — calculates estimated reading time from raw content string.
 * Average adult reading speed: ~238 wpm (Research: Brysbaert 2019).
 */

const WORDS_PER_MINUTE = 238;

/**
 * Strip markdown syntax before word counting so headings, links,
 * code fences, and frontmatter don't inflate the count.
 */
function stripMarkdown(raw: string): string {
  return raw
    // Remove frontmatter (--- block at top)
    .replace(/^---[\s\S]*?---/, '')
    // Remove fenced code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]+`/g, '')
    // Remove images and links, keeping link text
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove markdown heading markers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquote markers
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove bold / italic markers
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2');
}

/** Returns e.g. "4 min read" */
export function calcReadingTime(body: string): string {
  const cleaned = stripMarkdown(body);
  const words = cleaned.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

/** Returns the raw minute count as a number */
export function calcReadingMinutes(body: string): number {
  const cleaned = stripMarkdown(body);
  const words = cleaned.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
