import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScanPage } from './pages/ScanPage';
import { ScanResultPage } from './pages/ScanResultPage';
import { LiveCallGuardPage } from './pages/LiveCallGuardPage';
import { CheckPayPage } from './pages/CheckPayPage';
import { HistoryPage } from './pages/HistoryPage';
import { FamilyPage } from './pages/FamilyPage';
import { AlertsPage } from './pages/AlertsPage';
import { TrendsPage } from './pages/TrendsPage';
import { ShieldLogo } from './components/ShieldLogo';
import { PhoneCall, ExternalLink, ShieldCheck } from 'lucide-react';

export function App() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
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
      </main>

      {/* Official Emergency Banner & Trust Footer */}
      <footer className="bg-navy-950 text-white border-t border-navy-900 mt-auto">
        {/* Emergency Helpline Strip */}
        <div className="bg-red-700 py-3 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2 text-white font-black text-base sm:text-lg">
              <PhoneCall className="w-5 h-5 shrink-0 animate-bounce" />
              <span>National Cyber Crime Emergency Helpline: Dial 1930 (Toll-Free 24x7)</span>
            </div>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-white text-red-700 px-4 py-1 rounded-lg font-black text-sm hover:bg-slate-100 transition-colors shrink-0"
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
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

          <div className="pt-8 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>ScamShield India • Built for NIAT Hackathon • Production-Grade Safety Net</span>
            </div>
            <div>
              Explanations available in English, हिंदी, and ಕನ್ನಡ with browser Web Speech synthesis.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
