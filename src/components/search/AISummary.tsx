import { BookOpen, Sparkles, Info } from 'lucide-react'

export function AISummary({ query }: { query: string }) {
  return (
    <section className="ai-summary" aria-label="Simulated AI answer preview">
      <div className="ai-heading">
        <span className="ai-icon"><Sparkles size={16} /></span>
        <span>AI ANSWER</span>
        <span className="planned-label">PROTOTYPE PREVIEW</span>
      </div>
      <p className="ai-answer">
        <strong>{query}</strong> is an illustrative query in this frontend prototype. This response demonstrates the planned layout for our future search intelligence layer, which will synthesize independently indexed sources with cited provenance once the backend crawler is connected.
      </p>
      <div className="source-row">
        <BookOpen size={15} />
        <span>Sources below are sample reference links for demonstration. Real-time synthesized sources require the backend service.</span>
      </div>
      <div className="ai-status-note">
        <Info size={13} aria-hidden="true" />
        <small>AI source synthesis is currently a UI preview and not connected to an active inference backend.</small>
      </div>
    </section>
  )
}
