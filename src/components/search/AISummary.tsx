import { BookOpen, Sparkles } from 'lucide-react'

export function AISummary({ query }: { query: string }) {
  return <section className="ai-summary" aria-label="AI answer"><div className="ai-heading"><span className="ai-icon"><Sparkles size={16} /></span><span>AI ANSWER</span><span className="planned-label">UI PREVIEW</span></div><p className="ai-answer"><strong>{query}</strong> is a broad topic with several useful starting points. This concise answer surface is prepared for a future search intelligence layer that will synthesize sources and show its work.</p><div className="source-row"><BookOpen size={15} /><span>Sources will appear here when AI search is connected.</span></div></section>
}
