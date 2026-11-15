import React, { useState } from 'react';
import { api } from '../api/endpoints';
import { ErrorBox } from '../components/ErrorBox';
import { Loader } from '../components/Loader';
import { getScamTypeLabel } from '../utils/scamTypeLabels';
import { useCountUp } from '../hooks/useCountUp';
import {
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Flag,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export function CheckPayPage() {
  const [searchValue, setSearchValue] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reporting modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportScamType, setReportScamType] = useState('kyc_bank');
  const [reporting, setReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const animatedReportCount = useCountUp(
    result?.report_count ?? 0,
    900,
    Boolean(result && !loading && result.verdict === 'reported')
  );

  const runLookup = async (rawValue) => {
    const query = (rawValue !== undefined ? rawValue : searchValue).trim();
    if (!query) {
      setError('Please paste a phone number, UPI ID, or website link.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.lookup.check(query);
      setResult(data);
    } catch (err) {
      console.error('Lookup failed:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    await runLookup(searchValue);
  };

  const handleSampleClick = async (sample) => {
    setSearchValue(sample);
    await runLookup(sample);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setReporting(true);
    try {
      await api.reports.create({
        value: searchValue.trim(),
        scam_type: reportScamType
      });
      setReportSuccess(true);
      // Refresh lookup
      const refreshed = await api.lookup.check(searchValue.trim());
      setResult(refreshed);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
      }, 1500);
    } catch (err) {
      alert('Failed to submit report. Please try again.');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>India Community Fraud Database</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-navy-950 tracking-tight">
          Check Before You Pay
        </h1>
        <p className="text-lg sm:text-xl text-slate-700 font-medium max-w-xl mx-auto">
          Verify any mobile number, UPI ID, or URL before sending payment or sharing personal details.
        </p>
      </div>

      <ErrorBox error={error} />

      {/* Main Big Search Input Form */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl border-3 border-navy-900 shadow-lg p-6 sm:p-8 space-y-4">
        <form onSubmit={handleSearch} className="space-y-4">
          <label
            htmlFor="lookup-input"
            className="block text-lg font-black text-navy-950"
          >
            Paste a phone number, UPI ID or link:
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                id="lookup-input"
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="e.g. +910000000001 or kyc.refund.demo@oksbi or sbi-kyc-update.example"
                className="w-full min-h-[58px] px-5 py-3 rounded-2xl border-2 border-slate-300 font-mono text-lg font-bold text-slate-900 focus:border-navy-900 focus:outline-none placeholder:font-sans placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="min-h-[58px] px-8 py-3.5 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-400 text-white font-black text-xl rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-navy-300 shrink-0"
            >
              <Search className="w-6 h-6" />
              <span>Verify Now</span>
            </button>
          </div>
        </form>

        {/* Quick Sample Chips */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1 text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Try sample:
          </span>
          <button
            type="button"
            onClick={() => handleSampleClick('+910000000001')}
            className="min-h-[48px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-mono transition-colors"
          >
            +910000000001
          </button>
          <button
            type="button"
            onClick={() => handleSampleClick('kyc.refund.demo@oksbi')}
            className="min-h-[48px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-mono transition-colors"
          >
            kyc.refund.demo@oksbi
          </button>
          <button
            type="button"
            onClick={() => handleSampleClick('sbi-kyc-update.example')}
            className="min-h-[48px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-mono transition-colors"
          >
            sbi-kyc-update.example
          </button>
          <button
            type="button"
            onClick={() => handleSampleClick('parcel-customs-fee.example')}
            className="min-h-[48px] px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-mono transition-colors"
          >
            parcel-customs-fee.example
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-10 border border-slate-200 text-center">
          <Loader message="Checking national community database..." />
        </div>
      )}

      {/* BIG RESULT DISPLAY AS SPECIFIED */}
      {result && !loading && (
        <div className="space-y-6 fade-up">
          {result.verdict === 'reported' ? (
            /* RED REPORTED VERDICT */
            <div className="bg-red-50 border-3 border-red-500 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-100 px-3 py-0.5 rounded-full">
                      Known Fraud Identifier
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-red-950 mt-1 tabular-nums">
                      ⚠️ Reported {animatedReportCount} times
                      {result.last_7_days_count > 0 && (
                        <span className="text-red-700 ml-1">
                          ({result.last_7_days_count} this week)
                        </span>
                      )}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="min-h-[48px] px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-base shadow flex items-center justify-center gap-2 shrink-0 transition-colors"
                >
                  <Flag className="w-5 h-5" />
                  <span>Add Another Report</span>
                </button>
              </div>

              {/* Reported details */}
              <div className="bg-white p-5 rounded-2xl border border-red-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <span className="text-sm font-bold text-slate-500">Searched Identifier:</span>
                  <span className="font-mono text-lg font-black text-slate-900 break-all">
                    {result.identifier_value}
                  </span>
                </div>

                {result.scam_types && result.scam_types.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-sm font-bold text-slate-700">Associated Scam Types:</span>
                    {result.scam_types.map((st, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800"
                      >
                        {getScamTypeLabel(st)}
                      </span>
                    ))}
                  </div>
                )}

                {result.last_reported_at && (
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 pt-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      Most recently flagged:{' '}
                      {new Date(result.last_reported_at).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-red-600 text-white p-4 rounded-2xl font-bold text-base flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <span>
                  DO NOT send money or OTP to this destination. This identifier is flagged by multiple victims.
                </span>
              </div>
            </div>
          ) : (
            /* GREEN NOT REPORTED VERDICT */
            <div className="bg-emerald-50 border-3 border-emerald-500 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full">
                      Zero Citizen Complaints
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1">
                      No reports yet — still be careful
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="min-h-[48px] px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-300 font-bold rounded-xl text-base flex items-center justify-center gap-2 shrink-0 transition-colors"
                >
                  <Flag className="w-5 h-5 text-red-600" />
                  <span>Report Suspicious Activity</span>
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500">Identifier:</span>
                  <span className="font-mono text-base font-bold text-slate-900 break-all">
                    {result.identifier_value}
                  </span>
                </div>
                <p className="text-base text-slate-700 font-medium pt-2">
                  While no fraud complaints have been filed against this identifier yet, newly created scam accounts can appear within minutes. Always verify recipient names on your UPI banking app before confirming any payment.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 border-2 border-slate-200 shadow-2xl">
            <h3 className="text-2xl font-black text-navy-950">
              Submit Community Fraud Report
            </h3>
            <p className="text-sm font-semibold text-slate-700">
              Reporting helps protect seniors and families from falling for this scammer.
            </p>

            {reportSuccess ? (
              <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-4 rounded-xl font-bold text-center">
                ✅ Report registered successfully!
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-800">
                    Identifier to Report
                  </label>
                  <input
                    type="text"
                    required
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border-2 border-slate-300 font-mono text-base focus:border-navy-900 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-800">
                    Type of Scam
                  </label>
                  <select
                    value={reportScamType}
                    onChange={(e) => setReportScamType(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border-2 border-slate-300 text-base font-semibold focus:border-navy-900 focus:outline-none"
                  >
                    <option value="kyc_bank">Bank KYC Scam</option>
                    <option value="electricity_bill">Electricity Bill Scam</option>
                    <option value="digital_arrest">Digital Arrest / Fake Police</option>
                    <option value="job_task">Part-Time Job / Task Scam</option>
                    <option value="delivery_courier">Delivery / Customs Courier Scam</option>
                    <option value="upi_payment_request">UPI Payment Request Scam</option>
                    <option value="phishing_link">Phishing Link Scam</option>
                    <option value="impersonation">Impersonation Scam</option>
                    <option value="investment_trading">Investment / Trading Scam</option>
                    <option value="lottery_prize">Lottery / Fake Prize Scam</option>
                    <option value="loan_app">Predatory Loan App Scam</option>
                    <option value="sextortion">Sextortion / Blackmail Scam</option>
                    <option value="other">Other Scam</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="min-h-[48px] px-4 py-2 text-slate-700 font-bold rounded-xl hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reporting}
                    className="min-h-[48px] px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow"
                  >
                    {reporting ? 'Submitting...' : 'Confirm Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
