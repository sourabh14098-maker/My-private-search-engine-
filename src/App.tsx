import { useEffect, useState } from 'react'
import { AlertCircle, ArrowUpRight, Globe2, LockKeyhole, Settings2, ShieldCheck, SlidersHorizontal, Clock3, Minus, Plus } from 'lucide-react'
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { SearchLayout } from './components/layout/SearchLayout'
import { AISummary } from './components/search/AISummary'
import { SearchResult } from './components/search/SearchResult'
import { KnowledgeCard } from './components/search/KnowledgeCard'
import { PrivacyStatus } from './components/privacy/PrivacyStatus'
import { Toggle } from './components/common/Toggle'
import { LoadingSkeleton } from './components/common/LoadingSkeleton'
import { BookResults, ImageResults, PlaceResults, ProductResults, VideoResults } from './components/verticals/VerticalResults'
import { HomePage } from './pages/HomePage'
import { NewsPage } from './pages/NewsPage'
import { SearchPage } from './pages/SearchPage'
import { searchService } from './services/searchService'
import type { AISearchResponse, ImageResult, SearchMode, UserPreferences } from './types'
import { modePaths } from './types'
import { readStored, writeStored } from './utils/storage'
import './App.css'
import './verticals.css'
import './news.css'
import './layout.css'
import './search-results.css'

const searchVerticalRoutes = [
  '/search',
  '/images',
  '/videos',
  '/news',
  '/maps',
  '/shopping',
  '/books',
  '/ai',
]

const settingsKey = 'ditchgoogle-settings'
const defaultUserPreferences: UserPreferences = {
  safeSearch: true,
  language: 'English',
  region: 'Global',
  theme: 'dark',
  animations: true,
  compactResults: false,
}

function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isSearchVertical = searchVerticalRoutes.includes(location.pathname)

  return (
    <div className={isHome ? 'app-shell home-shell' : 'app-shell'}>
      {!isHome && !isSearchVertical && <Navbar />}
      <main>{children}</main>
      {!isHome && <Footer />}
    </div>
  )
}

