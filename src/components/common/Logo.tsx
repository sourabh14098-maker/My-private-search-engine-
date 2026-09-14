import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="logo" to="/" aria-label="Ditch Google!R! home">
      <span className="logo-mark">D</span>
      {!compact && <span>DITCH GOOGLE<span className="logo-punctuation">!R!</span></span>}
      <ArrowUpRight size={14} strokeWidth={2.5} aria-hidden="true" />
    </Link>
  )
}
