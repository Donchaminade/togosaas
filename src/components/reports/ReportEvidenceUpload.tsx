import { useRef, useState } from 'react';
import { FileText, ImagePlus, Loader2, X } from 'lucide-react';
import { api } from '../../lib/api';
import type { ReportEvidenceFile } from '../../types';

interface Props {
  value: ReportEvidenceFile[];
  onChange: (files: ReportEvidenceFile[]) => void;
  max?: number;
}

export default function ReportEvidenceUpload({ value, onChange, max = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList) => {
    const remaining = max - value.length;
    if (remaining <= 0) {
      setError(`Maximum ${max} fichiers.`);
      return;
    }

    setError(null);
    setUploading(true);
    const uploaded: ReportEvidenceFile[] = [];

    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        const res = await api.uploadReportEvidence(file);
        uploaded.push(res.data.evidence);
      }
      onChange([...value, ...uploaded]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Échec du téléversement.';
      setError(msg);
      if (uploaded.length) onChange([...value, ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        Captures d&apos;écran, photos ou PDF — max {max} fichiers, 8 Mo chacun. Stockage chiffré côté serveur, visible uniquement par l&apos;administration.
      </p>

      {value.length > 0 && (
        <ul className="mb-3 space-y-2">
          {value.map((f, i) => (
            <li
              key={`${f.key}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"
            >
              {f.mime.startsWith('image/') ? (
                <ImagePlus className="h-4 w-4 shrink-0 text-togo-green" />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-togo-red" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {f.originalName}
              </span>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="text-slate-400 hover:text-togo-red"
                aria-label="Retirer"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.length < max && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-togo-green hover:bg-togo-green/5 hover:text-togo-green disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:border-togo-yellow dark:hover:text-togo-yellow"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? 'Envoi en cours…' : 'Ajouter une preuve (optionnel)'}
          </button>
        </>
      )}

      {error && <p className="mt-2 text-xs font-medium text-togo-red">{error}</p>}
    </div>
  );
}
