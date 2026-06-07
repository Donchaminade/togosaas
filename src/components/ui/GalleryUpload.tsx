import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { mediaUrl } from '../../lib/media';

interface Props {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  max?: number;
}

export default function GalleryUpload({ label, value, onChange, disabled = false, max = 12 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList) => {
    const remaining = max - value.length;
    if (remaining <= 0) {
      setError(`Maximum ${max} images.`);
      return;
    }

    const batch = Array.from(files).slice(0, remaining);
    setError(null);
    setUploading(true);
    const uploaded: string[] = [];

    try {
      for (const file of batch) {
        const res = await api.uploadFile(file);
        uploaded.push(res.data.url);
      }
      onChange([...value, ...uploaded]);
    } catch (e: any) {
      setError(e?.message || 'Échec du téléversement.');
      if (uploaded.length) onChange([...value, ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
        JPG, PNG, WebP ou GIF — max {max} images
      </p>

      {value.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, i) => (
            <div key={`${url}-${i}`} className="group relative aspect-video overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
              <img src={mediaUrl(url)} alt="" className="h-full w-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-slate-900/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && value.length < max && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files?.length) handleFiles(e.target.files);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-4 text-sm font-semibold text-slate-600 transition-colors hover:border-togo-green hover:text-togo-green dark:border-slate-600 dark:text-slate-300"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {uploading ? 'Téléversement…' : 'Ajouter des photos'}
          </button>
        </>
      )}

      {error && <p className="mt-2 text-xs font-medium text-togo-red">{error}</p>}
    </div>
  );
}
