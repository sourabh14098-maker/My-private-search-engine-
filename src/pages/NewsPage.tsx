import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowUpRight, Clock, Globe2, Newspaper, Sparkles } from 'lucide-react'
import { SearchLayout } from '../components/layout/SearchLayout'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { searchService } from '../services/searchService'
import type { NewsResult, SearchMode } from '../types'
import { modePaths } from '../types'

const EMPTY_RESULTS: NewsResult[] = []

export function NewsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = params.get('q') || ''

  const [request, setRequest] = useState<{ query: string; results: NewsResult[] } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    searchService.news(query)
      .then((response) => {
        if (!cancelled) {
          setRequest({ query, results: response.results })
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Unable to load news results.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [query])

  const loading = Boolean((!request || request.query !== query) && !error)
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

  const resultCount = query
    ? error
      ? 'Search failed'
      : loading
      ? 'Loading mock news feed...'
      : `Demo results · ${results.length} sample articles for "${query}" (Mock index)`
    : undefined

  const sidebarContent = (
    <div className="news-sidebar-content">
      {/* Coverage & Sources Card */}
      <div className="news-sidebar-card">
        <div className="sidebar-heading">
          <Globe2 size={13} aria-hidden="true" />
          SAMPLE SOURCES (DEMO)
        </div>
        <h3>Source Diversity</h3>
        <p>In this prototype, articles illustrate reporting from independent publisher concepts without engagement weighting or biased boosting.</p>
        <div className="news-publishers-list">
          {publisherSources.map(({ name, count }) => (
            <div className="news-publisher-item" key={name}>
              <span>{name}</span>
              <small>{count} {count === 1 ? 'sample story' : 'sample stories'}</small>
            </div>
          ))}
        </div>
        <span className="sidebar-footnote">
          Demo feed: {publisherSources.length} sample publisher concepts
        </span>
      </div>

      {/* DitchX News Ethos Card */}
      <div className="news-sidebar-card">
        <div className="sidebar-heading">
          <Sparkles size={13} aria-hidden="true" />
          PLANNED INDEX ETHOS
        </div>
        <h3>Unprofiled News Vision</h3>
        <p>
          Mainstream news engines often prioritize content that triggers engagement profiles. DitchX’s planned crawler architecture aims to index chronological reporting with zero user tracking.
        </p>
        <span className="sidebar-footnote">
          Planned architecture · Current results are mock data
        </span>
      </div>
    </div>
  )

  return (
    <SearchLayout
      mode="news"
      query={query}
      onSearchSubmit={handleSearchSubmit}
      onModeChange={handleModeChange}
      resultCount={resultCount}
      placeholder="Search news & independent journalism..."
      sidebar={sidebarContent}
    >
      {error ? (
        <div className="search-error-state" role="alert">
          <AlertCircle size={24} aria-hidden="true" />
          <div>
            <h3>Unable to load news results</h3>
            <p>{error}</p>
          </div>
        </div>
      ) : loading ? (
        <LoadingSkeleton />
      ) : results.length === 0 ? (
        <div className="news-empty-hero">
          <Newspaper size={32} aria-hidden="true" />
          <h2>No sample news articles found</h2>
          <p>Try searching for sample topics like &ldquo;software&rdquo;, &ldquo;privacy&rdquo;, or &ldquo;web&rdquo;.</p>
        </div>
      ) : (
        <div className="news-feed" role="feed" aria-label="News articles feed">
          {results.map((article) => {
            const destUrl =
              article.destinationUrl ||
              `https://duckduckgo.com/?q=${encodeURIComponent(article.headline)}&ia=news`

            return (
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
                      <span className="news-source-tag">Demo article</span>
                    </div>

                    <a
                      href={destUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="news-card-title"
                      aria-label={`${article.headline} from ${article.publisher} (opens web search)`}
                    >
                      <span>{article.headline}</span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>

                    <p className="news-card-desc">{article.description}</p>
                  </div>

                  {article.imageUrl && (
                    <div className="news-card-thumbnail">
                      <img src={article.imageUrl} alt="" loading="lazy" />
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </SearchLayout>
  )
}
