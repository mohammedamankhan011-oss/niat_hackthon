import test from 'node:test';
import assert from 'node:assert/strict';
import { t, TRANSLATIONS } from '../utils/translations.js';
import { getScamTypeLabel, getScamTypeBadgeClass, SCAM_TYPES } from '../utils/scamTypeLabels.js';
import { CBI_DIGITAL_ARREST_DEMO, getDemoWordStream } from '../utils/demoCallScript.js';
import {
  buildCybercrimeComplaint,
  buildPaymentStatusLine,
  buildFamilyWhatsAppWarning
} from '../utils/complaintBuilder.js';

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
  const scamTypes = [
    'kyc_bank',
    'job_task',
    'digital_arrest',
    'lottery_prize',
    'investment_trading',
    'upi_payment_request',
    'delivery_courier',
    'loan_app',
    'electricity_bill',
    'impersonation',
    'phishing_link',
    'sextortion',
    'other',
    'none'
  ];

  for (const type of scamTypes) {
    assert.ok(SCAM_TYPES[type], `SCAM_TYPES must contain ${type}`);
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

test('buildCybercrimeComplaint builds ready-made complaint in English, Hindi, and Kannada with payment checkbox toggle', () => {
  const sampleScan = {
    id: 'scan_test_01',
    input_type: 'text',
    created_at: '2026-11-14T10:30:00.000Z',
    risk_level: 'scam',
    risk_score: 96,
    scam_type: 'kyc_bank',
    summary: 'Phishing attack mimicking State Bank of India.',
    explanation: 'SBI never sends .example links via SMS.',
    identifiers: {
      phones: ['+910000000001'],
      upi_ids: ['kyc.refund.demo@oksbi'],
      urls: ['sbi-kyc-update.example']
    },
    red_flags: [
      {
        flag: 'Fake Phishing Link',
        evidence: 'sbi-kyc-update.example',
        explanation: 'Suspicious domain.'
      }
    ]
  };

  const enComplaintNoLoss = buildCybercrimeComplaint({
    scan: sampleScan,
    language: 'en',
    lostMoney: false
  });
  assert.ok(enComplaintNoLoss.includes('Bank KYC Scam'));
  assert.ok(enComplaintNoLoss.includes('+910000000001'));
  assert.ok(enComplaintNoLoss.includes('kyc.refund.demo@oksbi'));
  assert.ok(enComplaintNoLoss.includes('sbi-kyc-update.example'));
  assert.ok(enComplaintNoLoss.includes('Fake Phishing Link'));
  assert.ok(enComplaintNoLoss.includes('I did not share any OTP or make any payment'));

  const enComplaintLossBlank = buildCybercrimeComplaint({
    scan: sampleScan,
    language: 'en',
    lostMoney: true,
    lostAmount: ''
  });
  assert.ok(enComplaintLossBlank.includes('I lost money: Rs ____'));

  const enComplaintLossAmount = buildCybercrimeComplaint({
    scan: sampleScan,
    language: 'en',
    lostMoney: true,
    lostAmount: '5000'
  });
  assert.ok(enComplaintLossAmount.includes('I lost money: Rs 5000'));

  const hiComplaint = buildCybercrimeComplaint({
    scan: sampleScan,
    language: 'hi',
    lostMoney: false
  });
  assert.ok(hiComplaint.includes('बैंक केवाईसी धोखा'));

  const knComplaint = buildCybercrimeComplaint({
    scan: sampleScan,
    language: 'kn',
    lostMoney: false
  });
  assert.ok(knComplaint.includes('ಬ್ಯಾಂಕ್ ಕೆವೈಸಿ ವಂಚನೆ'));

  const waLink = buildFamilyWhatsAppWarning({ scan: sampleScan, language: 'en' });
  assert.ok(waLink.startsWith('https://wa.me/?text='));
});
