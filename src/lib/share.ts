import { communityPublicUrl } from './communityUrl';

export interface ShareableCommunity {
  id: number;
  slug?: string | null;
  name: string;
  shortDescription?: string | null;
  description?: string;
}

export function communityShareUrl(community: ShareableCommunity): string {
  return communityPublicUrl(community);
}

export function communityShareText(community: ShareableCommunity): string {
  const excerpt =
    community.shortDescription?.trim() ||
    community.description?.trim().slice(0, 140) ||
    '';
  return excerpt ? `${community.name} — ${excerpt}` : community.name;
}

export type ShareNetwork = 'whatsapp' | 'facebook' | 'x' | 'linkedin' | 'telegram' | 'email';

export interface ShareOption {
  id: ShareNetwork;
  label: string;
  color: string;
  buildUrl: (url: string, text: string) => string;
}

export const SHARE_NETWORKS: ShareOption[] = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: 'bg-[#25D366] hover:bg-[#1ebe57]',
    buildUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    color: 'bg-[#1877F2] hover:bg-[#166fe0]',
    buildUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'x',
    label: 'X (Twitter)',
    color: 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600',
    buildUrl: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: 'bg-[#0A66C2] hover:bg-[#0958a8]',
    buildUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    color: 'bg-[#229ED9] hover:bg-[#1d8fc4]',
    buildUrl: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: 'email',
    label: 'Email',
    color: 'bg-slate-600 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500',
    buildUrl: (url, text) =>
      `mailto:?subject=${encodeURIComponent(text.split(' — ')[0] || 'Communauté Togosaas')}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
