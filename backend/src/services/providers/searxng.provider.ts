import { config } from '../../config.js'
import { AppError } from '../../middleware/errorHandler.js'
import type {
  SearchApiResponse,
  WebSearchResult,
  NewsResult,
  ImageResult,
  VideoResult,
  SearchVertical,
  QuickContextData,
  AIAnswerData,
} from '../../types/api.js'
import {
  aiAnswerService,
  classifyQueryIntent,
  isAuthoritativeSource,
  isLowQualityDiscussionSource,
} from '../ai.service.js'

export { isAuthoritativeSource, isLowQualityDiscussionSource }

export interface SearxngResultItem {
  title?: string
  url?: string
  content?: string
  snippet?: string
  engine?: string
  engines?: string[]
  publishedDate?: string
  pubdate?: string
  category?: string
  score?: number
  img_src?: string
  thumbnail_src?: string
  thumbnail?: string
  source?: string
  width?: number
  height?: number
  length?: string
  [key: string]: unknown
}

export interface SearxngInfoboxItem {
  infobox?: string
  id?: string
  content?: string
  img_src?: string
  urls?: Array<{ title?: string; url?: string }>
  engine?: string
  engines?: string[]
  attributes?: Array<{ label?: string; value?: string; [key: string]: unknown }>
  [key: string]: unknown
}

export interface SearxngRawResponse {
  query?: string
  number_of_results?: number
  results?: SearxngResultItem[]
  answers?: unknown[]
  corrections?: unknown[]
  infoboxes?: SearxngInfoboxItem[]
  suggestions?: string[]
  unresponsive_engines?: unknown[]
  [key: string]: unknown
}

/**
 * Canonicalizes a URL for deduplication by:
 * - Lowercasing protocol and hostname
 * - Stripping www.
 * - Stripping standard ports (:80, :443)
 * - Removing common tracking query parameters (utm_*, gclid, fbclid, ref, etc.)
 * - Removing URL hash fragments (#)
 * - Normalizing trailing slash on pathnames
 */
export function canonicalizeUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return ''
  try {
    const parsed = new URL(rawUrl.trim())
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')
    if ((parsed.protocol === 'http:' && parsed.port === '80') || (parsed.protocol === 'https:' && parsed.port === '443')) {
      parsed.port = ''
    }
    const trackingExact = new Set(['gclid', 'fbclid', 'ref', 'source', 'v', '_ga', 'ncid', 'msclkid'])
    const toDelete: string[] = []
    parsed.searchParams.forEach((_val, key) => {
      const lower = key.toLowerCase()
      if (trackingExact.has(lower) || lower.startsWith('utm_') || lower.startsWith('mc_')) {
        toDelete.push(key)
      }
    })
    for (const k of toDelete) {
      parsed.searchParams.delete(k)
    }
    parsed.hash = ''
    let pathname = parsed.pathname
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1)
    }
    parsed.pathname = pathname
    const search = parsed.searchParams.toString()
    return `${parsed.protocol}//${host}${parsed.pathname}${search ? '?' + search : ''}`
  } catch {
    return rawUrl.trim().toLowerCase()
  }
}

/**
 * Calculates a composite relevance score for ranking SearXNG results:
 * - SearXNG engine score
 * - Multi-engine consensus bonus (when multiple engines return the same result)
 * - Exact and token matches in the title
 * - Query token matches in snippet / content
 * - Domain authority boost (official government, educational, scientific research, encyclopedic sources)
 * - Intent-sensitive science grounding bonus for scientific explanations
 * - Demotion of low-quality discussion forums and unvetted blogs
 * - Freshness and recency boost for time-sensitive queries
 */
