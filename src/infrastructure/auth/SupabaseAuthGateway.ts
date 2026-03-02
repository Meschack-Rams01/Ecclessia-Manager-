import { getSupabaseClient } from "../supabase/client";
import { logger } from "../logger";

export type UserRole = "admin" | "extension";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  extensionId?: string; // For extension users, the extension they belong to
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Supabase Auth Gateway with role mapping.
 *
 * Roles are stored in user metadata:
 * - admin: full access to all extensions and admin features
 * - extension: limited to their assigned extension
 *
 * The extension_id is stored in the user's app_metadata or raw_user_meta_data
 */
export class SupabaseAuthGateway {
  private readonly client = getSupabaseClient();

  /**
   * Sign in with email/password using Supabase Auth
   */
  async signInWithPassword(email: string, password: string): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      
      if (error || !data.user) {
        logger.warn("auth.signInFailed", { email, error: error?.message });
        return { session: null, error: new Error(error?.message || "Authentication failed") };
      }

      const user = data.user;
      // Try to get role from metadata, with fallback based on email pattern
      // You can set proper metadata later via SQL or Supabase CLI
      let role: UserRole = (user.user_metadata?.role as UserRole) || "extension";
      
      // Simple fallback: emails containing "admin" = admin role
      if (email.toLowerCase().includes("admin")) {
        role = "admin";
      }
      
      const extensionId = user.user_metadata?.extension_id as string | undefined;

      // Map Supabase user to our AuthUser
      const authUser: AuthUser = {
        id: user.id,
        email: user.email || email,
        role,
        extensionId,
      };

      const session: AuthSession = {
        user: authUser,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };

      logger.info("auth.signInSuccess", { userId: user.id, role });
      return { session, error: null };
    } catch (err) {
      logger.error("auth.signInException", err, { email });
      return { session: null, error: err as Error };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.client.auth.signOut();
      if (error) {
        logger.warn("auth.signOutFailed", { error: error.message });
        return { error: new Error(error.message) };
      }
      logger.info("auth.signOutSuccess");
      return { error: null };
    } catch (err) {
      logger.error("auth.signOutException", err);
      return { error: err as Error };
    }
  }

  /**
   * Get current session from Supabase
   */
  async getSession(): Promise<{ session: AuthSession | null; error: Error | null }> {
    try {
      const { data, error } = await this.client.auth.getSession();
      
      if (error || !data.session) {
        return { session: null, error: error ? new Error(error.message) : null };
      }

      const user = data.session.user;
      const role = (user.user_metadata?.role as UserRole) || "extension";
      const extensionId = user.user_metadata?.extension_id as string | undefined;

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || "",
        role,
        extensionId,
      };

      const session: AuthSession = {
        user: authUser,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      };

      return { session, error: null };
    } catch (err) {
      return { session: null, error: err as Error };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    const handler = this.client.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        callback(null);
        return;
      }

      const user = session.user;
      const role = (user.user_metadata?.role as UserRole) || "extension";
      const extensionId = user.user_metadata?.extension_id as string | undefined;

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || "",
        role,
        extensionId,
      };

      callback({
        user: authUser,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
      });
    });

    return () => handler.data.subscription.unsubscribe();
  }

  /**
   * Check if user has admin role
   */
  isAdmin(session: AuthSession | null): boolean {
    return session?.user.role === "admin";
  }

  /**
   * Check if user has extension role and belongs to specific extension
   */
  canAccessExtension(session: AuthSession | null, extensionId: string): boolean {
    if (!session) return false;
    if (session.user.role === "admin") return true;
    return session.user.extensionId === extensionId;
  }
}

// Singleton instance
let _gateway: SupabaseAuthGateway | null = null;

export function getAuthGateway(): SupabaseAuthGateway {
  if (!_gateway) {
    _gateway = new SupabaseAuthGateway();
  }
  return _gateway;
}
