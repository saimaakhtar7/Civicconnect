/**
 * Recursively removes all undefined properties from an object, which Firestore rejects.
 * Optional fields with undefined values are omitted completely.
 */
export function removeUndefined<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  const cleaned = {} as any;
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    // Recursively clean plain objects, ignoring null, arrays, and Dates
    if (
      value !== null &&
      typeof value === "object" &&
      !(value instanceof Date) &&
      !Array.isArray(value)
    ) {
      cleaned[key] = removeUndefined(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}