export function calculateResultRelevance(
  item: SearxngResultItem,
  queryTokens: string[],
  cleanQuery: string,
  isTimeSensitive = false,
  isScienceQuery = false
): number {
  let score = typeof item.score === 'number' && !Number.isNaN(item.score) ? item.score : 1.0

  const engineCount = Array.isArray(item.engines) && item.engines.length > 0
    ? item.engines.length
    : item.engine ? 1 : 1
  if (engineCount > 1) {
    score += (engineCount - 1) * 0.75
  }

  const titleLower = (item.title || '').toLowerCase()
  const contentLower = (item.content || item.snippet || '').toLowerCase()
  const urlLower = (item.url || '').toLowerCase()
  const isDiscussion = isLowQualityDiscussionSource(urlLower)

  if (cleanQuery && titleLower.includes(cleanQuery)) {
    score += isDiscussion ? 0.5 : 2.5
  }

  for (const token of queryTokens) {
    const tokenStem = token.length >= 4 && token.endsWith('s') ? token.slice(0, -1) : token
    if (titleLower.includes(token) || (tokenStem.length >= 4 && titleLower.includes(tokenStem))) {
      score += isDiscussion ? 0.4 : 0.8
    }
    if (contentLower.includes(token) || (tokenStem.length >= 4 && contentLower.includes(tokenStem))) {
      score += 0.2
    }
  }

  // 1. Domain Authority & Scientific Quality Boost
  if (/\.(?:gov|mil)(?:\.[a-z]{2,3})?(?:\/|$)/.test(urlLower) || urlLower.includes('.gov/') || urlLower.includes('.mil/')) {
    score += 2.0 // Official government & public institutions
    if (isScienceQuery) score += 1.0
  } else if (/\.(?:edu|ac)(?:\.[a-z]{2,3})?(?:\/|$)/.test(urlLower) || urlLower.includes('.edu/') || urlLower.includes('.ac.')) {
    score += 1.8 // Academic & higher education institutions
    if (isScienceQuery) score += 1.0
  } else if (
    urlLower.includes('nature.com') ||
    urlLower.includes('science.org') ||
    urlLower.includes('sciencedirect.com') ||
    urlLower.includes('ncbi.nlm.nih.gov') ||
    urlLower.includes('pubmed.ncbi.nlm.nih.gov') ||
    urlLower.includes('cell.com') ||
    urlLower.includes('pnas.org') ||
    urlLower.includes('acs.org') ||
    urlLower.includes('rsc.org') ||
    urlLower.includes('royalsocietypublishing.org') ||
    urlLower.includes('springer.com') ||
    urlLower.includes('wiley.com') ||
    urlLower.includes('academic.oup.com') ||
    urlLower.includes('cambridge.org') ||
    urlLower.includes('plos.org') ||
    urlLower.includes('frontiersin.org') ||
    urlLower.includes('arxiv.org')
  ) {
    score += 1.8 // Peer-reviewed scientific & research publishers
    if (isScienceQuery) score += 1.0
  } else if (
    urlLower.includes('scientificamerican.com') ||
    urlLower.includes('newscientist.com') ||
    urlLower.includes('phys.org') ||
    urlLower.includes('nationalgeographic.com') ||
    urlLower.includes('smithsonianmag.com') ||
    urlLower.includes('sciencenews.org') ||
    urlLower.includes('chemistryworld.com') ||
    urlLower.includes('livescience.com') ||
    urlLower.includes('sciencefocus.com') ||
    urlLower.includes('mayoclinic.org') ||
    urlLower.includes('clevelandclinic.org') ||
    urlLower.includes('hopkinsmedicine.org') ||
    urlLower.includes('loc.gov') ||
    urlLower.includes('wikipedia.org') ||
    urlLower.includes('britannica.com')
  ) {
    score += 1.5 // Established scientific, medical, and encyclopedic authorities
    if (isScienceQuery) score += 0.8
  } else if (
    urlLower.includes('developer.mozilla.org') ||
    urlLower.includes('docs.python.org') ||
    urlLower.includes('docs.oracle.com') ||
    urlLower.includes('learn.microsoft.com') ||
    urlLower.includes('docs.') ||
    urlLower.includes('developer.') ||
    urlLower.includes('github.com')
  ) {
    score += 1.2 // Primary technical documentation
  }

  // 2. Demotion for Low-Quality Discussion Forums & Unvetted Blogs
  if (isLowQualityDiscussionSource(urlLower)) {
    score -= 1.8
    if (isScienceQuery) {
      score -= 0.8 // Strongly discourage unvetted forum speculation for scientific explanations
    }
  }

  // 3. Freshness & Recency Boost (for time-sensitive or current affairs queries)
  if (isTimeSensitive) {
    const pubDate = String(item.publishedDate || item.pubdate || '').toLowerCase()
    const currentYear = new Date().getFullYear().toString()
    const lastYear = (new Date().getFullYear() - 1).toString()

    if (pubDate.includes(currentYear) || titleLower.includes(currentYear) || contentLower.includes(currentYear)) {
      score += 1.5 // Current year recency bonus
    } else if (pubDate.includes(lastYear) || titleLower.includes(lastYear)) {
      score += 0.75 // Recent year bonus
    }
  }

  return score
}

