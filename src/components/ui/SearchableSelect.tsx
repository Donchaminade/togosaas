import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import SearchBar from './SearchBar';
import { filterBySearch } from '../../lib/search';

export interface SearchableSelectOption {
  value: string | number;
  label: string;
  /** Texte supplémentaire indexé pour la recherche (ex. email, ville). */
  keywords?: string[];
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Sélectionnez…',
  searchPlaceholder = 'Rechercher…',
  emptyMessage = 'Aucun résultat.',
  required,
  disabled,
  className = '',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(
    () =>
      filterBySearch(options, query, (o) => [o.label, ...(o.keywords ?? [])]),
    [options, query],
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (v: string | number) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-togo-green focus:ring-2 focus:ring-togo-green/15 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-togo-yellow dark:focus:ring-togo-yellow/15"
      >
        <span className={selected ? 'truncate font-medium' : 'truncate text-slate-400'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {required && !value && (
        <input tabIndex={-1} required className="sr-only" value="" onChange={() => {}} />
      )}

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-2 dark:border-slate-800">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder={searchPlaceholder}
              size="sm"
              resultCount={filtered.length}
              totalCount={options.length}
            />
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-slate-500">{emptyMessage}</li>
            ) : (
              filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => pick(o.value)}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                      o.value === value
                        ? 'bg-togo-green/10 font-bold text-togo-green dark:bg-togo-yellow/10 dark:text-togo-yellow'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
