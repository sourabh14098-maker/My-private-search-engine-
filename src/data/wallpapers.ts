export interface Wallpaper {
  id: string
  name: string
  category: string
  description: string
  style: {
    backgroundColor: string
    backgroundImage: string
    backgroundSize?: string
    backgroundPosition?: string
  }
}

// 1. Alpine Twilight - Layered mountain ridges, atmospheric altitude haze, twilight starfield
const alpineRidgeSvg = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='none'>
    <defs>
      <linearGradient id='skyGrad' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#060a12'/>
        <stop offset='35%' stop-color='#0e1726'/>
        <stop offset='65%' stop-color='#1b2a3d'/>
        <stop offset='100%' stop-color='#2f445c'/>
      </linearGradient>
      <linearGradient id='ridgeBack' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#1a2636' stop-opacity='0.85'/>
        <stop offset='100%' stop-color='#0f1622' stop-opacity='0.95'/>
      </linearGradient>
      <linearGradient id='ridgeMid' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#131c28'/>
        <stop offset='100%' stop-color='#090d14'/>
      </linearGradient>
      <linearGradient id='ridgeFront' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#0a0e16'/>
        <stop offset='100%' stop-color='#030508'/>
      </linearGradient>
      <radialGradient id='moonGlow' cx='78%' cy='22%' r='30%'>
        <stop offset='0%' stop-color='#d7f26d' stop-opacity='0.25'/>
        <stop offset='45%' stop-color='#5ebedc' stop-opacity='0.12'/>
        <stop offset='100%' stop-color='transparent' stop-opacity='0'/>
      </radialGradient>
    </defs>
    <rect width='1600' height='900' fill='url(#skyGrad)'/>
    <rect width='1600' height='900' fill='url(#moonGlow)'/>
    <!-- Distant Stars -->
    <circle cx='210' cy='90' r='1' fill='#ffffff' opacity='0.7'/>
    <circle cx='340' cy='160' r='1.2' fill='#d7f26d' opacity='0.8'/>
    <circle cx='580' cy='85' r='1' fill='#ffffff' opacity='0.6'/>
    <circle cx='790' cy='140' r='1.5' fill='#ffffff' opacity='0.9'/>
    <circle cx='1020' cy='95' r='1' fill='#ffffff' opacity='0.6'/>
    <circle cx='1240' cy='180' r='1.2' fill='#5ebedc' opacity='0.8'/>
    <circle cx='1450' cy='110' r='1' fill='#ffffff' opacity='0.7'/>
    <circle cx='1380' cy='70' r='1.8' fill='#ffffff' opacity='0.9'/>
    <!-- Distant High Ridge -->
    <path d='M0,520 L160,430 L310,490 L480,380 L640,460 L810,360 L990,480 L1170,390 L1350,470 L1500,410 L1600,450 L1600,900 L0,900 Z' fill='url(#ridgeBack)'/>
    <!-- Mid Craggy Ridge -->
    <path d='M0,610 L190,510 L370,590 L560,480 L760,570 L940,490 L1130,580 L1310,500 L1490,570 L1600,530 L1600,900 L0,900 Z' fill='url(#ridgeMid)'/>
    <!-- Foreground Valley Treeline Silhouette -->
    <path d='M0,710 L130,640 L280,690 L450,620 L620,680 L790,610 L970,670 L1150,600 L1330,660 L1490,610 L1600,640 L1600,900 L0,900 Z' fill='url(#ridgeFront)'/>
  </svg>`
)

// 2. Neo Metropolis - Futuristic cyberpunk city skyline, telemetry grid horizon, beacon glows
const neoCitySvg = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='none'>
    <defs>
      <linearGradient id='citySky' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#05060b'/>
        <stop offset='45%' stop-color='#0a0c16'/>
        <stop offset='80%' stop-color='#141726'/>
        <stop offset='100%' stop-color='#1f1b2d'/>
      </linearGradient>
    </defs>
    <rect width='1600' height='900' fill='url(#citySky)'/>
    <!-- Horizon Glow -->
    <ellipse cx='800' cy='670' rx='700' ry='120' fill='#5ebedc' opacity='0.16'/>
    <ellipse cx='800' cy='680' rx='500' ry='70' fill='#d7f26d' opacity='0.12'/>
    <!-- Back Skyline -->
    <path d='M80,660 L80,480 L140,480 L140,660 M220,660 L220,440 L290,440 L290,660 M380,660 L380,410 L430,360 L480,410 L480,660 M560,660 L560,490 L630,490 L630,660 M720,660 L720,380 L800,380 L800,660 M890,660 L890,430 L950,430 L950,660 M1040,660 L1040,460 L1110,460 L1110,660 M1200,660 L1200,390 L1270,390 L1270,660 M1360,660 L1360,470 L1440,470 L1440,660 Z' fill='#0e111d' opacity='0.85'/>
    <!-- Mid Buildings with Spire Beacons -->
    <path d='M30,690 L30,520 L90,520 L90,690 M150,690 L150,460 L180,410 L210,460 L210,690 M310,690 L310,430 L360,430 L360,690 M490,690 L490,510 L550,510 L550,690 M640,690 L640,360 L680,360 L680,690 M790,690 L790,450 L860,450 L860,690 M960,690 L960,420 L1010,420 L1010,690 M1120,690 L1120,490 L1180,490 L1180,690 M1280,690 L1280,410 L1320,370 L1360,410 L1360,690 M1450,690 L1450,530 L1520,530 L1520,690 Z' fill='#090b12'/>
    <!-- Antennas and Beacon Lights -->
    <line x1='180' y1='410' x2='180' y2='370' stroke='#5ebedc' stroke-width='2' opacity='0.8'/>
    <circle cx='180' cy='368' r='2' fill='#5ebedc'/>
    <line x1='660' y1='360' x2='660' y2='310' stroke='#d7f26d' stroke-width='2' opacity='0.9'/>
    <circle cx='660' cy='308' r='3' fill='#d7f26d'/>
    <line x1='1320' y1='370' x2='1320' y2='325' stroke='#5ebedc' stroke-width='2' opacity='0.8'/>
    <circle cx='1320' cy='323' r='2' fill='#5ebedc'/>
    <!-- Horizon Deck Ground -->
    <rect x='0' y='685' width='1600' height='215' fill='#05070c'/>
    <line x1='0' y1='685' x2='1600' y2='685' stroke='#d7f26d' stroke-opacity='0.3' stroke-width='1.5'/>
  </svg>`
)

