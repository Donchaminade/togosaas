import {
  LayoutDashboard,
  Mail,
  MessageCircle,
  PenLine,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
} from 'lucide-react';
import type { DashboardNavItem } from '../components/dashboard/DashboardLayout';

export interface AdminNavStats {
  pendingCommunities?: number;
  unreadMessages?: number;
  pendingReports?: number;
}

export function buildAdminNav(stats: AdminNavStats = {}): DashboardNavItem[] {
  return [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard, href: '/admin', section: 'Principal' },
    {
      id: 'communities',
      label: 'Communautés',
      icon: ShieldCheck,
      badge: stats.pendingCommunities || undefined,
      href: '/admin?tab=communities',
    },
    { id: 'leads', label: 'Leads', icon: Users, href: '/admin?tab=leads' },
    {
      id: 'users',
      label: 'Utilisateurs',
      icon: UserCog,
      href: '/admin?tab=users',
      section: 'Administration',
    },
    {
      id: 'messages',
      label: 'Messages contact',
      icon: Mail,
      badge: stats.unreadMessages || undefined,
      href: '/admin?tab=messages',
      section: 'Communication',
    },
    { id: 'support', label: 'Chat leads', icon: MessageCircle, href: '/admin?tab=support' },
    {
      id: 'reports',
      label: 'Signalements',
      icon: ShieldAlert,
      badge: stats.pendingReports || undefined,
      href: '/admin?tab=reports',
      section: 'Modération',
    },
    {
      id: 'author',
      label: 'Page À propos',
      icon: PenLine,
      href: '/admin?tab=author',
      section: 'Contenu',
    },
  ];
}

export function adminTabFromSearch(search: string): string {
  const tab = new URLSearchParams(search).get('tab');
  const valid = ['overview', 'communities', 'leads', 'users', 'messages', 'support', 'reports', 'author'];
  return tab && valid.includes(tab) ? tab : 'overview';
}

export const ADMIN_TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Administration', subtitle: 'Pilotage de la plateforme T.C.H' },
  communities: { title: 'Communautés', subtitle: 'Modération et gestion des fiches' },
  leads: { title: 'Leads', subtitle: 'Comptes responsables de communautés' },
  users: { title: 'Utilisateurs', subtitle: 'Administrateurs et gestion des rôles' },
  messages: { title: 'Messages contact', subtitle: 'Formulaire public' },
  support: { title: 'Chat leads', subtitle: 'Conversations et messages groupés aux leads' },
  reports: { title: 'Signalements', subtitle: 'Abus signalés anonymement par des membres depuis l\'accueil' },
  author: { title: 'Page À propos', subtitle: 'Profil fondateur & auteur' },
};
