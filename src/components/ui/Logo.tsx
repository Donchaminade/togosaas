import { Link } from 'react-router-dom';

/** Logo officiel T.C.H. */
export const LOGO_SRC = '/logosansfond.png';
export const LOGO_ALT = 'T.C.H — Togo Communities Hub';

type LogoVariant = 'nav' | 'footer' | 'auth' | 'dashboard' | 'splash';

const VARIANT_CLASS: Record<LogoVariant, string> = {
  nav: 'h-14 w-auto sm:h-16',
  footer: 'h-24 w-auto sm:h-28',
  auth: 'h-28 w-auto sm:h-32',
  dashboard: 'h-14 w-auto sm:h-16',
  splash: 'h-auto w-[min(72vw,300px)] sm:w-[340px]',
};

interface LogoProps {
  className?: string;
  variant?: LogoVariant;
  linked?: boolean;
}

function LogoImage({ variant }: { variant: LogoVariant }) {
  return (
    <img
      src={LOGO_SRC}
      alt={LOGO_ALT}
      className={`${VARIANT_CLASS[variant]} transition-transform duration-300 group-hover:scale-[1.03]`}
      decoding="async"
      fetchPriority={variant === 'nav' ? 'high' : 'auto'}
    />
  );
}

export default function Logo({
  className = '',
  variant = 'nav',
  linked = true,
}: LogoProps) {
  const content = <LogoImage variant={variant} />;

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
