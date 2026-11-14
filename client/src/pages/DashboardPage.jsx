import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/endpoints';
import { VerdictBadge } from '../components/VerdictBadge';
import { AlertBell } from '../components/AlertBell';
import { Loader } from '../components/Loader';
import { ErrorBox } from '../components/ErrorBox';
import { getScamTypeLabel } from '../utils/scamTypeLabels';
import { t } from '../utils/translations';
import {
  ShieldAlert,
  PhoneCall,
  Search,
  MessageSquare,
  FileImage,
  ArrowRight,
  ShieldCheck,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export function DashboardPage() {
  const { user, language } = useAuth();
  const [scans, setScans] = useState([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [scansRes, alertsRes] = await Promise.all([
          api.scans.getAll(),
          api.alerts.getAll().catch(() => ({ alerts: [], unread_count: 0 }))
        ]);

        if (scansRes?.scans) {
          setScans(scansRes.scans);
        }
        if (alertsRes) {
          setUnreadAlerts(alertsRes.unread_count || 0);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Time based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'hi') {
      if (hour < 12) return 'नमस्ते, शुभ प्रभात';
      if (hour < 17) return 'नमस्ते, शुभ दोपहर';
      return 'नमस्ते, शुभ संध्या';
    }
    if (language === 'kn') {
      if (hour < 12) return 'ನಮಸ್ಕಾರ, ಶುಭೋದಯ';
      if (hour < 17) return 'ನಮಸ್ಕಾರ, ಶುಭ ಮಧ್ಯಾಹ್ನ';
      return 'ನಮಸ್ಕಾರ, ಶುಭ ಸಂಜೆ';
    }
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getInputIcon = (type) => {
    if (type === 'image') return <FileImage className="w-5 h-5 text-indigo-600" />;
    if (type === 'call') return <PhoneCall className="w-5 h-5 text-red-600" />;
    return <MessageSquare className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Greeting & Alerts Bar */}
      <div className="fade-up flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border-2 border-slate-200 shadow-sm">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Active Family Protection</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-navy-950 truncate">
            {getGreeting()}, {user?.name || 'Aarav'}!
          </h1>

          {unreadAlerts > 0 ? (
            <Link
              to="/alerts"
              className="mt-1 inline-flex items-center gap-2.5 min-h-[48px] px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-base shadow-sm transition-colors"
            >
              <span>
                ⚠️ {unreadAlerts} {unreadAlerts === 1 ? 'alert needs' : 'alerts need'} your attention
              </span>
              <ChevronRight className="w-5 h-5 shrink-0" />
            </Link>
          ) : (
            <p className="text-base text-slate-700 font-medium">
              Everything is safe. Check any unfamiliar phone call or message before taking action.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
          <AlertBell unreadCount={unreadAlerts} />
        </div>
      </div>

      <ErrorBox error={error} onRetry={() => window.location.reload()} />

      {/* 3 HUGE BUTTONS AS SPECIFIED */}
      <section aria-label="Core Actions" className="space-y-4">
        <h2 className="text-2xl font-black text-navy-950 tracking-tight">
          What would you like to verify?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Button 1: Check a message */}
          <Link
            to="/scan"
            className="fade-up stagger-1 card-lift group min-h-[140px] p-6 sm:p-8 bg-white/90 backdrop-blur-sm hover:bg-navy-900 text-slate-900 hover:text-white rounded-3xl border-3 border-navy-900 shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy-900 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-colors">
                <ShieldAlert className="w-8 h-8 text-navy-900 group-hover:text-white" />
              </div>
              <ArrowRight className="w-7 h-7 text-navy-900 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4 space-y-1">
              <div className="text-2xl font-black tracking-tight leading-snug">
                {t('checkMessage', language)}
              </div>
              <p className="text-sm font-semibold text-slate-600 group-hover:text-slate-200">
                Screenshot or text from WhatsApp & SMS
              </p>
            </div>
          </Link>

          {/* Button 2: Live Call Guard (Star Feature) */}
          <Link
            to="/call"
            className="fade-up stagger-2 card-lift group min-h-[140px] p-6 sm:p-8 bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-3xl border-3 border-red-500 shadow-lg flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="w-14 h-14 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0">
                <PhoneCall className="w-8 h-8" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest bg-white text-red-700 px-3 py-1 rounded-full">
                Live Speaker Guard
              </span>
            </div>
            <div className="mt-4 space-y-1">
              <div className="text-2xl font-black tracking-tight leading-snug flex items-center gap-2">
                <span>📞 Live Call Guard</span>
              </div>
              <p className="text-sm font-semibold text-red-100">
                Listens on speaker & warns of CBI/Police scams
              </p>
            </div>
          </Link>

          {/* Button 3: Check before you pay */}
          <Link
            to="/check"
            className="fade-up stagger-3 card-lift group min-h-[140px] p-6 sm:p-8 bg-white/90 backdrop-blur-sm hover:bg-navy-900 text-slate-900 hover:text-white rounded-3xl border-3 border-navy-900 shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 group-hover:bg-white/20 group-hover:text-white flex items-center justify-center transition-colors">
                <Search className="w-8 h-8 text-emerald-700 group-hover:text-white" />
              </div>
              <ArrowRight className="w-7 h-7 text-navy-900 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <div className="mt-4 space-y-1">
              <div className="text-2xl font-black tracking-tight leading-snug">
                {t('checkPay', language)}
              </div>
              <p className="text-sm font-semibold text-slate-600 group-hover:text-slate-200">
                Verify phone number, UPI ID, or URL
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Recent Scans Section with Verdict Badges */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-navy-900" />
            <h2 className="text-2xl font-black text-navy-950">
              {t('recentScans', language)}
            </h2>
          </div>

          <Link
            to="/history"
            className="min-h-[44px] px-4 py-2 text-base font-bold text-navy-900 hover:underline flex items-center gap-1"
          >
            <span>{t('viewAll', language)}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 border border-slate-200">
            <Loader message="Loading your recent safety checks..." />
          </div>
        ) : scans.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-10 border border-slate-200 text-center space-y-4">
            <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto" />
            <p className="text-lg font-bold text-slate-700">
              {t('noRecentScans', language)}
            </p>
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 min-h-[48px] px-6 py-2.5 bg-navy-900 text-white font-bold rounded-xl"
            >
              Check a message now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.slice(0, 5).map((scan) => (
              <Link
                key={scan.id}
                to={`/scans/${scan.id}`}
                className="block bg-white/90 backdrop-blur-sm hover:bg-white border-2 border-slate-200 hover:border-navy-900 rounded-2xl p-5 transition-all shadow-sm group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-slate-100 rounded-xl shrink-0 mt-0.5">
                      {getInputIcon(scan.input_type)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {scan.input_type.toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {new Date(scan.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {getScamTypeLabel(scan.scam_type, language)}
                        </span>
                      </div>

                      <p className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-navy-900">
                        {scan.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <VerdictBadge
                      riskLevel={scan.risk_level}
                      score={scan.risk_score}
                      size="sm"
                    />
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-navy-900 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
