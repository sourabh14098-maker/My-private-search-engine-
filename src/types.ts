export type SearchMode = 'all' | 'images' | 'videos' | 'news' | 'maps' | 'shopping' | 'books' | 'ai'

export const modePaths: Record<SearchMode, string> = {
  all: '/search',
  images: '/images',
  videos: '/videos',
  news: '/news',
  maps: '/maps',
  shopping: '/shopping',
  books: '/books',
  ai: '/ai',
}

export interface SearchResult {
  id: string
  domain: string
  title: string
  description: string
  url: string
  displayUrl?: string
  destinationUrl?: string
  metadata?: string
  breadcrumb?: string
  date?: string
  sitelinks?: string[]
  isDemo?: boolean
}

export interface DiscussionItem {
  id: string
  title: string
  community: string
  comments: number
  upvotes: number
  date: string
  preview?: string
  isDemo?: boolean
}

export interface ImageResult { id: string; title: string; source: string; domain: string; imageUrl: string; width: number; height: number; destinationUrl?: string }
export interface VideoResult { id: string; title: string; source: string; domain: string; thumbnailUrl: string; duration: string; description: string; published: string; destinationUrl?: string }
export interface NewsResult { id: string; headline: string; publisher: string; timestamp: string; description: string; imageUrl?: string; destinationUrl?: string }
export interface PlaceResult { id: string; name: string; category: string; rating: number; address: string; openingStatus: string; distance: string; website: string; destinationUrl?: string }
export interface ProductResult { id: string; name: string; price: string; store: string; rating: number; availability: string; imageUrl: string; destinationUrl?: string }
export interface BookResult { id: string; title: string; author: string; publicationDate: string; description: string; source: string; coverUrl: string; destinationUrl?: string }

export interface SearchResponse {
  query: string
  resultCount: string
  results: SearchResult[]
  relatedSearches?: string[]
  questions?: { question: string; answer: string }[]
  discussions?: DiscussionItem[]
}

export interface ImageSearchResponse { query: string; results: ImageResult[] }
export interface VideoSearchResponse { query: string; results: VideoResult[] }
export interface NewsSearchResponse { query: string; results: NewsResult[] }
export interface PlaceSearchResponse { query: string; results: PlaceResult[] }
export interface ProductSearchResponse { query: string; results: ProductResult[] }
export interface BookSearchResponse { query: string; results: BookResult[] }

export interface AISummary { answer: string; sources: { title: string; domain: string; url: string }[]; relatedQuestions: string[]; status: 'mock' | 'ready' }
export interface AISearchResponse extends SearchResponse { aiSummary?: AISummary }

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
