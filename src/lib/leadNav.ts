import {
  CalendarDays,
  HelpCircle,
  LayoutGrid,
  MessageCircle,
  Plus,
  UserCog,
  Users,
  Users2,
} from 'lucide-react';
import type { DashboardNavItem } from '../components/dashboard/DashboardLayout';

export interface LeadNavStats {
  communitiesTotal?: number;
  pending?: number;
  coLeadsTotal?: number;
  supportUnread?: number;
  eventsUpcoming?: number;
}

export function buildLeadNav(stats: LeadNavStats = {}): DashboardNavItem[] {
  return [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutGrid, section: 'Principal', href: '/espace-lead' },
    {
      id: 'communautes',
      label: 'Mes communautés',
      icon: Users2,
      badge: stats.communitiesTotal || undefined,
      href: '/espace-lead/communautes',
    },
    {
      id: 'co-leads',
      label: 'Co-leads',
      icon: Users,
      badge: stats.coLeadsTotal || undefined,
      href: '/espace-lead/co-leads',
    },
    {
      id: 'evenements',
      label: 'Événements',
      icon: CalendarDays,
      badge: stats.eventsUpcoming || undefined,
      href: '/espace-lead/evenements',
      section: 'Gestion',
    },
    {
      id: 'messages',
      label: 'Messages admin',
      icon: MessageCircle,
      badge: stats.supportUnread || undefined,
      href: '/espace-lead/messages',
    },
    {
      id: 'profil',
      label: 'Mon profil',
      icon: UserCog,
      href: '/espace-lead/profil',
      section: 'Compte',
    },
    {
      id: 'nouvelle',
      label: 'Nouvelle communauté',
      icon: Plus,
      href: '/espace-lead/communautes/nouvelle',
    },
    {
      id: 'aide',
      label: 'Aide & support',
      icon: HelpCircle,
      href: '/contact',
    },
  ];
}

export function leadSectionFromPath(pathname: string): string {
  if (pathname === '/espace-lead' || pathname === '/espace-lead/') return 'overview';
  const match = pathname.match(/^\/espace-lead\/([^/]+)/);
  return match?.[1] ?? 'overview';
}

export const LEAD_SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Mon espace lead', subtitle: 'Tableau de bord' },
  communautes: { title: 'Mes communautés', subtitle: 'Créer et gérer vos fiches' },
  'co-leads': { title: 'Gestion des co-leads', subtitle: 'Accès et équipe' },
  evenements: { title: 'Calendrier événementiel', subtitle: 'Tous vos événements' },
  messages: { title: 'Messages admin', subtitle: 'Échangez avec l\'équipe Togosaas' },
  profil: { title: 'Mon profil', subtitle: 'Informations du compte' },
};
