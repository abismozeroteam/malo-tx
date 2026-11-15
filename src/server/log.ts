import "server-only";

export const logFailure = (action: string, error: unknown) =>
  console.error(`[${action}] failed:`, error instanceof Error ? error.message : "unknown error");
