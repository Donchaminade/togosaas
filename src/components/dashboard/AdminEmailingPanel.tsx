import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bold,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  History,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Paperclip,
  RefreshCw,
  Send,
  Trash2,
  Underline,
  Users,
  XCircle,
} from 'lucide-react';
import { api, ApiError, API_BASE_URL } from '../../lib/api';
import { useToast } from '../ui/Toast';
import type {
  EmailAttachment,
  EmailCampaign,
  EmailCampaignRecipient,
  EmailConfig,
  EmailRecipientOption,
} from '../../types';

const ATTACHMENT_ACCEPT =
  '.jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip';

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  sending: { label: 'Envoi…', className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  sent: { label: 'Envoyée', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  partial: { label: 'Partielle', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  failed: { label: 'Échec', className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
};

export default function AdminEmailingPanel() {
  const { notify } = useToast();
  const [view, setView] = useState<'compose' | 'history'>('compose');

  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [recipients, setRecipients] = useState<EmailRecipientOption[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [cfg, rec, camp] = await Promise.all([
        api.adminEmailConfig(),
        api.adminEmailRecipients(),
        api.adminEmailCampaigns(),
      ]);
      setConfig(cfg.data);
      setRecipients(rec.data.recipients);
      setCampaigns(camp.data.campaigns);
    } catch {
      notify("Erreur de chargement de l'emailing.", 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const reloadCampaigns = useCallback(async () => {
    try {
      const camp = await api.adminEmailCampaigns();
      setCampaigns(camp.data.campaigns);
    } catch {
      /* silencieux */
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {config && !config.configured && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Service d'envoi non configuré</p>
            <p className="mt-1">
              Renseignez les variables <code className="font-mono">MAIL_*</code> (SMTP) dans le fichier{' '}
              <code className="font-mono">.env</code> du serveur pour activer l'envoi. Vous pouvez rédiger une campagne,
              mais l'envoi restera bloqué tant que la configuration est absente.
            </p>
          </div>
        </div>
      )}

      <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <button
          onClick={() => setView('compose')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            view === 'compose' ? 'bg-white text-togo-green shadow-sm dark:bg-slate-900 dark:text-togo-yellow' : 'text-slate-500'
          }`}
        >
          <Send className="h-4 w-4" /> Nouvelle campagne
        </button>
        <button
          onClick={() => setView('history')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
            view === 'history' ? 'bg-white text-togo-green shadow-sm dark:bg-slate-900 dark:text-togo-yellow' : 'text-slate-500'
          }`}
        >
          <History className="h-4 w-4" /> Historique
          {campaigns.length > 0 && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
              {campaigns.length}
            </span>
          )}
        </button>
      </div>

      {view === 'compose' ? (
        <Composer
          recipients={recipients}
          canSend={!!config?.configured}
          fromEmail={config?.fromEmail ?? null}
          maxFiles={config?.maxFiles ?? 5}
          onSent={async () => {
            await reloadCampaigns();
            setView('history');
          }}
        />
      ) : (
        <HistoryList campaigns={campaigns} onChanged={reloadCampaigns} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Composer                                                            */
/* ------------------------------------------------------------------ */

function Composer({
  recipients,
  canSend,
  fromEmail,
  maxFiles,
  onSent,
}: {
  recipients: EmailRecipientOption[];
  canSend: boolean;
  fromEmail: string | null;
  maxFiles: number;
  onSent: () => Promise<void> | void;
}) {
  const { notify } = useToast();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [subject, setSubject] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const filteredRecipients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [recipients, search]);

  const targetCount = sendToAll ? recipients.length : selectedIds.length;

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const toggleRecipient = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleInsertLink = () => {
    const url = window.prompt('URL du lien (https://…)');
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      notify('Le lien doit commencer par http:// ou https://', 'error');
      return;
    }
    exec('createLink', url);
  };

  const handleInsertImage = async (file: File) => {
    setUploading(true);
    try {
      const res = await api.uploadFile(file);
      const url = absoluteUrl(res.data.url);
      exec('insertHTML', `<img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:8px;" />`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Échec de l'envoi de l'image.", 'error');
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleAttachFiles = async (files: FileList) => {
    if (attachments.length + files.length > maxFiles) {
      notify(`Maximum ${maxFiles} pièces jointes.`, 'error');
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const res = await api.adminUploadEmailAttachment(file);
        setAttachments((prev) => [...prev, res.data.attachment]);
      }
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Échec de l'ajout du fichier.", 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (key: string) => {
    setAttachments((prev) => prev.filter((a) => a.key !== key));
  };

  const handleSend = async () => {
    const bodyHtml = editorRef.current?.innerHTML ?? '';
    const textContent = editorRef.current?.textContent?.trim() ?? '';

    if (subject.trim().length < 2) {
      notify('Le sujet est requis.', 'error');
      return;
    }
    if (textContent === '' && !bodyHtml.includes('<img')) {
      notify('Le corps du message est vide.', 'error');
      return;
    }
    if (!sendToAll && selectedIds.length === 0) {
      notify('Sélectionnez au moins un destinataire.', 'error');
      return;
    }
    if (targetCount === 0) {
      notify('Aucun destinataire disponible.', 'error');
      return;
    }

    const confirmed = window.confirm(
      `Envoyer cet email à ${targetCount} destinataire(s) ?`,
    );
    if (!confirmed) return;

    setSending(true);
    try {
      const res = await api.adminCreateEmailCampaign({
        subject: subject.trim(),
        bodyHtml,
        attachments,
        all: sendToAll,
        userIds: sendToAll ? undefined : selectedIds,
      });
      notify(res.message || 'Campagne envoyée.', 'success');
      setSubject('');
      setAttachments([]);
      setSelectedIds([]);
      if (editorRef.current) editorRef.current.innerHTML = '';
      await onSent();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Échec de l'envoi.", 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Colonne rédaction */}
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {fromEmail && (
          <p className="text-xs text-slate-400">
            Expéditeur : <span className="font-semibold text-slate-600 dark:text-slate-300">{fromEmail}</span>
          </p>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Sujet</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet de l'email"
            maxLength={255}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-togo-green dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Message</label>
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
              <ToolbarButton onClick={() => exec('bold')} title="Gras"><Bold className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onClick={() => exec('italic')} title="Italique"><Italic className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onClick={() => exec('underline')} title="Souligné"><Underline className="h-4 w-4" /></ToolbarButton>
              <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600" />
              <ToolbarButton onClick={() => exec('insertUnorderedList')} title="Liste à puces"><List className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onClick={() => exec('insertOrderedList')} title="Liste numérotée"><ListOrdered className="h-4 w-4" /></ToolbarButton>
              <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-600" />
              <ToolbarButton onClick={handleInsertLink} title="Insérer un lien"><Link2 className="h-4 w-4" /></ToolbarButton>
              <ToolbarButton onClick={() => imageInputRef.current?.click()} title="Insérer une image"><ImagePlus className="h-4 w-4" /></ToolbarButton>
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              data-placeholder="Rédigez votre message ici…"
              className="email-editor min-h-[240px] max-w-none px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none dark:text-slate-100 [&_a]:text-togo-green [&_a]:underline [&_img]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            Astuce : les images insérées sont hébergées et affichées dans l'email. Certains clients masquent les images
            par défaut.
          </p>
        </div>

        {/* Pièces jointes */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Pièces jointes</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || attachments.length >= maxFiles}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300"
            >
              <Paperclip className="h-3.5 w-3.5" /> Ajouter ({attachments.length}/{maxFiles})
            </button>
          </div>
          {attachments.length > 0 && (
            <ul className="mt-3 space-y-2">
              {attachments.map((a) => (
                <li
                  key={a.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="truncate text-sm text-slate-700 dark:text-slate-200">{a.originalName}</span>
                    <span className="shrink-0 text-xs text-slate-400">{formatBytes(a.size)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.key)}
                    title="Retirer la pièce jointe"
                    aria-label="Retirer la pièce jointe"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/15"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            aria-label="Ajouter des pièces jointes"
            title="Ajouter des pièces jointes"
            className="hidden"
            onChange={(e) => e.target.files && handleAttachFiles(e.target.files)}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            aria-label="Insérer une image"
            title="Insérer une image"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleInsertImage(e.target.files[0])}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {uploading && (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" /> Téléversement…
              </span>
            )}
          </span>
          <button
            onClick={handleSend}
            disabled={sending || uploading || !canSend || targetCount === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            title={!canSend ? 'Configuration SMTP requise' : undefined}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? 'Envoi en cours…' : `Envoyer à ${targetCount}`}
          </button>
        </div>
      </div>

      {/* Colonne destinataires */}
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-togo-green" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Destinataires</h3>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700">
          <input
            type="checkbox"
            checked={sendToAll}
            onChange={(e) => setSendToAll(e.target.checked)}
            className="h-4 w-4 accent-togo-green"
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Tous les leads <span className="text-slate-400">({recipients.length})</span>
          </span>
        </label>

        {!sendToAll && (
          <div className="space-y-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un lead…"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
              {filteredRecipients.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">Aucun lead trouvé.</p>
              ) : (
                filteredRecipients.map((r) => (
                  <label
                    key={r.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(r.id)}
                      onChange={() => toggleRecipient(r.id)}
                      className="h-4 w-4 accent-togo-green"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-200">{r.name}</span>
                      <span className="block truncate text-xs text-slate-400">{r.email}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
            {selectedIds.length > 0 && (
              <p className="text-xs font-semibold text-togo-green">{selectedIds.length} sélectionné(s)</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Historique                                                          */
/* ------------------------------------------------------------------ */

function HistoryList({ campaigns, onChanged }: { campaigns: EmailCampaign[]; onChanged: () => Promise<void> | void }) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-700">
        <History className="h-12 w-12 text-slate-300" />
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Aucune campagne envoyée pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {campaigns.map((c) => (
        <CampaignRow key={c.id} campaign={c} onChanged={onChanged} />
      ))}
    </div>
  );
}

function CampaignRow({ campaign, onChanged }: { campaign: EmailCampaign; onChanged: () => Promise<void> | void }) {
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState<EmailCampaignRecipient[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const meta = STATUS_META[campaign.status] ?? STATUS_META.sent;

  const loadDetail = async () => {
    if (recipients) return;
    setLoading(true);
    try {
      const res = await api.adminGetEmailCampaign(campaign.id);
      setRecipients(res.data.recipients);
    } catch {
      notify('Erreur de chargement du détail.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadDetail();
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await api.adminRetryEmailCampaign(campaign.id);
      notify(res.message || 'Renvoi effectué.', 'success');
      setRecipients(null);
      await onChanged();
      const detail = await api.adminGetEmailCampaign(campaign.id);
      setRecipients(detail.data.recipients);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Échec du renvoi.', 'error');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={toggle}
        aria-label={`Détails de la campagne : ${campaign.subject}`}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
      >
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{campaign.subject}</p>
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            {new Date(campaign.createdAt).toLocaleString('fr-FR')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs font-semibold text-slate-500 sm:inline dark:text-slate-400">
            {campaign.sentCount}/{campaign.recipientsCount} envoyé(s)
          </span>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.className}`}>{meta.label}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4 dark:border-slate-800">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> {campaign.sentCount} réussi(s)
            </span>
            {campaign.failedCount > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                <XCircle className="h-3.5 w-3.5" /> {campaign.failedCount} échec(s)
              </span>
            )}
            {campaign.attachments && campaign.attachments.length > 0 && (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Paperclip className="h-3.5 w-3.5" /> {campaign.attachments.length} pièce(s) jointe(s)
              </span>
            )}
            {campaign.failedCount > 0 && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 font-bold text-amber-700 transition-colors hover:bg-amber-200 disabled:opacity-50 dark:bg-amber-500/15 dark:text-amber-300"
              >
                {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Renvoyer les échecs
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-6 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : recipients && recipients.length > 0 ? (
            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
              {recipients.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 border-b border-slate-50 px-3 py-2 last:border-0 dark:border-slate-800/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-700 dark:text-slate-200">{r.name || r.email}</p>
                    {r.name && <p className="truncate text-xs text-slate-400">{r.email}</p>}
                    {r.status === 'failed' && r.error && (
                      <p className="truncate text-xs text-rose-500" title={r.error}>{r.error}</p>
                    )}
                  </div>
                  <RecipientStatus status={r.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-slate-400">Aucun destinataire.</p>
          )}

          {/* Aperçu du message */}
          <details className="mt-4 group">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-slate-400 hover:text-slate-600">
              Aperçu du message
            </summary>
            <div
              className="mt-3 max-w-none rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 [&_a]:text-togo-green [&_a]:underline [&_img]:my-2 [&_img]:max-w-full [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: campaign.bodyHtml }}
            />
          </details>
        </div>
      )}
    </div>
  );
}

function RecipientStatus({ status }: { status: EmailCampaignRecipient['status'] }) {
  if (status === 'sent') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
        <CheckCircle2 className="h-3 w-3" /> Envoyé
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
        <XCircle className="h-3 w-3" /> Échec
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <Clock className="h-3 w-3" /> En attente
    </span>
  );
}
