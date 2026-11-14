import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../api/endpoints.js';
import { isMockMode } from '../api/client.js';

test('isMockMode is active for standalone testing environment', () => {
  assert.equal(typeof isMockMode, 'boolean');
});

test('api.auth endpoints work seamlessly in mock mode', async () => {
  const loginRes = await api.auth.login({ email: 'aarav.patel@example.com', password: 'password123' });
  assert.ok(loginRes.token);
  assert.ok(loginRes.user);

  const meRes = await api.auth.getMe();
  assert.ok(meRes.user);

  const updated = await api.auth.updateMe({ preferred_language: 'hi' });
  assert.equal(updated.user.preferred_language, 'hi');
});

test('api.scans endpoints work end-to-end', async () => {
  const newScan = await api.scans.create({
    text: "URGENT: BESCOM electricity will disconnect at 9pm call 0000000001",
    language: 'en'
  });
  assert.ok(newScan.scan.id);
  assert.equal(newScan.scan.risk_level, 'scam');

  const fetched = await api.scans.getById(newScan.scan.id);
  assert.equal(fetched.scan.id, newScan.scan.id);

  const explainRes = await api.scans.explain(newScan.scan.id, 'hi');
  assert.ok(explainRes.summary);
  assert.ok(explainRes.explanation);

  const deleted = await api.scans.delete(newScan.scan.id);
  assert.equal(deleted.success, true);
});

test('api.calls endpoints work end-to-end for Live Call Guard', async () => {
  const analyzeRes = await api.calls.analyze({
    transcript: "This is CBI headquarters Mumbai airport MDMA parcel arrest warrant Skype",
    language: 'en'
  });
  assert.ok(analyzeRes.analysis);
  assert.equal(analyzeRes.analysis.risk_level, 'scam');
  assert.ok(analyzeRes.analysis.triggers.length > 0);

  const savedScan = await api.calls.save({
    transcript: "Full transcript of digital arrest call",
    language: 'en'
  });
  assert.ok(savedScan.scan.id);
  assert.equal(savedScan.scan.input_type, 'call');
});
