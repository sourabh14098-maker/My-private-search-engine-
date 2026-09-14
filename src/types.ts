export type SearchMode = 'all' | 'images' | 'videos' | 'news' | 'maps' | 'shopping' | 'books' | 'ai'

export interface SearchResult {
  id: string
  domain: string
  title: string
  description: string
  url: string
  metadata?: string
  breadcrumb?: string
  date?: string
}

export interface ImageResult { id: string; title: string; source: string; domain: string; imageUrl: string; width: number; height: number }
export interface VideoResult { id: string; title: string; source: string; domain: string; thumbnailUrl: string; duration: string; description: string; published: string }
export interface NewsResult { id: string; headline: string; publisher: string; timestamp: string; description: string; imageUrl?: string }
export interface PlaceResult { id: string; name: string; category: string; rating: number; address: string; openingStatus: string; distance: string; website: string }
export interface ProductResult { id: string; name: string; price: string; store: string; rating: number; availability: string; imageUrl: string }
export interface BookResult { id: string; title: string; author: string; publicationDate: string; description: string; source: string; coverUrl: string }

export interface SearchResponse {
  query: string
  resultCount: string
  results: SearchResult[]
  relatedSearches?: string[]
  questions?: { question: string; answer: string }[]
}

export interface ImageSearchResponse { query: string; results: ImageResult[] }
export interface VideoSearchResponse { query: string; results: VideoResult[] }
export interface NewsSearchResponse { query: string; results: NewsResult[] }
export interface PlaceSearchResponse { query: string; results: PlaceResult[] }
export interface ProductSearchResponse { query: string; results: ProductResult[] }
export interface BookSearchResponse { query: string; results: BookResult[] }

export interface AISummary { answer: string; sources: { title: string; domain: string; url: string }[]; relatedQuestions: string[]; status: 'mock' | 'ready' }

export interface PrivacySettings {
  searchProfile: boolean
  personalizedAds: boolean
  remoteHistory: boolean
  personalization: boolean
  analytics: boolean
  localHistory: boolean
}

export interface UserPreferences {
  safeSearch: boolean
  language: string
  region: string
  theme: 'dark' | 'light'
  animations: boolean
  compactResults: boolean
}
