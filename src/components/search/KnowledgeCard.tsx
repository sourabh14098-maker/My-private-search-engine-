import { Lightbulb } from 'lucide-react'

export function KnowledgeCard({ query }: { query: string }) { return <aside className="knowledge-card"><div className="knowledge-title"><Lightbulb size={16} /> QUICK CONTEXT</div><h2>{query || 'Search topic'}</h2><p>A concise knowledge surface is planned for the independent index. It will provide definitions, facts, and sources without turning a search into a profile.</p><span>Knowledge layer / planned</span></aside> }
