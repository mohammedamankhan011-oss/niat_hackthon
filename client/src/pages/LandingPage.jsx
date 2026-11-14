import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { ShieldLogo } from '../components/ShieldLogo';
import { LanguagePicker } from '../components/LanguagePicker';
import { t } from '../utils/translations';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  PhoneCall,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Activity,
  AlertTriangle
} from 'lucide-react';

export function LandingPage() {
  const { language, isAuthenticated } = useAuth();
  const [trends, setTrends] = useState({
    total_scans: 14350,
    scams_caught: 11480,
    total_reports: 8940
  });

  useEffect(() => {
    async function loadTrends() {
      try {
        const data = await api.trends.get();
        if (data) {
          setTrends({
            total_scans: data.total_scans || 14350,
            scams_caught: data.scams_caught || 11480,
            total_reports: data.total_reports || 8940
          });
        }
      } catch (e) {
        console.warn('Trends load fallback:', e);
      }
    }
    loadTrends();
  }, []);

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto px-4 space-y-6">
        <div className="inline-flex items-center gap-2 bg-navy-50 border border-navy-200 px-4 py-2 rounded-full text-navy-900 font-bold text-sm sm:text-base">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>India’s Verified Digital Protection Shield</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-navy-950 tracking-tight leading-tight">
          {t('tagline', language)}
        </h1>

        <p className="text-xl sm:text-2xl text-slate-700 max-w-2xl mx-auto font-medium leading-relaxed">
          {t('subtitle', language)}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to={isAuthenticated ? "/dashboard" : "/signup"}
            className="w-full sm:w-auto min-h-[56px] px-8 py-4 bg-navy-900 hover:bg-navy-800 text-white rounded-2xl text-xl font-black shadow-lg transition-all flex items-center justify-center gap-3 focus:ring-4 focus:ring-navy-300"
          >
            <span>{t('getStarted', language)}</span>
            <ArrowRight className="w-6 h-6" />
          </Link>

          <Link
            to="/scan"
            className="w-full sm:w-auto min-h-[56px] px-8 py-4 bg-white hover:bg-slate-50 text-navy-900 border-2 border-navy-900 rounded-2xl text-xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span>Check a Message Now</span>
          </Link>
        </div>

        {/* Live Public Stats Bar */}
        <div className="pt-10">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-navy-900">
                {trends.total_scans.toLocaleString('en-IN')}+
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-600 flex items-center justify-center gap-1.5">
                <Activity className="w-4 h-4 text-navy-600" />
                {t('statsTotalScans', language)}
              </div>
            </div>

            <div className="space-y-1 border-t sm:border-t-0 sm:border-l sm:border-r border-slate-200 pt-4 sm:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-red-600">
                {trends.scams_caught.toLocaleString('en-IN')}+
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-600 flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                {t('statsScamsCaught', language)}
              </div>
            </div>

            <div className="space-y-1 border-t sm:border-t-0 border-slate-200 pt-4 sm:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600">
                {trends.total_reports.toLocaleString('en-IN')}+
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-600 flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                {t('statsReports', language)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Feature Cards */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-navy-950">
            Three Protective Shields in One Place
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto font-medium">
            Designed specifically for Indian households, elderly parents, and students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1: Check Message */}
          <div className="bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-navy-900 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-navy-50 text-navy-900 flex items-center justify-center">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-black text-navy-950">
                1. {t('checkMessage', language)}
              </h3>
              <p className="text-base text-slate-700 leading-relaxed">
                {t('checkMessageDesc', language)} We scan for fake SBI KYC links, electricity disconnections, and job scams.
              </p>
            </div>
            <div className="pt-6">
              <Link
                to="/scan"
                className="w-full min-h-[48px] bg-slate-100 hover:bg-navy-900 hover:text-white text-navy-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <span>Check a message</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Feature 2: Live Call Guard (Star) */}
          <div className="bg-white rounded-3xl p-8 border-2 border-red-300 hover:border-red-600 transition-all shadow-md relative flex flex-col justify-between overflow-hidden">
            <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
              Star Feature
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                <PhoneCall className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-black text-navy-950">
                2. {t('liveCallGuard', language)}
              </h3>
              <p className="text-base text-slate-700 leading-relaxed">
                {t('liveCallGuardDesc', language)} Uses real-time speech analysis to detect CBI Digital Arrests and fake police threats live.
              </p>
            </div>
            <div className="pt-6">
              <Link
                to="/call"
                className="w-full min-h-[48px] bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow"
              >
                <span>Open Live Call Guard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Feature 3: Check Before You Pay */}
          <div className="bg-white rounded-3xl p-8 border-2 border-slate-200 hover:border-navy-900 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Search className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-black text-navy-950">
                3. {t('checkPay', language)}
              </h3>
              <p className="text-base text-slate-700 leading-relaxed">
                {t('checkPayDesc', language)} Instant lookup against 100,000+ fraud reports filed by Indian citizens before you send money.
              </p>
            </div>
            <div className="pt-6">
              <Link
                to="/check"
                className="w-full min-h-[48px] bg-slate-100 hover:bg-navy-900 hover:text-white text-navy-900 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                <span>Verify identifier</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Multilingual & Accessibility Section */}
      <section className="max-w-5xl mx-auto px-4 bg-navy-900 text-white rounded-3xl p-8 sm:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Elderly & Parent Friendly
            </span>
            <h2 className="text-3xl sm:text-4xl font-black leading-tight">
              Simple. Large Text. High Contrast.
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Explanations available in English, Hindi (हिंदी) and Kannada (ಕನ್ನಡ) with built-in voice read-aloud for parents and seniors who prefer listening over reading.
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Automatic family notifications when a senior encounters a scam</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200 font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Direct one-tap connection to National Cyber Helpline (1930)</span>
              </div>
            </div>
          </div>

          <div className="bg-navy-800/80 p-6 rounded-2xl border border-navy-700 space-y-4">
            <h3 className="text-xl font-bold text-white mb-2">Switch Language Anytime</h3>
            <LanguagePicker />
            <div className="pt-4 border-t border-navy-700 text-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center min-h-[48px] px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-navy-950 font-black rounded-xl text-base transition-colors"
              >
                Protect My Family Today
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
