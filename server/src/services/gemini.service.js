import { randomBytes } from 'node:crypto';
import { ApiError, GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';
import { z } from 'zod';
import { config } from '../config/env.js';
import { RISK_BANDS, RISK_LEVELS, SCAM_TYPES } from '../config/constants.js';
import { buildAnalyzeSystemPrompt, buildAnalyzeUserPrompt } from '../prompts/analyze.prompt.js';
import {
  buildLiveCallSystemPrompt,
  buildLiveCallUserPrompt,
  buildTranscribeSystemPrompt,
  buildTranscribeUserPrompt,
} from '../prompts/call.prompt.js';
import { buildExplainSystemPrompt, buildExplainUserPrompt } from '../prompts/explain.prompt.js';
import {
  analyzeResponseSchema,
  explainResponseSchema,
  liveCallResponseSchema,
  transcribeResponseSchema,
} from '../prompts/responseSchemas.js';
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

// Overload (5xx), rate limits (429), timeouts and network errors are worth
// another attempt; bad requests and auth errors are not.
const isRetryable = (err) =>
  !(err instanceof AppError)
  && (!(err instanceof ApiError) || err.status >= 500 || err.status === 429);

// A quick "busy" answer (as opposed to a timeout) usually clears within seconds.
const isQuickRejection = (err) =>
  err instanceof ApiError && (err.status === 429 || err.status === 503);

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });
const BUSY_RETRY_DELAY_MS = 1500;

// When a model's quota is used up (e.g. a free-tier daily limit), skip it until
// Google's suggested retry time (checked again at least hourly) instead of
// spending a round-trip on it for every request.
const MAX_COOLDOWN_MS = 60 * 60 * 1000;
const cooldownUntil = new Map();

function noteRateLimit(model, err) {
  if (!(err instanceof ApiError) || err.status !== 429) return;
  const match = /"retryDelay":\s*"(\d+(?:\.\d+)?)s"/.exec(String(err.message));
  const delayMs = match ? Number(match[1]) * 1000 : 30_000;
  cooldownUntil.set(model, Date.now() + Math.min(delayMs, MAX_COOLDOWN_MS));
  console.warn(`[gemini] ${model} quota exhausted, skipping it for ${Math.round(Math.min(delayMs, MAX_COOLDOWN_MS) / 1000)}s`);
}

const isCoolingDown = (model) => (cooldownUntil.get(model) ?? 0) > Date.now();

// Configured models (primary first, then fallbacks), skipping any whose quota
// is used up. If every model is cooling down, try them all anyway.
function modelOrder() {
  const configured = [...new Set([config.gemini.model, ...config.gemini.fallbackModels])];
  const available = configured.filter((model) => !isCoolingDown(model));
  return available.length > 0 ? available : configured;
}

// Upper bound on how long one AI answer may take across all attempts.
const TOTAL_BUDGET_MS = 50_000;
const MIN_ATTEMPT_MS = 3_000;

