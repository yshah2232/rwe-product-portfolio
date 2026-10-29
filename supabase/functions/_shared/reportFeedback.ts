import { z } from 'npm:zod@4.6.6';

// Strict allowlist: do not accept report contents or visitor identifiers.
export const ReportFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).default(''),
}).strict();