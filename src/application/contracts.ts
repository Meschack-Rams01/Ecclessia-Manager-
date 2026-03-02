import type { Extension } from "../app/constants";
import type { Rapport, Settings, Session } from "../app/state";

export interface ExtensionRepository {
  list(): Promise<Extension[]>;
  get(id: string): Promise<Extension | null>;
  upsert(ext: Extension): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface RapportRepository {
  list(extId?: string | null): Promise<Rapport[]>;
  get(id: string): Promise<Rapport | null>;
  upsert(rap: Rapport): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
}

export interface SessionRepository {
  get(): Promise<Session | null>;
  set(session: Session): Promise<void>;
  clear(): Promise<void>;
}

