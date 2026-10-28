import { getMockSearchResponse } from '../data/mockSearch'
import {
  mockBooks,
  mockImages,
  mockNews,
  mockPlaces,
  mockProducts,
  mockVideos,
} from '../data/verticalSearch'
import type {
  AISearchResponse,
  BookSearchResponse,
  ImageSearchResponse,
  NewsSearchResponse,
  PlaceSearchResponse,
  ProductSearchResponse,
  SearchResponse,
  VideoSearchResponse,
} from '../types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const withQuery = <T>(query: string, results: T): { query: string; results: T; isDemo: boolean; provider: string } => ({
  query,
  results,
  isDemo: true,
  provider: 'mock-index',
})

/**
 * Backend API Client Helper.
 * Queries the Node/Express backend /api/search endpoint at http://localhost:3001/api/search.
 * Handles HTTP status codes honestly: if the backend returns a 4xx/5xx (e.g. 501 when DEMO_MODE is off),
 * the error is thrown so the UI can display the honest backend response.
 * If the backend is completely offline/unreachable, it gracefully falls back to local prototype data.
 */
async function fetchVerticalFromBackend<T>(
  query: string,
  vertical: string,
  fallbackFn: () => T,
  signal?: AbortSignal
): Promise<T> {
  const trimmed = query.trim()
  if (!trimmed) {
    return fallbackFn()
  }

  if (signal?.aborted) {
    const abortErr = new Error('The operation was aborted')
    abortErr.name = 'AbortError'
    throw abortErr
  }

  try {
    const timeoutController = new AbortController()
    const timeoutId = setTimeout(() => timeoutController.abort(), 20000)

    const onCallerAbort = () => {
      timeoutController.abort()
    }
    if (signal) {
      signal.addEventListener('abort', onCallerAbort, { once: true })
    }

    const url = `${API_BASE_URL}/api/search?q=${encodeURIComponent(trimmed)}&v=${encodeURIComponent(vertical)}`
    let response: Response
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: timeoutController.signal,
      })
    } finally {
      clearTimeout(timeoutId)
      if (signal) {
        signal.removeEventListener('abort', onCallerAbort)
      }
    }

    if (response.ok) {
      const data = await response.json()
      // Adapt backend response to frontend contract
      if (vertical === 'all' || vertical === 'ai') {
        return {
          query: data.query,
          resultCount: data.resultCount,
          results: data.results,
          discussions: data.discussions || [],
          relatedSearches: data.relatedSearches || [],
          questions: data.questions || [],
          aiSummary: data.aiSummary,
          aiAnswer: data.aiAnswer,
          quickContext: data.quickContext,
          isDemo: typeof data.isDemo === 'boolean' ? data.isDemo : false,
          provider: data.provider,
        } as unknown as T
      }

      return {
        query: data.query,
        results: data.results,
        isDemo: typeof data.isDemo === 'boolean' ? data.isDemo : false,
        provider: data.provider,
      } as unknown as T
    }

    // Backend returned an explicit HTTP error (e.g. 400 Bad Request or 501 Not Implemented)
    const errData = (await response.json().catch(() => null)) as { message?: string; code?: string } | null
    const errorMessage = errData?.message || `Search API returned HTTP ${response.status}`
    const httpError = new Error(errorMessage)
    Object.assign(httpError, { status: response.status, code: errData?.code })
    throw httpError
  } catch (err: unknown) {
    // If request was aborted by caller, re-throw AbortError directly
    if (signal?.aborted || (err && typeof err === 'object' && (err as any).name === 'AbortError')) {
      const abortErr = new Error('The operation was aborted')
      abortErr.name = 'AbortError'
      throw abortErr
    }
    // If this is an explicit HTTP error response from the backend, rethrow so the UI handles it honestly
    if (err && typeof err === 'object' && 'status' in err) {
      throw err
    }
    // Network timeout or backend offline: use local prototype fallback
    console.warn('[DitchX Client] Backend unavailable or offline. Falling back to local demo mock data.')
    return fallbackFn()
  }
}

export const searchService = {
  search: (query: string, signal?: AbortSignal): Promise<SearchResponse> =>
    fetchVerticalFromBackend(query, 'all', () => getMockSearchResponse(query), signal),

  images: (query: string, signal?: AbortSignal): Promise<ImageSearchResponse> =>
    fetchVerticalFromBackend(query, 'images', () => withQuery(query, mockImages), signal),

  videos: (query: string, signal?: AbortSignal): Promise<VideoSearchResponse> =>
    fetchVerticalFromBackend(query, 'videos', () => withQuery(query, mockVideos), signal),

  news: (query: string, signal?: AbortSignal): Promise<NewsSearchResponse> =>
    fetchVerticalFromBackend(query, 'news', () => withQuery(query, mockNews), signal),

  maps: (query: string, signal?: AbortSignal): Promise<PlaceSearchResponse> =>
    fetchVerticalFromBackend(query, 'maps', () => withQuery(query, mockPlaces), signal),

  shopping: (query: string, signal?: AbortSignal): Promise<ProductSearchResponse> =>
    fetchVerticalFromBackend(query, 'shopping', () => withQuery(query, mockProducts), signal),

  books: (query: string, signal?: AbortSignal): Promise<BookSearchResponse> =>
    fetchVerticalFromBackend(query, 'books', () => withQuery(query, mockBooks), signal),

  ai: (query: string, signal?: AbortSignal): Promise<AISearchResponse> =>
    fetchVerticalFromBackend(
      query,
      'ai',
      () => ({
        ...getMockSearchResponse(query),
        aiSummary: {
          answer: `"${query}" is an illustrative query in this prototype. This preview demonstrates the planned surface for our future search intelligence layer, which will synthesize independently indexed documents with full provenance and zero user profiling.`,
          sources: [
            { title: `${query} - Wikipedia Overview`, domain: 'en.wikipedia.org', url: 'https://en.wikipedia.org' },
            { title: `Developer Reference for ${query}`, domain: 'developer.mozilla.org', url: 'https://developer.mozilla.org' },
          ],
          relatedQuestions: [
            `What are the core fundamentals of ${query}?`,
            `How does ${query} compare with modern alternatives?`,
          ],
          status: 'mock',
        },
      }),
      signal
    ),
}

export async function checkBackendHealth(): Promise<{
  online: boolean
  demoMode?: boolean
  version?: string
  status?: string
}> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (response.ok) {
      const data = await response.json()
      return {
        online: true,
        demoMode: data.demoMode,
        version: data.version,
        status: data.status,
      }
    }
    return { online: false, status: `HTTP ${response.status}` }
  } catch {
    return { online: false, status: 'unreachable' }
  }
}
