import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, Compass, LockKeyhole, ShieldCheck, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/common/Logo'
import { CustomizePanel, type CustomizeMode, type CustomizeRotation, type NewTabShortcut } from '../components/newtab/CustomizePanel'
import { SearchBar } from '../components/search/SearchBar'
import { SearchModeTabs } from '../components/search/SearchModeTabs'
import type { SearchMode } from '../types'
import { readStored, writeStored } from '../utils/storage'
import '../home.css'
import '../home-fixes.css'
import '../wallpaper.css'
import '../newtab-customize.css'
import '../homepage-redesign.css'

const modePaths: Record<SearchMode, string> = { all: '/search', images: '/images', videos: '/videos', news: '/news', maps: '/maps', shopping: '/shopping', books: '/books', ai: '/ai' }
const trending = ['Latest AI developments', 'Java development', 'Cybersecurity', 'Web development', 'Programming', 'Technology news']
const shortcutKey = 'ditchgoogle-shortcuts'
const preferenceKey = 'ditchgoogle-newtab-preferences'
const defaultShortcuts: NewTabShortcut[] = [
  { id: 'github', label: 'GitHub', url: 'https://github.com' }, { id: 'youtube', label: 'YouTube', url: 'https://youtube.com' }, { id: 'reddit', label: 'Reddit', url: 'https://reddit.com' }, { id: 'wikipedia', label: 'Wikipedia', url: 'https://wikipedia.org' }, { id: 'stackoverflow', label: 'Stack Overflow', url: 'https://stackoverflow.com' }, { id: 'gmail', label: 'Gmail', url: 'https://mail.google.com' }, { id: 'maps', label: 'Maps', url: 'https://maps.google.com' }, { id: 'news', label: 'News', url: 'https://news.google.com' },
]
type NewTabPreferences = { showShortcuts: boolean; showDiscovery: boolean; showPrivacyStats: boolean; autocompleteEnabled: boolean; voiceEnabled: boolean; defaultSearchMode: SearchMode; theme: 'dark' | 'light' }
const defaultPreferences: NewTabPreferences = { showShortcuts: true, showDiscovery: true, showPrivacyStats: true, autocompleteEnabled: true, voiceEnabled: true, defaultSearchMode: 'all', theme: 'dark' }
type Wallpaper = { id: string; name: string; src: string }
const wallpapers: Wallpaper[] = [
  { id: 'night-range', name: 'Night Range', src: 'radial-gradient(ellipse at 72% 22%, rgba(94,190,220,.55) 0 8%, transparent 34%), linear-gradient(145deg, transparent 0 52%, rgba(91,153,174,.5) 53% 55%, transparent 56%), linear-gradient(180deg, #123c55 0%, #1a3540 48%, #0b1724 100%)' },
  { id: 'signal-field', name: 'Signal Field', src: 'repeating-linear-gradient(115deg, transparent 0 9%, rgba(215,242,109,.38) 9.3% 9.8%, transparent 10.1% 19%), radial-gradient(circle at 22% 28%, rgba(215,242,109,.7) 0 3px, transparent 4px), linear-gradient(145deg, #173e3c 0%, #28605a 52%, #10242b 100%)' },
  { id: 'orbital-grid', name: 'Orbital Grid', src: 'linear-gradient(rgba(215,242,109,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(137,175,177,.24) 1px, transparent 1px), radial-gradient(circle at 72% 30%, rgba(215,242,109,.65), transparent 18%), linear-gradient(180deg, #292b4c 0%, #182943 100%)' },
  { id: 'aurora-stack', name: 'Aurora Stack', src: 'radial-gradient(ellipse at 28% 34%, rgba(74,231,205,.62), transparent 29%), radial-gradient(ellipse at 78% 70%, rgba(125,125,255,.55), transparent 32%), linear-gradient(135deg, #123e43 0%, #24545d 48%, #171b42 100%)' },
  { id: 'ember-coast', name: 'Ember Coast', src: 'radial-gradient(ellipse at 72% 28%, rgba(255,190,83,.8), transparent 22%), linear-gradient(25deg, transparent 0 58%, rgba(255,220,145,.35) 59% 60%, transparent 61%), linear-gradient(160deg, #6b2f20 0%, #9c4f26 48%, #211a2a 100%)' },
]
type WallpaperMode = 'automatic' | 'static'
type WallpaperRotation = 'session' | 'hourly' | 'daily'
const wallpaperKey = 'ditchgoogle-wallpaper'
type WallpaperState = { index: number; mode: WallpaperMode; rotation: WallpaperRotation; changedAt: number }
const sessionKey = `${wallpaperKey}-session`
const rotationDurations: Record<Exclude<WallpaperRotation, 'session'>, number> = { hourly: 3600000, daily: 86400000 }

