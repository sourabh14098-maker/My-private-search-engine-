import { Search, Image, Newspaper, Play, Sparkles, Map, ShoppingBag, BookOpen } from 'lucide-react'
import type { SearchMode } from '../../types'

const modes: { id: SearchMode; label: string; icon: typeof Search }[] = [
  { id: 'all', label: 'All', icon: Search }, { id: 'images', label: 'Images', icon: Image }, { id: 'videos', label: 'Videos', icon: Play }, { id: 'news', label: 'News', icon: Newspaper }, { id: 'maps', label: 'Maps', icon: Map }, { id: 'shopping', label: 'Shopping', icon: ShoppingBag }, { id: 'books', label: 'Books', icon: BookOpen }, { id: 'ai', label: 'AI', icon: Sparkles },
]

export function SearchModeTabs({ mode, onModeChange }: { mode: SearchMode; onModeChange: (mode: SearchMode) => void }) {
  return <div className="mode-tabs" role="tablist" aria-label="Search modes">{modes.map(({ id, label, icon: Icon }) => <button key={id} className={mode === id ? 'mode-tab active' : 'mode-tab'} role="tab" aria-selected={mode === id} onClick={() => onModeChange(id)}><Icon size={14} />{label}</button>)}</div>
}
