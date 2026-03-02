import type { RapportRepository } from "../../application";
import type { Rapport } from "../../app/state";
import { getSupabaseClient } from "../supabase/client";
import type { JsonRow } from "../supabase/types";

export class SupabaseRapportRepository implements RapportRepository {
  private readonly client = getSupabaseClient();

  async list(extId?: string | null): Promise<Rapport[]> {
    // NOTE: current table stores full object in JSON. For filtering/pagination, we will later
    // migrate key fields (extension_id, date) into real columns.
    const { data, error } = await this.client.from("rapports").select("id,data");
    if (error) throw error;
    const all = ((data || []) as JsonRow<Rapport>[]).map((r) => r.data).filter(Boolean);
    return extId ? all.filter((r) => r.extensionId === extId) : all;
  }

  async get(id: string): Promise<Rapport | null> {
    const { data, error } = await this.client.from("rapports").select("id,data").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data as JsonRow<Rapport> | null)?.data ?? null;
  }

  async upsert(rap: Rapport): Promise<void> {
    const { error } = await this.client.from("rapports").upsert(
      {
        id: rap.id,
        extension_id: rap.extensionId,
        date: rap.date,
        data: rap,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from("rapports").delete().eq("id", id);
    if (error) throw error;
  }
}

