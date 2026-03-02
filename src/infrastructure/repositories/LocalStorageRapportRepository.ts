import type { RapportRepository } from "../../application";
import type { Rapport } from "../../app/state";
import { K } from "../../app/constants";
import { readJson, writeJson } from "./LocalStorageJson";

export class LocalStorageRapportRepository implements RapportRepository {
  async list(extId?: string | null): Promise<Rapport[]> {
    const all = readJson<Rapport[]>(K.RAP, []);
    return extId ? all.filter((r) => r.extensionId === extId) : all;
  }

  async get(id: string): Promise<Rapport | null> {
    const all = readJson<Rapport[]>(K.RAP, []);
    return all.find((r) => r.id === id) ?? null;
  }

  async upsert(rap: Rapport): Promise<void> {
    const all = readJson<Rapport[]>(K.RAP, []);
    const idx = all.findIndex((r) => r.id === rap.id);
    if (idx >= 0) all[idx] = rap;
    else all.push(rap);
    writeJson(K.RAP, all);
  }

  async delete(id: string): Promise<void> {
    const all = readJson<Rapport[]>(K.RAP, []);
    writeJson(
      K.RAP,
      all.filter((r) => r.id !== id),
    );
  }
}

