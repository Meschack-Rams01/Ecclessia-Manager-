import { K } from "./constants";

// Salt should be configured via environment variable in production
const SALT = import.meta.env.VITE_PASSWORD_SALT || "churchreport_salt_2024";

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashStoredPasswords(): Promise<void> {
  const settings = JSON.parse(localStorage.getItem(K.SET) || "null");
  if (settings?.adminPw && !settings.adminPwHash) {
    settings.adminPwHash = await hashPassword(settings.adminPw);
    localStorage.setItem(K.SET, JSON.stringify(settings));
  }
}

export function sanitizeHTML(html: string): string {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

export function validateInput(value: string, maxLength: number = 500): boolean {
  if (!value || typeof value !== 'string') return false;
  if (value.length > maxLength) return false;
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:/gi
  ];
  return !dangerousPatterns.some(pattern => pattern.test(value));
}

export function createSafeDOM(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

export const InputValidation = {
  required: (value: string) => value?.trim().length > 0,
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  positiveNumber: (value: number) => value > 0,
  date: (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value),
  maxLength: (value: string, max: number) => value.length <= max,
};
