import { describe, it, expect } from "vitest";
import { newId } from "./newId";

describe("newId", () => {
  it("should generate an id with the given prefix", () => {
    const id = newId("ext");
    expect(id.startsWith("ext_")).toBe(true);
  });

  it("should generate unique ids", () => {
    const id1 = newId("rap");
    const id2 = newId("rap");
    expect(id1).not.toBe(id2);
  });

  it("should work with different prefixes", () => {
    const extId = newId("ext");
    const rapId = newId("rap");
    const userId = newId("user");

    expect(extId.startsWith("ext_")).toBe(true);
    expect(rapId.startsWith("rap_")).toBe(true);
    expect(userId.startsWith("user_")).toBe(true);
  });

  it("should generate valid UUID format when crypto.randomUUID is available", () => {
    const id = newId("test");
    // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
    const parts = id.split("_");
    if (parts.length === 2) {
      // Using crypto UUID
      expect(parts[1]).toMatch(uuidRegex);
    }
  });
});
