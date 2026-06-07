import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Nombre de résultats affichés (affiche un compteur si défini avec totalCount). */
  resultCount?: number;
  /** Nombre total d'éléments avant filtrage. */
  totalCount?: number;
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
}

const SIZE_STYLES = {
  sm: {
    input: 'rounded-xl py-2 pl-9 pr-9 text-xs',
    icon: 'left-3 h-3.5 w-3.5',
    clear: 'right-2.5 h-6 w-6',
    count: 'right-9 text-[10px]',
  },
  md: {
    input: 'rounded-2xl py-3 pl-11 pr-11 text-sm',
    icon: 'left-4 h-4 w-4',
    clear: 'right-3 h-7 w-7',
    count: 'right-11 text-xs',
  },
} as const;

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Rechercher…',
  resultCount,
  totalCount,
  size = 'md',
  className = '',
  id,
}: SearchBarProps) {
  const s = SIZE_STYLES[size];
  const showCount =
    value.trim().length > 0 &&
    resultCount !== undefined &&
    totalCount !== undefined &&
    totalCount > 0;

  return (
    <div className={`relative ${className}`}>
      <Search
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${s.icon}`}
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full border border-slate-200 bg-slate-50 font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-togo-green focus:bg-white focus:ring-2 focus:ring-togo-green/15 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-togo-yellow dark:focus:bg-slate-900 dark:focus:ring-togo-yellow/15 ${s.input}`}
      />
      {showCount && (
        <span
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 font-bold tabular-nums text-slate-400 ${s.count}`}
        >
          {resultCount}/{totalCount}
        </span>
      )}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Effacer la recherche"
          className={`absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/80 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200 ${s.clear}`}
        >
          <X className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </button>
      )}
    </div>
  );
}
