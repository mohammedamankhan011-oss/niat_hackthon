import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeContentHeuristic,
  analyzeLiveCallHeuristic,
  extractIdentifiers,
  mockBackend
} from '../api/mocks.js';

test('extractIdentifiers extracts Indian phone numbers, UPIs and phishing URLs', () => {
  const sample = "Call +91 00000 00001 or 0000000002 or pay kyc.update.sbi@demoupi via https://sbi-kyc-verify.example/login";
  const result = extractIdentifiers(sample);

  assert.ok(result.phones.some(p => p.includes('00000')), 'Should extract phone numbers');
  assert.ok(result.upi_ids.includes('kyc.update.sbi@demoupi'), 'Should extract UPI ID');
  assert.ok(result.urls.some(u => u.includes('sbi-kyc-verify.example')), 'Should extract phishing URL');
});

test('analyzeContentHeuristic accurately detects Electricity Bill cutoff fraud', () => {
  const text = "Dear Customer, your electricity power will be DISCONNECTED tonight at 9:30 PM from electricity office. Call officer Rahul at 0000000001.";
  const analysis = analyzeContentHeuristic(text, 'en');

  assert.equal(analysis.risk_level, 'scam');
  assert.equal(analysis.scam_type, 'electricity_bill');
  assert.ok(analysis.risk_score >= 80, 'Risk score should be high');
  assert.ok(analysis.red_flags.length >= 2, 'Should detect multiple red flags');
  assert.ok(analysis.actions.length > 0, 'Should include action steps');
});

test('analyzeContentHeuristic accurately detects CBI Digital Arrest extortion', () => {
  const text = "DCP Crime Branch. A consignment of MDMA narcotics was seized under your Aadhaar. You are under digital arrest. Connect on Skype.";
  const analysis = analyzeContentHeuristic(text, 'en');

  assert.equal(analysis.risk_level, 'scam');
  assert.equal(analysis.scam_type, 'digital_arrest');
  assert.ok(analysis.risk_score >= 90);
  assert.ok(analysis.red_flags.some(rf => rf.flag.includes('Digital Arrest')));
});

test('analyzeContentHeuristic flags safe messages as safe with low score', () => {
  const text = "Your delivery order #9823101 has been picked up by delivery partner. Track live delivery on app. OTP is 4821.";
  const analysis = analyzeContentHeuristic(text, 'en');

  assert.equal(analysis.risk_level, 'safe');
  assert.ok(analysis.risk_score < 40, 'Safe message score should be low');
  assert.equal(analysis.scam_type, 'safe_message');
  assert.ok(analysis.safe_reasons.length > 0, 'Safe reasons should be provided');
});

test('analyzeLiveCallHeuristic flags Digital Arrest spoken cues and provides say_this', () => {
  const transcript = "Listen carefully, I am Inspector Sharma. A parcel with MDMA narcotics is under your Aadhaar. You are under digital arrest. Connect on Skype immediately.";
  const analysis = analyzeLiveCallHeuristic(transcript, 'en');

  assert.equal(analysis.risk_level, 'scam');
  assert.ok(analysis.risk_score >= 90);
  assert.ok(analysis.triggers.length >= 2, 'Should capture multiple triggers');
  assert.ok(analysis.say_this && analysis.say_this.length > 0, 'Should provide advice on what to say');
});

test('mockBackend handles complete Scans and Lookups lifecycle', async () => {
  // 1. Create Scan
  const { scan } = await mockBackend.createScan({
    text: "Dear SBI User, your YONO account has been BLOCKED. Click https://sbi-kyc-verify.example/login",
    language: 'en'
  });
  assert.ok(scan.id);
  assert.equal(scan.risk_level, 'scam');

  // 2. Lookup existing reported identifier
  const lookupReported = await mockBackend.lookup('0000000001');
  assert.equal(lookupReported.verdict, 'reported');
  assert.ok(lookupReported.report_count > 0);

  // 3. Lookup clean / unrecorded identifier
  const lookupClean = await mockBackend.lookup('9999900000');
  assert.equal(lookupClean.verdict, 'not_reported');
  assert.equal(lookupClean.report_count, 0);

  // 4. Submit Report for the clean number
  const { report } = await mockBackend.createReport({
    value: '9999900000',
    scam_type: 'bank_kyc'
  });
  assert.ok(report.id);

  // 5. Lookup again should now be reported
  const lookupAfterReport = await mockBackend.lookup('9999900000');
  assert.equal(lookupAfterReport.verdict, 'reported');
  assert.equal(lookupAfterReport.report_count, 1);
});

test('mockBackend handles Guardians, Alerts and Trends lifecycle', async () => {
  // 1. Guardians
  const guardiansBefore = await mockBackend.getGuardians();
  assert.ok(Array.isArray(guardiansBefore.my_guardians));
  assert.ok(Array.isArray(guardiansBefore.people_i_protect));

  const { invite } = await mockBackend.inviteGuardian({ email: 'sister.patel@example.com' });
  assert.equal(invite.status, 'pending');

  // 2. Alerts
  const alerts = await mockBackend.getAlerts();
  assert.ok(Array.isArray(alerts.alerts));
  if (alerts.alerts.length > 0) {
    const firstAlert = alerts.alerts[0];
    await mockBackend.markAlertRead(firstAlert.id);
    const updated = await mockBackend.getAlerts();
    const found = updated.alerts.find(a => a.id === firstAlert.id);
    assert.equal(found.is_read, true);
  }

  // 3. Trends
  const trends = await mockBackend.getTrends();
  assert.ok(trends.total_scans > 0);
  assert.ok(trends.scams_caught > 0);
  assert.ok(Array.isArray(trends.last_7_days));
  assert.ok(Array.isArray(trends.top_reported));
});
