import { ArrowUpRight, Clock, ExternalLink, MapPin, Play, ShoppingBag, Star } from 'lucide-react'
import type { BookResult, ImageResult, NewsResult, PlaceResult, ProductResult, VideoResult } from '../../types'

export function ImageResults({ results, onPreview }: { results: ImageResult[]; onPreview: (result: ImageResult) => void }) { return <div className="image-grid">{results.map((result) => <button className="image-result" key={result.id} onClick={() => onPreview(result)}><img src={result.imageUrl} alt={result.title} loading="lazy" /><span>{result.title}</span><small>{result.domain}</small></button>)}</div> }
export function VideoResults({ results }: { results: VideoResult[] }) { return <div className="media-list">{results.map((result) => <article className="video-result" key={result.id}><div className="thumbnail"><img src={result.thumbnailUrl} alt="" loading="lazy" /><span><Play size={13} fill="currentColor" /> {result.duration}</span></div><div><small>{result.source} · {result.published}</small><h2>{result.title}<ArrowUpRight size={15} /></h2><p>{result.description}</p></div></article>)}</div> }
export function NewsResults({ results }: { results: NewsResult[] }) {
  return (
    <div className="news-feed" role="feed" aria-label="News articles feed">
      {results.map((result) => (
        <article className="news-card" key={result.id}>
          <div className="news-card-inner">
            <div className="news-card-content">
              <div className="news-card-meta">
                <span className="news-card-publisher">{result.publisher}</span>
                <span className="news-meta-divider" aria-hidden="true">·</span>
                <span className="news-card-time">
                  <Clock size={11} aria-hidden="true" />
                  {result.timestamp}
                </span>
                <span className="news-source-tag">Independent</span>
              </div>
              <a
                href="#read"
                onClick={(e) => e.preventDefault()}
                className="news-card-title"
                aria-label={`${result.headline} by ${result.publisher}`}
              >
                <span>{result.headline}</span>
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
              <p className="news-card-desc">{result.description}</p>
            </div>
            {result.imageUrl && (
              <div className="news-card-thumbnail">
                <img src={result.imageUrl} alt="" loading="lazy" />
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
export function PlaceResults({ results }: { results: PlaceResult[] }) { return <div className="place-list">{results.map((result) => <article className="place-result" key={result.id}><div className="place-heading"><MapPin size={16} /><div><h2>{result.name}</h2><small>{result.category} · {result.distance}</small></div><strong><Star size={13} fill="currentColor" /> {result.rating}</strong></div><p>{result.address}</p><span className="open-status">{result.openingStatus}</span><a href={`https://${result.website}`} target="_blank" rel="noreferrer">{result.website} <ExternalLink size={12} /></a></article>)}</div> }
export function ProductResults({ results }: { results: ProductResult[] }) { return <div className="product-grid">{results.map((result) => <article className="product-result" key={result.id}><img src={result.imageUrl} alt="" loading="lazy" /><div><small><ShoppingBag size={12} /> {result.store}</small><h2>{result.name}</h2><strong>{result.price}</strong><p><Star size={13} fill="currentColor" /> {result.rating} · {result.availability}</p></div></article>)}</div> }
export function BookResults({ results }: { results: BookResult[] }) { return <div className="book-list">{results.map((result) => <article className="book-result" key={result.id}><img src={result.coverUrl} alt="" loading="lazy" /><div><small>{result.source} · {result.publicationDate}</small><h2>{result.title}</h2><strong>{result.author}</strong><p>{result.description}</p></div></article>)}</div> }
