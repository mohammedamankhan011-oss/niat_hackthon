import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { RiskMeter } from '../components/RiskMeter';
import { VerdictBadge } from '../components/VerdictBadge';
import { RedFlagCard } from '../components/RedFlagCard';
import { CommunityMatches } from '../components/CommunityMatches';
import { ReadAloudButton } from '../components/ReadAloudButton';
import { Loader } from '../components/Loader';
import { ErrorBox } from '../components/ErrorBox';
import { getScamTypeLabel, getScamTypeBadgeClass } from '../utils/scamTypeLabels';
import {
  PhoneCall,
  ExternalLink,
  Share2,
  Flag,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  AlertOctagon,
  Copy,
  Check
} from 'lucide-react';

export function ScanResultPage() {
  const { id } = useParams();
  const { language: initialLang } = useAuth();

  const [scan, setScan] = useState(null);
  const [currentLang, setCurrentLang] = useState(initialLang || 'en');
  const [loading, setLoading] = useState(true);
  const [explaining, setExplaining] = useState(false);
  const [error, setError] = useState(null);

  // Reporting modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportValue, setReportValue] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    async function fetchScan() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.scans.getById(id);
        if (res?.scan) {
          setScan(res.scan);
          setCurrentLang(res.scan.language || initialLang || 'en');
          // Pre-populate report identifier if available
          const firstId = res.scan.identifiers?.phones?.[0] ||
                          res.scan.identifiers?.upi_ids?.[0] ||
                          res.scan.identifiers?.urls?.[0] || '';
          setReportValue(firstId);
        }
      } catch (err) {
        console.error('Failed to fetch scan:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchScan();
    }
  }, [id, initialLang]);

  // Handle language switch via /explain endpoint
  const handleLanguageSwitch = async (targetLang) => {
    if (targetLang === currentLang || !scan) return;
    try {
      setExplaining(true);
      const res = await api.scans.explain(scan.id, targetLang);
      if (res) {
        setScan((prev) => ({
          ...prev,
          explanation: res.explanation || prev.explanation,
          summary: res.summary || prev.summary,
          red_flags: res.red_flags || prev.red_flags,
          actions: res.actions || prev.actions,
          language: targetLang
        }));
        setCurrentLang(targetLang);
      }
    } catch (e) {
      console.warn('Explain failed:', e);
      setCurrentLang(targetLang);
    } finally {
      setExplaining(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportValue.trim()) return;

    try {
      setReporting(true);
      await api.reports.create({
        value: reportValue.trim(),
        scam_type: scan?.scam_type || 'fraud'
      });
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
      }, 2000);
    } catch (err) {
      alert('Failed to submit report. Please try again.');
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="bg-white rounded-3xl p-12 border border-slate-200">
          <Loader message="Loading security scan report..." />
        </div>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-4">
        <ErrorBox error={error || 'Scan not found'} />
        <Link
          to="/scan"
          className="inline-flex items-center gap-2 px-6 py-3 bg-navy-900 text-white rounded-xl font-bold"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Scanner</span>
        </Link>
      </div>
    );
  }

  // WhatsApp share message URL
  const shareMessageText = encodeURIComponent(
    `🚨 SCAM ALERT from ScamShield:\n` +
    `Warning! ${scan.summary}\n` +
    `Risk Score: ${scan.risk_score}/100 (${scan.risk_level.toUpperCase()})\n` +
    `Stay safe and check suspicious messages at https://scamshield.in`
  );
  const whatsappUrl = `https://wa.me/?text=${shareMessageText}`;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Breadcrumb & Scan Another */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="min-h-[44px] px-3 py-1.5 text-slate-700 hover:text-navy-900 font-bold flex items-center gap-2 text-base transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>

        <Link
          to="/scan"
          className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy-900 font-bold rounded-xl text-sm transition-colors"
        >
          + Scan Another
        </Link>
      </div>

      {/* Main Result Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-6 sm:p-10 space-y-8">
        {/* Header with Risk Meter & Verdict */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getScamTypeBadgeClass(scan.scam_type)}`}>
                {getScamTypeLabel(scan.scam_type, currentLang)}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Checked on {new Date(scan.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-navy-950 leading-tight">
              {scan.summary}
            </h1>

            <VerdictBadge riskLevel={scan.risk_level} score={scan.risk_score} />
          </div>

          {/* Big Circular Risk Meter */}
          <div className="shrink-0">
            <RiskMeter
              score={scan.risk_score}
              riskLevel={scan.risk_level}
              size={220}
            />
          </div>
        </div>

        {/* Community Reports Match Alert */}
        {scan.community_matches && scan.community_matches.length > 0 && (
          <CommunityMatches matches={scan.community_matches} />
        )}

        {/* Language Switcher for Explanation */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-700">
            Read explanation in your mother tongue:
          </span>
          <div className="flex items-center gap-2">
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'kn', label: 'ಕನ್ನಡ' }
            ].map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleLanguageSwitch(l.code)}
                disabled={explaining}
                className={`min-h-[44px] px-4 py-1.5 rounded-xl font-bold text-sm transition-all ${
                  currentLang === l.code
                    ? 'bg-navy-900 text-white shadow'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Explanation Section with Read Aloud */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-navy-950">
              Why this was flagged
            </h2>
            <ReadAloudButton
              text={`${scan.summary}. ${scan.explanation}`}
              language={currentLang}
            />
          </div>

          <div className="bg-slate-50 border-l-4 border-navy-900 p-5 rounded-r-2xl">
            <p className="text-lg text-slate-800 leading-relaxed font-medium">
              {scan.explanation}
            </p>
          </div>
        </div>

        {/* Red Flags with Quoted Evidence Highlighted */}
        {scan.red_flags && scan.red_flags.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-red-950 flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 text-red-600" />
              <span>Critical Red Flags Found ({scan.red_flags.length})</span>
            </h3>

            <div className="space-y-3">
              {scan.red_flags.map((item, idx) => (
                <RedFlagCard
                  key={idx}
                  index={idx}
                  flag={item.flag}
                  evidence={item.evidence}
                  explanation={item.explanation}
                />
              ))}
            </div>
          </div>
        )}

        {/* Safe Reasons (if safe) */}
        {scan.safe_reasons && scan.safe_reasons.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-black text-emerald-950 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <span>Safety Verification Checks</span>
            </h3>
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 space-y-2">
              {scan.safe_reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-base font-semibold text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {scan.actions && scan.actions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xl font-black text-navy-950">
              Immediate Safe Actions to Take:
            </h3>
            <div className="space-y-2">
              {scan.actions.map((act, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-800 flex items-center gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 MANDATED ACTIONS AS SPECIFIED */}
        <div className="pt-6 border-t-2 border-slate-200 space-y-4">
          <h3 className="text-xl font-black text-navy-950">
            Emergency & Protection Actions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Action 1: Call 1930 */}
            <a
              href="tel:1930"
              className="min-h-[52px] px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 shadow transition-all focus:ring-4 focus:ring-red-300"
            >
              <PhoneCall className="w-5 h-5" />
              <span>📞 Call 1930</span>
            </a>

            {/* Action 2: Report at cybercrime.gov.in */}
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[52px] px-4 py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 shadow transition-all focus:ring-4 focus:ring-navy-300"
            >
              <ExternalLink className="w-5 h-5" />
              <span>cybercrime.gov.in</span>
            </a>

            {/* Action 3: Warn others on WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[52px] px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 shadow transition-all focus:ring-4 focus:ring-emerald-300"
            >
              <Share2 className="w-5 h-5" />
              <span>⚠️ Warn on WhatsApp</span>
            </a>

            {/* Action 4: Report this number */}
            <button
              type="button"
              onClick={() => setShowReportModal(true)}
              className="min-h-[52px] px-4 py-3 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-colors focus:ring-2 focus:ring-slate-400"
            >
              <Flag className="w-5 h-5 text-red-600" />
              <span>Report Identifier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Community Report Modal */}
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 border-2 border-slate-200 shadow-2xl">
            <h3 className="text-2xl font-black text-navy-950">
              Report Fraudulent Number / UPI / Link
            </h3>
            <p className="text-sm font-semibold text-slate-700">
              Your report will immediately alert other Indian citizens when they look up this sender.
            </p>

            {reportSuccess ? (
              <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-4 rounded-xl font-bold text-center">
                ✅ Reported successfully! Thank you for protecting the community.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-800">
                    Identifier (Phone, UPI ID, or URL)
                  </label>
                  <input
                    type="text"
                    required
                    value={reportValue}
                    onChange={(e) => setReportValue(e.target.value)}
                    placeholder="+91 00000 00001 or kyc.update.sbi@demoupi"
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border-2 border-slate-300 font-mono text-base focus:border-navy-900 focus:outline-none"
                  />
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
                    {reporting ? 'Submitting...' : 'Submit Report'}
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
