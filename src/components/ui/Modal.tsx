import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: 'md' | 'lg' | '2xl';
}

export default function Modal({ title, onClose, children, maxWidth = 'lg' }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const maxWidthClass =
    maxWidth === 'md' ? 'max-w-md' : maxWidth === '2xl' ? 'max-w-2xl' : 'max-w-lg';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`my-auto flex w-full ${maxWidthClass} max-h-[min(90dvh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <h2 id="modal-title" className="text-lg font-black text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
