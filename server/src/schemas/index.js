import { z } from 'zod';
import {
  LANGUAGES,
  MAX_CALL_TRANSCRIPT_LENGTH,
  MAX_INPUT_TEXT_LENGTH,
  MAX_LIVE_TRANSCRIPT_LENGTH,
  REPORTABLE_SCAM_TYPES,
  SCAM_TYPE_ALIASES,
} from '../config/constants.js';

const language = z.enum(LANGUAGES, { error: 'Language must be one of: en, hi, kn' });

const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long')
  .pipe(z.email('Enter a valid email address'));

export const idParams = z.object({
  id: z.uuid('Invalid id'),
});

// ---------------------------------------------------------------------------
// Auth & users
// ---------------------------------------------------------------------------

export const signupBody = z.object({
  name: z.string({ error: 'Name is required' }).trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email,
  password: z
    .string({ error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be at most 72 characters'),
  preferred_language: language.default('en'),
});

export const loginBody = z.object({
  email,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required').max(200),
});

export const updateMeBody = z.object({
  preferred_language: language,
});

// ---------------------------------------------------------------------------
// Scans
// ---------------------------------------------------------------------------

// multipart/form-data fields arrive as strings.
export const createScanBody = z.object({
  text: z
    .string()
    .max(MAX_INPUT_TEXT_LENGTH, `Text must be at most ${MAX_INPUT_TEXT_LENGTH} characters`)
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : undefined)),
  language: language.optional(),
});

export const listScansQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const explainBody = z.object({
  language,
});

// ---------------------------------------------------------------------------
// Guardians
// ---------------------------------------------------------------------------

export const inviteGuardianBody = z.object({
  email,
});

// ---------------------------------------------------------------------------
// Live Call Guard
// ---------------------------------------------------------------------------

const transcript = (max) =>
  z
    .string({ error: 'Transcript is required' })
    .trim()
    .min(1, 'Transcript is empty')
    .max(max, `Transcript must be at most ${max} characters`);

export const analyzeCallBody = z.object({
  transcript: transcript(MAX_LIVE_TRANSCRIPT_LENGTH),
  language: language.optional(),
});

export const saveCallBody = z.object({
  transcript: transcript(MAX_CALL_TRANSCRIPT_LENGTH),
  language: language.optional(),
});

// ---------------------------------------------------------------------------
// Community database
// ---------------------------------------------------------------------------

const identifierValue = z
  .string({ error: 'Enter a phone number, UPI ID or website link' })
  .trim()
  .min(1, 'Enter a phone number, UPI ID or website link')
  .max(2048, 'Value is too long');

export const lookupQuery = z.object({
  value: identifierValue,
});

export const reportBody = z.object({
  value: identifierValue,
  // Accepts the API's scam types and the web client's names (e.g. "bank_kyc").
  scam_type: z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return 'other';
      if (typeof v !== 'string') return v;
      const key = v.trim().toLowerCase();
      return SCAM_TYPE_ALIASES[key] ?? key;
    },
    z.enum(REPORTABLE_SCAM_TYPES, { error: 'Unknown scam type' }),
  ),
});
