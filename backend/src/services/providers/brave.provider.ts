import { config } from '../../config.js'
import { AppError } from '../../middleware/errorHandler.js'
import type {
  SearchApiResponse,
  WebSearchResult,
  DiscussionItem,
} from '../../types/api.js'

export interface BraveWebResult {
  title: string
  url: string
  description?: string
  page_age?: string
  profile?: {
    name?: string
    long_name?: string
    img?: string
  }
  extra_snippets?: string[]
}

export interface BraveDiscussionResult {
  title: string
  url: string
  forum_name?: string
  num_answers?: number
  pubdate?: string
  data?: {
    forum_name?: string
    num_answers?: number
    question_date?: string
  }
}

export interface BraveSearchRawResponse {
  query?: {
    original?: string
  }
  web?: {
    total?: number
    results?: BraveWebResult[]
  }
  discussions?: {
    results?: BraveDiscussionResult[]
  }
}

export function normalizeBraveWebResults(rawResults: BraveWebResult[]): WebSearchResult[] {
  return rawResults.map((item, index) => {
    let domain = item.profile?.long_name || ''
    if (!domain && item.url) {
      try {
        domain = new URL(item.url).hostname.replace(/^www\./, '')
      } catch {
        domain = ''
      }
    }

    const metadata = item.profile?.name || (domain ? domain.split('.')[0] : 'Web')
    const displayUrl = domain ? `${domain} > ${item.title.slice(0, 30)}` : item.url

    const sitelinks: string[] = []
    if (item.extra_snippets && Array.isArray(item.extra_snippets)) {
      item.extra_snippets.slice(0, 4).forEach((snip) => {
        if (typeof snip === 'string' && snip.length > 0 && snip.length < 40) {
          sitelinks.push(snip)
        }
      })
    }

    return {
      id: `brave-web-${index + 1}`,
      title: item.title || 'Untitled',
      url: item.url,
      destinationUrl: item.url,
      description: item.description || '',
      domain,
      displayUrl,
      breadcrumb: displayUrl,
      metadata,
      date: item.page_age || undefined,
      sitelinks: sitelinks.length > 0 ? sitelinks : undefined,
      isDemo: false,
    }
  })
}

export function normalizeBraveDiscussions(rawDiscussions: BraveDiscussionResult[]): DiscussionItem[] {
  return rawDiscussions.map((item, index) => {
    const community = item.forum_name || item.data?.forum_name || 'Community'
    const comments =
      typeof item.num_answers === 'number'
        ? item.num_answers
        : typeof item.data?.num_answers === 'number'
        ? item.data.num_answers
        : 0
    const date = item.pubdate || item.data?.question_date || 'Recent'

    return {
      id: `brave-disc-${index + 1}`,
      title: item.title || 'Discussion thread',
      community,
      comments,
      upvotes: 0,
      date,
      preview: item.url,
      isDemo: false,
    }
  })
}

export class BraveSearchProvider {
  private apiKey: string
  private apiUrl: string
  private timeoutMs: number

  constructor(apiKey?: string, apiUrl?: string, timeoutMs?: number) {
    this.apiKey = (apiKey ?? config.braveApiKey).trim()
    this.apiUrl = apiUrl ?? config.braveApiUrl
    this.timeoutMs = timeoutMs ?? config.searchTimeoutMs
  }

  async search(query: string): Promise<SearchApiResponse<WebSearchResult>> {
    if (!this.apiKey) {
      throw new AppError(
        'Live search provider is not configured. Add BRAVE_SEARCH_API_KEY to backend/.env or set SEARCH_PROVIDER=mock.',
        503,
        'PROVIDER_NOT_CONFIGURED'
      )
    }

    const startTime = Date.now()
    const targetUrl = new URL(this.apiUrl)
    targetUrl.searchParams.set('q', query)
    targetUrl.searchParams.set('result_filter', 'web,discussions')
    targetUrl.searchParams.set('safesearch', 'moderate')

    let response: Response
    try {
      response = await fetch(targetUrl.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': this.apiKey,
        },
        signal: AbortSignal.timeout(this.timeoutMs),
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
          'Search provider authentication failed. Check BRAVE_SEARCH_API_KEY.',
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

    const rawData = (await response.json()) as BraveSearchRawResponse
    const webResults = normalizeBraveWebResults(rawData.web?.results || [])
    const discussions = normalizeBraveDiscussions(rawData.discussions?.results || [])
    const executionTimeMs = Date.now() - startTime

    return {
      query,
      vertical: 'all',
      isDemo: false,
      provider: 'brave',
      resultCount: `Found ${webResults.length} web results for "${query}" (Brave Search Index)`,
      results: webResults,
      discussions: discussions.length > 0 ? discussions : undefined,
      metadata: {
        executionTimeMs,
        timestamp: new Date().toISOString(),
        isIndexedData: true,
        notice: 'Live web results powered by Brave Search API.',
        totalEstimate: rawData.web?.total || webResults.length,
      },
    }
  }
}
