/*
 * Notifications Web Push (cote client).
 *
 * Gere : detection du support, recuperation de la cle VAPID publique,
 * demande de permission, abonnement/desabonnement via PushManager, et
 * synchronisation de l'abonnement avec le backend.
 *
 * Tout est defensif : si la cle VAPID n'est pas configuree (build sans
 * VITE_VAPID_PUBLIC_KEY et backend sans cle), la fonctionnalite se desactive
 * proprement sans casser l'application.
 */
import { API_BASE_URL, tokenStore } from './api';

export interface PushStatus {
  /** API navigateur disponibles (SW + PushManager + Notification). */
  supported: boolean;
  /** Push reellement configure (cle VAPID disponible). */
  configured: boolean;
  /** Etat de la permission de notification. */
  permission: NotificationPermission | 'unsupported';
  /** L'utilisateur est-il actuellement abonne ? */
  subscribed: boolean;
}

let cachedPublicKey: string | null | undefined;

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** Recupere la cle VAPID publique : variable de build, sinon endpoint backend. */
export async function getPushPublicKey(): Promise<string | null> {
  if (cachedPublicKey !== undefined) return cachedPublicKey;

  const fromEnv = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim();
  if (fromEnv) {
    cachedPublicKey = fromEnv;
    return cachedPublicKey;
  }

  // Repli : demander la cle au backend (utile si non injectee au build).
  try {
    const res = await fetch(`${API_BASE_URL}/push/config`, {
      headers: { Accept: 'application/json' },
    });
    const payload = await res.json();
    const key = payload?.data?.publicKey;
    cachedPublicKey = typeof key === 'string' && key !== '' ? key : null;
  } catch {
    cachedPublicKey = null;
  }
  return cachedPublicKey;
}

export async function getPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) {
    return { supported: false, configured: false, permission: 'unsupported', subscribed: false };
  }

  const publicKey = await getPushPublicKey();
  let subscribed = false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    subscribed = !!sub;
  } catch {
    subscribed = false;
  }

  return {
    supported: true,
    configured: !!publicKey,
    permission: Notification.permission,
    subscribed,
  };
}

/** Active les notifications : permission -> abonnement -> envoi au backend. */
export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) {
    return { ok: false, reason: 'non-supporte' };
  }

  const publicKey = await getPushPublicKey();
  if (!publicKey) {
    return { ok: false, reason: 'non-configure' };
  }

  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch {
    return { ok: false, reason: 'permission-erreur' };
  }
  if (permission !== 'granted') {
    return { ok: false, reason: permission === 'denied' ? 'refusee' : 'ignoree' };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const sent = await postSubscription('/push/subscribe', { subscription: sub.toJSON() });
    if (!sent) {
      return { ok: false, reason: 'backend' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'abonnement-erreur' };
  }
}

/** Desactive les notifications : informe le backend puis desabonne. */
export async function disablePush(): Promise<{ ok: boolean }> {
  if (!isPushSupported()) return { ok: true };

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await postSubscription('/push/unsubscribe', { endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/* ------------------------------------------------------------------ */
/* Internes                                                           */
/* ------------------------------------------------------------------ */

async function postSubscription(path: string, body: unknown): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const payload = await res.json().catch(() => null);
    return res.ok && !!payload?.success;
  } catch {
    return false;
  }
}

/** Convertit une cle VAPID base64url en Uint8Array pour applicationServerKey. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
