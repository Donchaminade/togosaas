import { useState } from 'react';
import { MailWarning, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../ui/Toast';

/**
 * Bandeau NON bloquant invitant les nouveaux comptes a confirmer leur email.
 * N'apparait jamais pour les comptes existants (emailVerified !== false) ni pour
 * les profils sentinelles incomplets (qui ont leur propre flux de completion).
 */
export default function EmailVerificationBanner() {
  const { user, profileIncomplete } = useAuth();
  const { notify } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified !== false || profileIncomplete || dismissed) {
    return null;
  }

  const resend = async () => {
    setSending(true);
    try {
      const res = await api.resendVerification();
      notify(res.message || 'Email de confirmation envoyé.', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Échec de l'envoi.", 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
            Confirmez votre adresse email
          </p>
          <p className="mt-0.5 text-sm text-amber-700/90 dark:text-amber-300/80">
            Un email de confirmation a été envoyé à <strong>{user.email}</strong>. Vérifiez votre
            boîte de réception (et les indésirables). Votre compte reste pleinement utilisable.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={resend}
          disabled={sending}
          className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
        >
          {sending ? 'Envoi…' : 'Renvoyer'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="grid h-8 w-8 place-items-center rounded-lg text-amber-600 transition-colors hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-500/20"
          aria-label="Masquer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
