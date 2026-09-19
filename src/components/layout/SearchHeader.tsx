import { Link, useNavigate } from 'react-router-dom'
import { Settings2, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { Logo } from '../common/Logo'
import { SearchBar } from '../search/SearchBar'
import { SearchModeTabs } from '../search/SearchModeTabs'
import type { SearchMode } from '../../types'
import { modePaths } from '../../types'

interface SearchHeaderProps {
  query: string
  mode: SearchMode
  onSearchSubmit?: (query: string) => void
  onModeChange?: (mode: SearchMode) => void
  showFilters?: boolean
  onToggleFilters?: () => void
  placeholder?: string
}

export function SearchHeader({
  query,
  mode,
  onSearchSubmit,
  onModeChange,
  showFilters = false,
  onToggleFilters,
  placeholder = 'Search the web freely...',
}: SearchHeaderProps) {
  const navigate = useNavigate()

  const handleDefaultSubmit = (nextQuery: string) => {
    const trimmed = nextQuery.trim()
    const currentPath = modePaths[mode]
    if (trimmed) {
      navigate(`${currentPath}?q=${encodeURIComponent(trimmed)}`)
    } else {
      navigate(currentPath)
    }
  }

  const handleDefaultModeChange = (nextMode: SearchMode) => {
    const targetPath = modePaths[nextMode]
    navigate(`${targetPath}${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  }

  const submitHandler = onSearchSubmit || handleDefaultSubmit
  const modeChangeHandler = onModeChange || handleDefaultModeChange

  return (
    <header className="search-results-header" role="banner">
      <div className="search-header-container">
        <div className="search-header-top">
          <div className="search-header-logo-wrap">
            <Logo />
          </div>

          <div className="search-header-input-wrap">
            <SearchBar
              key={`${mode}-${query}`}
              initialQuery={query}
              onSubmit={submitHandler}
              placeholder={placeholder}
            />
          </div>

          <div className="search-header-actions">
            <span
              className="results-private"
              title="Frontend prototype — queries are evaluated locally in-browser with mock index data"
            >
              <ShieldCheck size={14} aria-hidden="true" />
              <span className="private-label">Local Demo</span>
            </span>
            {onToggleFilters && (
              <button
                type="button"
                className={`header-icon-link ${showFilters ? 'active' : ''}`}
                onClick={onToggleFilters}
                aria-label="Toggle search filters"
                title="Search filters"
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
              </button>
            )}
            <Link to="/settings" className="header-icon-link" aria-label="Settings" title="Preferences & Settings">
              <Settings2 size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Sub-row: Category Navigation Tabs aligned with Search Bar */}
        <div className="search-header-sub">
          <div className="search-header-tabs-spacer" />
          <div className="search-header-tabs-content">
            <SearchModeTabs mode={mode} onModeChange={modeChangeHandler} />
            {onToggleFilters && (
              <button
                type="button"
                className="header-filter-pill-btn"
                onClick={onToggleFilters}
                title="Filter options"
                aria-label="Filter search results"
              >
                <SlidersHorizontal size={13} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
