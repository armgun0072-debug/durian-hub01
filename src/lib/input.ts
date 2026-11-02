export function positiveId(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

// Decimal(10,2), or Decimal(12,2) for quantities. Reject booleans and Infinity.
export function positiveDecimal(value: unknown, max = 99999999.99): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= max &&
    Math.abs(number * 100 - Math.round(number * 100)) < 0.00001 ? number : null;
}