function VerticalPage({ mode }: { mode: Exclude<SearchMode, 'all' | 'ai' | 'news'> }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = params.get('q') || ''
  const [preview, setPreview] = useState<ImageResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [request, setRequest] = useState<{
    mode: Exclude<SearchMode, 'all' | 'ai' | 'news'>
    data:
      | Awaited<ReturnType<typeof searchService.images>>
      | Awaited<ReturnType<typeof searchService.videos>>
      | Awaited<ReturnType<typeof searchService.maps>>
      | Awaited<ReturnType<typeof searchService.shopping>>
      | Awaited<ReturnType<typeof searchService.books>>
  } | null>(null)

  useEffect(() => {
    if (!query) return
    let cancelled = false

    const loader =
      mode === 'images'
        ? searchService.images(query)
        : mode === 'videos'
        ? searchService.videos(query)
        : mode === 'maps'
        ? searchService.maps(query)
        : mode === 'shopping'
        ? searchService.shopping(query)
        : searchService.books(query)

    loader
      .then((data) => {
        if (!cancelled) {
          setRequest({ mode, data })
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || `Unable to load ${mode} results.`)
        }
      })

    return () => {
      cancelled = true
    }
  }, [mode, query])

  const loading = Boolean(query && (!request || request.mode !== mode || request.data.query !== query) && !error)

  const handleSearchSubmit = (nextQuery: string) => {
    const trimmed = nextQuery.trim()
    const targetPath = modePaths[mode]
    if (trimmed) {
      navigate(`${targetPath}?q=${encodeURIComponent(trimmed)}`)
    } else {
      navigate(targetPath)
    }
  }

  const handleModeChange = (nextMode: SearchMode) => {
    const targetPath = modePaths[nextMode]
    navigate(`${targetPath}${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  }

  const resultCount = query
    ? error
      ? 'Search failed'
      : loading
      ? `Loading demo ${mode} results...`
      : `Demo results · ${request?.data?.results?.length || 0} sample ${mode} entries for "${query}" (Mock index)`
    : undefined

  const placeholders: Record<string, string> = {
    images: 'Search for images, photos, illustrations...',
    videos: 'Search videos, tutorials, streams...',
    maps: 'Search places, addresses, businesses...',
    shopping: 'Search products, prices, stores...',
    books: 'Search books, authors, publications...',
  }

  const sidebar =
    mode === 'maps' ? (
      <div className="map-placeholder">
        <MapLabel />
        <span>Interactive map visualizer (Planned feature · Demo placeholder)</span>
      </div>
    ) : mode !== 'images' && !error && !loading ? (
      <KnowledgeCard query={query} />
    ) : undefined

  return (
    <SearchLayout
      mode={mode}
      query={query}
      onSearchSubmit={handleSearchSubmit}
      onModeChange={handleModeChange}
      resultCount={resultCount}
      placeholder={placeholders[mode] || 'Search the web freely...'}
      layoutVariant={mode === 'images' ? 'full' : 'standard'}
      sidebar={sidebar}
    >
      {error ? (
        <div className="search-error-state" role="alert">
          <AlertCircle size={24} aria-hidden="true" />
          <div>
            <h3>Unable to load {mode} results</h3>
            <p>{error}</p>
          </div>
        </div>
      ) : loading ? (
        <LoadingSkeleton />
      ) : (
        <VerticalContent mode={mode} data={request?.data || null} onPreview={setPreview} />
      )}

      {preview && (
        <div
          className="preview-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setPreview(null)}
        >
          <div className="preview-panel" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setPreview(null)} aria-label="Close preview">
              Close
            </button>
            <img src={preview.imageUrl} alt={preview.title} />
            <h2>{preview.title}</h2>
            <p>{preview.domain} · {preview.source} (Sample image)</p>
          </div>
        </div>
      )}
    </SearchLayout>
  )
}

function VerticalContent({
  mode,
  data,
  onPreview,
}: {
  mode: Exclude<SearchMode, 'all' | 'ai' | 'news'>
  data:
    | Awaited<ReturnType<typeof searchService.images>>
    | Awaited<ReturnType<typeof searchService.videos>>
    | Awaited<ReturnType<typeof searchService.maps>>
    | Awaited<ReturnType<typeof searchService.shopping>>
    | Awaited<ReturnType<typeof searchService.books>>
    | null
  onPreview: (result: ImageResult) => void
}) {
  if (!data) return null

  if (data.results.length === 0) {
    return (
      <div className="search-empty-state">
        <h3>No {mode} results found for &ldquo;{data.query}&rdquo;</h3>
        <p>Try searching for different terms or switch to another search tab.</p>
      </div>
    )
  }

  if (mode === 'images' && 'results' in data) {
    return <ImageResults results={data.results as ImageResult[]} onPreview={onPreview} />
  }
  if (mode === 'videos') {
    return <VideoResults results={data.results as Awaited<ReturnType<typeof searchService.videos>>['results']} />
  }
  if (mode === 'maps') {
    return <PlaceResults results={data.results as Awaited<ReturnType<typeof searchService.maps>>['results']} />
  }
  if (mode === 'shopping') {
    return <ProductResults results={data.results as Awaited<ReturnType<typeof searchService.shopping>>['results']} />
  }
  return <BookResults results={data.results as Awaited<ReturnType<typeof searchService.books>>['results']} />
}

function MapLabel() {
  return (
    <div className="map-lines" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
      <i />
    </div>
  )
}

function AIPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const query = params.get('q') || ''
  const [data, setData] = useState<AISearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query) return
    let cancelled = false

    searchService.ai(query)
      .then((res) => {
        if (!cancelled) {
          setData(res)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Unable to load AI summary.')
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
      navigate(`/ai?q=${encodeURIComponent(trimmed)}`)
    } else {
      navigate('/ai')
    }
  }

  const handleModeChange = (nextMode: SearchMode) => {
    const targetPath = modePaths[nextMode]
    navigate(`${targetPath}${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  }

  const resultCount = query
    ? error
      ? 'Search failed'
      : loading
      ? `Generating simulated AI answer for "${query}"...`
      : data?.resultCount || `Demo AI answer & simulated sources for "${query}" (Mock index)`
    : undefined

  const sidebar = !loading && !error && data && data.results.length > 0 ? (
    <KnowledgeCard query={query} />
  ) : undefined

  return (
    <SearchLayout
      mode="ai"
      query={query}
      onSearchSubmit={handleSearchSubmit}
      onModeChange={handleModeChange}
      resultCount={resultCount}
      placeholder="Ask AI anything private..."
      sidebar={sidebar}
    >
      {error ? (
        <div className="search-error-state" role="alert">
          <AlertCircle size={24} aria-hidden="true" />
          <div>
            <h3>Unable to load AI summary</h3>
            <p>{error}</p>
          </div>
        </div>
      ) : loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="ai-page-feed">
          <AISummary query={query || 'Your topic'} />
          <div className="ai-web-results">
            <div className="section-kicker">
              <span>SAMPLE WEB SOURCES (DEMO)</span>
              <b />
            </div>
            {(data?.results || []).slice(0, 2).map((result) => (
              <SearchResult key={result.id} result={result} />
            ))}
          </div>
        </div>
      )}
    </SearchLayout>
  )
}

