import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  escapeHtml,
  validateInput,
  InputValidation,
} from "./security";

// Mock crypto for Node.js environment
beforeAll(() => {
  if (typeof crypto === "undefined") {
    Object.defineProperty(global, "crypto", {
      value: {
        subtle: {
          digest: vi.fn(async (algorithm: string, data: ArrayBuffer) => {
            // Simple mock hash for testing
            const bytes = new Uint8Array(data);
            const hash = new Uint8Array(32);
            for (let i = 0; i < 32; i++) {
              hash[i] = bytes[i % bytes.length] ^ i;
            }
            return hash.buffer;
          }),
        },
        getRandomValues: vi.fn((array: Uint8Array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
          return array;
        }),
      },
    });
  }
});

describe("security", () => {
  describe("hashPassword", () => {
    it("should return consistent hash for same password", async () => {
      const password = "testPassword123";
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).toBe(hash2);
    });

    it("should return different hashes for different passwords", async () => {
      const hash1 = await hashPassword("password1");
      const hash2 = await hashPassword("password2");
      expect(hash1).not.toBe(hash2);
    });

    it("should return a 64-character hex string", async () => {
      const hash = await hashPassword("test");
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("verifyPassword", () => {
    it("should return true for correct password", async () => {
      const password = "correctPassword";
      const hash = await hashPassword(password);
      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it("should return false for incorrect password", async () => {
      const hash = await hashPassword("correctPassword");
      const result = await verifyPassword("wrongPassword", hash);
      expect(result).toBe(false);
    });
  });

  describe("generateSessionToken", () => {
    it("should return a 64-character hex string", () => {
      const token = generateSessionToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should return different tokens on each call", () => {
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("escapeHtml", () => {
    it("should escape ampersand", () => {
      expect(escapeHtml("&")).toBe("&amp;");
    });

    it("should escape less than", () => {
      expect(escapeHtml("<")).toBe("&lt;");
    });

    it("should escape greater than", () => {
      expect(escapeHtml(">")).toBe("&gt;");
    });

    it("should escape double quote", () => {
      expect(escapeHtml('"')).toBe("&quot;");
    });

    it("should escape single quote", () => {
      expect(escapeHtml("'")).toBe("&#039;");
    });

    it("should escape multiple characters", () => {
      const input = '<script>alert("XSS")</script>';
      const expected =
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;";
      expect(escapeHtml(input)).toBe(expected);
    });
  });

  describe("validateInput", () => {
    it("should return false for empty string", () => {
      expect(validateInput("")).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(validateInput(null as unknown as string)).toBe(false);
      expect(validateInput(undefined as unknown as string)).toBe(false);
    });

    it("should return false for strings exceeding maxLength", () => {
      const longString = "a".repeat(501);
      expect(validateInput(longString)).toBe(false);
    });

    it("should return false for script tags", () => {
      expect(validateInput("<script>alert('xss')</script>")).toBe(false);
    });

    it("should return false for javascript: protocol", () => {
      expect(validateInput("javascript:alert('xss')")).toBe(false);
    });

    it("should return false for event handlers", () => {
      expect(validateInput("onclick=alert('xss')")).toBe(false);
    });

    it("should return true for safe input", () => {
      expect(validateInput("Hello World")).toBe(true);
      expect(validateInput("Test 123")).toBe(true);
    });

    it("should respect custom maxLength", () => {
      expect(validateInput("test", 2)).toBe(false);
      expect(validateInput("test", 10)).toBe(true);
    });
  });

  describe("InputValidation", () => {
    describe("required", () => {
      it("should return true for non-empty string", () => {
        expect(InputValidation.required("test")).toBe(true);
      });

      it("should return false for empty string", () => {
        expect(InputValidation.required("")).toBe(false);
      });

      it("should return false for whitespace only", () => {
        expect(InputValidation.required("   ")).toBe(false);
      });
    });

    describe("email", () => {
      it("should return true for valid email", () => {
        expect(InputValidation.email("test@example.com")).toBe(true);
        expect(InputValidation.email("user.name@domain.co.uk")).toBe(true);
      });

      it("should return false for invalid email", () => {
        expect(InputValidation.email("invalid")).toBe(false);
        expect(InputValidation.email("@example.com")).toBe(false);
        expect(InputValidation.email("test@")).toBe(false);
        expect(InputValidation.email("")).toBe(false);
      });
    });

    describe("positiveNumber", () => {
      it("should return true for positive numbers", () => {
        expect(InputValidation.positiveNumber(1)).toBe(true);
        expect(InputValidation.positiveNumber(0.5)).toBe(true);
      });

      it("should return false for zero and negative", () => {
        expect(InputValidation.positiveNumber(0)).toBe(false);
        expect(InputValidation.positiveNumber(-1)).toBe(false);
      });
    });

    describe("date", () => {
      it("should return true for valid ISO date", () => {
        expect(InputValidation.date("2024-01-01")).toBe(true);
        expect(InputValidation.date("2024-12-31")).toBe(true);
      });

      it("should return false for invalid date format", () => {
        expect(InputValidation.date("01-01-2024")).toBe(false);
        expect(InputValidation.date("2024/01/01")).toBe(false);
        expect(InputValidation.date("invalid")).toBe(false);
      });
    });

    describe("maxLength", () => {
      it("should return true when within limit", () => {
        expect(InputValidation.maxLength("test", 10)).toBe(true);
      });

      it("should return false when exceeding limit", () => {
        expect(InputValidation.maxLength("test", 2)).toBe(false);
      });
    });
  });
});
