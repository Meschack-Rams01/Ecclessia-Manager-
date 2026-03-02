export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEvent = {
  level: LogLevel;
  event: string;
  message?: string;
  context?: Record<string, unknown>;
  error?: unknown;
  ts: string;
};

/**
 * Minimal structured logger.
 *
 * - In production, replace console with a remote log sink.
 * - Keep payload JSON-friendly.
 */
export const logger = {
  debug(event: string, context?: Record<string, unknown>) {
    emit({ level: "debug", event, context });
  },
  info(event: string, context?: Record<string, unknown>) {
    emit({ level: "info", event, context });
  },
  warn(event: string, context?: Record<string, unknown>) {
    emit({ level: "warn", event, context });
  },
  error(event: string, error?: unknown, context?: Record<string, unknown>) {
    emit({ level: "error", event, error, context });
  },
};

function emit(partial: Omit<LogEvent, "ts">) {
  const payload: LogEvent = { ...partial, ts: new Date().toISOString() };
  const fn = payload.level === "error" ? console.error : payload.level === "warn" ? console.warn : console.log;
  fn(payload);
}

