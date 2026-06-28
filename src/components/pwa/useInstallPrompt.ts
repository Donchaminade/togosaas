import { useCallback, useEffect, useState } from 'react';

/** Event non standardise emis par Chrome/Edge/Android avant l'installation. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

/** L'app tourne-t-elle deja en mode installe (standalone) ? */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const displayStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayStandalone || iosStandalone;
}

/** Appareil iOS (iPhone/iPad/iPod), y compris iPadOS qui se presente comme Mac. */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

/** Navigateur iOS reellement Safari (les autres ne peuvent pas installer la PWA). */
export function isIOSSafari(): boolean {
  if (!isIOS()) return false;
  const ua = navigator.userAgent || '';
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

/** Heuristique mobile : user agent OU largeur d'ecran. */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const byUA = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|Windows Phone/i.test(ua);
  const byWidth = window.innerWidth < 768;
  return byUA || byWidth;
}

export interface InstallPromptState {
  /** Invite native disponible (Chrome/Edge/Android). */
  canInstall: boolean;
  /** App lancee en mode installe. */
  standalone: boolean;
  ios: boolean;
  mobile: boolean;
  /** Declenche l'invite native d'installation. */
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState<boolean>(isStandalone);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    const mql = window.matchMedia?.('(display-mode: standalone)');
    const onChange = () => setStandalone(isStandalone());
    mql?.addEventListener?.('change', onChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      mql?.removeEventListener?.('change', onChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return 'unavailable' as const;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome;
  }, [deferred]);

  return {
    canInstall: !!deferred,
    standalone,
    ios: isIOS(),
    mobile: isMobileDevice(),
    promptInstall,
  };
}
