import { communityCoverUrl } from '../../lib/media';

interface CommunityCoverFrameProps {
  bannerUrl?: string | null;
  logoUrl?: string | null;
  name: string;
  className?: string;
}

/** Visuel communauté entièrement visible (bannière, logo ou défaut Togosaas). */
export default function CommunityCoverFrame({
  bannerUrl,
  logoUrl,
  name,
  className = '',
}: CommunityCoverFrameProps) {
  const src = communityCoverUrl({ bannerUrl, logoUrl });
  const isDefault = !bannerUrl?.trim() && !logoUrl?.trim();

  return (
    <div
      className={`relative flex aspect-[16/10] items-center justify-center overflow-hidden ${
        isDefault ? 'bg-slate-950' : 'bg-slate-50 dark:bg-slate-800'
      } ${className}`}
    >
      <img
        src={src}
        alt={name}
        className={`w-full object-contain ${
          isDefault ? 'h-full p-3' : 'max-h-full max-w-full p-4'
        }`}
        loading="lazy"
      />
    </div>
  );
}
