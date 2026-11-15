import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../api/endpoints.js';
import { mockBackend, analyzeLiveCallHeuristic } from '../api/mocks.js';
import { t } from '../utils/translations.js';

test('api.calls.transcribeAudio transcribes English, Hindi, and Kannada audio chunks', async () => {
  // Mock audio buffer
  const fakeAudioBlob = { size: 4096, type: 'audio/webm' };

  // English
  const enRes = await api.calls.transcribeAudio({
    audioBlob: fakeAudioBlob,
    language: 'en'
  });
  assert.ok(enRes.transcript);
  assert.equal(enRes.has_speech, true);
  assert.equal(enRes.detected_language, 'en');
  assert.ok(enRes.transcript.includes('Crime Branch') || enRes.transcript.includes('Aadhaar'));

  // Hindi
  const hiRes = await api.calls.transcribeAudio({
    audioBlob: fakeAudioBlob,
    language: 'hi'
  });
  assert.ok(hiRes.transcript);
  assert.equal(hiRes.has_speech, true);
  assert.equal(hiRes.detected_language, 'hi');
  assert.ok(hiRes.transcript.includes('क्राइम ब्रांच') || hiRes.transcript.includes('पार्सल'));

  // Kannada
  const knRes = await api.calls.transcribeAudio({
    audioBlob: fakeAudioBlob,
    language: 'kn'
  });
  assert.ok(knRes.transcript);
  assert.equal(knRes.has_speech, true);
  assert.equal(knRes.detected_language, 'kn');
  assert.ok(knRes.transcript.includes('ಕ್ರೈಮ್ ಬ್ರಾಂಚ್') || knRes.transcript.includes('ಪಾರ್ಸೆಲ್'));
});

test('api.calls.transcribeAudio ignores empty or silent audio chunks', async () => {
  const emptyBlob = { size: 0, type: 'audio/webm' };
  const res = await api.calls.transcribeAudio({
    audioBlob: emptyBlob,
    language: 'en'
  });
  assert.equal(res.transcript, '');
  assert.equal(res.has_speech, false);
});

test('api.calls.analyzeAudio performs complete post-call scam analysis on uploaded audio file', async () => {
  const fakeAudioFile = {
    name: 'digital_arrest_call.mp3',
    size: 524288,
    type: 'audio/mpeg'
  };

  const res = await api.calls.analyzeAudio({
    audioFile: fakeAudioFile,
    language: 'en',
    save: true
  });

  assert.ok(res.transcript);
  assert.equal(res.has_speech, true);
  assert.ok(res.analysis);
  assert.equal(res.analysis.risk_level, 'scam');
  assert.equal(res.analysis.scam_type, 'digital_arrest');
  assert.ok(res.analysis.risk_score >= 80);
  assert.ok(res.scan);
  assert.ok(res.scan.id.startsWith('scan_audio_'));
  assert.equal(res.scan.input_type, 'call');
});

test('Live call heuristic detects urgent scam threats across multi-lingual spoken keywords', () => {
  // Police / Digital Arrest
  const digitalArrestCall = analyzeLiveCallHeuristic(
    'This is Crime Branch Inspector Rajesh. Narcotics found in parcel under your Aadhaar. Connect on Skype for digital arrest.',
    'en'
  );
  assert.equal(digitalArrestCall.risk_level, 'scam');
  assert.equal(digitalArrestCall.scam_type, 'digital_arrest');
  assert.ok(digitalArrestCall.triggers.length >= 2);
  assert.ok(digitalArrestCall.say_this.includes('police station'));

  // Hindi Digital Arrest advice
  const hiCall = analyzeLiveCallHeuristic(
    'सीबीआई अधिकारी बोल रहा हूँ। पार्सल में एमडीएमए ड्रग्स मिला है। डिजिटल अरेस्ट वारंट जारी हुआ है।',
    'hi'
  );
  assert.equal(hiCall.risk_level, 'scam');
  assert.ok(hiCall.say_this && hiCall.say_this.length > 0);

  // Bank OTP / AnyDesk remote access
  const bankOtpCall = analyzeLiveCallHeuristic(
    'Your bank KYC is expiring. Please install AnyDesk and share the 6 digit OTP immediately.',
    'en'
  );
  assert.equal(bankOtpCall.risk_level, 'scam');
  assert.ok(bankOtpCall.triggers.some(t => t.phrase.includes('remote app') || t.phrase.includes('OTP')));

  // Safe normal conversation
  const safeCall = analyzeLiveCallHeuristic(
    'Hello mom, I reached Bangalore safely and will be home by dinner time.',
    'en'
  );
  assert.equal(safeCall.risk_level, 'safe');
  assert.ok(safeCall.risk_score <= 30);
});

test('Second-device monitoring and 12-state translations are verified', () => {
  const languages = ['en', 'hi', 'kn'];
  const keys = [
    'secondDeviceTitle',
    'secondDeviceDesc',
    'diagnosticTitle',
    'uploadCallAudio',
    'stateInitializing',
    'stateActive',
    'stateSpeechDetected',
    'stateScamDetected',
    'stateNoAudio',
    'stateCallAudioInaccessible'
  ];

  for (const lang of languages) {
    for (const key of keys) {
      const translation = t(key, lang);
      assert.ok(translation && typeof translation === 'string', `Translation for ${key} in ${lang} must exist`);
      assert.ok(translation.length > 3, `Translation for ${key} in ${lang} must be meaningful`);
    }
  }
});
