const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_reader',
  'fbclid',
  'gclid',
  'gclsrc',
  'msclkid',
  'mc_eid',
  '_ga',
  '_gl',
  'yclid',
  'wickedid',
  'rb_clickid',
  'ref_src',
])

/**
 * Strips known tracking query parameters (utm_*, fbclid, gclid, v= tracking, etc.) from a URL.
 * Preserves normal application query parameters (like search terms, pagination, YouTube video IDs).
 */
export function cleanUrlTrackingParams(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return ''
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''

  try {
    const isAbsolute = /^https?:\/\//i.test(trimmed)
    const url = new URL(trimmed, 'https://placeholder.domain')

    const keysToRemove: string[] = []
    url.searchParams.forEach((_val, key) => {
      const lower = key.toLowerCase()
      if (
        TRACKING_PARAMS.has(lower) ||
        lower.startsWith('utm_') ||
        (lower === 'v' &&
          url.hostname !== 'www.youtube.com' &&
          url.hostname !== 'youtube.com' &&
          url.hostname !== 'm.youtube.com')
      ) {
        keysToRemove.push(key)
      }
    })

    for (const key of keysToRemove) {
      url.searchParams.delete(key)
    }

    let cleaned = isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`.replace(/^\//, '')
    if (!trimmed.endsWith('/') && cleaned.endsWith('/') && url.pathname === '/' && !url.search && !url.hash) {
      cleaned = cleaned.slice(0, -1)
    }
    return cleaned
  } catch {
    return trimmed
      .replace(/[?&](?:utm_[a-zA-Z0-9_]+|fbclid|gclid|msclkid|v)=[^&\s)"']*/gi, '')
      .replace(/\?&/g, '?')
      .replace(/[?&]$/, '')
  }
}

/**
 * Sanitizes external search result destination URLs.
 * Permits strictly http: and https: protocols to prevent DOM-based script execution (XSS).
 * Defuses dangerous schemes (javascript:, data:, vbscript:, file:, blob:) to '#'.
 * Automatically removes tracking parameters (utm_*, fbclid, gclid, v=).
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
      return cleanUrlTrackingParams(parsed.href)
    }
  } catch {
    // Malformed URL string that cannot be parsed
  }

  return '#'
}

