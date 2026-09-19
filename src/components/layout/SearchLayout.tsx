import { useState } from 'react'
import type { ReactNode } from 'react'
import { SearchHeader } from './SearchHeader'
import { SearchFilters } from '../search/SearchFilters'
import { EmptyState } from '../common/EmptyState'
import type { SearchMode } from '../../types'
import '../../search-results.css'

interface SearchLayoutProps {
  mode: SearchMode
  query: string
  onSearchSubmit?: (query: string) => void
  onModeChange?: (mode: SearchMode) => void
  resultCount?: string
  placeholder?: string
  layoutVariant?: 'standard' | 'full' | 'wide'
  sidebar?: ReactNode
  children: ReactNode
  enableFilters?: boolean
}

export function SearchLayout({
  mode,
  query,
  onSearchSubmit,
  onModeChange,
  resultCount,
  placeholder,
  layoutVariant = 'standard',
  sidebar,
  children,
  enableFilters = true,
}: SearchLayoutProps) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className={`page search-results-page search-vertical-${mode}`}>
      {/* Shared Unified Sticky Header */}
      <SearchHeader
        query={query}
        mode={mode}
        onSearchSubmit={onSearchSubmit}
        onModeChange={onModeChange}
        showFilters={showFilters}
        onToggleFilters={enableFilters ? () => setShowFilters((prev) => !prev) : undefined}
        placeholder={placeholder}
      />

      {/* Main Results Container */}
      <main className="search-content-container">
        {!query ? (
          <EmptyState />
        ) : (
          <>
            {/* Optional Collapsible Filters Bar */}
            {enableFilters && showFilters && (
              <div className="search-filters-container animate-fade-in">
                <SearchFilters />
              </div>
            )}

            {/* Layout Grid according to layoutVariant */}
            {layoutVariant === 'full' ? (
              <div className="search-full-width-container">
                {resultCount && (
                  <div className="search-status-bar" aria-live="polite">
                    <span className="search-result-count">{resultCount}</span>
                  </div>
                )}
                {children}
              </div>
            ) : (
              <div className="search-main-grid">
                <div className="search-results-column">
                  {resultCount && (
                    <div className="search-status-bar" aria-live="polite">
                      <span className="search-result-count">{resultCount}</span>
                    </div>
                  )}
                  {children}
                </div>

                {sidebar && (
                  <aside className="search-sidebar-column" aria-label="Contextual panel">
                    {sidebar}
                  </aside>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
