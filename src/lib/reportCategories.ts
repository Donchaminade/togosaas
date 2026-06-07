export const REPORT_CATEGORIES = [
  { id: 'inappropriate', label: 'Comportement inapproprié' },
  { id: 'misinformation', label: 'Informations fausses ou trompeuses' },
  { id: 'harassment', label: 'Harcèlement ou discrimination' },
  { id: 'fraud', label: 'Fraude ou arnaque' },
  { id: 'illegal', label: 'Contenu illégal' },
  { id: 'other', label: 'Autre' },
] as const;

export const REPORT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente de traitement',
  investigating: 'En cours d\'enquête',
  resolved: 'Traité par l\'équipe T.C.H',
  dismissed: 'Classé sans suite',
};

export const REPORT_TARGET_LABELS = {
  community: 'La communauté (comportement collectif, contenu, activités…)',
  lead: 'Le/la responsable ou co-lead de la communauté',
} as const;
