import { getMockSearchResponse } from '../data/mockSearch'
import { mockBooks, mockImages, mockNews, mockPlaces, mockProducts, mockVideos } from '../data/verticalSearch'
import type { BookSearchResponse, ImageSearchResponse, NewsSearchResponse, PlaceSearchResponse, ProductSearchResponse, SearchResponse, VideoSearchResponse } from '../types'

const withQuery = <T>(query: string, results: T): { query: string; results: T } => ({ query, results })
export const searchService = {
  search: async (query: string): Promise<SearchResponse> => getMockSearchResponse(query),
  images: async (query: string): Promise<ImageSearchResponse> => withQuery(query, mockImages),
  videos: async (query: string): Promise<VideoSearchResponse> => withQuery(query, mockVideos),
  news: async (query: string): Promise<NewsSearchResponse> => withQuery(query, mockNews),
  maps: async (query: string): Promise<PlaceSearchResponse> => withQuery(query, mockPlaces),
  shopping: async (query: string): Promise<ProductSearchResponse> => withQuery(query, mockProducts),
  books: async (query: string): Promise<BookSearchResponse> => withQuery(query, mockBooks),
}
