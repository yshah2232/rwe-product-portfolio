// Safe-language guard for the AI document review. Pure TS, unit tested.

export const REVIEW_DISCLAIMER =
  "This review cannot confirm eligibility. Verify the original trial record and speak with the study team or a qualified healthcare professional.";

export const ALLOWED_MIME = /^(application\/pdf|image\/(png|jpe?g|webp|gif)|text\/plain|text\/markdown|text\/csv)$/i;

// Phrases that must never appear in review output.
const BANNED = [
  /\b(?:likely|probably|possibly|potentially)\s+(?:not\s+)?(?:eligible|qualif(?:y|ies|ied))\b/gi,
  /\bnot\s+(?:eligible|qualified)\b/gi,
  /\bineligible\b/gi,
  /\beligible\b/gi,
  /\bqualif(?:y|ies|ied)\b/gi,
  /\brecommended\s+trial\b/gi,
  /\b(?:should|must)\s+(?:enroll|join|apply)\b/gi,
  /\bgood\s+(?:fit|candidate)\b/gi,
];

/** Returns true when the text contains any banned verdict wording. */
export function hasBannedLanguage(text: string): boolean {
  return BANNED.some((re) => { re.lastIndex = 0; return re.test(text); });
}

/** Drops any sentence containing banned wording; returns the remaining text. */
export function sanitizeReviewText(text: string): string {
  const sentences = String(text ?? "").split(/(?<=[.!?])\s+/);
  return sentences.filter((s) => s.trim() && !hasBannedLanguage(s)).join(" ").trim();
}
