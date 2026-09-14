import { SearchX } from 'lucide-react'

export function EmptyState({ title = 'Start with a search', copy = 'Enter a query above to explore the independent web.' }: { title?: string; copy?: string }) { return <div className="empty-state"><SearchX size={22} /><h2>{title}</h2><p>{copy}</p></div> }
