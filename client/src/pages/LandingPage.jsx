import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/endpoints';
import { LanguagePicker } from '../components/LanguagePicker';
import { t } from '../utils/translations';
import { useAuth } from '../context/AuthContext';
import { useInView } from '../hooks/useInView';
import { useCountUp } from '../hooks/useCountUp';
import {
  ShieldAlert,
  PhoneCall,
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Activity,
  MessageSquare,
  Cpu,
  AlertTriangle
} from 'lucide-react';

export function LandingPage() {
  const { language, isAuthenticated } = useAuth();
  const [trends, setTrends] = useState(null);

  const [statsRef, statsInView] = useInView({ threshold: 0.2 });
  const [howRef, howInView] = useInView({ threshold: 0.2 });
  const [cardsRef, cardsInView] = useInView({ threshold: 0.15 });

  useEffect(() => {
    async function loadTrends() {
      try {
        const data = await api.trends.get();
        if (data) {
          setTrends({
            total_scans: data.total_scans ?? 0,
            scams_caught: data.scams_caught ?? 0,
            total_reports: data.total_reports ?? 0
          });
        }
      } catch (e) {
        console.warn('Trends load fallback:', e);
      }
    }
    loadTrends();
  }, []);

  const totalScansCount = useCountUp(trends?.total_scans ?? 0, 900, Boolean(trends && statsInView));
  const scamsCaughtCount = useCountUp(trends?.scams_caught ?? 0, 900, Boolean(trends && statsInView));
  const totalReportsCount = useCountUp(trends?.total_reports ?? 0, 900, Boolean(trends && statsInView));

  return (
    <div className="space-y-14 sm:space-y-20 py-6 sm:py-12 overflow-x-hidden">
      {/* Hero Section: Two-column on laptop, stacked on mobile */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headline, CTAs & Trust Strip */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6 fade-up">
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-full text-navy-900 font-bold text-sm sm:text-base shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>India’s Family Safety Net Against Scams</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-navy-950 tracking-tight leading-[1.12]">
              {t('tagline', language)}
            </h1>

            <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
              {t('subtitle', language)}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3.5 pt-2">
              <Link
                to={isAuthenticated ? '/dashboard' : '/signup'}
                className="min-h-[56px] px-7 py-4 bg-navy-900 hover:bg-navy-800 text-white rounded-2xl text-lg sm:text-xl font-black shadow-lg transition-all flex items-center justify-center gap-3 focus:ring-4 focus:ring-navy-300"
              >
                <span>{t('getStarted', language)}</span>
                <ArrowRight className="w-6 h-6 shrink-0" />
              </Link>

              <Link
                to="/scan"
                className="min-h-[56px] px-7 py-4 bg-white/90 backdrop-blur-sm hover:bg-white text-navy-900 border-2 border-navy-900 rounded-2xl text-lg sm:text-xl font-bold transition-all flex items-center justify-center gap-2.5 shadow-sm"
              >
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <span>Check a Message Now</span>
              </Link>
            </div>

            {/* Trust Strip */}
            <div className="pt-2">
              <div className="inline-block bg-white/85 backdrop-blur-sm border border-slate-200/90 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm">
                🇮🇳 Built for India · English, हिंदी, ಕನ್ನಡ · 🔒 Privacy-first · ⚡ Live AI
              </div>
            </div>
          </div>

          {/* Right Column: Animated HTML/CSS Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center fade-up stagger-2">
            <div
              className="w-full max-w-[340px] bg-navy-950 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 relative"
              aria-label="Interactive scam detection preview"
            >
              {/* Speaker notch */}
              <div className="w-24 h-1.5 bg-slate-700 rounded-full mx-auto mb-2.5" />

              {/* Screen */}
              <div className="bg-slate-100 rounded-[26px] overflow-hidden border border-slate-300">
                {/* WhatsApp-style Header */}
                <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-sm shrink-0">
                      !
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">+91 00000 00001</div>
                      <div className="text-xs text-emerald-100">Unknown Sender</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-emerald-900/70 px-2 py-0.5 rounded-md">
                    SMS / Chat
                  </span>
                </div>

                {/* Chat Body with Scanning Beam */}
                <div className="p-4 space-y-4 relative bg-[#ECE5DD]/70">
                  {/* WhatsApp Chat Bubble with Scanning Overlay */}
                  <div className="relative bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-sm border border-slate-200 overflow-hidden">
                    {/* Scanning Beam */}
                    <div
                      className="phone-scan-beam pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,0.85)]"
                      aria-hidden="true"
                    />

                    <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
                      Forwarded Message
                    </div>
                    <p className="text-sm font-semibold text-slate-900 leading-snug break-words">
                      Your SBI account is blocked, update KYC:{' '}
                      <span className="underline text-blue-700 font-mono">
                        sbi-kyc-update.example
                      </span>
                    </p>
                    <div className="text-right text-xs text-slate-400 mt-1">10:42 AM</div>
                  </div>

                  {/* ScamShield AI Verdict Slide-In Card */}
                  <div className="phone-verdict-reveal bg-white/95 backdrop-blur-sm rounded-2xl p-3.5 border-2 border-red-500 shadow-md space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black tracking-wider uppercase shadow-sm">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>SCAM · 95/100</span>
                      </span>
                      <span className="text-xs font-bold text-navy-900">ScamShield AI</span>
                    </div>

                    {/* 2 Red-Flag Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="phone-chip-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-900 border border-red-200 text-xs font-bold">
                        <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                        <span>Fake urgency</span>
                      </span>
                      <span className="phone-chip-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-900 border border-red-200 text-xs font-bold">
                        <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                        <span>Fake bank link</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Public Stats Bar (Count up from 0 on scroll) */}
        <div ref={statsRef} className="pt-10 sm:pt-12">
          <div className="bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black text-navy-900 tabular-nums">
                {trends ? totalScansCount.toLocaleString('en-IN') : '—'}
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-600 flex items-center justify-center gap-1.5">
                <Activity className="w-4 h-4 text-navy-600 shrink-0" />
                <span>{t('statsTotalScans', language)}</span>
              </div>
            </div>

            <div className="space-y-1 border-t sm:border-t-0 sm:border-l sm:border-r border-slate-200 pt-4 sm:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-red-600 tabular-nums">
                {trends ? scamsCaughtCount.toLocaleString('en-IN') : '—'}
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-600 flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span>{t('statsScamsCaught', language)}</span>
              </div>
            </div>

            <div className="space-y-1 border-t sm:border-t-0 border-slate-200 pt-4 sm:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-emerald-600 tabular-nums">
                {trends ? totalReportsCount.toLocaleString('en-IN') : '—'}
              </div>
              <div className="text-sm sm:text-base font-bold text-slate-600 flex items-center justify-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('statsReports', language)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "How It Works" Row with Drawing Connecting Line */}
      <section ref={howRef} className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-navy-700 bg-navy-50 px-3 py-1 rounded-full border border-navy-200">
              Simple 3-Step Protection
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-950">
              How It Works
            </h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Thin connecting line on desktop that draws in on scroll */}
            <div
              className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-slate-200 overflow-hidden"
              aria-hidden="true"
            >
              <div
                className="h-full bg-navy-900 transition-all duration-700 ease-out"
                style={{ width: howInView ? '100%' : '0%' }}
              />
            </div>

            {/* Step 1 */}
            <div className={`relative z-10 flex flex-col items-center text-center space-y-2.5 ${howInView ? 'fade-up stagger-1' : ''}`}>
              <div className="w-16 h-16 rounded-2xl bg-navy-900 text-white flex items-center justify-center shadow-md border-4 border-white">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="text-lg font-black text-navy-950">
                1. Paste or speak
              </div>
              <p className="text-sm text-slate-600 font-medium max-w-xs">
                Paste a suspicious message, upload a screenshot, or put a phone call on speaker.
              </p>
            </div>

            {/* Step 2 */}
            <div className={`relative z-10 flex flex-col items-center text-center space-y-2.5 ${howInView ? 'fade-up stagger-2' : ''}`}>
              <div className="w-16 h-16 rounded-2xl bg-navy-900 text-white flex items-center justify-center shadow-md border-4 border-white">
                <Cpu className="w-7 h-7" />
              </div>
              <div className="text-lg font-black text-navy-950">
                2. AI checks
              </div>
              <p className="text-sm text-slate-600 font-medium max-w-xs">
                AI-powered fraud detection checks links, UPI IDs, and spoken coercion tactics.
              </p>
            </div>

            {/* Step 3 */}
            <div className={`relative z-10 flex flex-col items-center text-center space-y-2.5 ${howInView ? 'fade-up stagger-3' : ''}`}>
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md border-4 border-white">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="text-lg font-black text-navy-950">
                3. Stay safe
              </div>
              <p className="text-sm text-slate-600 font-medium max-w-xs">
                Read or listen to the verdict in English, हिंदी, or ಕನ್ನಡ and alert your family.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Feature Cards */}
      <section ref={cardsRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-navy-950">
            Three Protective Shields in One Place
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto font-medium">
            Designed specifically for Indian households, elderly parents, and students.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Feature 1: Check Message */}
          <div className={`card-lift bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-slate-200 hover:border-navy-900 shadow-sm flex flex-col justify-between ${cardsInView ? 'fade-up stagger-1' : ''}`}>
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-navy-50 text-navy-900 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8" />
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
          <div className={`card-lift bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-red-300 hover:border-red-600 shadow-md relative flex flex-col justify-between overflow-hidden ${cardsInView ? 'fade-up stagger-2' : ''}`}>
            <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Star Feature
            </div>
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                <PhoneCall className="w-8 h-8" />
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
          <div className={`card-lift bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border-2 border-slate-200 hover:border-navy-900 shadow-sm flex flex-col justify-between ${cardsInView ? 'fade-up stagger-3' : ''}`}>
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-navy-950">
                3. {t('checkPay', language)}
              </h3>
              <p className="text-base text-slate-700 leading-relaxed">
                {t('checkPayDesc', language)} Instant lookup against fraud reports filed by Indian citizens before you send money.
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
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-navy-900 text-white rounded-3xl p-6 sm:p-12 shadow-lg">
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
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Automatic family notifications when a senior encounters a scam</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-base">
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
                  className="inline-flex items-center justify-center min-h-[48px] px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-navy-950 font-black rounded-xl text-base transition-colors"
                >
                  Protect My Family Today
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subtle Team Attribution */}
      <div className="text-center text-sm font-semibold text-slate-500 pt-2">
        Built by Team Neural Nexus
      </div>
    </div>
  );
}