export function normalizeSearxngInfobox(rawInfobox?: SearxngInfoboxItem): QuickContextData | undefined {
  if (!rawInfobox || typeof rawInfobox !== 'object') return undefined

  const title = (rawInfobox.infobox || '').trim()
  const content = (rawInfobox.content || '').trim()

  if (!title && !content) return undefined

  const primaryUrl = Array.isArray(rawInfobox.urls) && rawInfobox.urls.length > 0
    ? rawInfobox.urls[0]?.url || rawInfobox.id
    : rawInfobox.id

  const sourceTitle = Array.isArray(rawInfobox.urls) && rawInfobox.urls.length > 0
    ? rawInfobox.urls[0]?.title || rawInfobox.engine || 'Wikipedia'
    : rawInfobox.engine || 'Wikipedia'

  const attributes = Array.isArray(rawInfobox.attributes)
    ? rawInfobox.attributes
        .filter((attr) => attr && typeof attr.label === 'string' && typeof attr.value === 'string')
        .slice(0, 6)
        .map((attr) => ({ label: attr.label!.trim(), value: attr.value!.trim() }))
    : undefined

  return {
    title: title || 'Quick Context',
    content,
    url: primaryUrl || undefined,
    destinationUrl: primaryUrl || undefined,
    source: sourceTitle,
    imageUrl: rawInfobox.img_src || undefined,
    attributes: attributes && attributes.length > 0 ? attributes : undefined,
  }
}

export function normalizeSearxngWebResults(
  rawResults: SearxngResultItem[],
  query?: string
): WebSearchResult[] {
  const cleanQuery = (query || '').toLowerCase().trim()
  const queryTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 2)
  const queryAnalysis = cleanQuery ? classifyQueryIntent(cleanQuery) : undefined
  const isTimeSensitive = queryAnalysis ? queryAnalysis.isTimeSensitive : false
  const isScienceQuery = queryAnalysis ? queryAnalysis.intent === 'science_education' : false

  const dedupMap = new Map<string, { item: SearxngResultItem; engines: Set<string>; calculatedScore: number }>()

  for (let i = 0; i < rawResults.length; i++) {
    const item = rawResults[i]
    if (!item || typeof item !== 'object') continue
    const canonical = item.url ? canonicalizeUrl(item.url) : `__empty_entry_${i}`

    const itemEngines = Array.isArray(item.engines) && item.engines.length > 0
      ? item.engines
      : item.engine ? [item.engine] : []

    const relScore = calculateResultRelevance(item, queryTokens, cleanQuery, isTimeSensitive, isScienceQuery)

    const existing = dedupMap.get(canonical)
    if (existing) {
      for (const e of itemEngines) existing.engines.add(e)
      existing.calculatedScore += 0.75
      const existingDesc = existing.item.content || existing.item.snippet || ''
      const newDesc = item.content || item.snippet || ''
      if (newDesc.length > existingDesc.length) {
        existing.item.content = newDesc
      }
      if (relScore > existing.calculatedScore) {
        existing.calculatedScore = relScore
      }
    } else {
      dedupMap.set(canonical, {
        item: { ...item },
        engines: new Set(itemEngines),
        calculatedScore: relScore,
      })
    }
  }

  const sortedEntries = cleanQuery
    ? Array.from(dedupMap.values()).sort((a, b) => b.calculatedScore - a.calculatedScore)
    : Array.from(dedupMap.values())

  return sortedEntries.map((entry, index) => {
    const item = entry.item
    let domain = ''
    if (item.url) {
      try {
        domain = new URL(item.url).hostname.replace(/^www\./, '')
      } catch {
        domain = ''
      }
    }

    const title = (item.title || 'Untitled').trim()
    const description = (item.content || item.snippet || '').trim()

    const enginesArray = Array.from(entry.engines)
    let metadata = 'Web'
    if (enginesArray.length > 0) {
      metadata = enginesArray.join(', ')
    } else if (item.engine) {
      metadata = item.engine
    } else if (domain) {
      metadata = domain.split('.')[0]
    }

    const displayUrl = domain ? `${domain} > ${title.slice(0, 30)}` : (item.url || '')

    return {
      id: `searxng-web-${index + 1}`,
      title,
      url: item.url || '',
      destinationUrl: item.url || '',
      description,
      domain,
      displayUrl,
      breadcrumb: displayUrl,
      metadata,
      date: item.publishedDate || item.pubdate || undefined,
      isDemo: false,
    }
  })
}

