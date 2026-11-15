import "server-only";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}
