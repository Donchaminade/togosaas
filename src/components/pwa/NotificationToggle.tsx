import { useEffect, useState } from 'react';
import { BellOff, BellRing } from 'lucide-react';
import { disablePush, enablePush, getPushStatus, isPushSupported } from '../../lib/push';
import { useToast } from '../ui/Toast';

/**
 * Bouton d'activation des notifications push, affiche dans la barre du dashboard.
 * Ne s'affiche que si le navigateur le supporte ET que le push est configure
 * (cle VAPID disponible). Sinon il disparait proprement.
 */
export default function NotificationToggle() {
  const { notify } = useToast();
  const [supported] = useState(isPushSupported);
  const [configured, setConfigured] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getPushStatus().then((status) => {
      if (!active) return;
      setConfigured(status.configured);
      setSubscribed(status.subscribed);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!supported || !configured) return null;

  const toggle = async () => {
    setBusy(true);
    try {
      if (subscribed) {
        const result = await disablePush();
        if (result.ok) {
          setSubscribed(false);
          notify('Notifications désactivées.', 'info');
        } else {
          notify('Impossible de désactiver les notifications.', 'error');
        }
      } else {
        const result = await enablePush();
        if (result.ok) {
          setSubscribed(true);
          notify('Notifications activées 🎉', 'success');
        } else {
          const messages: Record<string, string> = {
            refusee: 'Permission refusée dans le navigateur.',
            'non-configure': 'Notifications indisponibles pour le moment.',
            'non-supporte': 'Votre navigateur ne supporte pas les notifications.',
            backend: 'Enregistrement de l’abonnement impossible.',
          };
          notify(messages[result.reason ?? ''] || 'Activation des notifications impossible.', 'error');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const Icon = subscribed ? BellRing : BellOff;
  const label = subscribed ? 'Notifications activées' : 'Activer les notifications';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title={label}
      aria-label={label}
      className={`grid h-10 w-10 place-items-center rounded-xl border transition-colors disabled:opacity-50 ${
        subscribed
          ? 'border-togo-green/30 bg-togo-green/10 text-togo-green'
          : 'border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
