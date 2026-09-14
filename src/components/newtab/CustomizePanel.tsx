import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Image,
  Layers,
  Plus,
  Search,
  ShieldCheck,
  Shuffle,
  Trash2,
  X,
} from 'lucide-react'
import type { Wallpaper } from '../../data/wallpapers'

export type NewTabShortcut = { id: string; label: string; url: string }
export type CustomizeMode = 'static' | 'automatic'
export type CustomizeRotation = 'session' | 'hourly' | 'daily'

export interface CustomizePanelProps {
  wallpapers: Wallpaper[]
  wallpaperIndex: number
  wallpaperMode: CustomizeMode
  rotation: CustomizeRotation
  shortcuts: NewTabShortcut[]
  showShortcuts: boolean
  showPrivacyStats: boolean
  showTrending: boolean
  showDiscovery: boolean
  autocompleteEnabled: boolean
  voiceEnabled: boolean
  defaultSearchMode: string
  theme: 'dark' | 'light'
  onClose: () => void
  onWallpaperChange: (index: number) => void
  onWallpaperModeChange: (mode: CustomizeMode) => void
  onRotationChange: (rotation: CustomizeRotation) => void
  onAddShortcut: (shortcut: NewTabShortcut) => void
  onUpdateShortcut: (shortcut: NewTabShortcut) => void
  onRemoveShortcut: (id: string) => void
  onToggle: (
    key:
      | 'showShortcuts'
      | 'showPrivacyStats'
      | 'showTrending'
      | 'showDiscovery'
      | 'autocompleteEnabled'
      | 'voiceEnabled',
    value: boolean
  ) => void
  onDefaultSearchModeChange: (mode: string) => void
  onThemeChange: (theme: 'dark' | 'light') => void
}

type TabKey = 'wallpaper' | 'shortcuts' | 'modules' | 'search'

