import { randomBytes } from 'node:crypto';
import { ApiError, GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';
import { z } from 'zod';
import { config } from '../config/env.js';
import { RISK_BANDS, RISK_LEVELS, SCAM_TYPES } from '../config/constants.js';
import { buildAnalyzeSystemPrompt, buildAnalyzeUserPrompt } from '../prompts/analyze.prompt.js';
import { buildExplainSystemPrompt, buildExplainUserPrompt } from '../prompts/explain.prompt.js';
import { analyzeResponseSchema, explainResponseSchema } from '../prompts/responseSchemas.js';
import { AppError } from '../utils/AppError.js';
import { localized } from '../utils/localizedText.js';

const LIMITS = {
  flag: 120,
  evidence: 500,
  flagExplanation: 500,
  summary: 300,
  explanation: 2000,
  listItem: 300,
  redFlags: 10,
  listItems: 10,
};

// Scam content (threats, sextortion, abuse) must reach the model to be analysed,
// so only block content the model rates as high-harm.
const SAFETY_SETTINGS = [
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
].map((category) => ({ category, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }));

let client;
function getClient() {
  if (!config.gemini.apiKey) {
    throw AppError.serviceUnavailable(
      'AI analysis is not configured on the server. Please try again later.',
      'AI_NOT_CONFIGURED',
    );
  }
  client ??= new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return client;
}

const newNonce = () => randomBytes(8).toString('hex');

function mapGeminiError(err) {
  if (err instanceof AppError) return err;
  const status = err instanceof ApiError ? err.status : undefined;

  if (status === 429) {
    return new AppError(429, 'The AI service is busy. Please try again in a minute.', 'AI_RATE_LIMITED');
  }
  if ((status === 400 || status === 401 || status === 403) && /api[ _-]?key|permission|unauthori[sz]ed/i.test(err.message)) {
    console.error('[gemini] authentication failed — check GEMINI_API_KEY');
    return AppError.serviceUnavailable(
      'AI analysis is not configured on the server. Please try again later.',
      'AI_NOT_CONFIGURED',
    );
  }
  console.error(`[gemini] request failed (status ${status ?? 'n/a'}): ${err.message}`);
  return AppError.serviceUnavailable(
    'The AI service is unavailable right now. Please try again in a moment.',
    'AI_UNAVAILABLE',
  );
}

const isRetryable = (err) =>
  !(err instanceof AppError) && (!(err instanceof ApiError) || err.status >= 500);

async function generateJson({ systemInstruction, parts, responseSchema }) {
  const ai = getClient();
  const request = {
    model: config.gemini.model,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.2,
      safetySettings: SAFETY_SETTINGS,
      httpOptions: { timeout: config.gemini.timeoutMs },
    },
  };

  let response;
  for (let attempt = 1; ; attempt += 1) {
    try {
      response = await ai.models.generateContent(request);
      break;
    } catch (err) {
      if (attempt >= 2 || !isRetryable(err)) throw mapGeminiError(err);
    }
  }

  const text = response.text;
  if (!text) {
    const reason = response.promptFeedback?.blockReason ?? response.candidates?.[0]?.finishReason;
    console.warn(`[gemini] empty response (reason: ${reason ?? 'unknown'})`);
    throw AppError.unprocessable(
      'We could not analyse this content. Please try a clearer screenshot or paste the message text.',
      'AI_NO_RESULT',
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error('[gemini] response was not valid JSON');
    throw AppError.serviceUnavailable(
      'The AI service returned an unexpected answer. Please try again.',
      'AI_BAD_RESPONSE',
    );
  }
}

// ---------------------------------------------------------------------------
// Output validation & normalisation
// ---------------------------------------------------------------------------

const looseString = z.string().catch('');
const looseStringList = z.array(z.unknown()).catch([]);

const aiRedFlag = z.object({
  flag: looseString,
  evidence: looseString,
  explanation: looseString,
});

const aiAnalysis = z.object({
  is_readable: z.boolean().catch(true),
  error_reason: looseString,
  extracted_text: looseString,
  risk_level: z.enum(RISK_LEVELS).catch('suspicious'),
  risk_score: z.coerce.number().catch(50),
  scam_type: z.enum(SCAM_TYPES).catch('other'),
  red_flags: z.array(z.unknown()).catch([]),
  summary: looseString,
  explanation: looseString,
  actions: looseStringList,
  safe_reasons: looseStringList,
});

const aiExplanation = z.object({
  summary: looseString,
  explanation: looseString,
  red_flags: z.array(z.unknown()).catch([]),
  actions: looseStringList,
});

const clip = (value, max) => Array.from(String(value ?? '').trim()).slice(0, max).join('');

function cleanList(items) {
  return items
    .filter((item) => typeof item === 'string')
    .map((item) => clip(item, LIMITS.listItem))
    .filter(Boolean)
    .slice(0, LIMITS.listItems);
}

function cleanRedFlags(items) {
  return items
    .map((item) => aiRedFlag.safeParse(item))
    .filter((result) => result.success)
    .map(({ data }) => ({
      flag: clip(data.flag, LIMITS.flag),
      evidence: clip(data.evidence, LIMITS.evidence),
      explanation: clip(data.explanation, LIMITS.flagExplanation),
    }))
    .filter((flag) => flag.flag && flag.explanation)
    .slice(0, LIMITS.redFlags);
}

function clampToBand(score, riskLevel) {
  const { min, max } = RISK_BANDS[riskLevel];
  const rounded = Number.isFinite(score) ? Math.round(score) : Math.round((min + max) / 2);
  return Math.min(max, Math.max(min, rounded));
}

export function normaliseAnalysis(raw, language) {
  const data = aiAnalysis.parse(raw ?? {});
  const riskLevel = data.risk_level;

  let scamType = data.scam_type;
  if (riskLevel === 'safe') scamType = 'none';
  else if (scamType === 'none') scamType = 'other';

  let actions = cleanList(data.actions);
  if (actions.length === 0) {
    actions = riskLevel === 'safe' ? [localized(language, 'safeAction')] : localized(language, 'scamActions');
  }

  const summary = clip(data.summary, LIMITS.summary)
    || (riskLevel === 'safe' ? localized(language, 'safeAction') : actions[0]);

  return {
    extracted_text: data.extracted_text.trim(),
    risk_level: riskLevel,
    risk_score: clampToBand(data.risk_score, riskLevel),
    scam_type: scamType,
    red_flags: cleanRedFlags(data.red_flags),
    summary,
    explanation: clip(data.explanation, LIMITS.explanation),
    actions,
    safe_reasons: cleanList(data.safe_reasons),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyses a suspicious message given as text and/or an in-memory image.
 * The image buffer is sent to Gemini only and is never written anywhere.
 */
export async function analyzeMessage({ text, image, language }) {
  const nonce = newNonce();
  const parts = [];

  if (image) {
    parts.push({ inlineData: { mimeType: image.mimetype, data: image.buffer.toString('base64') } });
  }
  parts.push({ text: buildAnalyzeUserPrompt({ text, hasImage: Boolean(image), nonce }) });

  const raw = await generateJson({
    systemInstruction: buildAnalyzeSystemPrompt(language, nonce),
    parts,
    responseSchema: analyzeResponseSchema,
  });

  const readable = raw?.is_readable !== false;
  const hasContent = typeof raw?.extracted_text === 'string' && raw.extracted_text.trim().length > 0;

  if (image && !text && (!readable || !hasContent)) {
    const reason = typeof raw?.error_reason === 'string' ? clip(raw.error_reason, 300) : '';
    throw AppError.unprocessable(reason || localized(language, 'unreadableImage'), 'UNREADABLE_IMAGE');
  }

  return normaliseAnalysis(raw, language);
}

/**
 * Re-explains an existing scan in another language without changing the verdict.
 */
export async function explainScan(scan, language) {
  const nonce = newNonce();
  const raw = await generateJson({
    systemInstruction: buildExplainSystemPrompt(language, nonce),
    parts: [{ text: buildExplainUserPrompt({ scan, nonce }) }],
    responseSchema: explainResponseSchema,
  });

  const data = aiExplanation.parse(raw ?? {});
  const translatedFlags = cleanRedFlags(data.red_flags);
  const originalFlags = Array.isArray(scan.red_flags) ? scan.red_flags : [];

  // Evidence must stay an exact quote, so always take it from the stored scan.
  const redFlags = originalFlags.map((original, index) => ({
    flag: translatedFlags[index]?.flag || original.flag,
    evidence: original.evidence,
    explanation: translatedFlags[index]?.explanation || original.explanation,
  }));

  let actions = cleanList(data.actions);
  if (actions.length === 0) {
    actions = scan.risk_level === 'safe' ? [localized(language, 'safeAction')] : localized(language, 'scamActions');
  }

  return {
    summary: clip(data.summary, LIMITS.summary) || scan.summary,
    explanation: clip(data.explanation, LIMITS.explanation) || scan.explanation,
    red_flags: redFlags,
    actions,
  };
}
