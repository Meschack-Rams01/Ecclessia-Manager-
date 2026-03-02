import { K, type Extension } from "./constants";
import type { Session, Settings } from "./state";
import { hashPassword, verifyPassword, generateSessionToken } from "./security";

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface SecureSession {
  token: string;
  role: 'admin' | 'extension';
  extId?: string;
  expiresAt: number;
}

const SecureStore = {
  async init(): Promise<void> {
    const settings = this.getSettings();
    if (settings?.adminPw && !settings.adminPwHash) {
      settings.adminPwHash = await hashPassword(settings.adminPw);
      this.saveSettings(settings);
    }
  },

  getSettings(): Settings {
    try {
      return JSON.parse(localStorage.getItem(K.SET) || "null") || { 
        nom: "Emerge in Christ", 
        adminPw: "admin123" 
      };
    } catch {
      return { nom: "Emerge in Christ", adminPw: "admin123" };
    }
  },

  saveSettings(s: Settings): void {
    localStorage.setItem(K.SET, JSON.stringify(s));
  },

  getSession(): SecureSession | null {
    try {
      const ses = localStorage.getItem(K.SES);
      if (!ses) return null;
      const session: SecureSession = JSON.parse(ses);
      if (session.expiresAt < Date.now()) {
        localStorage.removeItem(K.SES);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  setSession(role: 'admin' | 'extension', extId?: string): void {
    const session: SecureSession = {
      token: generateSessionToken(),
      role,
      extId,
      expiresAt: Date.now() + SESSION_DURATION
    };
    localStorage.setItem(K.SES, JSON.stringify(session));
  },

  clearSession(): void {
    localStorage.removeItem(K.SES);
  },

  async loginAdmin(password: string): Promise<boolean> {
    const settings = this.getSettings();
    
    // First try hashed password
    if (settings.adminPwHash) {
      const isValid = await verifyPassword(password, settings.adminPwHash);
      if (isValid) {
        this.setSession('admin');
        return true;
      }
    }
    
    // Fallback for old plaintext passwords (migration)
    if (password === settings.adminPw) {
      settings.adminPwHash = await hashPassword(password);
      this.saveSettings(settings);
      this.setSession('admin');
      return true;
    }
    
    return false;
  },

  async loginExtension(extId: string, password: string): Promise<boolean> {
    const exts = this.getExtensions();
    const ext = exts.find(e => e.id === extId);
    
    if (!ext || ext.password !== password) {
      return false;
    }
    
    this.setSession('extension', extId);
    return true;
  },

  getExtensions(): Extension[] {
    try {
      const data = localStorage.getItem(K.EXT);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  },

  isAdmin(): boolean {
    const ses = this.getSession();
    return ses?.role === 'admin';
  },

  isExtension(): boolean {
    const ses = this.getSession();
    return ses?.role === 'extension';
  },

  getCurrentExtId(): string | undefined {
    const ses = this.getSession();
    return ses?.extId;
  }
};

export const AuthService = SecureStore;
