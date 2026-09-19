import { Filter } from 'lucide-react'
import { useState } from 'react'

export interface FilterState {
  safeSearch: string
  time: string
  region: string
  language: string
}

interface SearchFiltersProps {
  className?: string
  onChange?: (filters: FilterState) => void
}

export function SearchFilters({ className = '', onChange }: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    safeSearch: 'On',
    time: 'Any time',
    region: 'Global',
    language: 'English',
  })

  const update = (key: keyof FilterState, value: string) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    onChange?.(next)
  }

  return (
    <div className={`search-filters ${className}`.trim()} role="region" aria-label="Search filter controls">
      <span>
        <Filter size={14} aria-hidden="true" /> Filters
      </span>
      <label>
        Safe Search
        <select
          value={filters.safeSearch}
          onChange={(e) => update('safeSearch', e.target.value)}
          aria-label="Filter Safe Search"
        >
          <option value="On">On</option>
          <option value="Moderate">Moderate</option>
          <option value="Off">Off</option>
        </select>
      </label>
      <label>
        Time
        <select
          value={filters.time}
          onChange={(e) => update('time', e.target.value)}
          aria-label="Filter by time"
        >
          <option value="Any time">Any time</option>
          <option value="Past hour">Past hour</option>
          <option value="Past 24 hours">Past 24 hours</option>
          <option value="Past week">Past week</option>
          <option value="Past month">Past month</option>
        </select>
      </label>
      <label>
        Region
        <select
          value={filters.region}
          onChange={(e) => update('region', e.target.value)}
          aria-label="Filter by region"
        >
          <option value="Global">Global</option>
          <option value="United States">United States</option>
          <option value="Europe">Europe</option>
          <option value="Asia">Asia</option>
        </select>
      </label>
      <label>
        Language
        <select
          value={filters.language}
          onChange={(e) => update('language', e.target.value)}
          aria-label="Filter by language"
        >
          <option value="English">English</option>
          <option value="Spanish">Spanish</option>
          <option value="French">French</option>
          <option value="German">German</option>
        </select>
      </label>
    </div>
  )
}
