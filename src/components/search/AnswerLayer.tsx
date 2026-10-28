import { useState, useLayoutEffect, useRef } from 'react'
import {
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react'
import type { AIAnswerData } from '../../types'
import { sanitizeSafeUrl } from '../../utils/url'
import {
  parseMarkdownBlocks,
  renderInlineMarkdown,
  evaluateAnswerTruncation,
  COLLAPSED_HEIGHT_PX,
} from '../../utils/markdownParser'

interface AnswerLayerProps {
  query: string
  answer?: AIAnswerData
  loading?: boolean
}

/**
 * Fenced code block component with syntax language badge and one-click copy feedback.
 */
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // Fallback if clipboard API is restricted
    }
  }

  return (
    <div className="answer-code-block-wrapper">
      <div className="answer-code-header">
        <span className="answer-code-lang">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="answer-code-copy-btn"
          aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
        >
          {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="answer-code-content">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function AnswerLayer({ query, answer, loading = false }: AnswerLayerProps) {
  const [prevProps, setPrevProps] = useState({ query, answerText: answer?.answer })
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLElement>(null)

  // Adjust expansion state when query or answer changes per React recommended pattern
  if (prevProps.query !== query || prevProps.answerText !== answer?.answer) {
    setPrevProps({ query, answerText: answer?.answer })
    setIsExpanded(false)
  }

  const handleToggleExpand = () => {
    if (isExpanded) {
      setIsExpanded(false)
      const container = containerRef.current
      if (container && typeof window !== 'undefined') {
        const rect = container.getBoundingClientRect()
        if (rect.top < 0) {
          container.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    } else {
      setIsExpanded(true)
    }
  }

  // Measure content overflow dynamically using ResizeObserver
  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) {
      setIsTruncated(false)
      return
    }

    const checkTruncation = () => {
      // Show More / Show Less appears ONLY when the content scrollHeight genuinely exceeds the expansion threshold (340px)
      // Short answers (<= 280px) and medium answers (280px - 340px) fit naturally within space without a toggle button.
      const { isTruncated: hasOverflow } = evaluateAnswerTruncation(el.scrollHeight)
      setIsTruncated(hasOverflow)
    }

    checkTruncation()

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        checkTruncation()
      })
      observer.observe(el)

      return () => {
        observer.disconnect()
      }
    }
  }, [answer?.answer])

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
      ref={containerRef}
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
          <div
            id="ditchx-answer-body"
            ref={contentRef}
            className={`answer-markdown-text ${isTruncated && !isExpanded ? 'collapsed' : 'expanded'}`}
            style={{
              maxHeight: isTruncated && !isExpanded ? `${COLLAPSED_HEIGHT_PX}px` : undefined,
            }}
          >
            {parseMarkdownBlocks(answer.answer, query).map((block, idx) => {
              if (block.type === 'heading') {
                const HeadingTag = block.level === 2 ? 'h2' : block.level === 4 ? 'h4' : 'h3'
                return (
                  <HeadingTag key={`h-${idx}`} className="answer-heading">
                    {renderInlineMarkdown(block.text || '', sources)}
                  </HeadingTag>
                )
              }
              if (block.type === 'code-block') {
                return (
                  <CodeBlock
                    key={`code-block-${idx}`}
                    code={block.code || ''}
                    language={block.language}
                  />
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
            {isTruncated && !isExpanded && (
              <div className="answer-bottom-fade" aria-hidden="true" />
            )}
          </div>

          {isTruncated && (
            <div className="answer-expand-container">
              <button
                type="button"
                id="ditchx-answer-toggle-btn"
                className="answer-toggle-btn"
                onClick={handleToggleExpand}
                aria-expanded={isExpanded}
                aria-controls="ditchx-answer-body"
              >
                <span>{isExpanded ? 'Show less' : 'Show more'}</span>
                {isExpanded ? (
                  <ChevronUp size={14} className="answer-toggle-icon" aria-hidden="true" />
                ) : (
                  <ChevronDown size={14} className="answer-toggle-icon" aria-hidden="true" />
                )}
              </button>
            </div>
          )}
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

      {/* Clickable Source Citations (always accessible outside collapsible preview) */}
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
