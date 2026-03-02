import { describe, it, expect } from "vitest";
import { validateString, validateNumber, ok, fail, mergeResults } from "./validation";

describe("validation", () => {
  describe("validateString", () => {
    it("should return ok for valid string", () => {
      const result = validateString("name", "John");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("John");
      }
    });

    it("should trim whitespace", () => {
      const result = validateString("name", "  John  ");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("John");
      }
    });

    it("should fail for empty string when min is 1", () => {
      const result = validateString("name", "", { min: 1 });
      expect(result.ok).toBe(false);
    });

    it("should fail when string is shorter than min", () => {
      const result = validateString("name", "ab", { min: 3 });
      expect(result.ok).toBe(false);
    });

    it("should fail when string is longer than max", () => {
      const result = validateString("name", "abcdef", { max: 3 });
      expect(result.ok).toBe(false);
    });

    it("should convert non-string to string", () => {
      const result = validateString("num", 123);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("123");
      }
    });
  });

  describe("validateNumber", () => {
    it("should return ok for valid number", () => {
      const result = validateNumber("age", 25);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(25);
      }
    });

    it("should convert string to number", () => {
      const result = validateNumber("age", "25");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(25);
      }
    });

    it("should fail for non-numeric string", () => {
      const result = validateNumber("age", "abc");
      expect(result.ok).toBe(false);
    });

    it("should fail when below min", () => {
      const result = validateNumber("age", 5, { min: 18 });
      expect(result.ok).toBe(false);
    });

    it("should fail when above max", () => {
      const result = validateNumber("age", 150, { max: 120 });
      expect(result.ok).toBe(false);
    });

    it("should fail for non-integer when integer required", () => {
      const result = validateNumber("count", 5.5, { integer: true });
      expect(result.ok).toBe(false);
    });

    it("should pass for integer when integer required", () => {
      const result = validateNumber("count", 5, { integer: true });
      expect(result.ok).toBe(true);
    });
  });

  describe("ok/fail", () => {
    it("ok should wrap value in success result", () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it("fail should wrap error in failure result", () => {
      const result = fail<number>({ path: "field", message: "error" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toHaveLength(1);
      }
    });

    it("fail should handle array of errors", () => {
      const errors = [
        { path: "a", message: "error1" },
        { path: "b", message: "error2" },
      ];
      const result = fail<number>(errors);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors).toHaveLength(2);
      }
    });
  });

  describe("mergeResults", () => {
    it("should merge multiple ok results", () => {
      const results = {
        name: ok("John"),
        age: ok(25),
      };
      const merged = mergeResults(results);
      expect(merged.ok).toBe(true);
      if (merged.ok) {
        expect(merged.value).toEqual({ name: "John", age: 25 });
      }
    });

    it("should collect errors from failed results", () => {
      const results = {
        name: ok("John"),
        age: fail<number>({ path: "age", message: "too young" }),
      };
      const merged = mergeResults(results);
      expect(merged.ok).toBe(false);
      if (!merged.ok) {
        expect(merged.errors).toHaveLength(1);
      }
    });
  });
});
