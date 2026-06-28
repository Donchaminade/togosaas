import type { Community, CoLead, LeaderLinks } from '../types';
import {
  Facebook,
  Github,
  Globe,
  Linkedin,
  Mail,
  MessageCircle,
  Send,
  Twitter,
} from 'lucide-react';
import { externalUrl } from './externalUrl';

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

/* ------------------------------------------------------------------ */
/* Liens sociaux par membre d'équipe (fondateur + co-membres)          */
/* ------------------------------------------------------------------ */

export type MemberLinkKind = 'linkedin' | 'facebook' | 'github' | 'portfolio' | 'email';

export interface MemberLink {
  kind: MemberLinkKind;
  label: string;
  icon: typeof Linkedin;
  /** href prêt à l'emploi : URL normalisée (https://…) ou mailto: pour l'email. */
  href: string;
  /** Vrai pour les liens externes (target _blank). Faux pour mailto. */
  external: boolean;
  /** Classe de couleur au survol pour l'icône. */
  hover: string;
}

const MEMBER_LINK_META: Record<MemberLinkKind, { label: string; icon: typeof Linkedin; hover: string }> = {
  linkedin: { label: 'LinkedIn', icon: Linkedin, hover: 'hover:text-blue-600 dark:hover:text-blue-400' },
  facebook: { label: 'Facebook', icon: Facebook, hover: 'hover:text-blue-700 dark:hover:text-blue-500' },
  github: { label: 'GitHub', icon: Github, hover: 'hover:text-slate-900 dark:hover:text-white' },
  portfolio: { label: 'Portfolio', icon: Globe, hover: 'hover:text-togo-green dark:hover:text-togo-yellow' },
  email: { label: 'Email', icon: Mail, hover: 'hover:text-togo-red' },
};

/** Source de liens unifiée (co-membre ou fondateur). */
export interface MemberLinkSource {
  linkedin?: string | null;
  facebook?: string | null;
  github?: string | null;
  portfolio?: string | null;
  email?: string | null;
}

/** Convertit un co-membre (clés legacy `linkedinUrl`) vers la source unifiée. */
export function coLeadLinkSource(member: CoLead): MemberLinkSource {
  return {
    linkedin: member.linkedinUrl ?? null,
    facebook: member.facebook ?? null,
    github: member.github ?? null,
    portfolio: member.portfolio ?? null,
    email: member.email ?? null,
  };
}

/** Source unifiée pour le fondateur. */
export function leaderLinkSource(links: LeaderLinks | null | undefined, email?: string | null): MemberLinkSource {
  return {
    linkedin: links?.linkedin ?? null,
    facebook: links?.facebook ?? null,
    github: links?.github ?? null,
    portfolio: links?.portfolio ?? null,
    email: links?.email ?? email ?? null,
  };
}

const ORDER: MemberLinkKind[] = ['linkedin', 'github', 'facebook', 'portfolio', 'email'];

/** Renvoie uniquement les liens renseignés, prêts à afficher. */
export function getMemberLinks(source: MemberLinkSource): MemberLink[] {
  const out: MemberLink[] = [];
  for (const kind of ORDER) {
    const raw = source[kind];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) continue;
    const meta = MEMBER_LINK_META[kind];
    if (kind === 'email') {
      out.push({ kind, label: meta.label, icon: meta.icon, href: `mailto:${value}`, external: false, hover: meta.hover });
    } else {
      const href = externalUrl(value);
      if (!href) continue;
      out.push({ kind, label: meta.label, icon: meta.icon, href, external: true, hover: meta.hover });
    }
  }
  return out;
}
