import {
  LayoutDashboard,
  Mail,
  MailPlus,
  MessageCircle,
  MessagesSquare,
  PenLine,
  ShieldAlert,
  ShieldCheck,
  UserCircle,
  UserCog,
  Users,
  Workflow,
} from 'lucide-react';
import type { DashboardNavItem } from '../components/dashboard/DashboardLayout';

export interface AdminNavStats {
  pendingCommunities?: number;
  unreadMessages?: number;
  pendingReports?: number;
}

export interface AdminNavOptions {
  /** Réservé au super-admin : affiche les onglets Utilisateurs et Page À propos. */
  isSuperAdmin?: boolean;
}

/** Onglets réservés au super-administrateur. */
export const SUPER_ADMIN_TABS = ['users', 'author'] as const;

export function buildAdminNav(stats: AdminNavStats = {}, options: AdminNavOptions = {}): DashboardNavItem[] {
  const { isSuperAdmin = false } = options;

  const items: DashboardNavItem[] = [
    { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard, href: '/admin', section: 'Principal' },
    {
      id: 'communities',
      label: 'Solutions SaaS',
      icon: ShieldCheck,
      badge: stats.pendingCommunities || undefined,
      href: '/admin?tab=communities',
    },
    { id: 'leads', label: 'Leads', icon: Users, href: '/admin?tab=leads' },
  ];

  if (isSuperAdmin) {
    items.push({
      id: 'users',
      label: 'Utilisateurs',
      icon: UserCog,
      href: '/admin?tab=users',
      section: 'Administration',
    });
  }

  items.push(
    {
      id: 'messages',
      label: 'Messages contact',
      icon: Mail,
      badge: stats.unreadMessages || undefined,
      href: '/admin?tab=messages',
      section: 'Communication',
    },
    { id: 'support', label: 'Chat leads', icon: MessageCircle, href: '/admin?tab=support' },
    { id: 'emailing', label: 'Emailing', icon: MailPlus, href: '/admin?tab=emailing' },
    { id: 'automations', label: 'Automatisations', icon: Workflow, href: '/admin?tab=automations' },
    {
      id: 'reports',
      label: 'Signalements',
      icon: ShieldAlert,
      badge: stats.pendingReports || undefined,
      href: '/admin?tab=reports',
      section: 'Modération',
    },
    {
      id: 'reviews',
      label: 'Avis',
      icon: MessagesSquare,
      href: '/admin?tab=reviews',
    },
  );

  if (isSuperAdmin) {
    items.push({
      id: 'author',
      label: 'Page À propos',
      icon: PenLine,
      href: '/admin?tab=author',
      section: 'Contenu',
    });
  }

  items.push({
    id: 'profile',
    label: 'Mon profil',
    icon: UserCircle,
    href: '/admin?tab=profile',
    section: 'Compte',
  });

  return items;
}

export function adminTabFromSearch(search: string, isSuperAdmin = false): string {
  const tab = new URLSearchParams(search).get('tab');
  const valid = ['overview', 'communities', 'leads', 'messages', 'support', 'emailing', 'automations', 'reports', 'reviews', 'profile'];
  if (isSuperAdmin) {
    valid.push(...SUPER_ADMIN_TABS);
  }
  return tab && valid.includes(tab) ? tab : 'overview';
}

export const ADMIN_TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Administration', subtitle: 'Pilotage de la plateforme Togosaas' },
  communities: { title: 'Solutions SaaS', subtitle: 'Modération et gestion des fiches' },
  leads: { title: 'Leads', subtitle: 'Comptes responsables de solutions SaaS' },
  users: { title: 'Utilisateurs', subtitle: 'Staff (admins & sous-admins) et gestion des rôles' },
  messages: { title: 'Messages contact', subtitle: 'Formulaire public' },
  support: { title: 'Chat leads', subtitle: 'Conversations et messages groupés aux leads' },
  emailing: { title: 'Emailing', subtitle: 'Rédigez et envoyez des emails aux leads avec pièces jointes' },
  automations: { title: 'Automatisations', subtitle: 'Modèles de message, déclencheurs et envois automatiques' },
  reports: { title: 'Signalements', subtitle: 'Dysfonctionnements de solutions signalés anonymement par les visiteurs' },
  reviews: { title: 'Avis', subtitle: 'Modération des avis écrits laissés sur les solutions' },
  author: { title: 'Page À propos', subtitle: 'Profil fondateur & auteur' },
  profile: { title: 'Mon profil', subtitle: 'Vos informations de compte et mot de passe' },
};
