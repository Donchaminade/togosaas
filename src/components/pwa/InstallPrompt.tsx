import { useEffect, useState } from 'react';
import { Download, Share, Plus, X, Smartphone } from 'lucide-react';
import { isIOSSafari, useInstallPrompt } from './useInstallPrompt';

const STORAGE_KEY = 'tch_pwa_install';
const DISMISS_NEVER = 'never';
const MOBILE_INTERVAL = 15_000; // l'invite reapparait toutes les 15 s sur mobile
const DESKTOP_INTERVAL = 45_000; // version plus discrete et espacee sur ordinateur
const FIRST_DELAY = 3_000;

function readNever(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === DISMISS_NEVER;
  } catch {
    return false;
  }
}

export default function InstallPrompt() {
  const { canInstall, standalone, ios, mobile, promptInstall } = useInstallPrompt();
  const [never, setNever] = useState<boolean>(readNever);
  const [visible, setVisible] = useState(false);

  const iosInstructions = ios && !canInstall && isIOSSafari();
  const eligible = !standalone && !never && (canInstall || iosInstructions);

  useEffect(() => {
    if (!eligible) {
      setVisible(false);
      return;
    }
    const interval = mobile ? MOBILE_INTERVAL : DESKTOP_INTERVAL;
    const first = window.setTimeout(() => setVisible(true), FIRST_DELAY);
    const timer = window.setInterval(() => setVisible(true), interval);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [eligible, mobile]);

  if (!eligible || !visible) return null;

  const dismissLater = () => setVisible(false);
  const dismissForever = () => {
    try {
      localStorage.setItem(STORAGE_KEY, DISMISS_NEVER);
    } catch {
      /* ignore */
    }
    setNever(true);
    setVisible(false);
  };
  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome !== 'unavailable') setVisible(false);
  };

  const containerClass = mobile
    ? 'fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4'
    : 'fixed bottom-5 right-5 z-[90] w-full max-w-sm';

  return (
    <div className={containerClass} role="dialog" aria-label="Installer l'application TogoSaaS">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-black/10 animate-rise dark:border-slate-700 dark:bg-slate-900">
        <div className="h-1.5 w-full bg-gradient-to-r from-togo-green via-togo-yellow to-togo-red" />

        <button
          type="button"
          onClick={dismissLater}
          aria-label="Fermer"
          className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5">
          <div className="flex items-start gap-4">
            <img
              src="/pwa-192x192.png"
              alt="TogoSaaS"
              className="h-14 w-14 shrink-0 rounded-2xl border border-slate-100 object-contain shadow-sm dark:border-slate-700"
            />
            <div className="min-w-0 flex-1 pr-6">
              <h3 className="flex items-center gap-1.5 text-base font-black text-slate-900 dark:text-white">
                <Smartphone className="h-4 w-4 text-togo-green" />
                Installer TogoSaaS
              </h3>
              <p className="mt-1 text-sm leading-snug text-slate-600 dark:text-slate-300">
                {iosInstructions
                  ? 'Ajoutez TogoSaaS à votre écran d’accueil pour un accès rapide et les notifications.'
                  : 'Installez l’application pour un accès instantané, hors-ligne et les notifications.'}
              </p>
            </div>
          </div>

          {iosInstructions ? (
            <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <p className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-togo-green/10 text-togo-green">
                  1
                </span>
                Touchez <Share className="mx-0.5 inline h-4 w-4 text-togo-green" /> (Partager) dans la barre de Safari.
              </p>
              <p className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-togo-green/10 text-togo-green">
                  2
                </span>
                Choisissez « Sur l’écran d’accueil »
                <Plus className="mx-0.5 inline h-4 w-4 text-togo-green" />.
              </p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {!iosInstructions && (
              <button
                type="button"
                onClick={handleInstall}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-togo-green/25 transition-transform hover:scale-[1.02] active:scale-95"
              >
                <Download className="h-4 w-4" />
                Installer
              </button>
            )}
            <button
              type="button"
              onClick={dismissLater}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Plus tard
            </button>
            <button
              type="button"
              onClick={dismissForever}
              className="inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            >
              Ne plus afficher
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