export function normalizeSearxngNewsResults(
  rawResults: SearxngResultItem[],
  query?: string
): NewsResult[] {
  const cleanQuery = (query || '').toLowerCase().trim()
  const queryTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 2)

  const dedupMap = new Map<string, { item: SearxngResultItem; engines: Set<string>; calculatedScore: number }>()

  for (const item of rawResults) {
    if (!item || !item.url) continue
    const canonical = canonicalizeUrl(item.url)
    if (!canonical) continue

    const itemEngines = Array.isArray(item.engines) && item.engines.length > 0
      ? item.engines
      : item.engine ? [item.engine] : []

    const relScore = calculateResultRelevance(item, queryTokens, cleanQuery)

    const existing = dedupMap.get(canonical)
    if (existing) {
      for (const e of itemEngines) existing.engines.add(e)
      existing.calculatedScore += 0.75
      const existingDesc = existing.item.content || existing.item.snippet || ''
      const newDesc = item.content || item.snippet || ''
      if (newDesc.length > existingDesc.length) {
        existing.item.content = newDesc
      }
    } else {
      dedupMap.set(canonical, {
        item: { ...item },
        engines: new Set(itemEngines),
        calculatedScore: relScore,
      })
    }
  }

  const sortedEntries = Array.from(dedupMap.values()).sort((a, b) => b.calculatedScore - a.calculatedScore)

  return sortedEntries.map((entry, index) => {
    const item = entry.item
    let domain = ''
    if (item.url) {
      try {
        domain = new URL(item.url).hostname.replace(/^www\./, '')
      } catch {
        domain = ''
      }
    }

    const enginesArray = Array.from(entry.engines)
    const publisher = domain || (enginesArray.length > 0 ? enginesArray.join(', ') : item.engine) || 'News'
    const headline = (item.title || 'Untitled Article').trim()
    const description = (item.content || item.snippet || '').trim()
    const imageUrl = typeof item.img_src === 'string'
      ? item.img_src
      : typeof item.thumbnail === 'string'
      ? item.thumbnail
      : undefined

    return {
      id: `searxng-news-${index + 1}`,
      headline,
      publisher,
      timestamp: item.publishedDate || item.pubdate || 'Recent',
      description,
      imageUrl,
      destinationUrl: item.url || '',
    }
  })
}

export function normalizeSearxngImageResults(
  rawResults: SearxngResultItem[],
  query?: string
): ImageResult[] {
  const cleanQuery = (query || '').toLowerCase().trim()
  const queryTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 2)

  const dedupMap = new Map<string, { item: SearxngResultItem; calculatedScore: number }>()

  for (const item of rawResults) {
    if (!item) continue
    const imgUrl = (typeof item.img_src === 'string' && item.img_src)
      ? item.img_src
      : (typeof item.thumbnail_src === 'string' && item.thumbnail_src)
      ? item.thumbnail_src
      : item.url
    if (!imgUrl) continue

    const canonical = canonicalizeUrl(imgUrl)
    if (!canonical) continue

    const relScore = calculateResultRelevance(item, queryTokens, cleanQuery)
    if (!dedupMap.has(canonical)) {
      dedupMap.set(canonical, { item, calculatedScore: relScore })
    }
  }

  const sortedEntries = Array.from(dedupMap.values()).sort((a, b) => b.calculatedScore - a.calculatedScore)

  return sortedEntries.map((entry, index) => {
    const item = entry.item
    let domain = ''
    const pageUrl = item.url || ''
    if (pageUrl) {
      try {
        domain = new URL(pageUrl).hostname.replace(/^www\./, '')
      } catch {
        domain = ''
      }
    }

    const title = (item.title || 'Image').trim()
    const imageUrl = (typeof item.img_src === 'string' && item.img_src)
      ? item.img_src
      : (typeof item.thumbnail_src === 'string' && item.thumbnail_src)
      ? item.thumbnail_src
      : item.url || ''

    return {
      id: `searxng-img-${index + 1}`,
      title,
      source: domain || item.engine || 'Web',
      domain: domain || 'web',
      imageUrl,
      width: typeof item.width === 'number' && item.width > 0 ? item.width : 600,
      height: typeof item.height === 'number' && item.height > 0 ? item.height : 400,
      destinationUrl: pageUrl || imageUrl,
    }
  })
}

