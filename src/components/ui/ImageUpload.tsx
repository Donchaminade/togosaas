import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { mediaUrl } from '../../lib/media';

interface Props {
  label: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  aspect?: 'square' | 'banner';
}

export default function ImageUpload({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  hint,
  aspect = 'square',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      onChange(res.data.url);
    } catch (e: any) {
      setError(e?.message || 'Échec du téléversement.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const preview = value ? mediaUrl(value) : null;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label} {required && <span className="text-togo-red">*</span>}
      </label>
      {hint && <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className={`group relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-togo-green dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-togo-yellow ${
            aspect === 'banner' ? 'h-28 w-full sm:h-32 sm:flex-1' : 'h-28 w-28 shrink-0'
          } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full flex-col items-center justify-center gap-1 text-slate-400">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-togo-green" />
              ) : (
                <>
                  <ImagePlus className="h-7 w-7" />
                  <span className="text-[10px] font-semibold uppercase tracking-wide">Charger</span>
                </>
              )}
            </span>
          )}
          {uploading && preview && (
            <span className="absolute inset-0 grid place-items-center bg-slate-900/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </span>
          )}
        </button>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {!disabled && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {preview ? 'Remplacer l\'image' : 'Choisir un fichier'}
            </button>
          )}
          {preview && !disabled && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-togo-red hover:opacity-80"
            >
              <X className="h-3.5 w-3.5" /> Retirer
            </button>
          )}
          {error && <p className="text-xs font-medium text-togo-red">{error}</p>}
        </div>
      </div>
    </div>
  );
}
