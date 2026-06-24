import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

/** Logo officiel Togosaas */
export const LOGO_SRC = '/logo.svg';
export const LOGO_ON_DARK_SRC = '/logo-on-dark.svg';
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

function LogoImage({
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
  const src = bg === 'dark' ? LOGO_ON_DARK_SRC : LOGO_SRC;

  return (
    <img
      src={src}
      alt={LOGO_ALT}
      className={`${VARIANT_CLASS[variant]} transition-transform duration-300 group-hover:scale-[1.02] ${className}`}
      decoding="async"
      fetchPriority={variant === 'nav' ? 'high' : 'auto'}
    />
  );
}

export default function Logo({
  className = '',
  variant = 'nav',
  linked = true,
  surface = 'auto',
}: LogoProps) {
  const content = <LogoImage variant={variant} surface={surface} />;

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
