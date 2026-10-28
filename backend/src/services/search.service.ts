import { config, type SearchProviderType } from '../config.js'
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
  private activeProviderType?: SearchProviderType

  constructor(customProvider?: SearchProvider, providerType?: SearchProviderType) {
    this.isCustomProvider = Boolean(customProvider)
    this.customProvider = customProvider
    this.activeProviderType = providerType
    this.braveProvider = customProvider || new BraveSearchProvider()
    this.searxngProvider = customProvider || new SearxngSearchProvider()
    this.mockProvider = MockSearchProvider
  }

  async search(query: string, vertical: SearchVertical): Promise<SearchApiResponse> {
    // If a custom provider was injected (e.g. in unit tests)
    if (this.isCustomProvider && this.customProvider) {
      return this.customProvider.search(query, vertical)
    }

    const providerType = this.activeProviderType || config.searchProvider

    // Route supported verticals to SearXNG when active provider is searxng
    if (providerType === 'searxng') {
      if (vertical === 'all' || vertical === 'news' || vertical === 'images' || vertical === 'videos') {
        return this.searxngProvider.search(query, vertical)
      }
    }

    // Route 'all' (Web) vertical to configured live Brave provider
    if (vertical === 'all' && providerType === 'brave') {
      return this.braveProvider.search(query, vertical)
    }

    // All other verticals (and all verticals when searchProvider === 'mock' or unsupported) use MockSearchProvider
    return this.mockProvider.search(query, vertical)
  }
}

export const searchService = new SearchService()

