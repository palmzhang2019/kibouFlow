/** PostgreSQL: undefined_table / undefined object */
export function isMissingRelationError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const code = (e as { code?: string }).code;
  return code === "42P01";
}
