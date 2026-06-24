import type { UserRole } from '../types';

/** Libellés lisibles pour chaque rôle. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  subadmin: 'Sous-administrateur',
  lead: 'Lead',
};

/** Libellé court (sidebar, badges compacts). */
export const ROLE_SHORT_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  subadmin: 'Sous-admin',
  lead: 'Lead',
};

/** Description des droits par rôle (affichée dans les formulaires). */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Accès complet, y compris la gestion des comptes du staff et la page À propos.",
  subadmin:
    'Modération courante (solutions SaaS, leads, messages, signalements). Ne peut pas gérer les comptes du staff, éditer la page À propos, ni supprimer définitivement.',
  lead: 'Responsable de communautés/solutions SaaS via son espace dédié.',
};

/** Membre du staff (accès à l'espace admin) : admin OU subadmin. */
export function isStaffRole(role?: UserRole | null): boolean {
  return role === 'admin' || role === 'subadmin';
}

/** Super-administrateur : seul habilité aux actions sensibles. */
export function isSuperAdminRole(role?: UserRole | null): boolean {
  return role === 'admin';
}
