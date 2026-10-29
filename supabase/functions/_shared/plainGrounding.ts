/** Reject newly invented quantities; this does not certify prose or clinical meaning. */
export function supportedNumbers(text: string, source: unknown): boolean {
  const numbers = (value: string) => value.replace(/(\d),(?=\d{3}\b)/g, '$1').match(/\d+(?:\.\d+)?/g) ?? [];
  const known = new Set(numbers(JSON.stringify(source)));
  return numbers(text).every((number) => known.has(number));
}

export function enrollmentStatement(count: unknown, type: unknown): string | null {
  if (typeof count !== 'number' || !Number.isFinite(count)) return null;
  return type === 'ACTUAL' ? `${count} participants reported as actual enrollment` : type === 'ESTIMATED' ? `${count} participants planned as estimated enrollment` : `${count} participants listed; actual or estimated enrollment is not specified`;
}