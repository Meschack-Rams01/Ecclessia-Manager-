import type { ExtensionRepository } from "../../application";
import type { Extension } from "../../app/constants";
import { getSupabaseClient } from "../supabase/client";
import type { JsonRow } from "../supabase/types";

export class SupabaseExtensionRepository implements ExtensionRepository {
  private readonly client = getSupabaseClient();

  async list(): Promise<Extension[]> {
    const { data, error } = await this.client.from("extensions").select("id,data,password");
    if (error) throw error;
    return ((data || []) as JsonRow<Extension>[]).map((r) => r.data).filter(Boolean);
  }

  async get(id: string): Promise<Extension | null> {
    const { data, error } = await this.client.from("extensions").select("id,data,password").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as JsonRow<Extension> | null)?.data ?? null;
  }

  async upsert(ext: Extension): Promise<void> {
    const { error } = await this.client.from("extensions").upsert({ id: ext.id, data: ext, password: ext.password }, { onConflict: "id" });
    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("extensions").delete().eq("id", id);
    if (error) throw error;
  }
}