function PrivacyPage() {
  return (
    <div className="page inner-page">
      <div className="container narrow">
        <span className="eyebrow">PRIVACY CENTER</span>
        <h1>Your search<br /><em>belongs to you.</em></h1>
        <p className="lead">
          A clear view of what this frontend does today, and what is still being built. No vague promises. No hidden switches.
        </p>
        <PrivacyStatus />
        <div className="privacy-details">
          <div className="section-kicker"><span>PRIVACY PRINCIPLES</span><b /></div>
          {[
            ['What we collect', 'This frontend does not send search queries to a remote search provider.'],
            ['What we do not collect', 'There is no account, remote profile, personalized advertising, or connected analytics in this frontend.'],
            ['Future architecture', 'A future backend will document request handling, index boundaries, and third-party services before launch.'],
          ].map(([title, copy]) => (
            <div className="principle" key={title}>
              <ShieldCheck size={17} />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SettingsPage() {
  const [prefs, setPrefs] = useState(() => readStored(settingsKey, defaultUserPreferences))
  useEffect(() => writeStored(settingsKey, prefs), [prefs])
  const update = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) =>
    setPrefs((current) => ({ ...current, [key]: value }))

  return (
    <div className="page inner-page">
      <div className="container settings-layout">
        <div className="settings-intro">
          <span className="eyebrow">SETTINGS</span>
          <h1>Make it<br /><em>yours.</em></h1>
          <p>Small controls for a calmer, more intentional search experience.</p>
          <div className="settings-save"><i /> Preferences saved locally</div>
        </div>
        <div className="settings-panel">
          <SettingGroup title="Search">
            <SettingRow
              icon={<SlidersHorizontal size={17} />}
              title="Safe Search"
              description="Filter explicit content from results."
              control={<Toggle checked={prefs.safeSearch} onChange={(v) => update('safeSearch', v)} label="Safe Search" />}
            />
            <SettingRow
              icon={<Globe2 size={17} />}
              title="Language"
              description="Choose your preferred result language."
              control={
                <select value={prefs.language} onChange={(e) => update('language', e.target.value)}>
                  <option>English</option>
                  <option>Spanish</option>
                </select>
              }
            />
            <SettingRow
              icon={<Globe2 size={17} />}
              title="Region"
              description="Prioritize results from a region."
              control={
                <select value={prefs.region} onChange={(e) => update('region', e.target.value)}>
                  <option>Global</option>
                  <option>United States</option>
                </select>
              }
            />
          </SettingGroup>
          <SettingGroup title="Privacy">
            <SettingRow
              icon={<Clock3 size={17} />}
              title="Local History"
              description="Optional local history is planned."
              badge="PLANNED"
              control={<Toggle checked={false} onChange={() => {}} label="Local History" />}
            />
            <SettingRow
              icon={<ShieldCheck size={17} />}
              title="Personalization"
              description="No personalization is active."
              control={<Toggle checked={false} onChange={() => {}} label="Personalization" />}
            />
            <SettingRow
              icon={<LockKeyhole size={17} />}
              title="Analytics"
              description="No analytics are connected."
              control={<Toggle checked={false} onChange={() => {}} label="Analytics" />}
            />
          </SettingGroup>
          <SettingGroup title="Appearance">
            <SettingRow
              icon={<Settings2 size={17} />}
              title="Theme"
              description="Focused midnight theme for this release."
              control={
                <select value={prefs.theme} onChange={(e) => update('theme', e.target.value as UserPreferences['theme'])}>
                  <option value="dark">Midnight</option>
                  <option value="light">Light (planned)</option>
                </select>
              }
            />
            <SettingRow
              icon={<Plus size={17} />}
              title="Animations"
              description="Keep subtle transitions and page movement."
              control={<Toggle checked={prefs.animations} onChange={(v) => update('animations', v)} label="Animations" />}
            />
            <SettingRow
              icon={<Minus size={17} />}
              title="Compact results"
              description="Use a denser results layout."
              control={<Toggle checked={prefs.compactResults} onChange={(v) => update('compactResults', v)} label="Compact results" />}
            />
          </SettingGroup>
          <SettingGroup title="Advanced">
            <SettingRow
              icon={<SlidersHorizontal size={17} />}
              title="Keyboard shortcuts"
              description="Slash and Ctrl + K are active."
              badge="ACTIVE"
              control={<span className="key-hint">/ · Ctrl K</span>}
            />
          </SettingGroup>
        </div>
      </div>
    </div>
  )
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="setting-group">
      <div className="section-kicker"><span>{title.toUpperCase()}</span><b /></div>
      {children}
    </section>
  )
}

function SettingRow({
  icon,
  title,
  description,
  control,
  badge,
}: {
  icon: React.ReactNode
  title: string
  description: string
  control: React.ReactNode
  badge?: string
}) {
  return (
    <div className="setting-row">
      <span className="setting-icon">{icon}</span>
      <div className="setting-copy">
        <h3>{title} {badge && <small>{badge}</small>}</h3>
        <p>{description}</p>
      </div>
      {control}
    </div>
  )
}

function AboutPage() {
  const roadmap = [
    'Search Experience',
    'Privacy Layer',
    'Search Backend',
    'Web Crawler',
    'Independent Index',
    'Ranking Engine',
    'Semantic Search',
    'AI Search',
    'Vertical Search',
    'Public Deployment',
  ]

  return (
    <div className="page inner-page about-page">
      <div className="container about-hero">
        <span className="eyebrow">OUR APPROACH</span>
        <h1>Why Ditch<br /><em>Google!R!?</em></h1>
        <p className="lead">
          Because the web is too important to hand over to systems that turn every question into a profile. We are building a search engine that earns trust through clarity, restraint, and useful results.
        </p>
      </div>
      <div className="container about-grid">
        <div>
          <span className="eyebrow">WHAT WE BELIEVE</span>
        </div>
        <div className="beliefs">
          <h2>Search is a public utility.<br /><em>It should serve the public.</em></h2>
          <p>
            Our goal is an independent search stack: an own crawler, an own index, and a ranking system you can understand. This frontend is the first visible layer of that work.
          </p>
          <Link className="text-link" to="/privacy">
            Explore the privacy center <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <div className="container roadmap">
        <div className="section-kicker"><span>OUR ROADMAP</span><b /></div>
        <div className="roadmap-list">
          {roadmap.map((item, index) => (
            <div className={index === 0 ? 'roadmap-item active' : 'roadmap-item'} key={item}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item}</h3>
              <span className="roadmap-status">{index === 0 ? 'Now' : 'Planned'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DeveloperPage() {
  return (
    <div className="page inner-page">
      <div className="container narrow">
        <span className="eyebrow">DEVELOPER SEARCH</span>
        <h1>Search the web<br /><em>your way.</em></h1>
        <p className="lead">
          Bang prefixes into the search box to prepare for focused sources. Integrations are planned, not connected in this frontend.
        </p>
        <div className="developer-list">
          {['!github react authentication', '!npm vite', '!stackoverflow typescript generics', '!mdn fetch', '!wiki privacy'].map((command) => (
            <code key={command}>{command}</code>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatusPage() {
  return (
    <div className="page inner-page">
      <div className="container narrow">
        <span className="eyebrow">SYSTEM STATUS</span>
        <h1>Quietly<br /><em>in progress.</em></h1>
        <div className="status-card">
          <span className="status-live"><i /> Frontend operational</span>
          <p>Search infrastructure, crawler, independent index, and API services are planned for future releases.</p>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/images" element={<VerticalPage mode="images" />} />
          <Route path="/videos" element={<VerticalPage mode="videos" />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/maps" element={<VerticalPage mode="maps" />} />
          <Route path="/shopping" element={<VerticalPage mode="shopping" />} />
          <Route path="/books" element={<VerticalPage mode="books" />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/developer" element={<DeveloperPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}

export default App