// 3. Emerald Canopy - Deep botanical shadows, pine silhouettes, sun mist filtration
const emeraldCanopySvg = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='none'>
    <defs>
      <linearGradient id='forestSky' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#030c09'/>
        <stop offset='40%' stop-color='#081c15'/>
        <stop offset='70%' stop-color='#102e23'/>
        <stop offset='100%' stop-color='#173f30'/>
      </linearGradient>
      <linearGradient id='treeGrad1' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#0c231a' stop-opacity='0.8'/>
        <stop offset='100%' stop-color='#05110d' stop-opacity='0.95'/>
      </linearGradient>
      <linearGradient id='treeGrad2' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#061510'/>
        <stop offset='100%' stop-color='#020705'/>
      </linearGradient>
      <radialGradient id='canopyLight' cx='50%' cy='25%' r='50%'>
        <stop offset='0%' stop-color='#d7f26d' stop-opacity='0.18'/>
        <stop offset='60%' stop-color='#2ee6ca' stop-opacity='0.06'/>
        <stop offset='100%' stop-color='transparent' stop-opacity='0'/>
      </radialGradient>
    </defs>
    <rect width='1600' height='900' fill='url(#forestSky)'/>
    <rect width='1600' height='900' fill='url(#canopyLight)'/>
    <!-- Distant Pines -->
    <path d='M0,580 L60,490 L120,580 L180,480 L240,580 L320,460 L400,580 L480,470 L560,580 L660,440 L760,580 L860,460 L960,580 L1060,440 L1160,580 L1260,470 L1360,580 L1460,450 L1540,580 L1600,510 L1600,900 L0,900 Z' fill='url(#treeGrad1)'/>
    <!-- Foreground Majestic Conifers -->
    <path d='M0,660 L80,520 L160,660 L260,500 L360,660 L480,470 L600,660 L730,490 L860,660 L990,480 L1120,660 L1250,510 L1380,660 L1500,490 L1600,620 L1600,900 L0,900 Z' fill='url(#treeGrad2)'/>
    <!-- Mist Base Layer -->
    <rect x='0' y='680' width='1600' height='220' fill='#040c09' opacity='0.75'/>
  </svg>`
)

// 4. Aurora Veil - Atmospheric polar dusk, bioluminescent wave curtains
const auroraVeilSvg = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='none'>
    <defs>
      <linearGradient id='auroraSky' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#040713'/>
        <stop offset='45%' stop-color='#081223'/>
        <stop offset='75%' stop-color='#0f1c32'/>
        <stop offset='100%' stop-color='#09101d'/>
      </linearGradient>
      <radialGradient id='auroraGreen' cx='35%' cy='35%' r='45%'>
        <stop offset='0%' stop-color='#2ee6ca' stop-opacity='0.42'/>
        <stop offset='50%' stop-color='#d7f26d' stop-opacity='0.18'/>
        <stop offset='100%' stop-color='transparent' stop-opacity='0'/>
      </radialGradient>
      <radialGradient id='auroraViolet' cx='70%' cy='42%' r='40%'>
        <stop offset='0%' stop-color='#8b5cf6' stop-opacity='0.36'/>
        <stop offset='60%' stop-color='#3b82f6' stop-opacity='0.15'/>
        <stop offset='100%' stop-color='transparent' stop-opacity='0'/>
      </radialGradient>
    </defs>
    <rect width='1600' height='900' fill='url(#auroraSky)'/>
    <rect width='1600' height='900' fill='url(#auroraGreen)'/>
    <rect width='1600' height='900' fill='url(#auroraViolet)'/>
    <!-- Auroral Curtains -->
    <path d='M-100,280 Q300,160 700,240 T1500,200 L1700,500 Q1100,580 600,480 T-100,520 Z' fill='#2ee6ca' opacity='0.14'/>
    <path d='M-100,320 Q400,200 900,310 T1700,260 L1700,540 Q1200,620 700,530 T-100,560 Z' fill='#8b5cf6' opacity='0.15'/>
    <path d='M0,380 Q500,260 1000,350 T1700,320 L1700,580 Q1100,640 600,550 T0,600 Z' fill='#d7f26d' opacity='0.12'/>
  </svg>`
)

