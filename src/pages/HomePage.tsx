import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  Compass,
  LockKeyhole,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { DitchXLogoLockup, DitchXSymbol } from '../components/common/DitchXBrand'
import {
  CustomizePanel,
  type CustomizeMode,
  type CustomizeRotation,
  type NewTabShortcut,
} from '../components/newtab/CustomizePanel'
import { ShortcutIcon } from '../components/newtab/ShortcutIcon'
import { SearchBar } from '../components/search/SearchBar'
import { SearchModeTabs } from '../components/search/SearchModeTabs'
import { wallpapers, type Wallpaper } from '../data/wallpapers'
import type { SearchMode } from '../types'
import { readStored, writeStored } from '../utils/storage'
import '../home.css'
import '../home-fixes.css'
import '../wallpaper.css'
import '../newtab-customize.css'
import '../homepage-redesign.css'

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

const shortcutKey = 'ditchgoogle-shortcuts'
const preferenceKey = 'ditchgoogle-newtab-preferences'
const wallpaperKey = 'ditchgoogle-wallpaper'
const sessionKey = `${wallpaperKey}-session`

const defaultShortcuts: NewTabShortcut[] = [
  { id: 'github', label: 'GitHub', url: 'https://github.com' },
  { id: 'youtube', label: 'YouTube', url: 'https://youtube.com' },
  { id: 'reddit', label: 'Reddit', url: 'https://reddit.com' },
  { id: 'wikipedia', label: 'Wikipedia', url: 'https://wikipedia.org' },
  { id: 'stackoverflow', label: 'Stack Overflow', url: 'https://stackoverflow.com' },
  { id: 'gmail', label: 'Gmail', url: 'https://mail.google.com' },
  { id: 'maps', label: 'Maps', url: 'https://maps.google.com' },
  { id: 'news', label: 'News', url: 'https://news.google.com' },
]

export interface NewTabPreferences {
  showShortcuts: boolean
  showDiscovery: boolean
  showPrivacyStats: boolean
  showTrending: boolean
  autocompleteEnabled: boolean
  voiceEnabled: boolean
  defaultSearchMode: SearchMode
  theme: 'dark' | 'light'
}

const defaultPreferences: NewTabPreferences = {
  showShortcuts: true,
  showDiscovery: true,
  showPrivacyStats: true,
  showTrending: true,
  autocompleteEnabled: true,
  voiceEnabled: true,
  defaultSearchMode: 'all',
  theme: 'dark',
}

type WallpaperMode = 'automatic' | 'static'
type WallpaperRotation = 'session' | 'hourly' | 'daily'

interface WallpaperState {
  index: number
  mode: WallpaperMode
  rotation: WallpaperRotation
  changedAt: number
}

const rotationDurations: Record<Exclude<WallpaperRotation, 'session'>, number> = {
  hourly: 3600000,
  daily: 86400000,
}

function readWallpaperState(): WallpaperState {
  const fallback: WallpaperState = {
    index: 0,
    mode: 'automatic',
    rotation: 'session',
    changedAt: Date.now(),
  }

  try {
    const raw = localStorage.getItem(wallpaperKey)
    const parsed = raw ? (JSON.parse(raw) as Partial<WallpaperState>) : null
    const valid =
      parsed &&
      Number.isInteger(parsed.index) &&
      (parsed.index ?? -1) >= 0 &&
      (parsed.index ?? -1) < wallpapers.length &&
      Number.isFinite(parsed.changedAt) &&
      (parsed.mode === 'automatic' || parsed.mode === 'static') &&
      (parsed.rotation === 'session' ||
        parsed.rotation === 'hourly' ||
        parsed.rotation === 'daily')

    if (!valid) {
      sessionStorage.setItem(sessionKey, 'active')
      return fallback
    }

    const sessionStarted = sessionStorage.getItem(sessionKey) !== 'active'
    const duration =
      parsed.rotation === 'session'
        ? Number.POSITIVE_INFINITY
        : rotationDurations[parsed.rotation!]
    const expired = Date.now() - parsed.changedAt! >= duration

    const shouldRotate =
      parsed.mode === 'automatic' &&
      ((parsed.rotation === 'session' && sessionStarted) ||
        (parsed.rotation !== 'session' && expired))

    const index = shouldRotate
      ? (parsed.index! + 1) % wallpapers.length
      : parsed.index!

    sessionStorage.setItem(sessionKey, 'active')
    return {
      index,
      mode: parsed.mode!,
      rotation: parsed.rotation!,
      changedAt: index === parsed.index ? parsed.changedAt! : Date.now(),
    }
  } catch {
    return fallback
  }
}

