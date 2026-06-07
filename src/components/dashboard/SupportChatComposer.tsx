import { FileText, ImageIcon, Paperclip, Send, X } from 'lucide-react';
import type { SupportAttachment } from '../../types';

const MAX_FILES = 3;
const MAX_SIZE_MB = 5;

function formatSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

interface PendingFile {
  id: string;
  file: File;
  uploading?: boolean;
  uploaded?: SupportAttachment;
  error?: string;
}

interface SupportChatComposerProps {
  body: string;
  onBodyChange: (value: string) => void;
  pendingFiles: PendingFile[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveFile: (id: string) => void;
  onSubmit: () => void;
  sending: boolean;
  placeholder?: string;
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

export function isImageMime(mime: string, filename?: string) {
  if (mime.startsWith('image/')) return true;
  if (filename && IMAGE_EXT.test(filename)) return true;
  return false;
}

export function isImageAttachment(att: { mime?: string; originalName?: string; key?: string }) {
  return isImageMime(att.mime ?? '', att.originalName ?? att.key ?? '');
}

export function canSendSupportMessage(body: string, pendingFiles: PendingFile[]) {
  const hasText = body.trim().length > 0;
  const readyFiles = pendingFiles.filter((f) => f.uploaded && !f.error);
  const stillUploading = pendingFiles.some((f) => f.uploading);
  return !stillUploading && (hasText || readyFiles.length > 0);
}

export { MAX_FILES, MAX_SIZE_MB };
export type { PendingFile, SupportChatComposerProps };

export default function SupportChatComposer({
  body,
  onBodyChange,
  pendingFiles,
  onAddFiles,
  onRemoveFile,
  onSubmit,
  sending,
  placeholder = 'Votre message…',
}: SupportChatComposerProps) {
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/80 sm:p-4">
      {pendingFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {pendingFiles.map((item) => (
            <div
              key={item.id}
              className="flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            >
              {isImageMime(item.file.type) ? (
                <ImageIcon className="h-3.5 w-3.5 shrink-0 text-sky-500" />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0 text-rose-500" />
              )}
              <span className="max-w-[9rem] truncate font-medium text-slate-700 dark:text-slate-200">
                {item.file.name}
              </span>
              <span className="text-slate-400">{formatSize(item.file.size)}</span>
              {item.uploading && <span className="text-togo-green dark:text-togo-yellow">…</span>}
              {item.error && <span className="text-rose-500">{item.error}</span>}
              <button
                type="button"
                onClick={() => onRemoveFile(item.id)}
                className="ml-1 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                aria-label="Retirer le fichier"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <label
          title={`Joindre un fichier (max ${MAX_FILES}, ${MAX_SIZE_MB} Mo — JPG, PNG, PDF)`}
          className={`grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-togo-green hover:text-togo-green dark:border-slate-700 dark:bg-slate-800 dark:hover:border-togo-yellow dark:hover:text-togo-yellow ${
            pendingFiles.length >= MAX_FILES ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          <Paperclip className="h-4 w-4" />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            multiple
            className="sr-only"
            disabled={pendingFiles.length >= MAX_FILES || sending}
            onChange={handleFilePick}
          />
        </label>

        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          maxLength={3000}
          placeholder={placeholder}
          className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-togo-green focus:ring-2 focus:ring-togo-green/15 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-togo-yellow dark:focus:ring-togo-yellow/15"
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={sending || !canSendSupportMessage(body, pendingFiles)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-togo-green text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark disabled:opacity-50 dark:bg-togo-yellow dark:text-slate-900 dark:shadow-togo-yellow/15 dark:hover:bg-togo-yellow/90"
          aria-label="Envoyer"
        >
          {sending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>

      <p className="mt-2 hidden text-[10px] text-slate-400 sm:block">
        Entrée pour envoyer · Maj+Entrée pour un retour à la ligne · JPG, PNG, PDF jusqu&apos;à {MAX_SIZE_MB} Mo
      </p>
    </div>
  );
}
