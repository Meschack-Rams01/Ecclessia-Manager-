import { describe, it, expect } from "vitest";
import { ok, err, type Result } from "./result";

describe("Result", () => {
  describe("ok", () => {
    it("should create a successful result with value", () => {
      const result: Result<string> = ok("success");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("success");
      }
    });

    it("should work with objects", () => {
      const data = { id: "123", name: "Test" };
      const result = ok(data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(data);
      }
    });
  });

  describe("err", () => {
    it("should create an error result", () => {
      const error = { code: "NOT_FOUND", message: "Item not found" };
      const result: Result<never> = err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NOT_FOUND");
        expect(result.error.message).toBe("Item not found");
      }
    });

    it("should include cause when provided", () => {
      const cause = new Error("Original error");
      const error = { code: "INTERNAL", message: "Failed", cause };
      const result = err(error);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.cause).toBe(cause);
      }
    });
  });
});
