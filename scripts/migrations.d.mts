export function readMigrations(dir?: string): Promise<{ name: string; statements: string[] }[]>;
