export const REPORT_CATEGORIES = [
  { id: 'bug', label: 'Dysfonctionnement technique / bug' },
  { id: 'unavailable', label: 'Service indisponible ou hors ligne' },
  { id: 'outdated', label: 'Informations erronées ou obsolètes' },
  { id: 'broken_link', label: 'Lien / accès non fonctionnel' },
  { id: 'inappropriate', label: 'Contenu inapproprié' },
  { id: 'other', label: 'Autre problème' },
] as const;

export const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente de traitement',
  investigating: 'En cours d\'analyse',
  resolved: 'Traité par l\'équipe Togosaas',
  dismissed: 'Classé sans suite',
};

export const REPORT_TARGET_LABELS = {
  community: 'La solution elle-même (service, accès, contenu…)',
  lead: 'L\'éditeur / responsable de la solution',
} as const;
