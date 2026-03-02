import type { SessionRepository } from "../../application";
import { K } from "../../app/constants";
import type { Session } from "../../app/state";
import { readJson, writeJson } from "./LocalStorageJson";

export class LocalStorageSessionRepository implements SessionRepository {
  async get(): Promise<Session | null> {
    return readJson<Session | null>(K.SES, null);
  }

  async set(session: Session): Promise<void> {
    writeJson(K.SES, session);
  }

  async clear(): Promise<void> {
    localStorage.removeItem(K.SES);
  }
}

