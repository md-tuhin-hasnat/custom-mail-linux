/**
 * messageQuoteParser.ts
 * 
 * Intelligently separates the direct reply message text from historical quoted
 * email threads (blockquotes, gmail_quote, outlook reply headers, and "On ... wrote:").
 * Enables messenger/chat-style conversation viewing without repetitive clutter.
 */

export interface ParsedMessageContent {
  directContent: string;
  quotedContent: string | null;
}

/**
 * Splits HTML content into direct conversation reply and quoted historical text.
 */
export function splitMessageBody(html: string): ParsedMessageContent {
  if (!html) {
    return { directContent: '', quotedContent: null };
  }

  // Common email quote markers in HTML
  const quotePatterns = [
    /<div[^>]*class=["'][^"']*gmail_quote[^"']*["'][^>]*>[\s\S]*$/i,
    /<blockquote[^>]*>[\s\S]*$/i,
    /<div[^>]*id=["']appendonsend["'][^>]*>[\s\S]*$/i,
    /<hr[^>]*id=["']stopspelling["'][^>]*>[\s\S]*$/i,
    /<div[^>]*class=["'][^"']*WordSection1[^"']*["'][\s\S]*?(?:<hr|<b[^>]*From:)/i,
    /(?:<p[^>]*>|<div[^>]*>)?(?:On\s+[A-Za-z]+,\s+.*wrote:?)(?:<\/p>|<\/div>)?[\s\S]*$/i,
    /-----Original Message-----[\s\S]*$/i,
  ];

  for (const pattern of quotePatterns) {
    const match = pattern.exec(html);
    if (match && match.index > 0) {
      const direct = html.substring(0, match.index).trim();
      const quoted = html.substring(match.index).trim();
      if (direct.length > 0) {
        return {
          directContent: direct,
          quotedContent: quoted,
        };
      }
    }
  }

  return {
    directContent: html,
    quotedContent: null,
  };
}
