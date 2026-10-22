import { config } from '../../config.js'
import { AppError } from '../../middleware/errorHandler.js'
import type {
  SearchApiResponse,
  WebSearchResult,
  SearchVertical,
  QuickContextData,
} from '../../types/api.js'
import { aiAnswerService } from '../ai.service.js'

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

export function normalizeSearxngWebResults(rawResults: SearxngResultItem[]): WebSearchResult[] {
  return rawResults.map((item, index) => {
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

    // Determine metadata / engine attribution
    let metadata = 'Web'
    if (Array.isArray(item.engines) && item.engines.length > 0) {
      metadata = item.engines.join(', ')
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

export class SearxngSearchProvider {
  private instanceUrl: string
  private timeoutMs: number

  constructor(instanceUrl?: string, timeoutMs?: number) {
    this.instanceUrl = (instanceUrl ?? config.searxngUrl).trim()
    this.timeoutMs = timeoutMs ?? config.searchTimeoutMs
  }

  async search(query: string, vertical?: SearchVertical): Promise<SearchApiResponse<WebSearchResult>> {
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
    if (vertical === 'all' || !vertical) {
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
    const webResults = normalizeSearxngWebResults(rawResults)
    const rawInfobox = Array.isArray(rawData.infoboxes) && rawData.infoboxes.length > 0
      ? (rawData.infoboxes[0] as SearxngInfoboxItem)
      : undefined
    const quickContext = normalizeSearxngInfobox(rawInfobox)
    const aiAnswer = await aiAnswerService.generateAnswer(query, webResults, quickContext)
    const executionTimeMs = Date.now() - startTime

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
