import { ArrowUpRight, Globe } from 'lucide-react'
import type { SearchResult as SearchResultType } from '../../types'

interface SearchResultProps {
  result: SearchResultType
  onSitelinkClick?: (term: string) => void
}

export function SearchResult({ result, onSitelinkClick }: SearchResultProps) {
  // Derive source indicator initial and domain branding
  const cleanDomain = result.domain ? result.domain.replace(/^www\./, '') : ''
  const domainInitial = cleanDomain ? cleanDomain[0].toUpperCase() : ''
  const isWikipedia = cleanDomain.includes('wikipedia')
  const isReddit = cleanDomain.includes('reddit')
  const isGitHub = cleanDomain.includes('github')

  // Clean human-readable display breadcrumb (never encoded query paths)
  const displayBreadcrumb =
    result.displayUrl ||
    result.breadcrumb ||
    (result.domain ? `${result.domain} > overview` : 'web')

  // True destination link URL with valid protocol
  const destinationUrl =
    result.destinationUrl ||
    (result.url.startsWith('http') ? result.url : `https://${result.url}`)

  return (
    <article className="result-card" role="article">
      {/* Source Favicon, Breadcrumb & Demo Label */}
      <div className="result-card-header">
        <span
          className={`source-indicator ${isWikipedia ? 'source-wiki' : isReddit ? 'source-reddit' : isGitHub ? 'source-github' : ''}`}
          aria-hidden="true"
        >
          {isWikipedia ? (
            <span className="source-wiki-w">W</span>
          ) : isReddit ? (
            <span className="source-reddit-r">r/</span>
          ) : domainInitial ? (
            <span className="source-initial">{domainInitial}</span>
          ) : (
            <Globe size={13} />
          )}
        </span>

        <div className="source-info">
          <div className="source-name-row">
            <span className="source-name">{result.metadata || result.domain}</span>
            {result.isDemo && <span className="demo-micro-tag">Sample result</span>}
          </div>
          <span className="result-breadcrumb" title={destinationUrl}>
            {displayBreadcrumb}
          </span>
        </div>
      </div>

      {/* Main Headline Title leading to Destination URL */}
      <h3 className="result-title-container">
        <a
          href={destinationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="result-card-title"
          aria-label={`${result.title} (opens external source)`}
        >
          <span>{result.title}</span>
          <ArrowUpRight size={14} className="result-title-arrow" aria-hidden="true" />
        </a>
      </h3>

      {/* Description Snippet */}
      <p className="result-card-snippet">
        {result.date && <span className="result-snippet-date">{result.date} — </span>}
        {result.description}
      </p>

      {/* Sitelinks Pills (Matching Brave Search tags) */}
      {result.sitelinks && result.sitelinks.length > 0 && (
        <div className="result-sitelinks-list" role="list" aria-label="Quick links">
          {result.sitelinks.map((link) => (
            <button
              key={link}
              type="button"
              className="sitelink-pill"
              onClick={() => onSitelinkClick?.(link)}
              title={`Refine search with ${link}`}
            >
              {link}
            </button>
          ))}
        </div>
      )}

      {/* Optional thumbnail if provided */}
      {'imageUrl' in result && (result as { imageUrl?: string }).imageUrl && (
        <div className="result-card-thumbnail">
          <img src={(result as { imageUrl?: string }).imageUrl} alt="" loading="lazy" />
        </div>
      )}
    </article>
  )
}
