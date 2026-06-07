import { useEffect, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { tokenStore } from '../../lib/api';
import { isImageFile } from '../../lib/media';
import type { ReportEvidenceFile } from '../../types';

interface ReportEvidencePreviewProps {
  reportId: number;
  index: number;
  file: ReportEvidenceFile;
  evidenceUrl: (reportId: number, index: number) => string;
}

export default function ReportEvidencePreview({
  reportId,
  index,
  file,
  evidenceUrl,
}: ReportEvidencePreviewProps) {
  const isImage = isImageFile(file.mime, file.originalName);

  const openFile = async () => {
    const token = tokenStore.get();
    try {
      const res = await fetch(evidenceUrl(reportId, index), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
    } catch {
      /* silencieux */
    }
  };

  if (!isImage) {
    return (
      <button
        type="button"
        onClick={openFile}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-togo-green dark:border-slate-700 dark:text-slate-300"
      >
        <FileText className="h-3.5 w-3.5" /> {file.originalName}
      </button>
    );
  }

  return (
    <EvidenceImage
      reportId={reportId}
      index={index}
      alt={file.originalName}
      evidenceUrl={evidenceUrl}
      onOpen={openFile}
    />
  );
}

function EvidenceImage({
  reportId,
  index,
  alt,
  evidenceUrl,
  onOpen,
}: {
  reportId: number;
  index: number;
  alt: string;
  evidenceUrl: (reportId: number, index: number) => string;
  onOpen: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;

    const load = async () => {
      const token = tokenStore.get();
      try {
        const res = await fetch(evidenceUrl(reportId, index), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!revoked) setSrc(null);
      } finally {
        if (!revoked) setLoading(false);
      }
    };

    load();

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [reportId, index, evidenceUrl]);

  if (loading) {
    return (
      <div className="flex h-36 w-full min-w-[8rem] max-w-xs items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
        <Loader2 className="h-5 w-5 animate-spin text-togo-green" />
      </div>
    );
  }

  if (!src) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
      >
        <FileText className="h-3.5 w-3.5" /> {alt}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      title={alt}
      className="group block max-w-xs overflow-hidden rounded-xl border border-slate-200 text-left dark:border-slate-700"
    >
      <img
        src={src}
        alt={alt}
        className="max-h-56 w-full object-cover transition-transform group-hover:scale-[1.02]"
        loading="lazy"
      />
      <span className="block truncate px-2 py-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
        {alt}
      </span>
    </button>
  );
}
