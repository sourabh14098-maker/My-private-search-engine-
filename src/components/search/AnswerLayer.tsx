import React from 'react'
import { Sparkles, ExternalLink, ShieldCheck, Info } from 'lucide-react'
import type { AIAnswerData, AnswerSource } from '../../types'
import { sanitizeSafeUrl } from '../../utils/url'

interface AnswerLayerProps {
  query: string
  answer?: AIAnswerData
  loading?: boolean
}

interface MarkdownBlock {
  type: 'heading' | 'numbered-list' | 'bullet-list' | 'paragraph'
  level?: number
  items?: string[]
  text?: string
}

function renderInlineMarkdown(text: string, sources: AnswerSource[]): React.ReactNode[] {
  // Matches citations [1], bold **text**, code `code`, italics *text*
  const tokenPattern = /(\[\d+(?:\s*,\s*\d+)*\]|\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\n]+\*|_[^_\n]+_)/g
  const parts = text.split(tokenPattern)

  return parts.map((part, index) => {
    if (!part) return null

    // Citation marker match: [1] or [1, 2]
    if (/^\[\d+(?:\s*,\s*\d+)*\]$/.test(part)) {
      const nums = part
        .slice(1, -1)
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))

      return (
        <span key={`cite-group-${index}`} className="answer-citation-group">
          {nums.map((num) => {
            const sourceIndex = num - 1
            const source = sources[sourceIndex]
            if (!source) {
              return (
                <span key={`cite-invalid-${num}`} className="answer-citation-ref inert">
                  [{num}]
                </span>
              )
            }
            const safeUrl = sanitizeSafeUrl(source.destinationUrl || source.url)
            return (
              <a
                key={`cite-${num}-${sourceIndex}`}
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="answer-citation-ref"
                title={`${source.title || 'Source'} (${source.domain || ''})`}
                aria-label={`Citation [${num}]: ${source.title || source.domain || 'Source'}`}
              >
                [{num}]
              </a>
            )
          })}
        </span>
      )
    }

    // Bold text: **text** or __text__
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return <strong key={`bold-${index}`}>{part.slice(2, -2)}</strong>
    }

    // Inline code: `code`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={`code-${index}`} className="answer-inline-code">
          {part.slice(1, -1)}
        </code>
      )
    }

    // Italics text: *text* or _text_
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return <em key={`em-${index}`}>{part.slice(1, -1)}</em>
    }

    // Plain text
    return part
  })
}

function parseMarkdownBlocks(rawText: string): MarkdownBlock[] {
  const lines = rawText.split(/\r?\n/)
  const blocks: MarkdownBlock[] = []
  let currentBlock: MarkdownBlock | null = null

  const flushBlock = () => {
    if (currentBlock) {
      blocks.push(currentBlock)
      currentBlock = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()

    if (!trimmed) {
      flushBlock()
      continue
    }

    // Headings: ### Heading, ## Heading, # Heading
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      flushBlock()
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      })
      continue
    }

    // Standalone bold line as section heading: **Heading Text**
    const boldHeadingMatch = trimmed.match(/^\*\*([^*]+)\*\*$/)
    if (boldHeadingMatch) {
      flushBlock()
      blocks.push({
        type: 'heading',
        level: 3,
        text: boldHeadingMatch[1].trim(),
      })
      continue
    }

    // Numbered list item: 1. Item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
    if (numMatch) {
      if (!currentBlock || currentBlock.type !== 'numbered-list') {
        flushBlock()
        currentBlock = { type: 'numbered-list', items: [] }
      }
      currentBlock.items?.push(numMatch[2].trim())
      continue
    }

    // Bullet list item: - Item, * Item, • Item
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/)
    if (bulletMatch) {
      if (!currentBlock || currentBlock.type !== 'bullet-list') {
        flushBlock()
        currentBlock = { type: 'bullet-list', items: [] }
      }
      currentBlock.items?.push(bulletMatch[1].trim())
      continue
    }

    // Regular paragraph
    if (!currentBlock || currentBlock.type !== 'paragraph') {
      flushBlock()
      currentBlock = { type: 'paragraph', text: trimmed }
    } else {
      currentBlock.text += ' ' + trimmed
    }
  }

  flushBlock()
  return blocks
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
            {parseMarkdownBlocks(answer.answer).map((block, idx) => {
              if (block.type === 'heading') {
                return (
                  <h3 key={`h-${idx}`} className="answer-heading">
                    {renderInlineMarkdown(block.text || '', sources)}
                  </h3>
                )
              }
              if (block.type === 'numbered-list' && block.items) {
                return (
                  <ol key={`ol-${idx}`} className="answer-numbered-list">
                    {block.items.map((item, itemIdx) => (
                      <li key={`li-num-${itemIdx}`}>
                        {renderInlineMarkdown(item, sources)}
                      </li>
                    ))}
                  </ol>
                )
              }
              if (block.type === 'bullet-list' && block.items) {
                return (
                  <ul key={`ul-${idx}`} className="answer-bullet-list">
                    {block.items.map((item, itemIdx) => (
                      <li key={`li-bullet-${itemIdx}`}>
                        {renderInlineMarkdown(item, sources)}
                      </li>
                    ))}
                  </ul>
                )
              }
              return (
                <p key={`p-${idx}`} className="answer-paragraph">
                  {renderInlineMarkdown(block.text || '', sources)}
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
