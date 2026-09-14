import { ArrowUpRight } from 'lucide-react'

const suggestions = ['How does quantum computing work?', 'Best Java frameworks', 'Latest cybersecurity research', 'React performance optimization']
export function SearchSuggestions({ onSelect }: { onSelect: (query: string) => void }) {
  return <section className="suggestions"><div className="section-kicker"><span>EXPLORE PRIVATELY</span><span className="line" /></div><div className="suggestion-grid">{suggestions.map((suggestion, index) => <button key={suggestion} className="suggestion" onClick={() => onSelect(suggestion)}><span className="suggestion-number">0{index + 1}</span><span>{suggestion}</span><ArrowUpRight size={15} /></button>)}</div></section>
}
