import { config } from '../config.js'
import { MockSearchProvider } from './mockProvider.js'
import { BraveSearchProvider } from './providers/brave.provider.js'
import type { SearchVertical, SearchApiResponse } from '../types/api.js'

export interface SearchProvider {
  search(query: string, vertical?: SearchVertical): Promise<SearchApiResponse> | SearchApiResponse
}

export class SearchService {
  private braveProvider: SearchProvider
  private mockProvider: typeof MockSearchProvider
  private isCustomProvider: boolean

  constructor(customProvider?: SearchProvider) {
    this.isCustomProvider = Boolean(customProvider)
    this.braveProvider = customProvider || new BraveSearchProvider()
    this.mockProvider = MockSearchProvider
  }

  async search(query: string, vertical: SearchVertical): Promise<SearchApiResponse> {
    // If a custom provider was injected (e.g. in unit tests)
    if (this.isCustomProvider) {
      return this.braveProvider.search(query, vertical)
    }

    // Route 'all' (Web) vertical to Brave Search if configured
    if (vertical === 'all' && config.searchProvider === 'brave') {
      return this.braveProvider.search(query, vertical)
    }

    // All other verticals (and 'all' when searchProvider === 'mock') use MockSearchProvider
    return this.mockProvider.search(query, vertical)
  }
}

export const searchService = new SearchService()
