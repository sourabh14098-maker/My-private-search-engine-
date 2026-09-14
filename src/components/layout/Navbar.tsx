import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Logo } from '../common/Logo'

const links = [['Search', '/search'], ['Images', '/images'], ['Videos', '/videos'], ['News', '/news'], ['Maps', '/maps'], ['AI', '/ai'], ['Privacy', '/privacy'], ['Settings', '/settings'], ['About', '/about']]

export function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <header className="site-header">
      <Logo />
      <button className="icon-button mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open}>
        {open ? <X size={19} /> : <Menu size={19} />}
      </button>
      <nav className={open ? 'nav-links is-open' : 'nav-links'} aria-label="Main navigation">
        {links.map(([label, href]) => <NavLink key={href} to={href} onClick={() => setOpen(false)}>{label}</NavLink>)}
      </nav>
    </header>
  )
}
