import type { ExtensionRepository } from "../../application";
import { DEF_EXTS, K, type Extension } from "../../app/constants";
import { readJson, writeJson } from "./LocalStorageJson";

export class LocalStorageExtensionRepository implements ExtensionRepository {
  async list(): Promise<Extension[]> {
    return readJson<Extension[]>(K.EXT, DEF_EXTS);
  }

  async get(id: string): Promise<Extension | null> {
    const all = readJson<Extension[]>(K.EXT, DEF_EXTS);
    return all.find((e) => e.id === id) ?? null;
  }

  async upsert(ext: Extension): Promise<void> {
    const all = readJson<Extension[]>(K.EXT, DEF_EXTS);
    const idx = all.findIndex((e) => e.id === ext.id);
    if (idx >= 0) all[idx] = ext;
    else all.push(ext);
    writeJson(K.EXT, all);
  }

  async delete(id: string): Promise<void> {
    const all = readJson<Extension[]>(K.EXT, DEF_EXTS);
    writeJson(
      K.EXT,
      all.filter((e) => e.id !== id),
    );
  }
}

