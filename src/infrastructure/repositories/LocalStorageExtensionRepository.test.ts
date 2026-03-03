import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStorageExtensionRepository } from "./LocalStorageExtensionRepository";
import { K, DEF_EXTS, type Extension } from "../../app/constants";

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

describe("LocalStorageExtensionRepository", () => {
  let repo: LocalStorageExtensionRepository;

  const mockExtension: Extension = {
    id: "ext_test",
    nom: "Test Extension",
    couleur: "#8B5CF6",
    ville: "Test City",
    pays: "Test Country",
    adresse: "123 Test Street",
    dateCreation: "2024-01-01",
    pasteur: {
      nom: "Test Pastor",
      email: "pastor@test.com",
      tel: "+1234567890",
    },
    coordinateur: "Test Coordinator",
    secretaire: "Test Secretary",
    tresorier: "Test Treasurer",
    devise: "EUR",
    symbole: "€",
  };

  beforeEach(() => {
    localStorageMock.clear();
    repo = new LocalStorageExtensionRepository();
  });

  describe("list", () => {
    it("should return default extensions when localStorage is empty", async () => {
      const result = await repo.list();
      expect(result).toEqual(DEF_EXTS);
    });

    it("should return stored extensions when available", async () => {
      const extensions = [mockExtension];
      localStorageMock.setItem(K.EXT, JSON.stringify(extensions));

      const result = await repo.list();
      expect(result).toEqual(extensions);
    });
  });

  describe("get", () => {
    it("should return null when extension does not exist", async () => {
      const result = await repo.get("nonexistent");
      expect(result).toBeNull();
    });

    it("should return extension from defaults when not in storage", async () => {
      const result = await repo.get("ext_nic");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("ext_nic");
    });

    it("should return extension from storage when available", async () => {
      localStorageMock.setItem(K.EXT, JSON.stringify([mockExtension]));

      const result = await repo.get("ext_test");
      expect(result).toEqual(mockExtension);
    });
  });

  describe("upsert", () => {
    it("should insert new extension", async () => {
      await repo.upsert(mockExtension);

      const stored = JSON.parse(localStorageMock.getItem(K.EXT) || "[]");
      // Should include defaults + new extension
      expect(stored.length).toBeGreaterThanOrEqual(1);
      expect(stored.some((e: Extension) => e.id === mockExtension.id)).toBe(true);
    });

    it("should update existing extension", async () => {
      localStorageMock.setItem(K.EXT, JSON.stringify([mockExtension]));

      const updated = { ...mockExtension, nom: "Updated Extension" };
      await repo.upsert(updated);

      const stored = JSON.parse(localStorageMock.getItem(K.EXT) || "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].nom).toBe("Updated Extension");
    });

    it("should add to existing extensions", async () => {
      localStorageMock.setItem(K.EXT, JSON.stringify([mockExtension]));

      const newExt = { ...mockExtension, id: "ext_new" };
      await repo.upsert(newExt);

      const stored = JSON.parse(localStorageMock.getItem(K.EXT) || "[]");
      expect(stored).toHaveLength(2);
    });
  });

  describe("delete", () => {
    it("should delete existing extension", async () => {
      localStorageMock.setItem(K.EXT, JSON.stringify([mockExtension]));

      await repo.delete("ext_test");

      const stored = JSON.parse(localStorageMock.getItem(K.EXT) || "[]");
      expect(stored).toHaveLength(0);
    });

    it("should handle deleting non-existent extension gracefully", async () => {
      localStorageMock.setItem(K.EXT, JSON.stringify([mockExtension]));

      await repo.delete("nonexistent");

      const stored = JSON.parse(localStorageMock.getItem(K.EXT) || "[]");
      expect(stored).toHaveLength(1);
    });
  });
});
