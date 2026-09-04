import type { AuthSession, User } from '@studioemar/shared';

const SESSION_KEY = 'studioemar.session';

export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
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
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.user) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function applyAuthSession(auth: AuthSession): Session {
  const session: Session = {
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    expiresAt: Date.now() + auth.expiresIn * 1000,
    user: auth.user,
  };
  setSession(session);
  return session;
}

export function patchSessionUser(user: User): void {
  const session = getSession();
  if (!session) {
    return;
  }
  setSession({ ...session, user });
}

export function clearSession(): void {
  if (!canUseStorage()) {
    return;
  }
  window.sessionStorage.removeItem(SESSION_KEY);
}
