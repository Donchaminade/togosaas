import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, MoreVertical, Pencil, Trash2, X, Check } from 'lucide-react';
import { tokenStore } from '../../lib/api';
import type { SupportAttachment, SupportMessage } from '../../types';
import { isImageAttachment } from './SupportChatComposer';

interface SupportMessageBubbleProps {
  message: SupportMessage;
  isOwn: boolean;
  attachmentUrl: (messageId: number, index: number) => string;
  onError?: (msg: string) => void;
  onEdit?: (messageId: number, body: string) => Promise<void>;
  onDelete?: (messageId: number) => Promise<void>;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AttachmentImage({
  messageId,
  index,
  alt,
  attachmentUrl,
  isOwn,
  onError,
  onOpenFallback,
}: {
  messageId: number;
  index: number;
  alt: string;
  attachmentUrl: (messageId: number, index: number) => string;
  isOwn: boolean;
  onError?: (msg: string) => void;
  onOpenFallback: (index: number) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;

    const load = async () => {
      const token = tokenStore.get();
      try {
        const res = await fetch(attachmentUrl(messageId, index), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!revoked) {
          setFailed(true);
          onError?.('Impossible d\'afficher l\'image.');
        }
      } finally {
        if (!revoked) setLoading(false);
      }
    };

    load();

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [messageId, index, attachmentUrl, onError]);

  const openFull = () => {
    if (src) window.open(src, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div
        className={`flex h-36 w-full min-w-[10rem] max-w-xs items-center justify-center rounded-xl border ${
          isOwn ? 'border-white/20 bg-white/10' : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900'
        }`}
      >
        <Loader2 className={`h-5 w-5 animate-spin ${isOwn ? 'text-white/70' : 'text-slate-400'}`} />
      </div>
    );
  }

  if (failed || !src) {
    return (
      <button
        type="button"
        onClick={() => onOpenFallback(index)}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold ${
          isOwn
            ? 'border-white/20 bg-white/10 hover:bg-white/20'
            : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-950'
        }`}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="truncate">{alt}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openFull}
      className="group block w-full max-w-xs overflow-hidden rounded-xl border border-white/15 text-left dark:border-slate-600"
      title="Ouvrir l'image"
    >
      <img
        src={src}
        alt={alt}
        className="max-h-56 w-full object-cover transition-transform group-hover:scale-[1.02]"
        loading="lazy"
      />
    </button>
  );
}

function AttachmentFile({
  att,
  index,
  isOwn,
  onOpen,
}: {
  att: SupportAttachment;
  index: number;
  isOwn: boolean;
  onOpen: (index: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${
        isOwn
          ? 'border-white/20 bg-white/10 hover:bg-white/20'
          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-950'
      }`}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{att.originalName}</span>
    </button>
  );
}

export default function SupportMessageBubble({
  message,
  isOwn,
  attachmentUrl,
  onError,
  onEdit,
  onDelete,
}: SupportMessageBubbleProps) {
  const isDeleted = Boolean(message.deletedAt);
  const attachments = isDeleted ? [] : (message.attachments ?? []);
  const canManage = isOwn && !isDeleted && (onEdit || onDelete);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(message.body);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const openAttachment = async (index: number) => {
    const token = tokenStore.get();
    try {
      const res = await fetch(attachmentUrl(message.id, index), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer');
    } catch {
      onError?.('Impossible d\'ouvrir le fichier.');
    }
  };

  const startEdit = () => {
    setEditBody(message.body);
    setEditing(true);
    setMenuOpen(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditBody(message.body);
  };

  const saveEdit = async () => {
    const text = editBody.trim();
    const hasAttachments = attachments.length > 0;
    if (!text && !hasAttachments) {
      onError?.('Le message ne peut pas être vide.');
      return;
    }
    if (!onEdit) return;

    setSaving(true);
    try {
      await onEdit(message.id, text);
      setEditing(false);
    } catch {
      // erreur gérée par le parent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!onDelete) return;
    await onDelete(message.id);
  };

  const wasEdited = Boolean(message.updatedAt) && !isDeleted;

  return (
    <div className={`group/bubble flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`relative max-w-[88%] sm:max-w-[85%] ${canManage ? 'pr-1' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isOwn
              ? 'bg-togo-green text-white'
              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
          } ${isDeleted ? 'opacity-70' : ''}`}
        >
          {isDeleted ? (
            <p className="italic text-inherit/80">Message supprimé</p>
          ) : editing ? (
            <div className="space-y-2">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
                maxLength={3000}
                aria-label="Modifier le message"
                placeholder="Votre message…"
                className={`w-full resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  isOwn
                    ? 'border-white/30 bg-white/10 text-white placeholder:text-white/60 focus:ring-white/40'
                    : 'border-slate-200 bg-white text-slate-900 focus:ring-togo-green dark:border-slate-600 dark:bg-slate-900 dark:text-white'
                }`}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
                    isOwn
                      ? 'bg-white/15 hover:bg-white/25'
                      : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600'
                  }`}
                >
                  <X className="h-3.5 w-3.5" />
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={saving}
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
                    isOwn
                      ? 'bg-white text-togo-green hover:bg-emerald-50'
                      : 'bg-togo-green text-white hover:bg-emerald-700'
                  }`}
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}

              {attachments.length > 0 && (
                <div className={`flex flex-col gap-2 ${message.body ? 'mt-3' : ''}`}>
                  {attachments.map((att: SupportAttachment, index) =>
                    isImageAttachment(att) ? (
                      <AttachmentImage
                        key={`${att.key}-${index}`}
                        messageId={message.id}
                        index={index}
                        alt={att.originalName}
                        attachmentUrl={attachmentUrl}
                        isOwn={isOwn}
                        onError={onError}
                        onOpenFallback={openAttachment}
                      />
                    ) : (
                      <AttachmentFile
                        key={`${att.key}-${index}`}
                        att={att}
                        index={index}
                        isOwn={isOwn}
                        onOpen={openAttachment}
                      />
                    ),
                  )}
                </div>
              )}
            </>
          )}

          {!editing && (
            <p
              className={`mt-1.5 text-[10px] font-semibold ${
                isOwn ? 'text-emerald-100' : 'text-slate-400'
              }`}
            >
              {!isOwn && message.senderRole === 'admin' ? 'Admin T.C.H · ' : ''}
              {formatTime(message.createdAt)}
              {wasEdited ? ' · modifié' : ''}
            </p>
          )}
        </div>

        {canManage && !editing && (
          <div ref={menuRef} className="absolute -right-1 top-1">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className={`rounded-lg p-1 opacity-0 transition-opacity group-hover/bubble:opacity-100 focus:opacity-100 ${
                menuOpen ? 'opacity-100' : ''
              } ${
                isOwn
                  ? 'text-emerald-100 hover:bg-white/15'
                  : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              aria-label="Actions sur le message"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                className={`absolute right-0 top-full z-10 mt-1 min-w-[9rem] overflow-hidden rounded-xl border shadow-lg ${
                  isOwn
                    ? 'border-emerald-700 bg-emerald-800'
                    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                }`}
              >
                {onEdit && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      isOwn
                        ? 'text-white hover:bg-white/10'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      isOwn
                        ? 'text-red-200 hover:bg-white/10'
                        : 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
