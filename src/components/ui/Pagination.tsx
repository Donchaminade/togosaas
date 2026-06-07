import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function buildPages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | 'ellipsis')[] = [1];

  if (current > 3) pages.push('ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('ellipsis');

  pages.push(total);
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}: Props) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const pages = buildPages(page, totalPages);

  return (
    <nav
      aria-label="Pagination"
      className={`mt-12 flex flex-col items-center gap-5 ${className}`}
    >
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Affichage{' '}
        <span className="font-bold text-slate-800 dark:text-slate-200">{from}–{to}</span>
        {' '}sur{' '}
        <span className="font-bold text-slate-800 dark:text-slate-200">{totalItems}</span>
        {' '}communauté{totalItems > 1 ? 's' : ''}
      </p>

      <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-lg shadow-slate-200/50 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-black/20">
        <NavBtn
          label="Page précédente"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </NavBtn>

        <div className="mx-1 flex items-center gap-0.5">
          {pages.map((p, i) =>
            p === 'ellipsis' ? (
              <span
                key={`e-${i}`}
                className="grid h-10 w-8 place-items-center text-sm font-bold text-slate-400"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPageChange(p)}
                className={`relative grid h-10 min-w-10 place-items-center rounded-xl px-3 text-sm font-bold transition-all duration-200 ${
                  p === page
                    ? 'bg-gradient-to-br from-togo-green to-togo-green-dark text-white shadow-md shadow-togo-green/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-togo-green dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-togo-yellow'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <NavBtn
          label="Page suivante"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </NavBtn>
      </div>

      {/* Barre tricolore discrète */}
      <div className="flex h-0.5 w-24 overflow-hidden rounded-full opacity-60">
        <div className="flex-1 bg-togo-green" />
        <div className="flex-1 bg-togo-yellow" />
        <div className="flex-1 bg-togo-red" />
      </div>
    </nav>
  );
}

function NavBtn({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-togo-green disabled:pointer-events-none disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-togo-yellow"
    >
      {children}
    </button>
  );
}

export function paginateSlice<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function totalPages(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize));
}
