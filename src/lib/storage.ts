// src/lib/storage.ts
import { StoredUser, TypingAttempt } from '@/types';

const STORAGE_KEY = 'edex_exam_user';
export const MAX_TYPING_ATTEMPTS = 3;

export function generateToken(): string {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: StoredUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function addTypingAttempt(result: TypingAttempt): StoredUser | null {
  const user = getStoredUser();
  if (!user) return null;
  if (user.typingAttempts.length >= MAX_TYPING_ATTEMPTS) return user;

  // Dublikat tekshiruv
  const last = user.typingAttempts[user.typingAttempts.length - 1];
  if (last && last.wpm === result.wpm && last.accuracy === result.accuracy) {
    return user;
  }

  user.typingAttempts.push({
    ...result,
    attemptNumber: user.typingAttempts.length + 1,
  });

  saveStoredUser(user);
  return user;
}

export function getBestTyping(attempts: TypingAttempt[]): TypingAttempt | null {
  if (!attempts.length) return null;
  return attempts.reduce((best, curr) => (curr.wpm > best.wpm ? curr : best));
}

export function getCurrentPhase(user: StoredUser): 'typing' | 'test' | 'docs' | 'done' {
  if (user.docsDone) return 'done';
  if (user.testDone) return 'docs';
  if (user.typingDone) return 'test';
  return 'typing';
}
