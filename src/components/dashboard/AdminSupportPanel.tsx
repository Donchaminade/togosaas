import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Megaphone, Send, Users, X } from 'lucide-react';
import SupportChatComposer, {
  MAX_FILES,
  MAX_SIZE_MB,
  type PendingFile,
} from './SupportChatComposer';
import SupportMessageBubble from './SupportMessageBubble';
import Spinner from '../ui/Spinner';
import SearchBar from '../ui/SearchBar';
import { useToast } from '../ui/Toast';
import { useConfirm } from '../ui/ConfirmDialog';
import { api, ApiError } from '../../lib/api';
import { filterBySearch } from '../../lib/search';
import type { LeadSummary, SupportAttachment, SupportConversation, SupportMessage } from '../../types';

type BroadcastMode = 'all' | 'selected';

export default function AdminSupportPanel() {
  const { notify } = useToast();
  const { confirmDelete } = useConfirm();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [leadName, setLeadName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMode, setBroadcastMode] = useState<BroadcastMode>('all');
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [conversationSearch, setConversationSearch] = useState('');

  const loadConversations = async () => {
    try {
      const res = await api.adminSupportConversations();
      setConversations(res.data.conversations);
    } catch {
      notify('Erreur de chargement.', 'error');
    }
  };

  const loadLeads = async () => {
    try {
      const res = await api.adminLeads();
      setLeads(res.data.leads);
    } catch {
      notify('Impossible de charger la liste des leads.', 'error');
    }
  };

  useEffect(() => {
    Promise.all([loadConversations(), loadLeads()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openThread = async (userId: number) => {
    setSelected(userId);
    setBody('');
    setPendingFiles([]);
    try {
      const res = await api.adminSupportThread(userId);
      setMessages(res.data.messages);
      setLeadName(res.data.lead?.name ?? '');
      setConversations((prev) =>
        prev.map((c) => (c.userId === userId ? { ...c, unread: 0 } : c)),
      );
    } catch {
      notify('Impossible de charger la conversation.', 'error');
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const uploadFile = useCallback(async (id: string, file: File) => {
    setPendingFiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, uploading: true, error: undefined } : p)),
    );
    try {
      const res = await api.adminUploadSupportAttachment(file);
      setPendingFiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, uploading: false, uploaded: res.data.attachment } : p,
        ),
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Upload impossible.';
      setPendingFiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, uploading: false, error: msg } : p)),
      );
    }
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      const room = MAX_FILES - pendingFiles.length;
      if (room <= 0) {
        notify(`Maximum ${MAX_FILES} fichiers par message.`, 'error');
        return;
      }
      list.slice(0, room).forEach((file) => {
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          notify(`${file.name} dépasse ${MAX_SIZE_MB} Mo.`, 'error');
          return;
        }
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setPendingFiles((prev) => [...prev, { id, file }]);
        uploadFile(id, file);
      });
    },
    [notify, pendingFiles.length, uploadFile],
  );

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.id !== id));
  };

  const send = async () => {
    if (!selected) return;
    const text = body.trim();
    const attachments: SupportAttachment[] = pendingFiles
      .filter((p) => p.uploaded && !p.error)
      .map((p) => p.uploaded!);

    if (!text && attachments.length === 0) return;
    if (pendingFiles.some((p) => p.uploading)) {
      notify('Patientez, upload en cours…', 'error');
      return;
    }

    setSending(true);
    try {
      const res = await api.adminSendSupportMessage(selected, { body: text, attachments });
      setMessages((prev) => [...prev, res.data.message]);
      setBody('');
      setPendingFiles([]);
      await loadConversations();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Envoi impossible.', 'error');
    } finally {
      setSending(false);
    }
  };

  const updateMessage = async (messageId: number, body: string) => {
    try {
      const res = await api.adminUpdateSupportMessage(messageId, { body });
      setMessages((prev) => prev.map((m) => (m.id === messageId ? res.data.message : m)));
      notify('Message modifié.', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Modification impossible.', 'error');
      throw err;
    }
  };

  const deleteMessage = async (messageId: number) => {
    const ok = await confirmDelete('Supprimer ce message ? Cette action est irréversible.');
    if (!ok) return;

    try {
      const res = await api.adminDeleteSupportMessage(messageId);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? res.data.message : m)));
      await loadConversations();
      notify('Message supprimé.', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Suppression impossible.', 'error');
    }
  };

  const filteredLeads = useMemo(
    () =>
      filterBySearch(leads, leadSearch, (l) => [l.name, l.email, l.phone]),
    [leads, leadSearch],
  );

  const filteredConversations = useMemo(
    () =>
      filterBySearch(conversations, conversationSearch, (c) => [c.name, c.lastBody]),
    [conversations, conversationSearch],
  );

  const broadcastTargetCount =
    broadcastMode === 'all' ? leads.length : selectedLeadIds.length;

  const openBroadcast = () => {
    setBroadcastMode('all');
    setSelectedLeadIds([]);
    setBroadcastBody('');
    setLeadSearch('');
    setShowBroadcast(true);
  };

  const toggleLead = (id: number) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredLeads.map((l) => l.id);
    setSelectedLeadIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const clearSelection = () => setSelectedLeadIds([]);

  const sendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastBody.trim()) return;
    if (broadcastMode === 'selected' && selectedLeadIds.length === 0) {
      notify('Sélectionnez au moins un lead.', 'error');
      return;
    }
    if (broadcastMode === 'all' && leads.length === 0) {
      notify('Aucun lead inscrit.', 'error');
      return;
    }

    setBroadcastSending(true);
    try {
      const res = await api.adminBroadcastSupportMessage({
        body: broadcastBody.trim(),
        all: broadcastMode === 'all',
        userIds: broadcastMode === 'selected' ? selectedLeadIds : undefined,
      });
      notify(`Message envoyé à ${res.data.sent} lead(s).`, 'success');
      setShowBroadcast(false);
      setBroadcastBody('');
      setSelectedLeadIds([]);
      await loadConversations();
    } catch {
      notify('Envoi groupé impossible.', 'error');
    } finally {
      setBroadcastSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8 text-togo-green" />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Conversations leads</p>
            <button
              type="button"
              onClick={openBroadcast}
              disabled={leads.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-togo-green px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-togo-green-dark disabled:opacity-50 dark:bg-togo-yellow dark:text-slate-900 dark:hover:bg-togo-yellow/90"
            >
              <Megaphone className="h-3.5 w-3.5" />
              Message groupé
            </button>
          </div>
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-slate-500">Aucune conversation pour l&apos;instant.</p>
              {leads.length > 0 && (
                <button
                  type="button"
                  onClick={openBroadcast}
                  className="mt-3 text-sm font-bold text-togo-green hover:underline dark:text-togo-yellow"
                >
                  Envoyer un premier message aux leads →
                </button>
              )}
            </div>
          ) : (
            <>
              {conversations.length > 3 && (
                <div className="border-b border-slate-100 p-2 dark:border-slate-800">
                  <SearchBar
                    value={conversationSearch}
                    onChange={setConversationSearch}
                    placeholder="Rechercher une conversation…"
                    size="sm"
                    resultCount={filteredConversations.length}
                    totalCount={conversations.length}
                  />
                </div>
              )}
            <div className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {filteredConversations.length === 0 ? (
                <p className="p-4 text-center text-xs text-slate-500">Aucune conversation trouvée.</p>
              ) : (
              filteredConversations.map((c) => (
                <button
                  key={c.userId}
                  type="button"
                  onClick={() => openThread(c.userId)}
                  className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    selected === c.userId ? 'bg-togo-green/5 dark:bg-togo-yellow/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                    {c.unread > 0 && (
                      <span className="rounded-full bg-togo-red px-2 py-0.5 text-[10px] font-bold text-white">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-500">{c.lastBody}</p>
                </button>
              ))
              )}
            </div>
            </>
          )}
        </div>

        <div className="flex h-[480px] flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          {!selected ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-sm text-slate-500">Sélectionnez une conversation.</p>
              <button
                type="button"
                onClick={openBroadcast}
                disabled={leads.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:border-togo-green hover:text-togo-green disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-togo-yellow dark:hover:text-togo-yellow"
              >
                <Megaphone className="h-4 w-4" />
                Message à tous ou à certains leads
              </button>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white">{leadName}</p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((m) => (
                  <SupportMessageBubble
                    key={m.id}
                    message={m}
                    isOwn={m.senderRole === 'admin'}
                    attachmentUrl={api.adminSupportAttachmentUrl}
                    onError={(msg) => notify(msg, 'error')}
                    onEdit={updateMessage}
                    onDelete={deleteMessage}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
              <SupportChatComposer
                body={body}
                onBodyChange={setBody}
                pendingFiles={pendingFiles}
                onAddFiles={addFiles}
                onRemoveFile={removeFile}
                onSubmit={send}
                sending={sending}
                placeholder="Répondre au lead…"
              />
            </>
          )}
        </div>
      </div>

      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 sm:items-center">
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            role="dialog"
            aria-labelledby="broadcast-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <h2 id="broadcast-title" className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                  <Megaphone className="h-5 w-5 text-togo-green dark:text-togo-yellow" />
                  Message groupé
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Envoyez un message à tous les leads ou à une sélection.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcast(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={sendBroadcast} className="flex min-h-0 flex-1 flex-col">
              <div className="space-y-4 overflow-y-auto px-5 py-4">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Destinataires</p>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                    <input
                      type="radio"
                      name="broadcastMode"
                      checked={broadcastMode === 'all'}
                      onChange={() => setBroadcastMode('all')}
                      className="mt-1"
                    />
                    <span>
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <Users className="h-4 w-4 text-togo-green dark:text-togo-yellow" />
                        Tous les leads
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {leads.length} lead{leads.length !== 1 ? 's' : ''} inscrit{leads.length !== 1 ? 's' : ''}
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                    <input
                      type="radio"
                      name="broadcastMode"
                      checked={broadcastMode === 'selected'}
                      onChange={() => setBroadcastMode('selected')}
                      className="mt-1"
                    />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Sélection personnalisée
                    </span>
                  </label>
                </div>

                {broadcastMode === 'selected' && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3 dark:border-slate-800">
                      <SearchBar
                        value={leadSearch}
                        onChange={setLeadSearch}
                        placeholder="Rechercher un lead…"
                        size="sm"
                        resultCount={filteredLeads.length}
                        totalCount={leads.length}
                        className="min-w-[140px] flex-1"
                      />
                      <button
                        type="button"
                        onClick={selectAllFiltered}
                        className="text-xs font-bold text-togo-green hover:underline dark:text-togo-yellow"
                      >
                        Tout cocher
                      </button>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-xs font-bold text-slate-500 hover:underline"
                      >
                        Tout décocher
                      </button>
                    </div>
                    <div className="max-h-44 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                      {filteredLeads.length === 0 ? (
                        <p className="p-4 text-center text-xs text-slate-500">Aucun lead trouvé.</p>
                      ) : (
                        filteredLeads.map((l) => (
                          <label
                            key={l.id}
                            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLeadIds.includes(l.id)}
                              onChange={() => toggleLead(l.id)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {l.name}
                              </span>
                              <span className="block truncate text-xs text-slate-500">{l.email}</span>
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
                    Message *
                  </label>
                  <textarea
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    required
                    rows={5}
                    maxLength={3000}
                    placeholder="Annonce, consigne, rappel…"
                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
                <p className="text-xs text-slate-500">
                  Sera envoyé à{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {broadcastTargetCount} lead{broadcastTargetCount !== 1 ? 's' : ''}
                  </strong>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBroadcast(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={broadcastSending || !broadcastBody.trim() || broadcastTargetCount === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-4 py-2 text-sm font-bold text-white disabled:opacity-50 dark:bg-togo-yellow dark:text-slate-900"
                  >
                    {broadcastSending ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    Envoyer
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
