import { mediaUrl } from '../../lib/media';

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 rounded-lg text-sm',
  md: 'h-10 w-10 rounded-xl text-base',
  lg: 'h-14 w-14 rounded-2xl text-xl',
};

export default function UserAvatar({ name, avatarUrl, size = 'sm', className = '' }: UserAvatarProps) {
  const src = avatarUrl ? mediaUrl(avatarUrl) : null;
  const initial = name?.charAt(0).toUpperCase() ?? '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Profil'}
        className={`shrink-0 object-cover ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center bg-togo-green font-black text-white ${sizes[size]} ${className}`}
    >
      {initial}
    </span>
  );
}
