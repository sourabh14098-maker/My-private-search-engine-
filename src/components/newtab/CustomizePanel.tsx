import { ArrowLeft, ArrowRight, Check, Plus, Shuffle, Trash2, X } from 'lucide-react'
import { useState } from 'react'

export type NewTabShortcut = { id: string; label: string; url: string }
export type CustomizeWallpaper = { id: string; name: string; src: string }
export type CustomizeMode = 'static' | 'automatic'
export type CustomizeRotation = 'session' | 'hourly' | 'daily'

type CustomizePanelProps = {
  wallpaper: CustomizeWallpaper
  wallpapers: CustomizeWallpaper[]
  wallpaperIndex: number
  wallpaperMode: CustomizeMode
  rotation: CustomizeRotation
  shortcuts: NewTabShortcut[]
  showShortcuts: boolean
  showDiscovery: boolean
  showPrivacyStats: boolean
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
  onToggle: (key: 'showShortcuts' | 'showDiscovery' | 'showPrivacyStats' | 'autocompleteEnabled' | 'voiceEnabled', value: boolean) => void
  onDefaultSearchModeChange: (mode: string) => void
  onThemeChange: (theme: 'dark' | 'light') => void
}

export function CustomizePanel({ wallpaper, wallpapers, wallpaperIndex, wallpaperMode, rotation, shortcuts, showShortcuts, showDiscovery, showPrivacyStats, autocompleteEnabled, voiceEnabled, defaultSearchMode, theme, onClose, onWallpaperChange, onWallpaperModeChange, onRotationChange, onAddShortcut, onUpdateShortcut, onRemoveShortcut, onToggle, onDefaultSearchModeChange, onThemeChange }: CustomizePanelProps) {
  const [newLabel, setNewLabel] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const addShortcut = () => { const label = newLabel.trim(); const url = newUrl.trim(); if (!label || !url) return; onAddShortcut({ id: `${Date.now()}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, label, url: url.startsWith('http') ? url : `https://${url}` }); setNewLabel(''); setNewUrl('') }
  return <aside className="customize-panel" role="dialog" aria-modal="true" aria-label="Customize new tab">
    <div className="customize-header"><div><span className="eyebrow">NEW TAB</span><h2>Customize</h2></div><button className="customize-close" onClick={onClose} aria-label="Close customize panel"><X size={18} /></button></div>
    <section className="customize-section"><div className="customize-section-title"><span>WALLPAPER</span><span>{wallpaperIndex + 1}/{wallpapers.length}</span></div><div className="customize-preview" style={{ backgroundImage: wallpaper.src }}><strong>{wallpaper.name}</strong></div><div className="customize-wallpaper-row"><button onClick={() => onWallpaperChange((wallpaperIndex - 1 + wallpapers.length) % wallpapers.length)} aria-label="Previous wallpaper"><ArrowLeft size={15} /></button><button onClick={() => onWallpaperChange((wallpaperIndex + 1) % wallpapers.length)} aria-label="Next wallpaper"><ArrowRight size={15} /></button><button onClick={() => onWallpaperChange((wallpaperIndex + 1 + Math.floor(Math.random() * (wallpapers.length - 1))) % wallpapers.length)} aria-label="Random wallpaper"><Shuffle size={15} /></button></div><label>Choose wallpaper<select value={wallpaperIndex} onChange={(event) => onWallpaperChange(Number(event.target.value))}>{wallpapers.map((item, index) => <option value={index} key={item.id}>{item.name}</option>)}</select></label><div className="customize-options"><label><input type="radio" name="customize-wallpaper-mode" checked={wallpaperMode === 'static'} onChange={() => onWallpaperModeChange('static')} /> Static</label><label><input type="radio" name="customize-wallpaper-mode" checked={wallpaperMode === 'automatic'} onChange={() => onWallpaperModeChange('automatic')} /> Automatic</label></div><label>Rotation<select value={rotation} disabled={wallpaperMode === 'static'} onChange={(event) => onRotationChange(event.target.value as CustomizeRotation)}><option value="session">Every new session</option><option value="hourly">Every hour</option><option value="daily">Daily</option></select></label></section>
    <section className="customize-section"><div className="customize-section-title"><span>SHORTCUTS</span><button onClick={() => onToggle('showShortcuts', !showShortcuts)} aria-pressed={showShortcuts}>{showShortcuts ? 'Shown' : 'Hidden'}</button></div>{showShortcuts && <><div className="customize-shortcuts">{shortcuts.map((shortcut) => <div className="customize-shortcut" key={shortcut.id}><input value={shortcut.label} aria-label={`${shortcut.label} shortcut name`} onChange={(event) => onUpdateShortcut({ ...shortcut, label: event.target.value })} /><input value={shortcut.url} aria-label={`${shortcut.label} shortcut URL`} onChange={(event) => onUpdateShortcut({ ...shortcut, url: event.target.value })} /><button onClick={() => onRemoveShortcut(shortcut.id)} aria-label={`Remove ${shortcut.label} shortcut`}><Trash2 size={14} /></button></div>)}</div><div className="customize-add-shortcut"><input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} placeholder="Name" aria-label="New shortcut name" /><input value={newUrl} onChange={(event) => setNewUrl(event.target.value)} placeholder="example.com" aria-label="New shortcut URL" /><button onClick={addShortcut} aria-label="Add shortcut"><Plus size={15} /></button></div></>}</section>
    <section className="customize-section"><div className="customize-section-title"><span>SEARCH</span></div><label>Default mode<select value={defaultSearchMode} onChange={(event) => onDefaultSearchModeChange(event.target.value)}><option value="all">Web</option><option value="images">Images</option><option value="videos">Videos</option><option value="news">News</option><option value="maps">Maps</option><option value="shopping">Shopping</option><option value="books">Books</option><option value="ai">AI</option></select></label><PreferenceToggle label="Autocomplete" checked={autocompleteEnabled} onChange={(value) => onToggle('autocompleteEnabled', value)} /><PreferenceToggle label="Voice search" checked={voiceEnabled} onChange={(value) => onToggle('voiceEnabled', value)} /></section>
    <section className="customize-section"><div className="customize-section-title"><span>APPEARANCE</span></div><label>Theme<select value={theme} onChange={(event) => onThemeChange(event.target.value as 'dark' | 'light')}><option value="dark">Midnight</option><option value="light">Light</option></select></label></section>
    <section className="customize-section"><div className="customize-section-title"><span>CONTENT</span></div><PreferenceToggle label="Shortcuts" checked={showShortcuts} onChange={(value) => onToggle('showShortcuts', value)} /><PreferenceToggle label="Discovery" checked={showDiscovery} onChange={(value) => onToggle('showDiscovery', value)} /><PreferenceToggle label="Privacy status" checked={showPrivacyStats} onChange={(value) => onToggle('showPrivacyStats', value)} /></section>
    <p className="customize-footnote"><Check size={13} /> Preferences are saved on this device.</p>
  </aside>
}

function PreferenceToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="preference-toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label> }