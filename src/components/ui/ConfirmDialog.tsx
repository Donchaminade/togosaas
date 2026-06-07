import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmInput = string | ConfirmOptions;

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

interface ConfirmContextValue {
  confirmDelete: (input: ConfirmInput) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);

function normalizeOptions(input: ConfirmInput): ConfirmOptions {
  if (typeof input === 'string') {
    return {
      title: 'Confirmer la suppression',
      message: input,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
      destructive: true,
    };
  }
  return {
    title: input.title ?? 'Confirmer la suppression',
    confirmLabel: input.confirmLabel ?? 'Supprimer',
    cancelLabel: input.cancelLabel ?? 'Annuler',
    destructive: input.destructive ?? true,
    ...input,
  };
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirmDelete = useCallback((input: ConfirmInput) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options: normalizeOptions(input), resolve });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setPending((current) => {
      current?.resolve(result);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!pending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [pending, close]);

  return (
    <ConfirmContext.Provider value={{ confirmDelete }}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => close(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div
            className="w-full max-w-md animate-fade-in rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-4">
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                  pending.options.destructive
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400'
                }`}
              >
                <AlertTriangle className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="confirm-dialog-title"
                  className="text-lg font-black text-slate-900 dark:text-white"
                >
                  {pending.options.title}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {pending.options.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => close(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {pending.options.cancelLabel}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors ${
                  pending.options.destructive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-togo-green hover:bg-togo-green-dark dark:bg-togo-yellow dark:text-slate-900 dark:hover:bg-yellow-400'
                }`}
              >
                {pending.options.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm doit etre utilise dans un ConfirmProvider');
  return ctx;
}
