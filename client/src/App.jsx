import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Loader } from './components/Loader';
import TruchetFlowBackground from './components/TruchetFlowBackground';
import { subscribeSlowRequest } from './api/client';
import { api } from './api/endpoints';
import { ShieldLogo } from './components/ShieldLogo';
import { PhoneCall, ExternalLink, ShieldCheck, Clock } from 'lucide-react';

// Lazy-loaded pages (Recharts only loads when visiting /trends)
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const SignupPage = lazy(() =>
  import('./pages/SignupPage').then((m) => ({ default: m.SignupPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ScanPage = lazy(() =>
  import('./pages/ScanPage').then((m) => ({ default: m.ScanPage }))
);
const ScanResultPage = lazy(() =>
  import('./pages/ScanResultPage').then((m) => ({ default: m.ScanResultPage }))
);
const LiveCallGuardPage = lazy(() =>
  import('./pages/LiveCallGuardPage').then((m) => ({ default: m.LiveCallGuardPage }))
);
const CheckPayPage = lazy(() =>
  import('./pages/CheckPayPage').then((m) => ({ default: m.CheckPayPage }))
);
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage }))
);
const FamilyPage = lazy(() =>
  import('./pages/FamilyPage').then((m) => ({ default: m.FamilyPage }))
);
const AlertsPage = lazy(() =>
  import('./pages/AlertsPage').then((m) => ({ default: m.AlertsPage }))
);
const TrendsPage = lazy(() =>
  import('./pages/TrendsPage').then((m) => ({ default: m.TrendsPage }))
);

function getTitleForPath(pathname) {
  if (pathname === '/') return 'ScamShield — Check before you click, pay or panic';
  if (pathname === '/login') return 'Log In · ScamShield';
  if (pathname === '/signup') return 'Sign Up · ScamShield';
  if (pathname === '/dashboard') return 'Dashboard · ScamShield';
  if (pathname === '/scan') return 'Check a Message · ScamShield';
  if (pathname.startsWith('/scans/') || pathname.startsWith('/scan/')) {
    return 'Scan Result · ScamShield';
  }
  if (pathname === '/call') return 'Live Call Guard · ScamShield';
  if (pathname === '/check') return 'Check Before You Pay · ScamShield';
  if (pathname === '/trends') return 'Scam Trends · ScamShield';
  if (pathname === '/history') return 'Scan History · ScamShield';
  if (pathname === '/family') return 'Family Guardians · ScamShield';
  if (pathname === '/alerts') return 'Guardian Alerts · ScamShield';
  return 'ScamShield — India’s Family Safety Net';
}

export function App() {
  const location = useLocation();
  const [slowServerBanner, setSlowServerBanner] = useState(false);
  const healthPingedRef = useRef(false);

  // E: Fire GET /api/health once silently on app load to wake up server
  useEffect(() => {
    if (healthPingedRef.current) return;
    healthPingedRef.current = true;
    api.health.check().catch(() => {});
  }, []);

  // Dynamic route page title & scroll to top on navigation
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = getTitleForPath(location.pathname);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [location.pathname]);

  // Global listener for API requests taking > 4s
  useEffect(() => {
    const unsubscribe = subscribeSlowRequest((isSlow) => {
      setSlowServerBanner(isSlow);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-slate-900 overflow-x-hidden">
      <TruchetFlowBackground />

      {/* Top Navbar */}
      <Navbar />

      {/* Friendly Slow Server Note (> 4s API wake-up) */}
      {slowServerBanner && (
        <div
          role="status"
          aria-live="polite"
          className="bg-amber-50 border-b border-amber-300 px-4 py-2.5 text-center text-sm font-bold text-amber-950 flex items-center justify-center gap-2 fade-up"
        >
          <Clock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Waking up our secure server… this can take up to 30 seconds the first time.</span>
        </div>
      )}

      {/* Main Content Area with Suspense skeleton fallback */}
      <main className="flex-1 pb-24 md:pb-16 bg-transparent">
        <Suspense
          fallback={
            <div className="max-w-4xl mx-auto py-12 px-4">
              <div className="bg-white/95 rounded-3xl p-8 border border-slate-200 shadow-sm">
                <Loader message="Loading ScamShield..." />
              </div>
            </div>
          }
        >
          <div key={location.pathname} className="page-fade">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Core Feature Pages */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/scans/:id" element={<ScanResultPage />} />
              <Route path="/scan/:id" element={<ScanResultPage />} />
              <Route
                path="/call"
                element={
                  <ProtectedRoute>
                    <LiveCallGuardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/check" element={<CheckPayPage />} />
              <Route path="/trends" element={<TrendsPage />} />

              {/* Protected Family & History Pages */}
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/family"
                element={
                  <ProtectedRoute>
                    <FamilyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <AlertsPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Suspense>
      </main>

      {/* Official Emergency Banner & Trust Footer */}
      <footer className="bg-navy-950 text-white border-t border-navy-900 mt-auto pb-20 md:pb-0">
        {/* Emergency Helpline Strip */}
        <div className="bg-red-700 py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2 text-white font-black text-base sm:text-lg">
              <PhoneCall className="w-5 h-5 shrink-0" />
              <span>National Cyber Crime Emergency Helpline: Dial 1930 (Toll-Free 24x7)</span>
            </div>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[48px] inline-flex items-center gap-1.5 bg-white text-red-700 px-4 py-2 rounded-xl font-black text-sm hover:bg-slate-100 transition-colors shrink-0"
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-3">
                <ShieldLogo className="w-8 h-8" />
                <span className="text-2xl font-black tracking-tight text-white">
                  ScamShield India
                </span>
              </div>
              <p className="text-base text-slate-300 max-w-md font-medium leading-relaxed">
                India's family safety net against phone scams, fake police arrests, electricity bill fraud, and malicious UPI requests. Designed with high-contrast, large text, and voice read-aloud for senior citizens and families.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-black uppercase tracking-wider text-slate-400">
                Core Features
              </div>
              <ul className="space-y-2 text-sm font-bold text-slate-300">
                <li>
                  <Link to="/scan" className="hover:text-white transition-colors">
                    Check a Message
                  </Link>
                </li>
                <li>
                  <Link to="/call" className="hover:text-white transition-colors text-red-300">
                    📞 Live Call Guard
                  </Link>
                </li>
                <li>
                  <Link to="/check" className="hover:text-white transition-colors">
                    Check Before You Pay
                  </Link>
                </li>
                <li>
                  <Link to="/trends" className="hover:text-white transition-colors">
                    National Fraud Trends
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-black uppercase tracking-wider text-slate-400">
                Family & Safety
              </div>
              <ul className="space-y-2 text-sm font-bold text-slate-300">
                <li>
                  <Link to="/family" className="hover:text-white transition-colors">
                    Family Guardians
                  </Link>
                </li>
                <li>
                  <Link to="/alerts" className="hover:text-white transition-colors">
                    Real-time Alerts
                  </Link>
                </li>
                <li>
                  <a href="tel:1930" className="hover:text-white transition-colors text-emerald-400">
                    Call 1930 Helpline
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-semibold text-slate-400 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>ScamShield India • Built by Team Neural Nexus</span>
            </div>
            <div>
              Explanations available in English, हिंदी, and ಕನ್ನಡ with browser Web Speech synthesis.
            </div>
          </div>
        </div>
      </footer>

      {/* App-Style Fixed Bottom Navigation (< 768px) */}
      <MobileBottomNav />
    </div>
  );
}
export default App;
