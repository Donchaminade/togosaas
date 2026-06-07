import type { Community } from '../types';
import {
  Linkedin,
  MessageCircle,
  Send,
  Twitter,
} from 'lucide-react';

export const SOCIAL_LINKS = [
  {
    key: 'whatsappUrl' as const,
    label: 'WhatsApp',
    icon: MessageCircle,
    btn: 'border-green-200 bg-green-50 text-green-800 hover:border-green-600 hover:bg-green-600 hover:text-white dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300 dark:hover:border-green-500 dark:hover:bg-green-600 dark:hover:text-white',
  },
  {
    key: 'telegramUrl' as const,
    label: 'Telegram',
    icon: Send,
    btn: 'border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-600 hover:bg-sky-600 hover:text-white dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:border-sky-500 dark:hover:bg-sky-600 dark:hover:text-white',
  },
  {
    key: 'linkedinUrl' as const,
    label: 'LinkedIn',
    icon: Linkedin,
    btn: 'border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-700 hover:bg-blue-700 hover:text-white dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:border-blue-600 dark:hover:bg-blue-700 dark:hover:text-white',
  },
  {
    key: 'twitterUrl' as const,
    label: 'Twitter',
    icon: Twitter,
    btn: 'border-slate-200 bg-slate-100 text-slate-800 hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-400 dark:hover:bg-slate-700 dark:hover:text-white',
  },
] as const;

export function getActiveSocialLinks(community: Community) {
  return SOCIAL_LINKS.filter((s) => community[s.key]);
}
