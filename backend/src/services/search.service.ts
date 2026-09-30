import { config } from '../config.js'
import { MockSearchProvider } from './mockProvider.js'
import { BraveSearchProvider } from './providers/brave.provider.js'
import { SearxngSearchProvider } from './providers/searxng.provider.js'
import type { SearchVertical, SearchApiResponse } from '../types/api.js'

export interface SearchProvider {
  search(query: string, vertical?: SearchVertical): Promise<SearchApiResponse> | SearchApiResponse
}

export class SearchService {
  private customProvider?: SearchProvider
  private braveProvider: SearchProvider
  private searxngProvider: SearchProvider
  private mockProvider: typeof MockSearchProvider
  private isCustomProvider: boolean

  constructor(customProvider?: SearchProvider) {
    this.isCustomProvider = Boolean(customProvider)
    this.customProvider = customProvider
    this.braveProvider = customProvider || new BraveSearchProvider()
    this.searxngProvider = customProvider || new SearxngSearchProvider()
    this.mockProvider = MockSearchProvider
  }

  async search(query: string, vertical: SearchVertical): Promise<SearchApiResponse> {
    // If a custom provider was injected (e.g. in unit tests)
    if (this.isCustomProvider && this.customProvider) {
      return this.customProvider.search(query, vertical)
    }

    // Route 'all' (Web) vertical to configured live provider
    if (vertical === 'all') {
      if (config.searchProvider === 'searxng') {
        return this.searxngProvider.search(query, vertical)
      }
      if (config.searchProvider === 'brave') {
        return this.braveProvider.search(query, vertical)
      }
    }

    // All other verticals (and 'all' when searchProvider === 'mock' or unsupported) use MockSearchProvider
    return this.mockProvider.search(query, vertical)
  }
}

export const searchService = new SearchService()
