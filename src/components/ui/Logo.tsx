import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

/** Logo officiel Togosaas (SVG inline — aucune dépendance à un fichier externe) */
export const LOGO_ALT = 'Togosaas — Hub SaaS du Togo';

type LogoVariant = 'nav' | 'footer' | 'auth' | 'dashboard' | 'splash';

/** Contraste du logo par rapport au fond d'affichage */
export type LogoSurface = 'auto' | 'light' | 'dark';

const VARIANT_CLASS: Record<LogoVariant, string> = {
  nav: 'h-11 w-auto sm:h-12',
  footer: 'h-20 w-auto sm:h-24',
  auth: 'h-24 w-auto sm:h-28',
  dashboard: 'h-11 w-auto sm:h-12',
  splash: 'h-auto w-[min(78vw,320px)] sm:w-[360px]',
};

interface LogoProps {
  className?: string;
  variant?: LogoVariant;
  linked?: boolean;
  /** Fond clair = logo coloré ; fond sombre = logo clair ; auto = suit le thème */
  surface?: LogoSurface;
}

function resolveSurface(surface: LogoSurface, theme: 'light' | 'dark'): 'light' | 'dark' {
  if (surface === 'auto') return theme === 'dark' ? 'dark' : 'light';
  return surface;
}

interface Palette {
  badge: string;
  spokeLine: string;
  spokeLineOpacity: number;
  hub: string;
  accent: string;
  word1: string;
  word2: string;
  subtitle: string;
}

const LIGHT_PALETTE: Palette = {
  badge: '#006A4E',
  spokeLine: '#FFFFFF',
  spokeLineOpacity: 0.45,
  hub: '#FFCE00',
  accent: '#D21034',
  word1: '#006A4E',
  word2: '#B8860B',
  subtitle: '#64748B',
};

const DARK_PALETTE: Palette = {
  badge: '#00875A',
  spokeLine: '#FFFFFF',
  spokeLineOpacity: 0.55,
  hub: '#FFCE00',
  accent: '#FF6B7A',
  word1: '#FFFFFF',
  word2: '#FFCE00',
  subtitle: '#CBD5E1',
};

function LogoMark({
  variant,
  surface,
  className = '',
}: {
  variant: LogoVariant;
  surface: LogoSurface;
  className?: string;
}) {
  const { theme } = useTheme();
  const bg = resolveSurface(surface, theme);
  const p = bg === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;

  const spokes = [
    { x: 32, y: 13 },
    { x: 50.2, y: 23.5 },
    { x: 50.2, y: 44.5 },
    { x: 32, y: 55 },
    { x: 13.8, y: 44.5 },
    { x: 13.8, y: 23.5 },
  ];
  // Couleurs alternées des nœuds du réseau (accent / blanc).
  const spokeFill = [p.accent, '#FFFFFF', p.accent, '#FFFFFF', p.accent, '#FFFFFF'];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 248 56"
      fill="none"
      role="img"
      aria-label={LOGO_ALT}
      className={`${VARIANT_CLASS[variant]} transition-transform duration-300 group-hover:scale-[1.02] ${className}`}
    >
      <title>{LOGO_ALT}</title>
      <rect x="0" y="4" width="48" height="48" rx="12" fill={p.badge} />
      <g transform="translate(8, 12) scale(0.5)">
        {spokes.map((s, i) => (
          <line
            key={`l-${i}`}
            x1="32"
            y1="34"
            x2={s.x}
            y2={s.y}
            stroke={p.spokeLine}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={p.spokeLineOpacity}
          />
        ))}
        <circle cx="32" cy="34" r="9" fill={p.hub} />
        {spokes.map((s, i) => (
          <circle key={`c-${i}`} cx={s.x} cy={s.y} r="5.5" fill={spokeFill[i]} />
        ))}
      </g>
      <text
        x="58"
        y="31"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="26"
        fontWeight="900"
        letterSpacing="-0.5"
      >
        <tspan fill={p.word1}>Togo</tspan>
        <tspan fill={p.word2}>saas</tspan>
      </text>
      <text
        x="58"
        y="46"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="9"
        fontWeight="600"
        letterSpacing="0.16em"
        fill={p.subtitle}
      >
        HUB SAAS DU TOGO
      </text>
    </svg>
  );
}

export default function Logo({
  className = '',
  variant = 'nav',
  linked = true,
  surface = 'auto',
}: LogoProps) {
  const content = <LogoMark variant={variant} surface={surface} />;

  if (!linked) {
    return (
      <span className={`group inline-flex shrink-0 items-center ${className}`}>
        {content}
      </span>
    );
  }

  return (
    <Link to="/" className={`group inline-flex shrink-0 items-center ${className}`}>
      {content}
    </Link>
  );
}
