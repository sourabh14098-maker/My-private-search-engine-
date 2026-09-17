export function DitchXSymbol({
  size = 48,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dxCyanGrad" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="60%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="dxSilverGrad" x1="52" y1="10" x2="12" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="dxCoreGrad" x1="24" y1="24" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
        <filter id="dxGlow" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Subtle Ambient Glow */}
      <circle cx="32" cy="32" r="20" fill="#38bdf8" opacity="0.12" filter="url(#dxGlow)" />

      {/* Wing 1: Azure Dynamic Forward Diagonal */}
      <path
        d="M15 11 C15 9.8 16 9 17.2 9 L25.5 9 C26.3 9 27.1 9.5 27.6 10.2 L48.8 52.8 C49.4 53.9 48.6 55 47.3 55 L38.8 55 C38 55 37.2 54.5 36.7 53.8 L15.4 12.2 C15.1 11.7 15 11.4 15 11 Z"
        fill="url(#dxCyanGrad)"
      />

      {/* Wing 2: Titanium Interlocking Transverse Diagonal (Upper Section) */}
      <path
        d="M48.8 9 C50 9 50.9 10.1 50.3 11.2 L37.2 33 L29.5 28.5 L40.2 10.2 C40.7 9.5 41.5 9 42.3 9 Z"
        fill="url(#dxSilverGrad)"
      />

      {/* Wing 2: Titanium Interlocking Transverse Diagonal (Lower Section) */}
      <path
        d="M34.5 35.5 L26.8 31 L13.7 52.8 C13.1 53.9 14 55 15.2 55 L23.7 55 C24.5 55 25.3 54.5 25.8 53.8 Z"
        fill="url(#dxSilverGrad)"
      />

      {/* Central Precision Luminous Core / Aperture */}
      <polygon
        points="32,23 39,32 32,41 25,32"
        fill="url(#dxCoreGrad)"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1"
      />
      <circle cx="32" cy="32" r="2.5" fill="#ffffff" />
    </svg>
  )
}

export function DitchXLogoLockup({
  size = 52,
  showTagline = true,
  className = '',
}: {
  size?: number
  showTagline?: boolean
  className?: string
}) {
  return (
    <div className={`ditchx-brand-center ${className}`}>
      <div className="ditchx-symbol-wrap">
        <DitchXSymbol size={size} />
      </div>
      <div className="ditchx-title-wrap">
        <h1 className="ditchx-wordmark">
          Ditch<span className="ditchx-x-accent">X</span>
        </h1>
      </div>
      {showTagline && (
        <p className="ditchx-tagline">
          Browse Beyond the Default
        </p>
      )}
      <div className="ditchx-search-engine-pill">
        <span className="pill-dot" />
        <span className="pill-text">
          Search engine: <strong>Ditch Google<span className="pill-punct">!R!</span></strong>
        </span>
      </div>
    </div>
  )
}
