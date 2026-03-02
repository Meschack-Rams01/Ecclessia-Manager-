import type { SettingsRepository } from "../../application";
import { K } from "../../app/constants";
import type { Settings } from "../../app/state";
import { readJson, writeJson } from "./LocalStorageJson";

const DEFAULT_SETTINGS: Settings = { nom: "Emerge in Christ", adminPw: "admin123", socialPct: 10 };

export class LocalStorageSettingsRepository implements SettingsRepository {
  async get(): Promise<Settings> {
    return readJson<Settings>(K.SET, DEFAULT_SETTINGS);
  }

  async save(settings: Settings): Promise<void> {
    writeJson(K.SET, settings);
  }
}

