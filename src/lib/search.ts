/** Normalise le texte pour une recherche insensible aux accents et à la casse. */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

type Searchable = string | number | null | undefined | string[];

/** Vérifie si tous les mots de la requête apparaissent dans les champs fournis. */
export function matchesSearchQuery(query: string, ...fields: Searchable[]): boolean {
  const q = normalizeSearchText(query);
  if (!q) return true;

  const tokens = q.split(/\s+/).filter(Boolean);
  const haystack = fields
    .flatMap((field) => {
      if (field == null) return [];
      if (Array.isArray(field)) return field.map(String);
      return [String(field)];
    })
    .map(normalizeSearchText)
    .join(' ');

  return tokens.every((token) => haystack.includes(token));
}

/** Filtre une liste selon une requête et une fonction d'extraction de champs. */
export function filterBySearch<T>(
  items: T[],
  query: string,
  getFields: (item: T) => Searchable[],
): T[] {
  if (!query.trim()) return items;
  return items.filter((item) => matchesSearchQuery(query, ...getFields(item)));
}