const trendingTopics = [
  { topic: 'Latest AI developments', category: 'Technology' },
  { topic: 'Cybersecurity research', category: 'Security' },
  { topic: 'Privacy web standards', category: 'Standards' },
  { topic: 'Open web architecture', category: 'Engineering' },
]

export function HomePage() {
  const [initialWallpaper] = useState(readWallpaperState)
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState<NewTabPreferences>(() =>
    readStored(preferenceKey, defaultPreferences)
  )
  const [shortcuts, setShortcuts] = useState<NewTabShortcut[]>(() =>
    readStored(shortcutKey, defaultShortcuts)
  )
  const [mode, setMode] = useState<SearchMode>(preferences.defaultSearchMode)
  const [wallpaperIndex, setWallpaperIndex] = useState(initialWallpaper.index)
  const [wallpaperMode, setWallpaperMode] = useState<WallpaperMode>(initialWallpaper.mode)
  const [rotation, setRotation] = useState<WallpaperRotation>(initialWallpaper.rotation)
  const [changedAt, setChangedAt] = useState(initialWallpaper.changedAt)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const customizeRef = useRef<HTMLDivElement>(null)

  const currentWallpaper: Wallpaper = wallpapers[wallpaperIndex] || wallpapers[0]

  useEffect(() => writeStored(preferenceKey, preferences), [preferences])
  useEffect(() => writeStored(shortcutKey, shortcuts), [shortcuts])

  useEffect(() => {
    try {
      localStorage.setItem(
        wallpaperKey,
        JSON.stringify({
          index: wallpaperIndex,
          mode: wallpaperMode,
          rotation,
          changedAt,
        })
      )
    } catch {}
  }, [wallpaperIndex, wallpaperMode, rotation, changedAt])

  useEffect(() => {
    if (!customizeOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCustomizeOpen(false)
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!customizeRef.current?.contains(event.target as Node)) {
        setCustomizeOpen(false)
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('mousedown', closeOnOutsideClick)
    }
  }, [customizeOpen])

  // Live timer for hourly / daily automatic rotation
  useEffect(() => {
    if (wallpaperMode === 'static' || rotation === 'session') return

    const duration = rotationDurations[rotation]
    const remaining = Math.max(0, duration - (Date.now() - changedAt))

    const timer = window.setTimeout(() => {
      setWallpaperIndex((current) => (current + 1) % wallpapers.length)
      setChangedAt(Date.now())
    }, remaining)

    return () => window.clearTimeout(timer)
  }, [wallpaperMode, rotation, changedAt])

  const search = (query: string) => navigate(`/search?q=${encodeURIComponent(query)}`)

  const changeMode = (next: SearchMode) => {
    setMode(next)
    if (next !== 'all') navigate(modePaths[next])
  }

  const moveWallpaper = (index: number) => {
    setWallpaperIndex(index)
    setChangedAt(Date.now())
  }

  const updatePreference = <K extends keyof NewTabPreferences>(
    key: K,
    value: NewTabPreferences[K]
  ) => setPreferences((current) => ({ ...current, [key]: value }))

  const hasBottomModules =
    preferences.showPrivacyStats || preferences.showTrending || preferences.showDiscovery

  return (
    <div className={`newtab-home theme-${preferences.theme}`}>
      {/* 1. Fullscreen Wallpaper Backdrop */}
      <div
        key={currentWallpaper.id}
        className="newtab-backdrop wallpaper-fade-in"
        style={{
          backgroundColor: currentWallpaper.style.backgroundColor,
          backgroundImage: currentWallpaper.style.backgroundImage,
          backgroundSize: currentWallpaper.style.backgroundSize || 'cover',
          backgroundPosition: currentWallpaper.style.backgroundPosition || 'center center',
        }}
        aria-hidden="true"
      />
      <div className="newtab-shade" />

      {/* Main Viewport Container */}
      <div className="newtab-content">
        {/* 2. Minimal Top Area */}
        <header className="newtab-topbar" aria-label="Browser controls">
          <Link to="/" className="topbar-brand" aria-label="DitchX Home">
            <DitchXSymbol size={24} />
            <span className="topbar-brand-name">
              Ditch<span className="brand-x">X</span>
            </span>
          </Link>

          <div className="topbar-actions">
            <Link
              to="/settings"
              className="topbar-action-btn"
              aria-label="Browser settings"
              title="Settings"
            >
              <Settings2 size={16} />
            </Link>

            <div className="customize-trigger-wrap" ref={customizeRef}>
              <button
                className={`topbar-action-btn ${customizeOpen ? 'active' : ''}`}
                onClick={() => setCustomizeOpen(!customizeOpen)}
                aria-label="Customize New Tab"
                aria-expanded={customizeOpen}
                title="Customize New Tab"
              >
                <SlidersHorizontal size={16} />
              </button>

              {customizeOpen && (
                <CustomizePanel
                  wallpapers={wallpapers}
                  wallpaperIndex={wallpaperIndex}
                  wallpaperMode={wallpaperMode as CustomizeMode}
                  rotation={rotation as CustomizeRotation}
                  shortcuts={shortcuts}
                  showShortcuts={preferences.showShortcuts}
                  showPrivacyStats={preferences.showPrivacyStats}
                  showTrending={preferences.showTrending}
                  showDiscovery={preferences.showDiscovery}
                  autocompleteEnabled={preferences.autocompleteEnabled}
                  voiceEnabled={preferences.voiceEnabled}
                  defaultSearchMode={preferences.defaultSearchMode}
                  theme={preferences.theme}
                  onClose={() => setCustomizeOpen(false)}
                  onWallpaperChange={moveWallpaper}
                  onWallpaperModeChange={setWallpaperMode}
                  onRotationChange={setRotation}
                  onAddShortcut={(shortcut) =>
                    setShortcuts((current) => [...current, shortcut])
                  }
                  onUpdateShortcut={(shortcut) =>
                    setShortcuts((current) =>
                      current.map((item) => (item.id === shortcut.id ? shortcut : item))
                    )
                  }
                  onRemoveShortcut={(id) =>
                    setShortcuts((current) => current.filter((item) => item.id !== id))
                  }
                  onToggle={(key, value) => updatePreference(key, value)}
                  onDefaultSearchModeChange={(next) =>
                    updatePreference('defaultSearchMode', next as SearchMode)
                  }
                  onThemeChange={(next) => updatePreference('theme', next)}
                />
              )}
            </div>
          </div>
        </header>

        {/* 3. Central Experience: Branding + Primary Search + Shortcuts */}
        <main className="newtab-center" aria-label="Search hero">
          {/* Large Center Branding */}
          <DitchXLogoLockup size={56} showTagline={true} />

          {/* 4. Primary Search */}
          <div className="newtab-search">
            <SearchBar
              large
              placeholder="Search the web..."
              onSubmit={search}
              autocompleteEnabled={preferences.autocompleteEnabled}
              voiceEnabled={preferences.voiceEnabled}
            />

            {/* 5. Compact Search Modes */}
            <SearchModeTabs mode={mode} onModeChange={changeMode} />

            {/* Subtle, Honest Privacy Signal */}
            <div className="newtab-trust" aria-label="Privacy principles">
              <span>
                <Check size={11} /> Private by default
              </span>
              <span>
                <Check size={11} /> Zero search tracking
              </span>
              <span>
                <Check size={11} /> No ad profiling
              </span>
            </div>
          </div>

          {/* 6. Browser-Style Icon Shortcuts */}
          {preferences.showShortcuts && (
            <div className="shortcut-dock" aria-label="Saved shortcuts">
              <div className="shortcut-grid">
                {shortcuts.map((shortcut) => (
                  <a
                    key={shortcut.id}
                    href={shortcut.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shortcut-tile"
                    title={`${shortcut.label} (${shortcut.url})`}
                  >
                    <div className="shortcut-icon-badge">
                      <ShortcutIcon url={shortcut.url} label={shortcut.label} size={20} />
                    </div>
                    <span className="shortcut-label">{shortcut.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* 7. Lightweight Floating Lower Information Modules */}
        {hasBottomModules && (
          <div className="newtab-bottom" aria-label="New tab information overlay">
            {/* Module 1: Privacy Status */}
            {preferences.showPrivacyStats && (
              <section className="newtab-panel stats-panel" aria-label="Privacy status">
                <div className="panel-label">
                  <ShieldCheck size={12} /> PRIVACY STATUS
                </div>
                <div className="stats-row">
                  <div>
                    <strong>ACTIVE</strong>
                    <span>Private default</span>
                  </div>
                  <div>
                    <strong>0</strong>
                    <span>Search profiles</span>
                  </div>
                  <div>
                    <strong>BLOCKED</strong>
                    <span>Trackers & ads</span>
                  </div>
                </div>
                <p>
                  <LockKeyhole size={11} /> Search queries and history stay on this device.
                </p>
              </section>
            )}

            {/* Module 2: Trending Searches */}
            {preferences.showTrending && (
              <section className="newtab-panel explore-panel" aria-label="Trending searches">
                <div className="panel-label">
                  <Compass size={12} /> TRENDING SEARCHES
                </div>
                <button
                  className="panel-feature"
                  onClick={() => search(trendingTopics[0].topic)}
                  aria-label={`Search ${trendingTopics[0].topic}`}
                >
                  <div>
                    <span className="feature-category">{trendingTopics[0].category}</span>
                    <strong className="feature-title">{trendingTopics[0].topic}</strong>
                  </div>
                  <ArrowUpRight size={14} />
                </button>
                <div className="panel-links">
                  {trendingTopics.slice(1, 4).map((item) => (
                    <button
                      key={item.topic}
                      onClick={() => search(item.topic)}
                      aria-label={`Search ${item.topic}`}
                    >
                      <span>{item.topic}</span>
                      <ArrowUpRight size={10} />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Module 3: Discover Insights */}
            {preferences.showDiscovery && (
              <section className="newtab-panel build-panel" aria-label="Discover insights">
                <div className="panel-label">
                  <Sparkles size={12} /> DISCOVER
                </div>
                <h2>
                  Independent Index.
                  <br />
                  <em>Fast. Quiet. Private.</em>
                </h2>
                <p>Developing open web infrastructure that respects your attention.</p>
                <Link to="/about" className="discover-link">
                  Read the roadmap <ArrowUpRight size={11} />
                </Link>
              </section>
            )}
          </div>
        )}

        {/* 8. Minimal Quiet Browser Footer */}
        <footer className="newtab-footer" aria-label="Browser footer">
          <div className="footer-left">
            <span className="footer-brand">DitchX</span>
            <span className="footer-sep">·</span>
            <span className="footer-tagline">Browse Beyond the Default</span>
          </div>
          <nav className="footer-links" aria-label="Quick links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/settings">Settings</Link>
            <Link to="/about">About</Link>
          </nav>
        </footer>
      </div>
    </div>
  )
}
