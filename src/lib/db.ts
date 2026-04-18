import postgres from "postgres";

const globalForPg = globalThis as unknown as { pgSql: postgres.Sql | undefined };

/**
 * 共享 PostgreSQL 连接（`postgres.js`）。
 * 使用 `DATABASE_URL`（例如 `postgresql://user:pass@127.0.0.1:5432/kibouflow`）。
 */
export function getPg(): postgres.Sql | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!globalForPg.pgSql) {
    globalForPg.pgSql = postgres(url, {
      max: 8,
      idle_timeout: 30,
      connect_timeout: 10,
    });
  }
  return globalForPg.pgSql;
}

export function isPgConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getMissingDatabaseEnv(): string[] {
  if (!process.env.DATABASE_URL?.trim()) return ["DATABASE_URL"];
  return [];
}
