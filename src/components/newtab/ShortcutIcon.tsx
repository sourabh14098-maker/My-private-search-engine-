import { Globe } from 'lucide-react'

interface ShortcutIconProps {
  url: string
  label: string
  size?: number
}

export function ShortcutIcon({ url, label, size = 20 }: ShortcutIconProps) {
  const norm = (url + ' ' + label).toLowerCase()

  if (norm.includes('github')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    )
  }

  if (norm.includes('youtube')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  }

  if (norm.includes('reddit')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm6.2 12.5a2.2 2.2 0 0 1-3.6 1.7 6.4 6.4 0 0 1-5.2 0 2.2 2.2 0 0 1-3.6-1.7 2.2 2.2 0 0 1 .4-1.3 4.8 4.8 0 0 1 0-2.4 2.2 2.2 0 0 1 3.2-1.8 8.8 8.8 0 0 1 4.2-1.1l.9-4.2 2.9.6a1.5 1.5 0 1 1 1.4 2l-2.2-.5-.7 3.2a8.8 8.8 0 0 1 4.2 1.1 2.2 2.2 0 0 1 3.2 1.8 4.8 4.8 0 0 1 0 2.4 2.2 2.2 0 0 1-.7 1.3z" />
      </svg>
    )
  }

  if (norm.includes('wikipedia') || norm.includes('wiki')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.09 13.12 14.6 6.8h2.09l3.41 10.4h-1.92l-.84-2.82h-3.41l-.74 2.82h-1.77l2.67-7.58zm3.62 5.08-.98-3.32h2.05l-1.07 3.32zM3.9 6.8h2.23l2.87 8.32 2.5-8.32h2.12L9.4 17.2H7.2L3.9 6.8z" />
      </svg>
    )
  }

  if (norm.includes('stackoverflow') || norm.includes('stack')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.986 21.865v-6.404h2.134V24H2.87v-8.539h2.134v6.404h13.982zM6.111 19.731H17.85v-2.134H6.111v2.134zm.277-5.184 11.474 2.41 0.44-2.088-11.473-2.41-0.441 2.088zm1.66-5.32 10.468 5.485 0.993-1.895-10.468-5.485-0.993 1.895zm3.87-5.011 8.647 8.04 1.439-1.583-8.647-8.04-1.439 1.583zM16.14 0l-1.802 1.139 6.326 10.02 1.802-1.139L16.14 0z" />
      </svg>
    )
  }

  if (norm.includes('mail') || norm.includes('gmail')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    )
  }

  if (norm.includes('map')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z" />
      </svg>
    )
  }

  if (norm.includes('news')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 7h5v6H5V7zm14 12H5v-2h14v2zm0-4h-7v-2h7v2zm0-4h-7V7h7v2z" />
      </svg>
    )
  }

  // Fallback: stylized initial character or clean globe
  const initial = label.trim().charAt(0).toUpperCase()
  if (initial && /^[A-Z0-9]$/.test(initial)) {
    return (
      <span className="shortcut-initial" style={{ fontSize: size * 0.75, fontWeight: 700 }}>
        {initial}
      </span>
    )
  }

  return <Globe size={size} />
}
