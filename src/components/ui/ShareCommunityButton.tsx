import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Share2, Smartphone, X } from 'lucide-react';
import { useToast } from './Toast';
import {
  SHARE_NETWORKS,
  canUseNativeShare,
  communityShareText,
  communityShareUrl,
  copyToClipboard,
  type ShareableCommunity,
} from '../../lib/share';

interface ShareCommunityButtonProps {
  community: ShareableCommunity;
  variant?: 'button' | 'icon';
  className?: string;
}

export default function ShareCommunityButton({
  community,
  variant = 'button',
  className = '',
}: ShareCommunityButtonProps) {
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const nativeShare = canUseNativeShare();

  const url = communityShareUrl(community);
  const text = communityShareText(community);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({
        title: community.name,
        text,
        url,
      });
      setOpen(false);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      notify('Partage impossible sur cet appareil.', 'error');
    }
  }, [community.name, notify, text, url]);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      notify('Lien copié dans le presse-papiers.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      notify('Impossible de copier le lien.', 'error');
    }
  }, [notify, url]);

  const openShare = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    setCopied(false);
  };

  const trigger =
    variant === 'icon' ? (
      <button
        type="button"
        onClick={openShare}
        title="Partager"
        aria-label={`Partager ${community.name}`}
        className={`grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white/90 text-slate-600 shadow-sm backdrop-blur-sm transition-all hover:border-togo-green hover:text-togo-green dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-togo-yellow dark:hover:text-togo-yellow ${className}`}
      >
        <Share2 className="h-4 w-4" />
      </button>
    ) : (
      <button
        type="button"
        onClick={openShare}
        className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-togo-green hover:text-togo-green dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-togo-yellow dark:hover:text-togo-yellow ${className}`}
      >
        <Share2 className="h-4 w-4" />
        Partager
      </button>
    );

  return (
    <>
      {trigger}

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-community-title"
          >
            <div
              className="my-auto flex w-full max-w-md max-h-[min(90dvh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
                <div className="min-w-0">
                  <p id="share-community-title" className="text-lg font-black text-slate-900 dark:text-white">
                    Partager la communauté
                  </p>
                  <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{community.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                {nativeShare && (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="flex w-full items-center gap-3 rounded-2xl bg-togo-green px-4 py-3.5 text-left text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark dark:bg-togo-yellow dark:text-slate-900 dark:shadow-togo-yellow/20 dark:hover:bg-yellow-400"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 dark:bg-slate-900/20">
                      <Smartphone className="h-5 w-5" />
                    </span>
                    <span>
                      Partager via l&apos;appareil
                      <span className="mt-0.5 block text-xs font-semibold opacity-80">
                        WhatsApp, Messages, Gmail… selon votre téléphone ou ordinateur
                      </span>
                    </span>
                  </button>
                )}

                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                    {nativeShare ? 'Ou choisir un réseau' : 'Réseaux sociaux'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {SHARE_NETWORKS.map((network) => (
                      <a
                        key={network.id}
                        href={network.buildUrl(url, text)}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold text-white transition-colors ${network.color}`}
                      >
                        {network.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Lien direct</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      readOnly
                      value={url}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold transition-colors sm:min-w-[5.5rem] ${
                        copied
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'bg-togo-green text-white hover:bg-togo-green-dark dark:bg-togo-yellow dark:text-slate-900 dark:hover:bg-yellow-400'
                      }`}
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copié' : 'Copier'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