export function normalizeSearxngVideoResults(
  rawResults: SearxngResultItem[],
  query?: string
): VideoResult[] {
  const cleanQuery = (query || '').toLowerCase().trim()
  const queryTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 2)

  const dedupMap = new Map<string, { item: SearxngResultItem; calculatedScore: number }>()

  for (const item of rawResults) {
    if (!item || !item.url) continue
    const canonical = canonicalizeUrl(item.url)
    if (!canonical) continue

    const relScore = calculateResultRelevance(item, queryTokens, cleanQuery)
    if (!dedupMap.has(canonical)) {
      dedupMap.set(canonical, { item, calculatedScore: relScore })
    }
  }

  const sortedEntries = Array.from(dedupMap.values()).sort((a, b) => b.calculatedScore - a.calculatedScore)

  return sortedEntries.map((entry, index) => {
    const item = entry.item
    let domain = ''
    if (item.url) {
      try {
        domain = new URL(item.url).hostname.replace(/^www\./, '')
      } catch {
        domain = ''
      }
    }

    const title = (item.title || 'Video').trim()
    const description = (item.content || item.snippet || '').trim()
    const thumbnailUrl = typeof item.thumbnail === 'string'
      ? item.thumbnail
      : typeof item.img_src === 'string'
      ? item.img_src
      : ''
    const duration = typeof item.length === 'string' ? item.length : 'Video'

    return {
      id: `searxng-vid-${index + 1}`,
      title,
      source: domain || item.engine || 'Video',
      domain: domain || 'video',
      thumbnailUrl,
      duration,
      description,
      published: item.publishedDate || item.pubdate || 'Recent',
      destinationUrl: item.url || '',
    }
  })
}

export class SearxngSearchProvider {
  private instanceUrl: string
  private timeoutMs: number

  constructor(instanceUrl?: string, timeoutMs?: number) {
    this.instanceUrl = (instanceUrl ?? config.searxngUrl).trim()
    this.timeoutMs = timeoutMs ?? config.searchTimeoutMs
  }