function readWallpaperState(): WallpaperState {
  const fallback = { index: Math.floor(Math.random() * wallpapers.length), mode: 'automatic' as WallpaperMode, rotation: 'session' as WallpaperRotation, changedAt: Date.now() }
  try {
    const raw = localStorage.getItem(wallpaperKey)
    const parsed = raw ? JSON.parse(raw) as Partial<WallpaperState> : null
    const valid = parsed && Number.isInteger(parsed.index) && (parsed.index ?? -1) >= 0 && (parsed.index ?? -1) < wallpapers.length && Number.isFinite(parsed.changedAt) && (parsed.mode === 'automatic' || parsed.mode === 'static') && (parsed.rotation === 'session' || parsed.rotation === 'hourly' || parsed.rotation === 'daily')
    if (!valid) {
      sessionStorage.setItem(sessionKey, 'active')
      return fallback
    }
    const sessionStarted = sessionStorage.getItem(sessionKey) !== 'active'
    const duration = parsed.rotation === 'session' ? Number.POSITIVE_INFINITY : rotationDurations[parsed.rotation!]
    const expired = Date.now() - parsed.changedAt! >= duration
    const index = parsed.mode === 'automatic' && (parsed.rotation === 'session' && sessionStarted || parsed.rotation !== 'session' && expired) ? (parsed.index! + 1) % wallpapers.length : parsed.index!
    sessionStorage.setItem(sessionKey, 'active')
    return { index, mode: parsed.mode!, rotation: parsed.rotation!, changedAt: index === parsed.index ? parsed.changedAt! : Date.now() }
  } catch {
    return fallback
  }
}

