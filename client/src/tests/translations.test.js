import test from 'node:test';
import assert from 'node:assert/strict';
import { t, TRANSLATIONS } from '../utils/translations.js';
import { getScamTypeLabel, getScamTypeBadgeClass, SCAM_TYPES } from '../utils/scamTypeLabels.js';
import { CBI_DIGITAL_ARREST_DEMO, getDemoWordStream } from '../utils/demoCallScript.js';

test('translations provide consistent UI strings in English, Hindi and Kannada', () => {
  const keys = ['appTitle', 'tagline', 'getStarted', 'liveCallGuard', 'checkMessage', 'call1930'];

  for (const key of keys) {
    const enText = t(key, 'en');
    const hiText = t(key, 'hi');
    const knText = t(key, 'kn');

    assert.ok(enText && typeof enText === 'string', `English translation for ${key} must exist`);
    assert.ok(hiText && typeof hiText === 'string', `Hindi translation for ${key} must exist`);
    assert.ok(knText && typeof knText === 'string', `Kannada translation for ${key} must exist`);
    assert.notEqual(enText, hiText, `Hindi should differ from English for ${key}`);
    assert.notEqual(enText, knText, `Kannada should differ from English for ${key}`);
  }
});

test('getScamTypeLabel provides localized names for all critical Indian scams', () => {
  const scamTypes = ['digital_arrest', 'electricity_bill', 'bank_kyc', 'part_time_job'];

  for (const type of scamTypes) {
    const enLabel = getScamTypeLabel(type, 'en');
    const hiLabel = getScamTypeLabel(type, 'hi');
    const knLabel = getScamTypeLabel(type, 'kn');

    assert.ok(enLabel, `English label for ${type} should exist`);
    assert.ok(hiLabel, `Hindi label for ${type} should exist`);
    assert.ok(knLabel, `Kannada label for ${type} should exist`);
  }
});

test('getScamTypeBadgeClass returns proper badge styling', () => {
  const redBadge = getScamTypeBadgeClass('digital_arrest');
  assert.ok(redBadge.includes('bg-red-100'));

  const amberBadge = getScamTypeBadgeClass('electricity_bill');
  assert.ok(amberBadge.includes('bg-amber-100'));
});

test('demoCallScript contains structured CBI Digital Arrest phrases', () => {
  assert.ok(CBI_DIGITAL_ARREST_DEMO.length >= 4, 'Demo script should have multiple dialogue stages');
  const words = getDemoWordStream();
  assert.ok(words.length > 50, 'Word stream should contain comprehensive realistic speech');
  assert.ok(words.some(w => w.toLowerCase().includes('digital') || w.toLowerCase().includes('arrest')));
});
