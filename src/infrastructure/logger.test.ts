import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger, type LogEvent } from "./logger";

describe("logger", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("should log debug events", () => {
    logger.debug("test event", { key: "value" });
    expect(consoleSpy).toHaveBeenCalled();
    const logged = consoleSpy.mock.calls[0][0] as LogEvent;
    expect(logged.level).toBe("debug");
    expect(logged.event).toBe("test event");
    expect(logged.context).toEqual({ key: "value" });
    expect(logged.ts).toBeDefined();
  });

  it("should log info events", () => {
    logger.info("info event");
    expect(consoleSpy).toHaveBeenCalled();
    const logged = consoleSpy.mock.calls[0][0] as LogEvent;
    expect(logged.level).toBe("info");
    expect(logged.event).toBe("info event");
  });

  it("should log warn events", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logger.warn("warning event");
    expect(warnSpy).toHaveBeenCalled();
    const logged = warnSpy.mock.calls[0][0] as LogEvent;
    expect(logged.level).toBe("warn");
    warnSpy.mockRestore();
  });

  it("should log error events", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("test error");
    logger.error("error event", error, { extra: "data" });
    expect(errorSpy).toHaveBeenCalled();
    const logged = errorSpy.mock.calls[0][0] as LogEvent;
    expect(logged.level).toBe("error");
    expect(logged.event).toBe("error event");
    expect(logged.error).toBe(error);
    expect(logged.context).toEqual({ extra: "data" });
    errorSpy.mockRestore();
  });

  it("should include timestamp in ISO format", () => {
    logger.info("timestamp test");
    const logged = consoleSpy.mock.calls[0][0] as LogEvent;
    expect(logged.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
