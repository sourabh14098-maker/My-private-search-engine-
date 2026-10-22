/**
 * Sanitizes external search result destination URLs.
 * Permits strictly http: and https: protocols to prevent DOM-based script execution (XSS).
 * Defuses dangerous schemes (javascript:, data:, vbscript:, file:, blob:) to '#'.
 */
export function sanitizeSafeUrl(rawUrl?: string): string {
  if (!rawUrl) return '#'
  const trimmed = rawUrl.trim()
  if (!trimmed) return '#'

  // Block dangerous pseudo-protocols explicitly before any normalization
  if (/^(javascript|data|vbscript|file|blob):/i.test(trimmed)) {
    return '#'
  }

  try {
    // If it starts with http:// or https://, parse directly
    // Otherwise if it lacks a protocol scheme (e.g. "wikipedia.org/page"), prepend https://
    const candidate = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`

    const parsed = new URL(candidate)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href
    }
  } catch {
    // Malformed URL string that cannot be parsed
  }

  return '#'
}