export function CustomizePanel({
  wallpapers,
  wallpaperIndex,
  wallpaperMode,
  rotation,
  shortcuts,
  showShortcuts,
  showPrivacyStats,
  showTrending,
  showDiscovery,
  autocompleteEnabled,
  voiceEnabled,
  defaultSearchMode,
  theme,
  onClose,
  onWallpaperChange,
  onWallpaperModeChange,
  onRotationChange,
  onAddShortcut,
  onUpdateShortcut,
  onRemoveShortcut,
  onToggle,
  onDefaultSearchModeChange,
  onThemeChange,
}: CustomizePanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('wallpaper')
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [urlError, setUrlError] = useState('')

  const currentWallpaper = wallpapers[wallpaperIndex] || wallpapers[0]

  const handleAddShortcut = () => {
    const label = newLabel.trim()
    let url = newUrl.trim()
    if (!label || !url) return

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
    }

    try {
      new URL(url)
      setUrlError('')
    } catch {
      setUrlError('Please enter a valid web address')
      return
    }

    onAddShortcut({
      id: `${Date.now()}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label,
      url,
    })
    setNewLabel('')
    setNewUrl('')
  }

  const handleRandomWallpaper = () => {
    if (wallpapers.length <= 1) return
    let next = Math.floor(Math.random() * wallpapers.length)
    if (next === wallpaperIndex) {
      next = (next + 1) % wallpapers.length
    }
    onWallpaperChange(next)
  }

  return (
    <aside
      className="customize-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Customize New Tab"
    >
      <div className="customize-header">
        <div>
          <span className="eyebrow">NEW TAB</span>
          <h2>Customize</h2>
        </div>
        <button
          className="customize-close"
          onClick={onClose}
          aria-label="Close customize panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="customize-tabs" role="tablist" aria-label="Customize categories">
        <button
          className={activeTab === 'wallpaper' ? 'active' : ''}
          onClick={() => setActiveTab('wallpaper')}
          role="tab"
          aria-selected={activeTab === 'wallpaper'}
        >
          <Image size={14} /> Wallpaper
        </button>
        <button
          className={activeTab === 'shortcuts' ? 'active' : ''}
          onClick={() => setActiveTab('shortcuts')}
          role="tab"
          aria-selected={activeTab === 'shortcuts'}
        >
          <Layers size={14} /> Shortcuts
        </button>
        <button
          className={activeTab === 'modules' ? 'active' : ''}
          onClick={() => setActiveTab('modules')}
          role="tab"
          aria-selected={activeTab === 'modules'}
        >
          <Compass size={14} /> Modules
        </button>
        <button
          className={activeTab === 'search' ? 'active' : ''}
          onClick={() => setActiveTab('search')}
          role="tab"
          aria-selected={activeTab === 'search'}
        >
          <Search size={14} /> Search
        </button>
      </div>

      <div className="customize-body">
        {/* Tab 1: Wallpaper */}
        {activeTab === 'wallpaper' && (
          <div className="customize-tab-content">
            <div className="customize-active-meta">
              <span className="wallpaper-category">{currentWallpaper.category}</span>
              <h3>{currentWallpaper.name}</h3>
              <p>{currentWallpaper.description}</p>
            </div>

            {/* Visual Grid of Wallpapers */}
            <div className="wallpaper-grid-picker">
              {wallpapers.map((wp, idx) => {
                const isSelected = idx === wallpaperIndex
                return (
                  <button
                    key={wp.id}
                    className={`wallpaper-thumb-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => onWallpaperChange(idx)}
                    aria-label={`Select ${wp.name} wallpaper`}
                    style={{
                      backgroundImage: wp.style.backgroundImage,
                      backgroundColor: wp.style.backgroundColor,
                    }}
                  >
                    <span className="thumb-label">{wp.name}</span>
                    {isSelected && (
                      <span className="thumb-check">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Quick Actions */}
            <div className="customize-wallpaper-row">
              <button
                onClick={() =>
                  onWallpaperChange((wallpaperIndex - 1 + wallpapers.length) % wallpapers.length)
                }
                aria-label="Previous wallpaper"
              >
                <ArrowLeft size={14} /> Previous
              </button>
              <button
                onClick={() => onWallpaperChange((wallpaperIndex + 1) % wallpapers.length)}
                aria-label="Next wallpaper"
              >
                Next <ArrowRight size={14} />
              </button>
              <button onClick={handleRandomWallpaper} aria-label="Random wallpaper">
                <Shuffle size={14} /> Random
              </button>
            </div>

            {/* Mode & Frequency */}
            <div className="customize-section-box">
              <div className="customize-options">
                <label>
                  <input
                    type="radio"
                    name="customize-wallpaper-mode"
                    checked={wallpaperMode === 'static'}
                    onChange={() => onWallpaperModeChange('static')}
                  />{' '}
                  Static
                </label>
                <label>
                  <input
                    type="radio"
                    name="customize-wallpaper-mode"
                    checked={wallpaperMode === 'automatic'}
                    onChange={() => onWallpaperModeChange('automatic')}
                  />{' '}
                  Automatic rotation
                </label>
              </div>

              <label className="customize-select-label">
                <span>Rotation interval</span>
                <select
                  value={rotation}
                  disabled={wallpaperMode === 'static'}
                  onChange={(e) => onRotationChange(e.target.value as CustomizeRotation)}
                >
                  <option value="session">Every new session</option>
                  <option value="hourly">Every hour</option>
                  <option value="daily">Daily</option>
                </select>
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Shortcuts */}
        {activeTab === 'shortcuts' && (
          <div className="customize-tab-content">
            <div className="customize-toggle-header">
              <span>Show Shortcuts on New Tab</span>
              <button
                className={`pill-toggle-btn ${showShortcuts ? 'active' : ''}`}
                onClick={() => onToggle('showShortcuts', !showShortcuts)}
                aria-pressed={showShortcuts}
              >
                {showShortcuts ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {showShortcuts && (
              <>
                <div className="customize-shortcuts-list">
                  {shortcuts.map((shortcut) => (
                    <div className="customize-shortcut-item" key={shortcut.id}>
                      <input
                        value={shortcut.label}
                        aria-label={`${shortcut.label} name`}
                        placeholder="Name"
                        onChange={(e) =>
                          onUpdateShortcut({ ...shortcut, label: e.target.value })
                        }
                      />
                      <input
                        value={shortcut.url}
                        aria-label={`${shortcut.label} URL`}
                        placeholder="https://example.com"
                        onChange={(e) =>
                          onUpdateShortcut({ ...shortcut, url: e.target.value })
                        }
                      />
                      <button
                        className="shortcut-delete-btn"
                        onClick={() => onRemoveShortcut(shortcut.id)}
                        aria-label={`Remove ${shortcut.label}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="customize-add-shortcut">
                  <div className="add-fields">
                    <input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Name (e.g. GitHub)"
                      aria-label="New shortcut name"
                    />
                    <input
                      value={newUrl}
                      onChange={(e) => {
                        setNewUrl(e.target.value)
                        setUrlError('')
                      }}
                      placeholder="URL (e.g. github.com)"
                      aria-label="New shortcut URL"
                    />
                  </div>
                  {urlError && <span className="error-text">{urlError}</span>}
                  <button
                    className="add-submit-btn"
                    onClick={handleAddShortcut}
                    aria-label="Add shortcut"
                  >
                    <Plus size={14} /> Add Shortcut
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Information Modules */}
        {activeTab === 'modules' && (
          <div className="customize-tab-content">
            <p className="tab-hint">
              Customize the lightweight information overlay cards docked at the bottom of the New Tab.
            </p>
            <div className="customize-toggles-stack">
              <PreferenceToggle
                label="Privacy Status"
                description="Show current privacy defaults and local data status"
                checked={showPrivacyStats}
                onChange={(val) => onToggle('showPrivacyStats', val)}
              />
              <PreferenceToggle
                label="Trending Searches"
                description="Display top privacy and technology trending topics"
                checked={showTrending}
                onChange={(val) => onToggle('showTrending', val)}
              />
              <PreferenceToggle
                label="Discover Insights"
                description="Highlights about independent web search development"
                checked={showDiscovery}
                onChange={(val) => onToggle('showDiscovery', val)}
              />
            </div>
          </div>
        )}

        {/* Tab 4: Search & Preferences */}
        {activeTab === 'search' && (
          <div className="customize-tab-content">
            <div className="customize-section-box">
              <label className="customize-select-label">
                <span>Default search vertical</span>
                <select
                  value={defaultSearchMode}
                  onChange={(e) => onDefaultSearchModeChange(e.target.value)}
                >
                  <option value="all">Web (All)</option>
                  <option value="images">Images</option>
                  <option value="videos">Videos</option>
                  <option value="news">News</option>
                  <option value="maps">Maps</option>
                  <option value="shopping">Shopping</option>
                  <option value="books">Books</option>
                  <option value="ai">AI Search</option>
                </select>
              </label>

              <PreferenceToggle
                label="Search Autocomplete"
                description="Show instant suggestions and search history as you type"
                checked={autocompleteEnabled}
                onChange={(val) => onToggle('autocompleteEnabled', val)}
              />

              <PreferenceToggle
                label="Voice Search"
                description="Allow searching with the browser speech recognition microphone"
                checked={voiceEnabled}
                onChange={(val) => onToggle('voiceEnabled', val)}
              />

              <label className="customize-select-label" style={{ marginTop: '12px' }}>
                <span>Theme</span>
                <select
                  value={theme}
                  onChange={(e) => onThemeChange(e.target.value as 'dark' | 'light')}
                >
                  <option value="dark">Midnight Dark</option>
                  <option value="light">Subtle Light</option>
                </select>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="customize-footer">
        <ShieldCheck size={14} />
        <span>All preferences are saved locally on this device.</span>
      </div>
    </aside>
  )
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="preference-toggle-card">
      <div className="toggle-copy">
        <strong>{label}</strong>
        {description && <p>{description}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  )
}