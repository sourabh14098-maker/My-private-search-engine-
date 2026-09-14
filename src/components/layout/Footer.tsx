import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Footer() {
  return <footer className="site-footer"><span className="footer-note"><ShieldCheck size={14} /> DITCH GOOGLE!R! · Search the web. Keep your privacy.</span><span><Link to="/about">About</Link> · <Link to="/privacy">Privacy</Link> · <Link to="/settings">Settings</Link> · <Link to="/developer">Developer</Link> · <Link to="/status">Status</Link></span></footer>
}
