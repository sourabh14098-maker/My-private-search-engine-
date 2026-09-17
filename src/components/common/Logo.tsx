import { Link } from 'react-router-dom'
import { DitchXSymbol } from './DitchXBrand'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="logo" to="/" aria-label="DitchX home">
      <DitchXSymbol size={22} />
      {!compact && (
        <span className="logo-text">
          DITCH GOOGLE<span className="logo-punctuation">!R!</span>
        </span>
      )}
    </Link>
  )
}
