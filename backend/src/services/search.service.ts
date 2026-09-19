import { config } from '../config.js'
import { MockSearchProvider } from './mockProvider.js'
import type { SearchVertical, SearchApiResponse } from '../types/api.js'
import { AppError } from '../middleware/errorHandler.js'

export interface SearchProvider {
  search(query: string, vertical: SearchVertical): Promise<SearchApiResponse> | SearchApiResponse
}

export class SearchService {
  private provider: SearchProvider

  constructor(provider?: SearchProvider) {
    if (provider) {
      this.provider = provider
    } else if (config.demoMode) {
      this.provider = MockSearchProvider
    } else {
      this.provider = {
        search: () => {
          throw new AppError(
            'Live search index is not yet operational. Independent crawler and indexing pipeline are in development. Set DEMO_MODE=true to view prototype responses.',
            501,
            'NOT_IMPLEMENTED'
          )
        },
      }
    }
  }

  async search(query: string, vertical: SearchVertical): Promise<SearchApiResponse> {
    if (!config.demoMode) {
      throw new AppError(
        'Live search index is not yet operational. Independent crawler and indexing pipeline are in development. Set DEMO_MODE=true to view prototype responses.',
        501,
        'NOT_IMPLEMENTED'
      )
    }
    return this.provider.search(query, vertical)
  }
}

export const searchService = new SearchService()
