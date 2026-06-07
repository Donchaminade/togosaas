import { useCallback, useEffect, useRef, useState } from 'react';
import Spinner from '../ui/Spinner';
import { useToast } from '../ui/Toast';
import { useConfirm } from '../ui/ConfirmDialog';
import SupportChatComposer, {
  MAX_FILES,
  MAX_SIZE_MB,
  type PendingFile,
} from './SupportChatComposer';
import SupportMessageBubble from './SupportMessageBubble';
import { api, ApiError } from '../../lib/api';
import type { SupportAttachment, SupportMessage } from '../../types';

export default function LeadAdminChat() {
  const { notify } = useToast();
  const { confirmDelete } = useConfirm();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const res = await api.leadSupportMessages();
      setMessages(res.data.messages);
    } catch {
      notify('Impossible de charger les messages.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const uploadFile = useCallback(
    async (id: string, file: File) => {
      setPendingFiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, uploading: true, error: undefined } : p)),
      );
      try {
        const res = await api.leadUploadSupportAttachment(file);
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
    },
    [],
  );

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
      const res = await api.leadSendSupportMessage({ body: text, attachments });
      setMessages((prev) => [...prev, res.data.message]);
      setBody('');
      setPendingFiles([]);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Envoi impossible.', 'error');
    } finally {
      setSending(false);
    }
  };

  const updateMessage = async (messageId: number, body: string) => {
    try {
      const res = await api.leadUpdateSupportMessage(messageId, { body });
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
      const res = await api.leadDeleteSupportMessage(messageId);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? res.data.message : m)));
      notify('Message supprimé.', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Suppression impossible.', 'error');
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
    <div className="flex h-[calc(100vh-14rem)] max-h-[640px] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          Conversation avec l&apos;administration T.C.H
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          Questions sur la validation, modération ou le fonctionnement de la plateforme. Vous pouvez
          joindre des captures ou documents (JPG, PNG, PDF).
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:space-y-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Aucun message pour l&apos;instant.
            </p>
            <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400">
              Écrivez à l&apos;équipe T.C.H pour suivre la validation de votre communauté ou obtenir
              de l&apos;aide. Utilisez le trombone pour joindre un fichier.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <SupportMessageBubble
              key={m.id}
              message={m}
              isOwn={m.senderRole === 'lead'}
              attachmentUrl={api.leadSupportAttachmentUrl}
              onError={(msg) => notify(msg, 'error')}
              onEdit={updateMessage}
              onDelete={deleteMessage}
            />
          ))
        )}
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
        placeholder="Votre message à l'administration…"
      />
    </div>
  );
}
