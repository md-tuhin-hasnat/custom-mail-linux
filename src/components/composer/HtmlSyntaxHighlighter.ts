/**
 * HTML Syntax Highlighter & Formatter Utility
 * 
 * Provides lightweight, zero-dependency tokenization and syntax highlighting
 * for raw HTML code, plus an auto-indent formatter for clean markup editing.
 */

// Escape HTML special characters for safe code display
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Tokenizes HTML string and wraps elements in syntax-colored span tags.
 * Designed for real-time overlay or side-by-side code editor display.
 */
export function highlightHtmlCode(code: string): string {
  if (!code) return '';

  // Regex to match tokens: comments, doctype, tags with attributes, entities, text
  const tokenRegex = /(<!--[\s\S]*?-->)|(<!DOCTYPE[\s\S]*?>)|(<\/?)([a-zA-Z0-9\-]+)((?:\s+[a-zA-Z0-9\-:]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*)(\/?>)|(&[a-zA-Z0-9#]+;)/g;

  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(code)) !== null) {
    // Plain text before token
    if (match.index > lastIndex) {
      result += escapeHtml(code.slice(lastIndex, match.index));
    }

    const [
      fullMatch,
      comment,
      doctype,
      openBracket,
      tagName,
      attributes,
      closeBracket,
      entity,
    ] = match;

    if (comment) {
      result += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
    } else if (doctype) {
      result += `<span class="tok-doctype">${escapeHtml(doctype)}</span>`;
    } else if (tagName) {
      result += `<span class="tok-bracket">${escapeHtml(openBracket)}</span>`;
      result += `<span class="tok-tag">${escapeHtml(tagName)}</span>`;

      if (attributes) {
        // Highlight attributes: name and value
        const attrRegex = /([a-zA-Z0-9\-:]+)(?:(=)("[^"]*"|'[^']*'|[^\s>]+))?/g;
        let attrMatch: RegExpExecArray | null;
        let lastAttrIndex = 0;

        while ((attrMatch = attrRegex.exec(attributes)) !== null) {
          if (attrMatch.index > lastAttrIndex) {
            result += escapeHtml(attributes.slice(lastAttrIndex, attrMatch.index));
          }

          const [, attrName, equals, attrValue] = attrMatch;
          result += `<span class="tok-attr-name">${escapeHtml(attrName)}</span>`;
          if (equals) {
            result += `<span class="tok-bracket">=</span>`;
          }
          if (attrValue) {
            result += `<span class="tok-attr-val">${escapeHtml(attrValue)}</span>`;
          }
          lastAttrIndex = attrRegex.lastIndex;
        }

        if (lastAttrIndex < attributes.length) {
          result += escapeHtml(attributes.slice(lastAttrIndex));
        }
      }

      result += `<span class="tok-bracket">${escapeHtml(closeBracket)}</span>`;
    } else if (entity) {
      result += `<span class="tok-entity">${escapeHtml(entity)}</span>`;
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < code.length) {
    result += escapeHtml(code.slice(lastIndex));
  }

  return result;
}

/**
 * Basic HTML beautifier that indents nested tags for clean readability.
 */
export function formatHtml(html: string): string {
  if (!html) return '';
  const tab = '  ';
  let result = '';
  let indent = 0;

  // Normalize spaces and split around tags
  const tokens = html
    .replace(/>\s*</g, '><')
    .replace(/(<[^\/>][^>]*>)/g, '\n$1\n')
    .replace(/(<\/[^>]+>)/g, '\n$1\n')
    .replace(/(<[^\/>][^>]*\/>)/g, '\n$1\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const voidTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
  ]);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const isClosing = /^<\//.test(token);
    const isOpening = /^<[^\/]/.test(token) && !token.endsWith('/>');
    const tagNameMatch = /^<([a-zA-Z0-9\-]+)/.exec(token);
    const tagName = tagNameMatch ? tagNameMatch[1].toLowerCase() : '';
    const isVoid = voidTags.has(tagName) || token.endsWith('/>');

    if (isClosing) {
      indent = Math.max(0, indent - 1);
    }

    result += (indent > 0 ? tab.repeat(indent) : '') + token + '\n';

    if (isOpening && !isVoid) {
      indent++;
    }
  }

  return result.trim();
}
