import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  applyAuthSession,
  clearSession,
  getSession,
  setSession,
} from './session';

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const storage = new MemoryStorage();
Object.defineProperty(globalThis, 'window', {
  value: { sessionStorage: storage },
  configurable: true,
});

const user = {
  id: 'user-joao',
  name: 'João',
  email: 'joao@studioemar.local',
  role: 'STUDENT' as const,
  mustSetPassword: false,
};

describe('session', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('grava e lê a sessão JWT (ADR-015)', () => {
    setSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: 1,
      user,
    });
    assert.equal(getSession()?.accessToken, 'access');
    assert.equal(getSession()?.user.email, 'joao@studioemar.local');
  });

  it('logout só limpa o storage local', () => {
    applyAuthSession({
      accessToken: 'access',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user,
    });
    clearSession();
    assert.equal(getSession(), null);
  });

  it('descarta JSON inválido', () => {
    storage.setItem('studioemar.session', '{');
    assert.equal(getSession(), null);
  });
});
