import { Type } from '@google/genai';
import { RISK_LEVELS, SCAM_TYPES } from '../config/constants.js';

const redFlagSchema = {
  type: Type.OBJECT,
  properties: {
    flag: { type: Type.STRING, description: 'Short name of the red flag' },
    evidence: { type: Type.STRING, description: 'Exact quote from the message' },
    explanation: { type: Type.STRING, description: 'One simple sentence in the chosen language' },
  },
  required: ['flag', 'evidence', 'explanation'],
  propertyOrdering: ['flag', 'evidence', 'explanation'],
};

export const analyzeResponseSchema = {
  type: Type.OBJECT,
  properties: {
    is_readable: { type: Type.BOOLEAN },
    error_reason: { type: Type.STRING },
    extracted_text: { type: Type.STRING },
    risk_level: { type: Type.STRING, format: 'enum', enum: RISK_LEVELS },
    risk_score: { type: Type.INTEGER, minimum: 0, maximum: 100 },
    scam_type: { type: Type.STRING, format: 'enum', enum: SCAM_TYPES },
    red_flags: { type: Type.ARRAY, items: redFlagSchema },
    summary: { type: Type.STRING },
    explanation: { type: Type.STRING },
    actions: { type: Type.ARRAY, items: { type: Type.STRING } },
    safe_reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    'is_readable',
    'error_reason',
    'extracted_text',
    'risk_level',
    'risk_score',
    'scam_type',
    'red_flags',
    'summary',
    'explanation',
    'actions',
    'safe_reasons',
  ],
  propertyOrdering: [
    'is_readable',
    'error_reason',
    'extracted_text',
    'risk_level',
    'risk_score',
    'scam_type',
    'red_flags',
    'summary',
    'explanation',
    'actions',
    'safe_reasons',
  ],
};

export const liveCallResponseSchema = {
  type: Type.OBJECT,
  properties: {
    risk_level: { type: Type.STRING, format: 'enum', enum: RISK_LEVELS },
    risk_score: { type: Type.INTEGER, minimum: 0, maximum: 100 },
    scam_type: { type: Type.STRING, format: 'enum', enum: SCAM_TYPES },
    triggers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phrase: { type: Type.STRING, description: 'Exact short quote from the transcript' },
          why: { type: Type.STRING, description: 'One simple sentence in the chosen language' },
        },
        required: ['phrase', 'why'],
        propertyOrdering: ['phrase', 'why'],
      },
    },
    advice: { type: Type.STRING },
    say_this: { type: Type.STRING },
  },
  required: ['risk_level', 'risk_score', 'scam_type', 'triggers', 'advice', 'say_this'],
  propertyOrdering: ['risk_level', 'risk_score', 'scam_type', 'triggers', 'advice', 'say_this'],
};

export const transcribeResponseSchema = {
  type: Type.OBJECT,
  properties: {
    transcript: { type: Type.STRING, description: 'Verbatim transcription in the spoken language or script' },
    has_speech: { type: Type.BOOLEAN, description: 'True if recognizable speech is detected, false if silence, static or background noise' },
    detected_language: { type: Type.STRING, description: 'Detected language code (en, hi, kn, or other)' },
  },
  required: ['transcript', 'has_speech'],
  propertyOrdering: ['transcript', 'has_speech', 'detected_language'],
};

export const explainResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    explanation: { type: Type.STRING },
    red_flags: { type: Type.ARRAY, items: redFlagSchema },
    actions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['summary', 'explanation', 'red_flags', 'actions'],
  propertyOrdering: ['summary', 'explanation', 'red_flags', 'actions'],
};