async function generateJson({ systemInstruction, parts, responseSchema }) {
  const ai = getClient();
  // Each available model is tried once, in order. If the last one was rejected
  // as busy, the first model that still has quota gets one more try after a
  // short pause. Everything stays within TOTAL_BUDGET_MS.
  const order = modelOrder();
  const queue = [...order];
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let busyRetryUsed = false;
  let lastError;
  let response;

  while (queue.length > 0) {
    const model = queue.shift();
    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_MS) break;

    try {
      response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.2,
          safetySettings: SAFETY_SETTINGS,
          httpOptions: { timeout: Math.min(config.gemini.timeoutMs, remaining) },
        },
      });
      break;
    } catch (err) {
      lastError = err;
      noteRateLimit(model, err);
      if (!isRetryable(err)) throw mapGeminiError(err);

      if (queue.length === 0 && !busyRetryUsed && isQuickRejection(err)) {
        busyRetryUsed = true;
        const retryModel = order.find((candidate) => !isCoolingDown(candidate));
        if (retryModel) {
          await wait(BUSY_RETRY_DELAY_MS);
          queue.push(retryModel);
        }
      }
      if (queue.length > 0) {
        const status = err instanceof ApiError ? err.status : 'network/timeout';
        console.warn(`[gemini] ${model} failed (${status}), retrying with ${queue[0]}`);
      }
    }
  }

  if (!response) {
    throw mapGeminiError(lastError ?? new Error('AI request time budget exhausted'));
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

// ScamShield must never promise that something is safe.
const CERTAINTY_CLAIM =
  /100\s*%|100 percent|\b(completely|totally|absolutely|definitely|perfectly|guaranteed|certainly)\b.{0,25}\b(safe|genuine|legitimate|harmless)\b|\b(safe|genuine)\b.{0,10}\bguaranteed\b|पूरी तरह (से )?सुरक्षित|बिल्कुल सुरक्षित|ಸಂಪೂರ್ಣ(ವಾಗಿ)? ಸುರಕ್ಷಿತ/i;

export const claimsCertainty = (text) => CERTAINTY_CLAIM.test(text);

function withoutCertaintySentences(text) {
  return text
    .split(/(?<=[.!?।])\s+/)
    .filter((sentence) => !claimsCertainty(sentence))
    .join(' ');
}

/**
 * Low-risk results: strip any "100% safe" style promise and always lead the
 * actions with "looks safe, still verify on the official app".
 */
function enforceSafeWording(result, language) {
  const safeLine = localized(language, 'safeAction');
  return {
    ...result,
    summary: !result.summary || claimsCertainty(result.summary) ? safeLine : result.summary,
    explanation: withoutCertaintySentences(result.explanation),
    actions: [safeLine, ...result.actions.filter((a) => a !== safeLine && !claimsCertainty(a))]
      .slice(0, LIMITS.listItems),
  };
}

export function normaliseAnalysis(raw, language) {
  const data = aiAnalysis.parse(raw ?? {});
  const riskLevel = data.risk_level;

  let scamType = data.scam_type;
  if (riskLevel === 'safe') scamType = 'none';
  else if (scamType === 'none') scamType = 'other';

  let actions = cleanList(data.actions);
  if (actions.length === 0 && riskLevel !== 'safe') {
    actions = localized(language, 'scamActions');
  }

  const result = {
    extracted_text: data.extracted_text.trim(),
    risk_level: riskLevel,
    risk_score: clampToBand(data.risk_score, riskLevel),
    scam_type: scamType,
    red_flags: cleanRedFlags(data.red_flags),
    summary: clip(data.summary, LIMITS.summary) || actions[0] || '',
    explanation: clip(data.explanation, LIMITS.explanation),
    actions,
    safe_reasons: cleanList(data.safe_reasons),
  };

  return riskLevel === 'safe' ? enforceSafeWording(result, language) : result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyses a suspicious message given as text and/or an in-memory image.
 * The image buffer is sent to Gemini only and is never written anywhere.
 */
export async function analyzeMessage({ text, image, language, source = 'message' }) {
  const nonce = newNonce();
  const parts = [];

  if (image) {
    parts.push({ inlineData: { mimeType: image.mimetype, data: image.buffer.toString('base64') } });
  }
  parts.push({ text: buildAnalyzeUserPrompt({ text, hasImage: Boolean(image), nonce, source }) });

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
  if (actions.length === 0 && scan.risk_level !== 'safe') {
    actions = localized(language, 'scamActions');
  }

  const result = {
    summary: clip(data.summary, LIMITS.summary) || scan.summary,
    explanation: clip(data.explanation, LIMITS.explanation) || scan.explanation,
    red_flags: redFlags,
    actions,
  };
  return scan.risk_level === 'safe' ? enforceSafeWording(result, language) : result;
}

// ---------------------------------------------------------------------------
// Live Call Guard
// ---------------------------------------------------------------------------

const aiLiveCall = z.object({
  risk_level: z.enum(RISK_LEVELS).catch('suspicious'),
  risk_score: z.coerce.number().catch(50),
  scam_type: z.enum(SCAM_TYPES).catch('other'),
  triggers: z.array(z.unknown()).catch([]),
  advice: looseString,
  say_this: looseString,
});

const aiTrigger = z.object({ phrase: looseString, why: looseString });

/**
 * Real-time verdict on a partial call transcript. Nothing is stored.
 */
export async function analyzeLiveCall({ transcript, language }) {
  const nonce = newNonce();
  const raw = await generateJson({
    systemInstruction: buildLiveCallSystemPrompt(language, nonce),
    parts: [{ text: buildLiveCallUserPrompt({ transcript, nonce }) }],
    responseSchema: liveCallResponseSchema,
  });

  const data = aiLiveCall.parse(raw ?? {});
  const riskLevel = data.risk_level;

  let scamType = data.scam_type;
  if (riskLevel === 'safe') scamType = 'none';
  else if (scamType === 'none') scamType = 'other';

  const triggers = data.triggers
    .map((item) => aiTrigger.safeParse(item))
    .filter((result) => result.success)
    .map(({ data: t }) => ({ phrase: clip(t.phrase, 200), why: clip(t.why, 300) }))
    .filter((t) => t.phrase && t.why)
    .slice(0, 8);

  const fallbackAdvice = {
    safe: 'liveSafeAdvice',
    suspicious: 'liveSuspiciousAdvice',
    scam: 'liveScamAdvice',
  }[riskLevel];

  const advice = clip(data.advice, 400);

  return {
    risk_level: riskLevel,
    risk_score: clampToBand(data.risk_score, riskLevel),
    scam_type: scamType,
    triggers,
    advice: advice && !claimsCertainty(advice) ? advice : localized(language, fallbackAdvice),
    say_this:
      clip(data.say_this, 300)
      || localized(language, riskLevel === 'safe' ? 'liveSafeSayThis' : 'liveScamSayThis'),
  };
}

const aiTranscribe = z.object({
  transcript: looseString,
  has_speech: z.boolean().catch(false),
  detected_language: looseString,
});

/**
 * Transcribes an incoming audio chunk or recording using Gemini.
 * Audio is kept strictly in-memory and never written to disk.
 */
export async function transcribeAudio({ audio, language = 'en' }) {
  if (!audio || !audio.buffer || audio.buffer.length === 0) {
    return { transcript: '', has_speech: false, detected_language: language };
  }

  const nonce = newNonce();
  const rawMime = (audio.mimetype || 'audio/webm').toLowerCase().split(';')[0].trim();
  const supportedMimes = ['audio/webm', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/mp3', 'audio/m4a', 'audio/aac'];
  const mimeType = supportedMimes.includes(rawMime) ? rawMime : 'audio/webm';

  const parts = [
    { inlineData: { mimeType, data: audio.buffer.toString('base64') } },
    { text: buildTranscribeUserPrompt({ nonce }) },
  ];

  try {
    const raw = await generateJson({
      systemInstruction: buildTranscribeSystemPrompt(language, nonce),
      parts,
      responseSchema: transcribeResponseSchema,
    });

    const parsed = aiTranscribe.parse(raw ?? {});
    return {
      transcript: clip(parsed.transcript, 4000),
      has_speech: parsed.has_speech || parsed.transcript.trim().length > 0,
      detected_language: parsed.detected_language || language,
    };
  } catch (err) {
    console.warn('[gemini] audio transcription failed:', err.message);
    throw err;
  }
}

/**
 * Transcribes an audio recording and runs live call scam analysis on it.
 */
export async function analyzeAudioWithGemini({ audio, language = 'en' }) {
  const { transcript, has_speech } = await transcribeAudio({ audio, language });
  if (!has_speech || !transcript) {
    return {
      transcript: '',
      has_speech: false,
      analysis: {
        risk_level: 'safe',
        risk_score: 0,
        scam_type: 'none',
        triggers: [],
        advice: localized(language, 'liveSafeAdvice'),
        say_this: localized(language, 'liveSafeSayThis'),
      },
    };
  }

  const analysis = await analyzeLiveCall({ transcript, language });
  return { transcript, has_speech: true, analysis };
}
