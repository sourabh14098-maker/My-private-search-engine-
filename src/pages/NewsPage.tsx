import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Clock, Globe2, Newspaper, ShieldCheck, Sparkles } from 'lucide-react'
import { SearchBar } from '../components/search/SearchBar'
import { SearchModeTabs } from '../components/search/SearchModeTabs'
import { SearchFilters } from '../components/search/SearchFilters'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { searchService } from '../services/searchService'
import type { NewsResult, SearchMode } from '../types'

const modePaths: Record<SearchMode, string> = {
  all: '/search',
  images: '/images',
  videos: '/videos',
  news: '/news',
  maps: '/maps',
  shopping: '/shopping',
  books: '/books',
  ai: '/ai',
}

const EMPTY_RESULTS: NewsResult[] = []

export function NewsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = params.get('q') || ''

  const [request, setRequest] = useState<{ query: string; results: NewsResult[] } | null>(null)

  useEffect(() => {
    let cancelled = false

    searchService.news(query).then((response) => {
      if (!cancelled) {
        setRequest({ query, results: response.results })
      }
    })

    return () => {
      cancelled = true
    }
  }, [query])

  const loading = Boolean(!request || request.query !== query)
  const results = request?.results || EMPTY_RESULTS

  const handleSearchSubmit = (nextQuery: string) => {
    const trimmed = nextQuery.trim()
    if (trimmed) {
      navigate(`/news?q=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/news')
    }
  }

  const handleModeChange = (nextMode: SearchMode) => {
    const targetPath = modePaths[nextMode]
    navigate(`${targetPath}${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  }

  // Derive unique publisher sources from the existing demo results
  const publisherSources = useMemo(() => {
    const counts: Record<string, number> = {}
    results.forEach((item) => {
      counts[item.publisher] = (counts[item.publisher] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [results])

  return (
    <div className="page news-page">
      {/* Sticky Search Header */}
      <header className="results-header" role="banner">
        <div className="container">
          <div className="results-search">
            <SearchBar
              key={query}
              initialQuery={query}
              onSubmit={handleSearchSubmit}
              placeholder="Search news & independent journalism..."
            />
            <span className="results-private" title="Queries are kept strictly local">
              <ShieldCheck size={14} aria-hidden="true" /> Private
            </span>
          </div>
          <SearchModeTabs mode="news" onModeChange={handleModeChange} />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="news-layout-container">
        {/* News Heading & Metadata Row */}
        <div className="news-header-meta">
          <div className="news-title-area">
            <span className="eyebrow">
              <Newspaper size={13} aria-hidden="true" />
              INDEPENDENT NEWS VERTICAL
            </span>
            <h1>
              {query ? (
                <>
                  News for <em>“{query}”</em>
                </>
              ) : (
                'Top Stories & Independent Coverage'
              )}
            </h1>
          </div>
          <div className="news-feed-count" aria-live="polite">
            <span className="live-dot" aria-hidden="true" />
            {loading ? (
              'Indexing feed...'
            ) : (
              <span>
                <strong>{results.length}</strong> {results.length === 1 ? 'article' : 'articles'} · Demo feed
              </span>
            )}
          </div>
        </div>

        {/* Refined Search Filters Bar */}
        <div className="news-filters-wrapper">
          <SearchFilters className="news-filters-bar" />
        </div>

        {/* Editorial Feed & Contextual Sidebar Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="news-grid">
            {/* Primary News Feed */}
            <section className="news-feed" aria-label="News headlines list">
              {results.length === 0 ? (
                <div className="news-empty-hero">
                  <Newspaper size={32} aria-hidden="true" />
                  <h2>No news articles found</h2>
                  <p>Try refining your search terms or exploring broader topics like technology, privacy, or web infrastructure.</p>
                </div>
              ) : (
                results.map((article) => (
                  <article className="news-card" key={article.id}>
                    <div className="news-card-inner">
                      <div className="news-card-content">
                        <div className="news-card-meta">
                          <span className="news-card-publisher">{article.publisher}</span>
                          <span className="news-meta-divider" aria-hidden="true">·</span>
                          <span className="news-card-time">
                            <Clock size={11} aria-hidden="true" />
                            {article.timestamp}
                          </span>
                          <span className="news-source-tag">Independent</span>
                        </div>

                        <a
                          href="#read"
                          onClick={(e) => e.preventDefault()}
                          className="news-card-title"
                          aria-label={`${article.headline} from ${article.publisher}`}
                        >
                          <span>{article.headline}</span>
                          <ArrowUpRight size={16} aria-hidden="true" />
                        </a>

                        <p className="news-card-desc">{article.description}</p>
                      </div>

                      {/* Optional Thumbnail (only rendered if imageUrl is present in data) */}
                      {article.imageUrl && (
                        <div className="news-card-thumbnail">
                          <img src={article.imageUrl} alt="" loading="lazy" />
                        </div>
                      )}
                    </div>
                  </article>
                ))
              )}
            </section>

            {/* Secondary Contextual Sidebar */}
            <aside className="news-sidebar" aria-label="News context and sources">
              {/* Coverage & Sources Card */}
              <div className="news-sidebar-card">
                <div className="sidebar-heading">
                  <Globe2 size={13} aria-hidden="true" />
                  PUBLISHERS IN FEED
                </div>
                <h3>Source Diversity</h3>
                <p>Articles are aggregated across independent publishers without clickbait weighting or biased boosting.</p>
                <div className="news-publishers-list">
                  {publisherSources.map(({ name, count }) => (
                    <div className="news-publisher-item" key={name}>
                      <span>{name}</span>
                      <small>{count} {count === 1 ? 'story' : 'stories'}</small>
                    </div>
                  ))}
                </div>
                <span className="sidebar-footnote">
                  Aggregated from {publisherSources.length} verified publications
                </span>
              </div>

              {/* DitchX News Ethos Card */}
              <div className="news-sidebar-card">
                <div className="sidebar-heading">
                  <Sparkles size={13} aria-hidden="true" />
                  INDEX ETHOS
                </div>
                <h3>Unprofiled News</h3>
                <p>
                  Mainstream news engines prioritize articles that confirm engagement profiles or provoke reaction. DitchX indexes chronological reports with zero user tracking.
                </p>
                <span className="sidebar-footnote">
                  No behavioral tracking · No sponsored stories
                </span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
