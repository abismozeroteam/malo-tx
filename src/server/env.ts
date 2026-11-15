import "server-only";

/** Reads a required env var. Throws without revealing any value. */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}
