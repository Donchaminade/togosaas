const VISITOR_KEY = 'tch_visitor_id';

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Identifiant anonyme persistant pour likes / avis publics. */
export function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id || !/^[a-f0-9]{32,64}$/i.test(id)) {
    id = randomHex(16);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}