  async search(query: string, vertical: SearchVertical = 'all'): Promise<SearchApiResponse> {
    if (!this.instanceUrl) {
      throw new AppError(
        'Live search provider is not configured. Add SEARXNG_URL to backend/.env or set SEARCH_PROVIDER=mock.',
        503,
        'PROVIDER_NOT_CONFIGURED'
      )
    }

    let targetUrl: URL
    try {
      const baseUrl = this.instanceUrl.endsWith('/search')
        ? this.instanceUrl
        : `${this.instanceUrl.replace(/\/+$/, '')}/search`
      targetUrl = new URL(baseUrl)
    } catch {
      throw new AppError(
        `Invalid SearXNG URL configured: ${this.instanceUrl}`,
        500,
        'INVALID_PROVIDER_URL'
      )
    }

    targetUrl.searchParams.set('q', query)
    targetUrl.searchParams.set('format', 'json')
    if (vertical === 'news') {
      targetUrl.searchParams.set('categories', 'news')
    } else if (vertical === 'images') {
      targetUrl.searchParams.set('categories', 'images')
    } else if (vertical === 'videos') {
      targetUrl.searchParams.set('categories', 'videos')
    } else {
      targetUrl.searchParams.set('categories', 'general')
    }

    const startTime = Date.now()
    let response: Response

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      response = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      })
    } catch (err: unknown) {
      const errorObj = err as { name?: string; message?: string }
      if (errorObj?.name === 'TimeoutError' || errorObj?.name === 'AbortError') {
        throw new AppError(
          `Search provider request timed out after ${this.timeoutMs}ms.`,
          504,
          'SEARCH_TIMEOUT'
        )
      }
      throw new AppError(
        `Failed to reach search provider: ${errorObj?.message || 'Network error'}`,
        502,
        'UPSTREAM_NETWORK_ERROR'
      )
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      if (response.status === 429) {
        throw new AppError(
          'Search provider rate limit or quota exceeded. Please try again later.',
          429,
          'RATE_LIMIT_EXCEEDED'
        )
      }
      if (response.status === 401 || response.status === 403) {
        throw new AppError(
          'Search provider access denied. Check your SearXNG configuration and permissions.',
          502,
          'PROVIDER_AUTHENTICATION_ERROR'
        )
      }
      const errText = await response.text().catch(() => '')
      throw new AppError(
        `Search provider error (HTTP ${response.status}): ${errText.slice(0, 100) || 'Unknown upstream failure'}`,
        502,
        'UPSTREAM_ERROR'
      )
    }

    let rawData: SearxngRawResponse
    try {
      const text = await response.text()
      rawData = JSON.parse(text) as SearxngRawResponse
    } catch {
      throw new AppError(
        'Search provider returned malformed non-JSON data.',
        502,
        'UPSTREAM_MALFORMED_RESPONSE'
      )
    }

    if (!rawData || typeof rawData !== 'object') {
      throw new AppError(
        'Search provider returned an invalid response structure.',
        502,
        'UPSTREAM_MALFORMED_RESPONSE'
      )
    }

    const rawResults = Array.isArray(rawData.results) ? rawData.results : []
    const executionTimeMs = Date.now() - startTime

    if (vertical === 'news') {
      const newsResults = normalizeSearxngNewsResults(rawResults, query)
      return {
        query,
        vertical: 'news',
        isDemo: false,
        provider: 'searxng',
        resultCount:
          newsResults.length > 0
            ? `Found ${newsResults.length} news articles for "${query}" (SearXNG Metasearch)`
            : `No news found for "${query}" (SearXNG Metasearch)`,
        results: newsResults,
        metadata: {
          executionTimeMs,
          timestamp: new Date().toISOString(),
          isIndexedData: true,
          notice: 'Live news results powered by SearXNG metasearch instance.',
          totalEstimate: typeof rawData.number_of_results === 'number' ? rawData.number_of_results : newsResults.length,
        },
      }
    }

    if (vertical === 'images') {
      const imageResults = normalizeSearxngImageResults(rawResults, query)
      return {
        query,
        vertical: 'images',
        isDemo: false,
        provider: 'searxng',
        resultCount:
          imageResults.length > 0
            ? `Found ${imageResults.length} images for "${query}" (SearXNG Metasearch)`
            : `No images found for "${query}" (SearXNG Metasearch)`,
        results: imageResults,
        metadata: {
          executionTimeMs,
          timestamp: new Date().toISOString(),
          isIndexedData: true,
          notice: 'Live image results powered by SearXNG metasearch instance.',
          totalEstimate: typeof rawData.number_of_results === 'number' ? rawData.number_of_results : imageResults.length,
        },
      }
    }

    if (vertical === 'videos') {
      const videoResults = normalizeSearxngVideoResults(rawResults, query)
      return {
        query,
        vertical: 'videos',
        isDemo: false,
        provider: 'searxng',
        resultCount:
          videoResults.length > 0
            ? `Found ${videoResults.length} videos for "${query}" (SearXNG Metasearch)`
            : `No videos found for "${query}" (SearXNG Metasearch)`,
        results: videoResults,
        metadata: {
          executionTimeMs,
          timestamp: new Date().toISOString(),
          isIndexedData: true,
          notice: 'Live video results powered by SearXNG metasearch instance.',
          totalEstimate: typeof rawData.number_of_results === 'number' ? rawData.number_of_results : videoResults.length,
        },
      }
    }

    // Default: 'all'
    const webResults = normalizeSearxngWebResults(rawResults, query)
    const rawInfobox = Array.isArray(rawData.infoboxes) && rawData.infoboxes.length > 0
      ? (rawData.infoboxes[0] as SearxngInfoboxItem)
      : undefined
    const quickContext = normalizeSearxngInfobox(rawInfobox)
    let aiAnswer: AIAnswerData | undefined
    try {
      aiAnswer = await aiAnswerService.generateAnswer(query, webResults, quickContext)
    } catch {
      aiAnswer = {
        status: 'unavailable',
        provider: config.aiProvider,
        notice: 'AI Answer Layer is temporarily unavailable. Organic search results are displayed below.',
        sources: aiAnswerService.extractSourceCitations(webResults).slice(0, 5),
      }
    }

    const relatedSearches =
      Array.isArray(rawData.suggestions) && rawData.suggestions.length > 0
        ? rawData.suggestions.filter((s): s is string => typeof s === 'string' && s.length > 0).slice(0, 8)
        : undefined

    return {
      query,
      vertical: 'all',
      isDemo: false,
      provider: 'searxng',
      resultCount:
        webResults.length > 0
          ? `Found ${webResults.length} web results for "${query}" (SearXNG Metasearch)`
          : `No results found for "${query}" (SearXNG Metasearch)`,
      results: webResults,
      relatedSearches,
      aiAnswer,
      quickContext,
      metadata: {
        executionTimeMs,
        timestamp: new Date().toISOString(),
        isIndexedData: true,
        notice: 'Live web results powered by SearXNG metasearch instance.',
        totalEstimate: typeof rawData.number_of_results === 'number' ? rawData.number_of_results : webResults.length,
      },
    }
  }
}