// 5. Cosmic Void - Deep space starlight, multi-layered nebulae, diffraction spikes
const cosmicVoidSvg = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='none'>
    <defs>
      <linearGradient id='spaceVoid' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#030407'/>
        <stop offset='50%' stop-color='#070912'/>
        <stop offset='100%' stop-color='#04050a'/>
      </linearGradient>
      <radialGradient id='nebula1' cx='78%' cy='28%' r='38%'>
        <stop offset='0%' stop-color='#9333ea' stop-opacity='0.28'/>
        <stop offset='50%' stop-color='#6366f1' stop-opacity='0.12'/>
        <stop offset='100%' stop-color='transparent' stop-opacity='0'/>
      </radialGradient>
      <radialGradient id='nebula2' cx='24%' cy='72%' r='42%'>
        <stop offset='0%' stop-color='#0284c7' stop-opacity='0.24'/>
        <stop offset='55%' stop-color='#2dd4bf' stop-opacity='0.1'/>
        <stop offset='100%' stop-color='transparent' stop-opacity='0'/>
      </radialGradient>
    </defs>
    <rect width='1600' height='900' fill='url(#spaceVoid)'/>
    <rect width='1600' height='900' fill='url(#nebula1)'/>
    <rect width='1600' height='900' fill='url(#nebula2)'/>
    <!-- Multi-tier stars -->
    <circle cx='120' cy='80' r='1.2' fill='#ffffff' opacity='0.75'/>
    <circle cx='240' cy='190' r='0.8' fill='#93c5fd' opacity='0.6'/>
    <circle cx='380' cy='110' r='1.5' fill='#ffffff' opacity='0.85'/>
    <circle cx='510' cy='230' r='1' fill='#ffffff' opacity='0.7'/>
    <circle cx='680' cy='95' r='2' fill='#ffffff' opacity='0.95'/>
    <circle cx='820' cy='170' r='1' fill='#d7f26d' opacity='0.8'/>
    <circle cx='960' cy='80' r='1.8' fill='#ffffff' opacity='0.9'/>
    <circle cx='1110' cy='210' r='0.8' fill='#ffffff' opacity='0.6'/>
    <circle cx='1280' cy='130' r='2.2' fill='#ffffff' opacity='0.95'/>
    <circle cx='1420' cy='260' r='1.2' fill='#a78bfa' opacity='0.8'/>
    <circle cx='1530' cy='90' r='1' fill='#ffffff' opacity='0.7'/>
    <circle cx='290' cy='430' r='1.4' fill='#ffffff' opacity='0.8'/>
    <circle cx='460' cy='520' r='0.9' fill='#ffffff' opacity='0.65'/>
    <circle cx='740' cy='490' r='1.2' fill='#ffffff' opacity='0.75'/>
    <circle cx='920' cy='560' r='1.6' fill='#d7f26d' opacity='0.85'/>
    <circle cx='1180' cy='470' r='1.2' fill='#ffffff' opacity='0.8'/>
    <circle cx='1390' cy='580' r='1' fill='#93c5fd' opacity='0.7'/>
    <!-- Bright Focal Star with Diffraction -->
    <line x1='680' y1='80' x2='680' y2='110' stroke='#ffffff' stroke-width='0.75' opacity='0.6'/>
    <line x1='665' y1='95' x2='695' y2='95' stroke='#ffffff' stroke-width='0.75' opacity='0.6'/>
    <line x1='1280' y1='112' x2='1280' y2='148' stroke='#ffffff' stroke-width='0.75' opacity='0.6'/>
    <line x1='1262' y1='130' x2='1298' y2='130' stroke='#ffffff' stroke-width='0.75' opacity='0.6'/>
  </svg>`
)

// 6. Brutalist Monolith - Architectural chiaroscuro, diagonal monolithic planes, raking daylight
const brutalistMonolithSvg = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='none'>
    <defs>
      <linearGradient id='archSky' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#080b0e'/>
        <stop offset='50%' stop-color='#10151b'/>
        <stop offset='100%' stop-color='#080a0d'/>
      </linearGradient>
      <linearGradient id='concreteLight' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#26333d' stop-opacity='0.9'/>
        <stop offset='60%' stop-color='#141c22' stop-opacity='0.95'/>
        <stop offset='100%' stop-color='#0b0f12'/>
      </linearGradient>
      <linearGradient id='concreteDark' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#10161b'/>
        <stop offset='100%' stop-color='#050709'/>
      </linearGradient>
      <linearGradient id='beamLight' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='#d7f26d' stop-opacity='0.16'/>
        <stop offset='45%' stop-color='#ffffff' stop-opacity='0.05'/>
        <stop offset='100%' stop-color='transparent' stop-opacity='0'/>
      </linearGradient>
    </defs>
    <rect width='1600' height='900' fill='url(#archSky)'/>
    <!-- Monolithic Columns and Cantilevers -->
    <polygon points='-40,900 240,160 520,240 280,900' fill='url(#concreteLight)'/>
    <polygon points='240,160 480,80 720,180 520,240' fill='url(#concreteDark)'/>
    <polygon points='560,900 860,260 1140,340 880,900' fill='url(#concreteLight)'/>
    <polygon points='860,260 1100,170 1360,270 1140,340' fill='url(#concreteDark)'/>
    <polygon points='1180,900 1420,380 1680,450 1480,900' fill='url(#concreteLight)'/>
    <!-- Raking Light Beam Overlay -->
    <polygon points='-200,0 800,0 1600,900 600,900' fill='url(#beamLight)'/>
  </svg>`
)

