import { useState } from 'react'
import { MessageSquare, ArrowUp, ChevronDown, ExternalLink } from 'lucide-react'
import type { DiscussionItem } from '../../types'

interface DiscussionsProps {
  items: DiscussionItem[]
}

export function Discussions({ items }: DiscussionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!items || items.length === 0) return null

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <section className="discussions-widget" aria-label="Community Discussions (Sample Threads)">
      <div className="discussions-header">
        <span className="discussions-icon" aria-hidden="true">💬</span>
        <h2 className="discussions-title">Discussions</h2>
        {items.some((item) => item.isDemo) && (
          <span className="demo-pill-tag">Sample threads · Mock index</span>
        )}
      </div>

      <div className="discussions-list" role="list">
        {items.map((item) => {
          const isExpanded = expandedId === item.id
          return (
            <article key={item.id} className={`discussion-item ${isExpanded ? 'is-expanded' : ''}`} role="listitem">
              <div
                className="discussion-main-row"
                onClick={() => toggleExpand(item.id)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleExpand(item.id)
                  }
                }}
              >
                <div className="discussion-content-block">
                  <h3 className="discussion-item-title">
                    {item.title}
                  </h3>
                  <div className="discussion-meta-row">
                    <span className="discussion-community">
                      <span className="community-badge-dot" aria-hidden="true">🟠</span>
                      {item.community}
                    </span>
                    {item.comments > 0 && (
                      <span className="discussion-stat">
                        <MessageSquare size={13} aria-hidden="true" />
                        <span>{item.comments}</span>
                      </span>
                    )}
                    {item.upvotes > 0 && (
                      <span className="discussion-stat">
                        <ArrowUp size={13} aria-hidden="true" />
                        <span>{item.upvotes}</span>
                      </span>
                    )}
                    {item.date && (
                      <span className="discussion-date">{item.date}</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="discussion-toggle-btn"
                  aria-label={isExpanded ? 'Collapse discussion details' : 'Expand discussion details'}
                  tabIndex={-1}
                >
                  <ChevronDown size={17} className={`toggle-chevron ${isExpanded ? 'rotated' : ''}`} />
                </button>
              </div>

              {isExpanded && (
                <div className="discussion-expanded-pane">
                  {item.preview && (
                    <p className="discussion-preview-text">{item.preview}</p>
                  )}
                  <div className="discussion-action-row">
                    <a
                      href={`https://reddit.com/${item.community}`}
                      target="_blank"
                      rel="noreferrer"
                      className="discussion-external-link"
                    >
                      <span>View thread on {item.community}</span>
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