export function HomePage() {
  const [initialWallpaper] = useState(readWallpaperState)
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState(() => readStored(preferenceKey, defaultPreferences))
  const [shortcuts, setShortcuts] = useState(() => readStored(shortcutKey, defaultShortcuts))
  const [mode, setMode] = useState<SearchMode>(preferences.defaultSearchMode)
  const [wallpaperIndex, setWallpaperIndex] = useState(initialWallpaper.index)
  const [wallpaperMode, setWallpaperMode] = useState<WallpaperMode>(initialWallpaper.mode)
  const [rotation, setRotation] = useState<WallpaperRotation>(initialWallpaper.rotation)
  const [changedAt, setChangedAt] = useState(initialWallpaper.changedAt)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const wallpaperControlRef = useRef<HTMLDivElement>(null)
  const currentWallpaper = wallpapers[wallpaperIndex]

  useEffect(() => writeStored(preferenceKey, preferences), [preferences])
  useEffect(() => writeStored(shortcutKey, shortcuts), [shortcuts])
  useEffect(() => { try { localStorage.setItem(wallpaperKey, JSON.stringify({ index: wallpaperIndex, mode: wallpaperMode, rotation, changedAt })) } catch {} }, [wallpaperIndex, wallpaperMode, rotation, changedAt])
  useEffect(() => { if (!customizeOpen) return; const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setCustomizeOpen(false) }; const closeOnOutsideClick = (event: MouseEvent) => { if (!wallpaperControlRef.current?.contains(event.target as Node)) setCustomizeOpen(false) }; document.addEventListener('keydown', closeOnEscape); document.addEventListener('mousedown', closeOnOutsideClick); return () => { document.removeEventListener('keydown', closeOnEscape); document.removeEventListener('mousedown', closeOnOutsideClick) } }, [customizeOpen])
  useEffect(() => { if (wallpaperMode === 'static' || rotation === 'session') return; const duration = rotationDurations[rotation]; const remaining = Math.max(0, duration - (Date.now() - changedAt)); const timer = window.setTimeout(() => { setWallpaperIndex((current) => (current + 1) % wallpapers.length); setChangedAt(Date.now()) }, remaining); return () => window.clearTimeout(timer) }, [wallpaperMode, rotation, changedAt])

  const search = (query: string) => navigate(`/search?q=${encodeURIComponent(query)}`)
  const changeMode = (next: SearchMode) => { setMode(next); if (next !== 'all') navigate(modePaths[next]) }
  const moveWallpaper = (index: number) => { setWallpaperIndex(index); setChangedAt(Date.now()) }
  const updatePreference = <K extends keyof NewTabPreferences>(key: K, value: NewTabPreferences[K]) => setPreferences((current) => ({ ...current, [key]: value }))

  return <div className={`newtab-home theme-${preferences.theme}`}>
    <div key={currentWallpaper.id} className="newtab-backdrop wallpaper-fade-in" style={{ backgroundImage: currentWallpaper.src }} aria-hidden="true" />
    <div className="newtab-shade" />
    <div className="newtab-content">
      <div className="wallpaper-control" ref={wallpaperControlRef}><button className="wallpaper-settings" onClick={() => setCustomizeOpen(!customizeOpen)} aria-label="Customize new tab" aria-expanded={customizeOpen}><SlidersHorizontal size={16} /></button>{customizeOpen && <CustomizePanel wallpaper={currentWallpaper} wallpapers={wallpapers} wallpaperIndex={wallpaperIndex} wallpaperMode={wallpaperMode as CustomizeMode} rotation={rotation as CustomizeRotation} shortcuts={shortcuts} showShortcuts={preferences.showShortcuts} showDiscovery={preferences.showDiscovery} showPrivacyStats={preferences.showPrivacyStats} autocompleteEnabled={preferences.autocompleteEnabled} voiceEnabled={preferences.voiceEnabled} defaultSearchMode={preferences.defaultSearchMode} theme={preferences.theme} onClose={() => setCustomizeOpen(false)} onWallpaperChange={moveWallpaper} onWallpaperModeChange={setWallpaperMode} onRotationChange={setRotation} onAddShortcut={(shortcut) => setShortcuts((current) => [...current, shortcut])} onUpdateShortcut={(shortcut) => setShortcuts((current) => current.map((item) => item.id === shortcut.id ? shortcut : item))} onRemoveShortcut={(id) => setShortcuts((current) => current.filter((item) => item.id !== id))} onToggle={(key, value) => updatePreference(key, value)} onDefaultSearchModeChange={(next) => updatePreference('defaultSearchMode', next as SearchMode)} onThemeChange={(next) => updatePreference('theme', next)} />}</div>
      <main className="newtab-center" aria-labelledby="newtab-title"><div className="newtab-brand"><Logo /><span className="brand-overline">PRIVATE SEARCH ENGINE</span><h1 id="newtab-title">Search privately.</h1></div><div className="newtab-search"><SearchBar large onSubmit={search} autocompleteEnabled={preferences.autocompleteEnabled} voiceEnabled={preferences.voiceEnabled} /><SearchModeTabs mode={mode} onModeChange={changeMode} /><div className="newtab-trust"><span><Check size={12} /> No search profile</span><span><Check size={12} /> No personalized ads</span></div></div>{preferences.showShortcuts && <div className="shortcut-dock" aria-label="Saved shortcuts"><span className="dock-label">SHORTCUTS</span><div className="shortcut-list">{shortcuts.map((shortcut) => <a key={shortcut.id} href={shortcut.url} target="_blank" rel="noreferrer"><span>{shortcut.label}</span></a>)}</div></div>}</main>
      {preferences.showDiscovery && <div className="newtab-bottom">{preferences.showPrivacyStats && <section className="newtab-panel stats-panel"><div className="panel-label"><ShieldCheck size={13} /> PRIVACY STATUS</div><div className="stats-row"><div><strong>ON</strong><span>Private by default</span></div><div><strong>NONE</strong><span>Search profile</span></div><div><strong>OFF</strong><span>Personalized ads</span></div></div><p><LockKeyhole size={12} /> Your activity stays in this browser.</p></section>}<section className="newtab-panel explore-panel"><div className="panel-label"><Compass size={13} /> TRENDING</div><button className="panel-feature" onClick={() => search('Latest AI developments')}><span>Latest AI<br />developments</span><ArrowUpRight size={17} /></button><div className="panel-links">{trending.slice(1, 4).map((query) => <button key={query} onClick={() => search(query)}>{query}<ArrowUpRight size={12} /></button>)}</div></section><section className="newtab-panel build-panel"><div className="panel-label"><Sparkles size={13} /> DISCOVER</div><h2>Web development.<br /><em>Programming. Science.</em></h2><p>Independent search infrastructure is in development.</p><a href="/about">Read the roadmap <ArrowUpRight size={13} /></a></section></div>}
    </div>
  </div>
}
