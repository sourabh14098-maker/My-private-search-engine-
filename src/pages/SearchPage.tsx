import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { SearchLayout } from '../components/layout/SearchLayout'
import { SearchResult } from '../components/search/SearchResult'
import { Discussions } from '../components/search/Discussions'
import { RelatedSearches } from '../components/search/RelatedSearches'
import { PeopleAlsoAsk } from '../components/search/PeopleAlsoAsk'
import { KnowledgeCard } from '../components/search/KnowledgeCard'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { EmptyState } from '../components/common/EmptyState'
import { searchService } from '../services/searchService'
import type { SearchMode, SearchResponse } from '../types'
import { modePaths } from '../types'

export function SearchPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = params.get('q') || ''
  const [data, setData] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query) return

    let cancelled = false

    searchService.search(query)
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Unable to load search results.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [query])

  const loading = Boolean(query && (!data || data.query !== query) && !error)

  const handleSearchSubmit = (nextQuery: string) => {
    const trimmed = nextQuery.trim()
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/search')
    }
  }

  const handleModeChange = (nextMode: SearchMode) => {
    const targetPath = modePaths[nextMode]
    navigate(`${targetPath}${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  }

  const firstBatch = data ? data.results.slice(0, 2) : []
  const remainingBatch = data ? data.results.slice(2) : []

  const resultCount = query
    ? error
      ? 'Search failed'
      : loading
      ? `Searching for "${query}"...`
      : data?.resultCount
    : undefined

  const sidebar = !loading && !error && data && data.results.length > 0 ? (
    <KnowledgeCard query={query} />
  ) : undefined

  return (
    <SearchLayout
      mode="all"
      query={query}
      onSearchSubmit={handleSearchSubmit}
      onModeChange={handleModeChange}
      resultCount={resultCount}
      placeholder="Search the web freely..."
      sidebar={sidebar}
    >
      {error ? (
        <div className="search-error-state" role="alert">
          <AlertCircle size={24} aria-hidden="true" />
          <div>
            <h3>Unable to load search results</h3>
            <p>{error}</p>
          </div>
        </div>
      ) : loading ? (
        <LoadingSkeleton />
      ) : !data || data.results.length === 0 ? (
        <EmptyState
          title={`No results found for "${query}"`}
          copy="Try searching for general topics like 'privacy', 'open source', or 'technology'."
        />
      ) : (
        <>
          {/* Primary Web Results Feed */}
          <div className="results-list" role="feed" aria-label="Web search results">
            {/* First batch of results */}
            {firstBatch.map((result) => (
              <SearchResult
                key={result.id}
                result={result}
                onSitelinkClick={(tag) => handleSearchSubmit(`${query} ${tag}`)}
              />
            ))}

            {/* Discussions Section (Embedded after 2nd result) */}
            {data.discussions && data.discussions.length > 0 && (
              <Discussions items={data.discussions} />
            )}

            {/* Remaining web results */}
            {remainingBatch.map((result) => (
              <SearchResult
                key={result.id}
                result={result}
                onSitelinkClick={(tag) => handleSearchSubmit(`${query} ${tag}`)}
              />
            ))}
          </div>

          {/* Related Searches */}
          {data.relatedSearches && data.relatedSearches.length > 0 && (
            <RelatedSearches
              queries={data.relatedSearches}
              onSelect={(next) => handleSearchSubmit(next)}
            />
          )}

          {/* People Also Ask */}
          {data.questions && data.questions.length > 0 && (
            <PeopleAlsoAsk questions={data.questions} />
          )}
        </>
      )}
    </SearchLayout>
  )
}
