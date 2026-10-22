import DOMPurify from 'dompurify';

export interface SanitizeOptions {
  allowImages?: boolean;
}

const FORBIDDEN_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'base',
  'meta',
  'link',
  'applet',
  'frame',
  'frameset',
];

const FORBIDDEN_ATTRS = [
  'onerror',
  'onload',
  'onclick',
  'onmouseover',
  'onmouseout',
  'onfocus',
  'onblur',
  'onchange',
  'onsubmit',
  'onkeydown',
  'onkeyup',
  'onkeypress',
  'formaction',
  'action',
];

export function sanitizeEmailHtml(rawHtml: string, options: SanitizeOptions = {}): string {
  if (!rawHtml) return '';
  if (typeof window === 'undefined') {
    return rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  DOMPurify.removeHook('afterSanitizeAttributes');
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
      const href = node.getAttribute('href') || '';
      if (/^(javascript|vbscript|data):/i.test(href)) {
        node.removeAttribute('href');
      }
    }

    if (node.tagName === 'IMG' && options.allowImages === false) {
      node.setAttribute('data-blocked-src', node.getAttribute('src') || '');
      node.removeAttribute('src');
    }
  });

  return DOMPurify.sanitize(rawHtml, {
    FORBID_TAGS: FORBIDDEN_TAGS,
    FORBID_ATTR: FORBIDDEN_ATTRS,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ADD_ATTR: ['target', 'rel'],
  });
}
