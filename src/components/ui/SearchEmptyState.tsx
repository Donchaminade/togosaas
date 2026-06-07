import { SearchX } from 'lucide-react';

interface Props {
  query: string;
  className?: string;
}

/** État vide quand une recherche ne retourne aucun résultat. */
export default function SearchEmptyState({ query, className = '' }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 py-16 text-center dark:border-slate-700 ${className}`}
    >
      <SearchX className="h-10 w-10 text-slate-300" />
      <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
        Aucun résultat pour « {query} »
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Essayez un autre mot-clé ou effacez la recherche.
      </p>
    </div>
  );
}
