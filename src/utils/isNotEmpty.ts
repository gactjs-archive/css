/**
 * Determines if the provided object has any properties set on it.
 */
export function isNotEmpty(obj: object): boolean {
  return Object.keys(obj).length > 0;
}
