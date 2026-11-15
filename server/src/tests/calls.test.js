import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTranscribeSystemPrompt, buildTranscribeUserPrompt } from '../prompts/call.prompt.js';
import { transcribeResponseSchema, liveCallResponseSchema } from '../prompts/responseSchemas.js';

test('buildTranscribeSystemPrompt generates secure prompt with untrusted data boundary and language selection', () => {
  const nonce = 'testnonce123';
  const enPrompt = buildTranscribeSystemPrompt('en', nonce);
  assert.ok(enPrompt.includes('ScamShield Live Audio Transcriber'));
  assert.ok(enPrompt.includes('UNTRUSTED DATA'));
  assert.ok(enPrompt.includes('English'));
  assert.ok(enPrompt.includes(nonce));

  const hiPrompt = buildTranscribeSystemPrompt('hi', nonce);
  assert.ok(hiPrompt.includes('Hindi'));
  assert.ok(hiPrompt.includes('Devanagari'));

  const knPrompt = buildTranscribeSystemPrompt('kn', nonce);
  assert.ok(knPrompt.includes('Kannada'));
});

test('buildTranscribeUserPrompt isolates spoken input with nonce token', () => {
  const nonce = 'sec456';
  const userPrompt = buildTranscribeUserPrompt({ nonce });
  assert.ok(userPrompt.includes('<<<SECURITY_TOKEN_sec456>>>'));
  assert.ok(userPrompt.includes('JSON'));
});

test('transcribeResponseSchema validates JSON response structure with required fields', () => {
  assert.equal(transcribeResponseSchema.type, 'OBJECT');
  assert.ok(transcribeResponseSchema.properties.transcript);
  assert.ok(transcribeResponseSchema.properties.has_speech);
  assert.ok(transcribeResponseSchema.properties.detected_language);
  assert.deepEqual(transcribeResponseSchema.required, ['transcript', 'has_speech']);
});

test('liveCallResponseSchema ensures triggers, risk_level, score and say_this are required', () => {
  assert.equal(liveCallResponseSchema.type, 'OBJECT');
  assert.ok(liveCallResponseSchema.required.includes('triggers'));
  assert.ok(liveCallResponseSchema.required.includes('risk_level'));
  assert.ok(liveCallResponseSchema.required.includes('say_this'));
  assert.ok(liveCallResponseSchema.required.includes('advice'));
});
