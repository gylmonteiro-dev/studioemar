const SESSION_KEY = 'studioemar.session';

type Session = {
  userId: string;
};

function canUseStorage(): boolean {
  return typeof window !== 'undefined';
}

export function getSession(): Session | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Session;
    if (!parsed.userId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(userId: string): void {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
}

export function clearSession(): void {
  window.sessionStorage.removeItem(SESSION_KEY);
}
