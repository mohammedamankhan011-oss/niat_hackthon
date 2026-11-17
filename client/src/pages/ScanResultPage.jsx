import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { RiskMeter } from '../components/RiskMeter';
import { VerdictBadge } from '../components/VerdictBadge';
import { RedFlagCard } from '../components/RedFlagCard';
import { CommunityMatches } from '../components/CommunityMatches';
import { ReadAloudButton } from '../components/ReadAloudButton';
import { ReportItForMePanel } from '../components/ReportItForMePanel';
import { Loader } from '../components/Loader';
import { getScamTypeLabel, getScamTypeBadgeClass } from '../utils/scamTypeLabels';
import { t } from '../utils/translations';
import {
  PhoneCall,
  ExternalLink,
  Share2,
  Flag,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  AlertOctagon,
  RefreshCw
} from 'lucide-react';

export function ScanResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const { language: initialLang, updateLanguage } = useAuth();

  // C.1: Render from router state immediately if available
  const initialScanFromState =
    location.state?.scan && (!id || String(location.state.scan.id) === String(id))
      ? location.state.scan
      : null;

  const [scan, setScan] = useState(initialScanFromState);
  const [currentLang, setCurrentLang] = useState(
    initialScanFromState?.language || initialLang || 'en'
  );
  const [loading, setLoading] = useState(!initialScanFromState);
  const [explaining, setExplaining] = useState(false);
  const [translationError, setTranslationError] = useState(null);
  const [error, setError] = useState(null);

  // D.2: Per-scan explanation cache { [lang]: { explanation, summary, red_flags, actions } }
  const [explanationCache, setExplanationCache] = useState(() => {
    if (!initialScanFromState) return {};
    const seedLang = initialScanFromState.language || 'en';
    return {
      [seedLang]: {
        explanation: initialScanFromState.explanation,
        summary: initialScanFromState.summary,
        red_flags: initialScanFromState.red_flags,
        actions: initialScanFromState.actions
      }
    };
  });

  // Reporting modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportValue, setReportValue] = useState(() => {
    if (!initialScanFromState) return '';
    return (
      initialScanFromState.identifiers?.phones?.[0] ||
      initialScanFromState.identifiers?.upi_ids?.[0] ||
      initialScanFromState.identifiers?.urls?.[0] ||
      ''
    );
  });
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reporting, setReporting] = useState(false);

  // "Report It For Me" cybercrime complaint panel state
  const [showComplaintPanel, setShowComplaintPanel] = useState(false);

  const isMountedRef = useRef(true);
  const explainAbortRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (explainAbortRef.current) {
        try {
          explainAbortRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  // C.2: Fetch scan with 20s timeout and up to 2 automatic retries with 2s gap
  const fetchScanWithRetries = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    let lastErr = null;
    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const res = await api.scans.getById(id, { timeout: 20000 });
        if (!isMountedRef.current) return;

        if (res?.scan) {
          const loaded = res.scan;
          const seedLang = loaded.language || 'en';
          setScan(loaded);
          setCurrentLang(seedLang);
          setExplanationCache({
            [seedLang]: {
              explanation: loaded.explanation,
              summary: loaded.summary,
              red_flags: loaded.red_flags,
              actions: loaded.actions
            }
          });
          const firstId =
            loaded.identifiers?.phones?.[0] ||
            loaded.identifiers?.upi_ids?.[0] ||
            loaded.identifiers?.urls?.[0] ||
            '';
          setReportValue(firstId);
          setLoading(false);
          return;
        }
        throw new Error('Scan report could not be loaded.');
      } catch (err) {
        lastErr = err;
        if (attempt < 2 && isMountedRef.current) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    if (isMountedRef.current) {
      setError(lastErr || new Error('Could not load this scan report.'));
      setLoading(false);
    }
  }, [id]);

  // Only fetch from backend if state was missing (e.g. page refresh) or route id changed
  useEffect(() => {
    const stateScan = location.state?.scan;
    if (stateScan && (!id || String(stateScan.id) === String(id))) {
      setScan(stateScan);
      const seedLang = stateScan.language || initialLang || 'en';
      setCurrentLang(seedLang);
      setExplanationCache((prev) => ({
        ...prev,
        [seedLang]: {
          explanation: stateScan.explanation,
          summary: stateScan.summary,
          red_flags: stateScan.red_flags,
          actions: stateScan.actions
        }
      }));
      const firstId =
        stateScan.identifiers?.phones?.[0] ||
        stateScan.identifiers?.upi_ids?.[0] ||
        stateScan.identifiers?.urls?.[0] ||
        '';
      setReportValue(firstId);
      setLoading(false);
      setError(null);
      return;
    }

    fetchScanWithRetries();
  }, [id, location.state, fetchScanWithRetries]);

  // D.2: Handle language switch with per-scan cache + AbortController + inline spinner + fallback link
  const handleLanguageSwitch = useCallback(
    async (targetLang, { forceRetry = false } = {}) => {
      if (!scan) return;
      if (targetLang === currentLang && !forceRetry) return;

      setTranslationError(null);
      updateLanguage(targetLang);

      // If cached, apply immediately with zero network wait
      if (!forceRetry && explanationCache[targetLang]) {
        const cached = explanationCache[targetLang];
        setScan((prev) => ({
          ...prev,
          explanation: cached.explanation || prev.explanation,
          summary: cached.summary || prev.summary,
          red_flags: cached.red_flags || prev.red_flags,
          actions: cached.actions || prev.actions,
          language: targetLang
        }));
        setCurrentLang(targetLang);
        return;
      }

      // Abort any previous in-flight /explain request
      if (explainAbortRef.current) {
        try {
          explainAbortRef.current.abort();
        } catch (_) {}
      }
      const controller = new AbortController();
      explainAbortRef.current = controller;

      setCurrentLang(targetLang);
      setExplaining(true);

      try {
        const res = await api.scans.explain(scan.id, targetLang, {
          signal: controller.signal
        });
        if (!isMountedRef.current || controller.signal.aborted) return;

        if (res && (res.explanation || res.summary)) {
          const entry = {
            explanation: res.explanation || scan.explanation,
            summary: res.summary || scan.summary,
            red_flags: res.red_flags || scan.red_flags,
            actions: res.actions || scan.actions,
            translated: res.translated
          };
          if (res.translated === false) {
            setTranslationError(targetLang);
          } else {
            setExplanationCache((prev) => ({
              ...prev,
              [targetLang]: entry
            }));
          }
          setScan((prev) => ({
            ...prev,
            ...entry,
            language: targetLang
          }));
        } else if (res?.translated === false) {
          setTranslationError(targetLang);
        }
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') {
          return;
        }
        if (isMountedRef.current) {
          setTranslationError(targetLang);
        }
      } finally {
        if (isMountedRef.current && !controller.signal.aborted) {
          setExplaining(false);
        }
      }
    },
    [scan, currentLang, explanationCache, updateLanguage]
  );

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportValue.trim()) return;

    try {
      setReporting(true);
      await api.reports.create({
        value: reportValue.trim(),
        scam_type: scan?.scam_type || 'fraud'
      });
      if (!isMountedRef.current) return;
      setReportSuccess(true);
      setTimeout(() => {
        if (isMountedRef.current) {
          setShowReportModal(false);
          setReportSuccess(false);
        }
      }, 2000);
    } catch (err) {
      alert('Failed to submit report. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setReporting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="bg-white/95 rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm">
          <Loader message="Loading security scan report..." />
        </div>
      </div>
    );
  }

  // C.2: Friendly error card with a "Try again" button (never a blank page)
  if (error || !scan) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white/95 rounded-3xl border-2 border-red-200 p-8 text-center space-y-5 shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertOctagon className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black text-navy-950">
            Could Not Load Scan Result
          </h2>
          <p className="text-base text-slate-700 font-medium max-w-md mx-auto">
            We couldn’t retrieve this scan report right now. Your connection or the server may be waking up.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={fetchScanWithRetries}
              className="min-h-[48px] px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-bold flex items-center gap-2 shadow"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Try again</span>
            </button>
            <Link
              to="/scan"
              className="min-h-[48px] px-6 py-3 bg-slate-100 hover:bg-slate-200 text-navy-900 rounded-xl font-bold flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Scanner</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // WhatsApp share message URL
  const shareMessageText = encodeURIComponent(
    `🚨 SCAM ALERT from ScamShield:\n` +
      `Warning! ${scan.summary}\n` +
      `Risk Score: ${scan.risk_score}/100 (${(scan.risk_level || '').toUpperCase()})\n` +
      `Stay safe and check suspicious messages at ScamShield`
  );
  const whatsappUrl = `https://wa.me/?text=${shareMessageText}`;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Breadcrumb & Scan Another */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/dashboard"
          className="min-h-[48px] px-3 py-2 text-slate-700 hover:text-navy-900 font-bold flex items-center gap-2 text-base transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>

        <Link
          to="/scan"
          className="min-h-[48px] px-4 py-2 bg-white/95 border border-slate-200 hover:bg-white text-navy-900 font-bold rounded-xl text-sm flex items-center transition-colors shadow-sm"
        >
          + Scan Another
        </Link>
      </div>

      {/* Main Result Card */}
      <div className="bg-white/95 rounded-3xl border-2 border-slate-200 shadow-md p-6 sm:p-10 space-y-8">
        {/* Header with Risk Meter & Verdict */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getScamTypeBadgeClass(
                  scan.scam_type
                )}`}
              >
                {getScamTypeLabel(scan.scam_type, currentLang)}
              </span>
              {scan.created_at && (
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Checked on{' '}
                  {new Date(scan.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              )}
              {scan.source === 'rules' && (
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                  Quick check (AI busy)
                </span>
              )}
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

        {/* Big "📝 Report It For Me" Button & Ready-Made Cybercrime Complaint Panel */}
        {(scan.risk_level === 'scam' || scan.risk_level === 'suspicious') && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowComplaintPanel((prev) => !prev)}
              className="w-full min-h-[60px] px-6 py-4 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-2xl font-black text-xl sm:text-2xl shadow-lg flex items-center justify-center gap-3 transition-all focus:ring-4 focus:ring-red-300"
            >
              <span>📝 Report It For Me</span>
            </button>

            {showComplaintPanel && (
              <ReportItForMePanel
                scan={scan}
                language={currentLang}
                onClose={() => setShowComplaintPanel(false)}
              />
            )}
          </div>
        )}

        {/* Language Switcher for Explanation */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm font-bold text-slate-700">
            Read explanation in your mother tongue:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'kn', label: 'ಕನ್ನಡ' }
            ].map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => handleLanguageSwitch(l.code)}
                className={`min-h-[48px] px-4 py-2 rounded-xl font-bold text-sm transition-all ${
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

        {/* Detailed Explanation Section with Read Aloud & Inline Spinner */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-navy-950">
                Why this was flagged
              </h2>
              {explaining && (
                <span
                  role="status"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-800 bg-navy-50 border border-navy-200 px-3 py-1 rounded-full"
                >
                  <span className="w-3 h-3 rounded-full border-2 border-navy-900 border-t-transparent animate-spin" />
                  <span>Translating…</span>
                </span>
              )}
            </div>
            <ReadAloudButton
              text={`${scan.summary}. ${scan.explanation}`}
              language={currentLang}
            />
          </div>

          <div className="bg-slate-50 border-l-4 border-navy-900 p-5 rounded-r-2xl space-y-2">
            <p className="text-lg text-slate-800 leading-relaxed font-medium">
              {scan.explanation}
            </p>

            {(translationError || scan.translated === false) && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleLanguageSwitch(translationError || currentLang, { forceRetry: true })
                  }
                  className="text-sm font-bold text-red-700 hover:underline inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Translation unavailable, try again</span>
                </button>
              </div>
            )}
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
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-base font-semibold text-emerald-900"
                >
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
              <span>{t('reportNumber', currentLang)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Community Report Modal */}
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75"
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