export const wallpapers: Wallpaper[] = [
  {
    id: 'alpine-twilight',
    name: 'Alpine Twilight',
    category: 'Cinematic Mountain',
    description: 'Layered mountain ridges, atmospheric altitude haze, twilight starfield',
    style: {
      backgroundColor: '#060a12',
      backgroundImage: `url("data:image/svg+xml,${alpineRidgeSvg}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center bottom',
    },
  },
  {
    id: 'neo-metropolis',
    name: 'Neo Metropolis',
    category: 'Futuristic Dark City',
    description: 'Futuristic cyberpunk city skyline, telemetry grid horizon, beacon glows',
    style: {
      backgroundColor: '#05060b',
      backgroundImage: `url("data:image/svg+xml,${neoCitySvg}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center bottom',
    },
  },
  {
    id: 'emerald-canopy',
    name: 'Emerald Canopy',
    category: 'Forest & Nature',
    description: 'Deep botanical shadows, evergreen conifer silhouettes, morning canopy mist',
    style: {
      backgroundColor: '#030c09',
      backgroundImage: `url("data:image/svg+xml,${emeraldCanopySvg}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center bottom',
    },
  },
  {
    id: 'aurora-veil',
    name: 'Aurora Veil',
    category: 'Atmospheric Gradient',
    description: 'Atmospheric polar dusk, bioluminescent wave curtains, starlight',
    style: {
      backgroundColor: '#040713',
      backgroundImage: `url("data:image/svg+xml,${auroraVeilSvg}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
    },
  },
  {
    id: 'cosmic-void',
    name: 'Cosmic Void',
    category: 'Night Sky & Nebula',
    description: 'Deep space starlight, multi-layered cosmic dust nebulae, diffraction spikes',
    style: {
      backgroundColor: '#030407',
      backgroundImage: `url("data:image/svg+xml,${cosmicVoidSvg}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
    },
  },
  {
    id: 'brutalist-monolith',
    name: 'Brutalist Monolith',
    category: 'Architectural & Geometric',
    description: 'Architectural chiaroscuro, diagonal monolithic planes, raking daylight',
    style: {
      backgroundColor: '#080b0e',
      backgroundImage: `url("data:image/svg+xml,${brutalistMonolithSvg}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
    },
  },
]
