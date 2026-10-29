export const MAPPING_TERMS_VERSION = '2026-10-27';
export const MAPPING_BODY_BYTES = 8192;
export const MAPPING_HOURLY_LIMIT = 5;

export function parseMappingSubmission(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !['fieldType', 'rawValue', 'suggestedClean', 'note', 'acceptance'].includes(key))) return null;
  const acceptance = body.acceptance as Record<string, unknown> | undefined;
  if (acceptance?.accepted !== true || acceptance.termsVersion !== MAPPING_TERMS_VERSION || !['clinical', 'patient'].includes(String(acceptance.audience))) return null;
  const fieldType = body.fieldType;
  const rawValue = typeof body.rawValue === 'string' ? body.rawValue.trim() : '';
  const suggestedClean = typeof body.suggestedClean === 'string' ? body.suggestedClean.trim() : '';
  if (typeof fieldType !== 'string' || !['sponsor', 'indication', 'asset'].includes(fieldType)) return null;
  if (!rawValue || rawValue.length > 300 || suggestedClean.length < 2 || suggestedClean.length > 200) return null;
  if (body.note !== undefined && typeof body.note !== 'string') return null;
  const note = typeof body.note === 'string' ? body.note.trim() : null;
  if (note && note.length > 500) return null;
  return { fieldType, rawValue, suggestedClean, note: note || null };
}