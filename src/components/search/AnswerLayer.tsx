import { Sparkles, ExternalLink, ShieldCheck, Info } from 'lucide-react'
import type { AIAnswerData } from '../../types'
import { sanitizeSafeUrl } from '../../utils/url'

interface AnswerLayerProps {
  query: string
  answer?: AIAnswerData
  loading?: boolean
}

export function AnswerLayer({ query, answer, loading = false }: AnswerLayerProps) {
  if (loading) {
    return (
      <section className="answer-layer loading" aria-busy="true" aria-label="Synthesizing answer">
        <div className="answer-layer-header">
          <div className="answer-layer-title">
            <span className="answer-sparkle-icon" aria-hidden="true">
              <Sparkles size={16} />
            </span>
            <span className="answer-heading-text">AI ANSWER</span>
          </div>
          <span className="answer-status-pill loading">SYNTHESIZING...</span>
        </div>
        <div className="answer-skeleton-body">
          <div className="skeleton-line wide" />
          <div className="skeleton-line medium" />
          <div className="skeleton-line narrow" />
        </div>
      </section>
    )
  }

  // If no answer payload or empty state
  if (!answer && !query) {
    return null
  }

  const status = answer?.status || 'unavailable'
  const sources = answer?.sources || []

  return (
    <section
      className={`answer-layer ${status}`}
      aria-label="Direct search answer and source synthesis"
    >
      <div className="answer-layer-header">
        <div className="answer-layer-title">
          <span className="answer-sparkle-icon" aria-hidden="true">
            <Sparkles size={16} />
          </span>
          <span className="answer-heading-text">AI ANSWER</span>
          {status === 'ready' && (
            <span className="answer-privacy-badge">
              <ShieldCheck size={13} aria-hidden="true" />
              <span>Zero query retention</span>
            </span>
          )}
        </div>

        <div className="answer-header-meta">
          {status === 'unavailable' && (
            <span className="answer-status-pill unavailable">
              <Info size={12} aria-hidden="true" />
              MODEL NOT CONFIGURED
            </span>
          )}
          {status === 'unsupported' && (
            <span className="answer-status-pill unsupported">INSUFFICIENT SOURCES</span>
          )}
          {status === 'error' && (
            <span className="answer-status-pill error">SYNTHESIS ERROR</span>
          )}
          {status === 'ready' && (
            <span className="answer-status-pill ready">VERIFIED SYNTHESIS</span>
          )}
        </div>
      </div>

      {status === 'ready' && answer?.answer && (
        <div className="answer-layer-content">
          <div className="answer-markdown-text">
            {answer.answer.split('\n\n').map((paragraph, idx) => {
              const trimmed = paragraph.trim()
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const items = trimmed.split('\n').map((li) => li.replace(/^[-*]\s+/, '').trim())
                return (
                  <ul key={`ul-${idx}`} className="answer-bullet-list">
                    {items.map((item, itemIdx) => (
                      <li key={`li-${itemIdx}`}>{item}</li>
                    ))}
                  </ul>
                )
              }
              return (
                <p key={`p-${idx}`} className="answer-paragraph">
                  {trimmed}
                </p>
              )
            })}
          </div>
        </div>
      )}

      {status === 'unavailable' && (
        <div className="answer-layer-notice">
          <p className="notice-lead">
            {answer?.notice ||
              'To safeguard your privacy, DitchX does not transmit search queries or retrieved content to third-party AI models by default.'}
          </p>
          <p className="notice-sub">
            You can configure a local private inference engine (e.g., Ollama) or an AI endpoint in{' '}
            <code>backend/.env</code> to enable real-time answer synthesis. Organic search results from
            SearXNG are displayed directly below.
          </p>
        </div>
      )}

      {status === 'unsupported' && (
        <div className="answer-layer-notice">
          <p className="notice-lead">
            {answer?.notice ||
              'Retrieved search results do not contain enough verified information to generate an answer.'}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="answer-layer-notice">
          <p className="notice-lead">
            {answer?.notice ||
              'An error occurred during AI answer synthesis. Organic search results are displayed below.'}
          </p>
        </div>
      )}

      {/* Clickable Source Citations */}
      {sources.length > 0 && (
        <div className="answer-layer-sources" aria-label="Retrieved sources for answer synthesis">
          <span className="sources-heading">
            {status === 'ready' ? 'Sources cited:' : 'Verified candidate sources:'}
          </span>
          <div className="sources-pills-list">
            {sources.map((src, idx) => {
              const safeUrl = sanitizeSafeUrl(src.destinationUrl || src.url)
              return (
                <a
                  key={`src-${idx}-${src.domain}`}
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-citation-pill"
                  title={src.title}
                >
                  <span className="source-index">[{idx + 1}]</span>
                  <span className="source-domain">{src.domain || 'Source'}</span>
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
