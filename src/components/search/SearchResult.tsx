import { ArrowUpRight } from 'lucide-react'
import type { SearchResult as SearchResultType } from '../../types'

export function SearchResult({ result }: { result: SearchResultType }) {
  return <article className="result-item"><div className="result-topline"><span className="result-domain">{result.domain}</span><span className="result-meta">{result.metadata}</span></div><a href={`https://${result.url}`} target="_blank" rel="noreferrer" className="result-title">{result.title}<ArrowUpRight size={16} /></a><p>{result.description}</p><span className="result-url">{result.url}</span></article>
}
