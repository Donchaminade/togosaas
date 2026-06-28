import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Loader2, Mail, Send } from 'lucide-react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import { useToast } from '../ui/Toast';
import { api, ApiError } from '../../lib/api';
import type { ContactMessage, ContactReply } from '../../types';

interface ContactMessageModalProps {
  message: ContactMessage;
  onClose: () => void;
  /** Notifie le parent qu'une reponse a ete ajoutee (mise a jour optimiste). */
  onReplied: (messageId: number) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ContactMessageModal({ message, onClose, onReplied }: ContactMessageModalProps) {
  const { notify } = useToast();
  const [replies, setReplies] = useState<ContactReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.adminMessageReplies(message.id);
      setReplies(res.data.replies);
    } catch {
      notify('Impossible de charger la conversation.', 'error');
    } finally {
      setLoading(false);
    }
  }, [message.id, notify]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length, loading]);

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const res = await api.adminReplyMessage(message.id, { body: text });
      const reply = res.data.reply;
      setReplies((prev) => [...prev, reply]);
      setBody('');
      onReplied(message.id);
      if (reply.emailStatus === 'sent') {
        notify('Réponse envoyée au visiteur par email.', 'success');
      } else {
        notify(
          "Réponse enregistrée, mais l'email n'a pas pu être envoyé (vérifiez l'adresse ou la configuration SMTP).",
          'info',
        );
      }
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Échec de l'envoi de la réponse.", 'error');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  };

  return (
    <Modal title="Conversation" onClose={onClose} maxWidth="2xl">
      <div className="flex max-h-[70vh] flex-col">
        {/* Message d'origine */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-start justify-between gap-3">
            <p className="font-black text-slate-900 dark:text-white">{message.subject || 'Sans objet'}</p>
            <span className="shrink-0 text-xs text-slate-400">{formatDate(message.createdAt)}</span>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{message.message}</p>
          <p className="mt-3 flex flex-wrap items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{message.name}</span>
            <span aria-hidden="true">·</span>
            <a
              href={`mailto:${message.email}`}
              className="inline-flex items-center gap-1 text-togo-green hover:underline dark:text-togo-yellow"
            >
              <Mail className="h-3 w-3" /> {message.email}
            </a>
          </p>
        </div>

        {/* Fil des reponses admin */}
        <div className="min-h-[8rem] flex-1 space-y-3 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8 text-togo-green" />
            </div>
          ) : replies.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              Aucune réponse pour le moment. Rédigez la première ci-dessous.
            </p>
          ) : (
            replies.map((r) => (
              <div key={r.id} className="flex justify-end">
                <div className="max-w-[88%] rounded-2xl bg-togo-green px-4 py-3 text-sm leading-relaxed text-white sm:max-w-[85%]">
                  <p className="whitespace-pre-wrap">{r.body}</p>
                  <p className="mt-1.5 flex items-center justify-end gap-1 text-[10px] font-semibold text-emerald-100">
                    {r.emailStatus === 'sent' ? (
                      <>Admin · {formatDate(r.createdAt)} · envoyé</>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3" />
                        Admin · {formatDate(r.createdAt)} · email non envoyé
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={threadEndRef} />
        </div>

        {/* Zone de reponse */}
        <div className="shrink-0 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
            rows={3}
            maxLength={3000}
            aria-label="Votre réponse au visiteur"
            placeholder="Rédigez votre réponse… (elle sera envoyée par email au visiteur)"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-togo-green dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">{body.length}/3000</span>
            <button
              type="button"
              onClick={send}
              disabled={sending || body.trim() === ''}
              aria-label="Envoyer la réponse"
              title="Envoyer la réponse par email"
              className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
