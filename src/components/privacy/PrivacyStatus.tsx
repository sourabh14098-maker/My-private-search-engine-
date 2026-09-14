import { Check, ShieldCheck } from 'lucide-react'

export function PrivacyStatus() {
  return <div className="privacy-status"><div className="privacy-status-head"><div className="shield-icon"><ShieldCheck size={19} /></div><div><span className="eyebrow">CURRENT STATUS</span><h3>Private by default</h3></div><span className="status-live"><i /> Active</span></div><div className="status-list"><div><span>Search profile</span><strong>None</strong></div><div><span>Personalized ads</span><strong>Off</strong></div><div><span>Remote search history</span><strong>Off</strong></div><div><span>Analytics</span><strong>Off</strong></div></div><p className="status-foot"><Check size={14} /> No account required for this experience</p></div>
}
