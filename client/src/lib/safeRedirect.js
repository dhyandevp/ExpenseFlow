/**
 * Validates and sanitizes a returnUrl to prevent open redirects.
 * Only allows relative internal paths starting with a single '/'.
 */
export function validateReturnUrl(rawUrl, defaultUrl = '/home') {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return defaultUrl;
  }

  const trimmed = rawUrl.trim();

  // Must begin with a single '/' and not '//' or '/\'
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
    return defaultUrl;
  }

  // Reject URLs containing protocol prefixes or control chars
  if (/[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return defaultUrl;
  }

  return trimmed;
}
