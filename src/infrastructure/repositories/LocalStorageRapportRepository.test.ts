import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStorageRapportRepository } from "./LocalStorageRapportRepository";
import { K } from "../../app/constants";
import type { Rapport } from "../../app/state";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("LocalStorageRapportRepository", () => {
  let repo: LocalStorageRapportRepository;

  const mockRapport: Rapport = {
    id: "rap_1",
    extensionId: "ext_1",
    date: "2024-01-01",
    theme: "Test Theme",
    heureDebut: "09:00",
    heureFin: "12:00",
    moderateur: "Test Moderator",
    predicateur: "Test Preacher",
    interprete: "",
    textes: "John 3:16",
    effectif: {
      papas: 10,
      mamans: 15,
      freres: 8,
      soeurs: 12,
      enfants: 5,
      total: 50,
    },
    offrandes: {
      ordinaires: [{ montant: 100, devise: "EUR", tauxChange: 1 }],
      orateur: [{ montant: 50, devise: "EUR", tauxChange: 1 }],
      dimes: [{ montant: 30, devise: "EUR", tauxChange: 1 }],
      actionsGrace: [{ montant: 20, devise: "EUR", tauxChange: 1 }],
      total: 200,
    },
    depenses: [],
    totalDepenses: 0,
    soldeFinal: 200,
    nouveaux: [],
    signatures: {
      secretaire: "Secretary",
      tresorier: "Treasurer",
      pasteur: "Pastor",
    },
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    localStorageMock.clear();
    repo = new LocalStorageRapportRepository();
  });

  describe("list", () => {
    it("should return empty array when no rapports exist", async () => {
      const result = await repo.list();
      expect(result).toEqual([]);
    });

    it("should return all rapports when extId is not provided", async () => {
      const rapports = [mockRapport, { ...mockRapport, id: "rap_2", extensionId: "ext_2" }];
      localStorageMock.setItem(K.RAP, JSON.stringify(rapports));

      const result = await repo.list();
      expect(result).toHaveLength(2);
    });

    it("should filter rapports by extensionId when provided", async () => {
      const rapports = [
        mockRapport,
        { ...mockRapport, id: "rap_2", extensionId: "ext_2" },
        { ...mockRapport, id: "rap_3", extensionId: "ext_1" },
      ];
      localStorageMock.setItem(K.RAP, JSON.stringify(rapports));

      const result = await repo.list("ext_1");
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.extensionId === "ext_1")).toBe(true);
    });
  });

  describe("get", () => {
    it("should return null when rapport does not exist", async () => {
      const result = await repo.get("nonexistent");
      expect(result).toBeNull();
    });

    it("should return rapport when it exists", async () => {
      localStorageMock.setItem(K.RAP, JSON.stringify([mockRapport]));

      const result = await repo.get("rap_1");
      expect(result).toEqual(mockRapport);
    });
  });

  describe("upsert", () => {
    it("should insert new rapport", async () => {
      await repo.upsert(mockRapport);

      const stored = JSON.parse(localStorageMock.getItem(K.RAP) || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0]).toEqual(mockRapport);
    });

    it("should update existing rapport", async () => {
      localStorageMock.setItem(K.RAP, JSON.stringify([mockRapport]));

      const updated = { ...mockRapport, theme: "Updated Theme" };
      await repo.upsert(updated);

      const stored = JSON.parse(localStorageMock.getItem(K.RAP) || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].theme).toBe("Updated Theme");
    });

    it("should handle multiple rapports correctly", async () => {
      await repo.upsert(mockRapport);
      await repo.upsert({ ...mockRapport, id: "rap_2" });

      const stored = JSON.parse(localStorageMock.getItem(K.RAP) || "[]");
      expect(stored).toHaveLength(2);
    });
  });

  describe("delete", () => {
    it("should delete existing rapport", async () => {
      localStorageMock.setItem(K.RAP, JSON.stringify([mockRapport]));

      await repo.delete("rap_1");

      const stored = JSON.parse(localStorageMock.getItem(K.RAP) || "[]");
      expect(stored).toHaveLength(0);
    });

    it("should handle deleting non-existent rapport gracefully", async () => {
      localStorageMock.setItem(K.RAP, JSON.stringify([mockRapport]));

      await repo.delete("nonexistent");

      const stored = JSON.parse(localStorageMock.getItem(K.RAP) || "[]");
      expect(stored).toHaveLength(1);
    });
  });
});
