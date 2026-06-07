interface WaveProps {
  className?: string;
  /** position: 'bottom' (defaut) ou 'top' (retourne). */
  flip?: boolean;
  /** classe de couleur tailwind appliquee au fill (ex: text-slate-50). */
  colorClassName?: string;
}

/**
 * Vague decorative SVG, a placer en bas (ou haut) d'une section.
 */
export default function Wave({
  className = '',
  flip = false,
  colorClassName = 'text-slate-50 dark:text-slate-950',
}: WaveProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 ${flip ? 'top-0 rotate-180' : 'bottom-0'} ${colorClassName} ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        className="h-[60px] w-full md:h-[100px]"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0,64 C240,120 480,0 720,32 C960,64 1200,128 1440,72 L1440,120 L0,120 Z" />
      </svg>
    </div>
  );
}
