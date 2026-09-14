import { ArrowUpRight } from 'lucide-react'

export function RelatedSearches({ queries, onSelect }: { queries: string[]; onSelect: (query: string) => void }) { return <section className="related-searches"><div className="section-kicker"><span>RELATED SEARCHES</span><b /></div><div className="related-grid">{queries.map((query) => <button key={query} onClick={() => onSelect(query)}>{query}<ArrowUpRight size={14} /></button>)}</div></section> }
