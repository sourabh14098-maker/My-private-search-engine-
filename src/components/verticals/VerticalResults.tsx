import { ArrowUpRight, Clock, ExternalLink, Globe, MapPin, Play, ShoppingBag, Star } from 'lucide-react'
import type { BookResult, ImageResult, NewsResult, PlaceResult, ProductResult, VideoResult } from '../../types'

export function ImageResults({ results, onPreview }: { results: ImageResult[]; onPreview: (result: ImageResult) => void }) {
  return (
    <div className="image-grid" role="region" aria-label="Image search results">
      {results.map((result) => (
        <button
          className="image-result"
          key={result.id}
          onClick={() => onPreview(result)}
          title={`Preview ${result.title} (Sample image)`}
        >
          <img src={result.imageUrl} alt={result.title} loading="lazy" />
          <div className="image-meta-bar">
            <span>{result.title}</span>
            <div className="image-sub-bar">
              <small>{result.domain}</small>
              <span className="demo-micro-tag">Sample</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export function VideoResults({ results }: { results: VideoResult[] }) {
  return (
    <div className="media-list" role="feed" aria-label="Video search results">
      {results.map((result) => {
        const destUrl = result.destinationUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(result.title)}`
        return (
          <article className="video-result" key={result.id}>
            <a
              href={destUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="thumbnail-link"
              aria-label={`Play ${result.title}`}
            >
              <div className="thumbnail">
                <img src={result.thumbnailUrl} alt="" loading="lazy" />
                <span><Play size={12} fill="currentColor" /> {result.duration}</span>
              </div>
            </a>
            <div className="video-content">
              <div className="video-meta-top">
                <small>{result.source} · {result.published}</small>
                <span className="demo-micro-tag">Demo video</span>
              </div>
              <a
                href={destUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="video-title-link"
              >
                <h2>
                  <span>{result.title}</span>
                  <ArrowUpRight size={15} />
                </h2>
              </a>
              <p>{result.description}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function NewsResults({ results }: { results: NewsResult[] }) {
  return (
    <div className="news-feed" role="feed" aria-label="News articles feed">
      {results.map((result) => {
        const destUrl = result.destinationUrl || `https://duckduckgo.com/?q=${encodeURIComponent(result.headline)}&ia=news`
        return (
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
                  <span className="news-source-tag">Sample publication</span>
                </div>

                <a
                  href={destUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="news-card-title"
                  aria-label={`${result.headline} from ${result.publisher}`}
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
        )
      })}
    </div>
  )
}

export function PlaceResults({ results }: { results: PlaceResult[] }) {
  return (
    <div className="place-list" role="feed" aria-label="Map location results">
      {results.map((result) => {
        const webUrl = result.website.startsWith('http') ? result.website : `https://${result.website}`
        const mapSearchUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(result.name + ' ' + result.address)}`

        return (
          <article className="place-result" key={result.id}>
            {/* Header: Name, Category, Distance, and Sample Rating */}
            <div className="place-heading">
              <div className="place-icon-wrapper" aria-hidden="true">
                <MapPin size={18} />
              </div>

              <div className="place-title-box">
                <a
                  href={mapSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="place-title-link"
                >
                  <h2>{result.name}</h2>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>

                <div className="place-category-distance-row">
                  <span className="place-category-pill">{result.category}</span>
                  <span className="place-bullet-dot" aria-hidden="true">•</span>
                  <span className="place-distance-text">{result.distance} away</span>
                </div>
              </div>

              <div className="place-rating-badge" title="Simulated rating for demonstration">
                <Star size={13} fill="currentColor" aria-hidden="true" />
                <strong>{result.rating}</strong>
                <span className="demo-rating-tag">Sample</span>
              </div>
            </div>

            {/* Structured Details: Address, Hours, Website (properly spaced rows) */}
            <div className="place-details-body">
              {/* Address Row */}
              <div className="place-detail-row">
                <span className="place-detail-icon-cell" aria-hidden="true">
                  <MapPin size={14} />
                </span>
                <span className="place-detail-label">Address:</span>
                <span className="place-detail-value place-address-text">{result.address}</span>
              </div>

              {/* Opening Hours Row */}
              <div className="place-detail-row">
                <span className="place-detail-icon-cell" aria-hidden="true">
                  <Clock size={14} />
                </span>
                <span className="place-detail-label">Hours:</span>
                <span className="place-detail-value open-status">{result.openingStatus}</span>
              </div>

              {/* Website Link Row */}
              <div className="place-detail-row place-website-row">
                <span className="place-detail-icon-cell" aria-hidden="true">
                  <Globe size={14} />
                </span>
                <span className="place-detail-label">Website:</span>
                <a
                  href={webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="place-detail-value place-website-link"
                >
                  <span>{result.website}</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>
            </div>

            {/* Demo Notice Footer */}
            <div className="place-card-footer">
              <span className="demo-micro-tag">Demo location · Not verified business data</span>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function ProductResults({ results }: { results: ProductResult[] }) {
  return (
    <div className="product-grid" role="region" aria-label="Shopping product results">
      {results.map((result) => {
        const productSearchUrl = result.destinationUrl || `https://duckduckgo.com/?q=${encodeURIComponent(result.name)}`
        return (
          <article className="product-result" key={result.id}>
            <div className="product-image-wrap">
              <img src={result.imageUrl} alt="" loading="lazy" />
              <span className="demo-micro-tag product-overlay-tag">Sample item</span>
            </div>
            <div className="product-body">
              <small className="product-store">
                <ShoppingBag size={12} aria-hidden="true" />
                <span>{result.store}</span>
              </small>
              <a
                href={productSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="product-title-link"
              >
                <h2>{result.name}</h2>
              </a>
              <div className="product-price-row">
                <strong>{result.price}</strong>
                <span className="product-price-sample">(Sample price)</span>
              </div>
              <p className="product-rating-line">
                <Star size={12} fill="currentColor" aria-hidden="true" />
                <span>{result.rating} (Sample) · {result.availability}</span>
              </p>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export function BookResults({ results }: { results: BookResult[] }) {
  return (
    <div className="book-list" role="feed" aria-label="Book search results">
      {results.map((result) => {
        const bookSearchUrl = result.destinationUrl || `https://openlibrary.org/search?q=${encodeURIComponent(result.title)}`
        return (
          <article className="book-result" key={result.id}>
            <img src={result.coverUrl} alt={`Cover of ${result.title}`} loading="lazy" />
            <div className="book-body">
              <div className="book-meta-top">
                <small>{result.source} · {result.publicationDate}</small>
                <span className="demo-micro-tag">Sample catalog</span>
              </div>
              <a
                href={bookSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="book-title-link"
              >
                <h2>
                  <span>{result.title}</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </h2>
              </a>
              <strong className="book-author">By {result.author}</strong>
              <p className="book-description">{result.description}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
