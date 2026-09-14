import { ArrowUpRight, BookOpen, Code2, Image, Map, Newspaper, Play, ShoppingBag, Sparkles, Search } from 'lucide-react'
import type { SearchMode } from '../../types'

const quickAccess: { label: string; mode: SearchMode; icon: typeof Search }[] = [
  { label: 'Web', mode: 'all', icon: Search },
  { label: 'Images', mode: 'images', icon: Image },
  { label: 'News', mode: 'news', icon: Newspaper },
  { label: 'Videos', mode: 'videos', icon: Play },
  { label: 'Maps', mode: 'maps', icon: Map },
  { label: 'Shopping', mode: 'shopping', icon: ShoppingBag },
  { label: 'Books', mode: 'books', icon: BookOpen },
  { label: 'AI', mode: 'ai', icon: Sparkles },
]

const trending = ['Latest technology trends', 'Java development', 'AI tools', 'Cybersecurity', 'Web development', 'Current events']

export function HomeDiscovery({ onMode, onSearch }: { onMode: (mode: SearchMode) => void; onSearch: (query: string) => void }) {
  return <section className="home-discovery" aria-label="Search shortcuts and discovery">
    <div className="discovery-block quick-block">
      <div className="discovery-heading"><span>QUICK ACCESS</span><span className="discovery-rule" /></div>
      <div className="quick-grid">{quickAccess.map(({ label, mode, icon: Icon }) => <button key={label} onClick={() => onMode(mode)}><Icon size={15} /><span>{label}</span><ArrowUpRight size={12} /></button>)}</div>
    </div>
    <div className="discovery-block trending-block">
      <div className="discovery-heading"><span>TRENDING</span><span className="discovery-rule" /><span className="live-mark"><i /> LIVE PREVIEW</span></div>
      <div className="trending-grid">{trending.map((query, index) => <button key={query} onClick={() => onSearch(query)}><span className="trend-index">{String(index + 1).padStart(2, '0')}</span><span>{query}</span><ArrowUpRight size={12} /></button>)}</div>
    </div>
    <div className="discovery-note"><Code2 size={14} /><span>Independent search infrastructure</span><span className="note-status">/ in development</span></div>
  </section>
}
