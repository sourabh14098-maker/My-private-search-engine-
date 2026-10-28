import { Lightbulb, ExternalLink } from 'lucide-react'
import type { QuickContextData } from '../../types'
import { sanitizeSafeUrl } from '../../utils/url'

interface QuickContextCardProps {
  data: QuickContextData
}

export function QuickContextCard({ data }: QuickContextCardProps) {
  if (!data || (!data.title && !data.content)) {
    return null
  }

  const safeUrl = data.url ? sanitizeSafeUrl(data.destinationUrl || data.url) : undefined

  return (
    <aside className="quick-context-card" aria-label="Quick context and verified entity facts">
      <div className="quick-context-header">
        <div className="quick-context-title">
          <Lightbulb size={15} aria-hidden="true" />
          <span>QUICK CONTEXT</span>
        </div>
        {data.source && <span className="quick-context-source">{data.source}</span>}
      </div>

      <div className="quick-context-main">
        {data.imageUrl && (
          <div className="quick-context-image-wrap">
            <img
              src={data.imageUrl}
              alt={data.title}
              className="quick-context-image"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        <h2 className="quick-context-heading">{data.title}</h2>
        <p className="quick-context-content">{data.content}</p>
      </div>

      {data.attributes && data.attributes.length > 0 && (
        <dl className="quick-context-attributes">
          {data.attributes.map((attr, idx) => (
            <div key={`attr-${idx}`} className="quick-context-attr-row">
              <dt className="attr-label">{attr.label}</dt>
              <dd className="attr-value">{attr.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {safeUrl && safeUrl !== '#' && (
        <div className="quick-context-footer">
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="quick-context-link"
          >
            <span>Learn more on {data.source || 'source'}</span>
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
      )}
    </aside>
  )
}
