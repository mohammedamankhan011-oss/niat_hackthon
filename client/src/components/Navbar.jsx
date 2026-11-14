import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldLogo } from './ShieldLogo';
import { LanguagePicker } from './LanguagePicker';
import { AlertBell } from './AlertBell';
import {
  Menu,
  X,
  ShieldCheck,
  PhoneCall,
  CreditCard,
  TrendingUp,
  Users,
  LogOut,
  LogIn,
  History
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: ShieldCheck, authOnly: true },
    { to: '/scan', label: 'Check Message', icon: ShieldCheck },
    { to: '/call', label: '📞 Call Guard', icon: PhoneCall, highlight: true, authOnly: true },
    { to: '/check', label: 'Check Pay', icon: CreditCard, authOnly: true },
    { to: '/trends', label: 'Trends', icon: TrendingUp },
    { to: '/history', label: 'History', icon: History, authOnly: true },
    { to: '/family', label: 'Family', icon: Users, authOnly: true },
  ];

  const visibleLinks = navLinks.filter(item => !item.authOnly || isAuthenticated);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link
            to={isAuthenticated ? "/dashboard" : "/"}
            className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-navy-900 rounded-xl p-1"
            aria-label="ScamShield Home"
          >
            <ShieldLogo className="w-10 h-10" />
            <div>
              <div className="text-2xl font-black text-navy-900 tracking-tight flex items-center gap-1.5">
                ScamShield
                <span className="text-xs bg-navy-900 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  India
                </span>
              </div>
              <div className="text-xs text-slate-700 font-semibold hidden sm:block">
                Family Safety Net Against Scams
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            {visibleLinks.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`min-h-[48px] px-3.5 py-2 rounded-xl text-base font-bold transition-all flex items-center gap-2 ${
                    item.highlight
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      : active
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'text-slate-700 hover:text-navy-900 hover:bg-slate-100'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Language, Alerts, User Profile */}
          <div className="hidden sm:flex items-center gap-2">
            <LanguagePicker compact />

            {isAuthenticated ? (
              <>
                <AlertBell />

                <div className="h-8 w-px bg-slate-200 mx-1" />

                <div className="flex items-center gap-2 pl-1">
                  <div className="text-right">
                    <div className="text-sm font-bold text-navy-900 leading-tight">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-xs text-slate-700">Protected</div>
                  </div>
                  <button
                    onClick={logout}
                    aria-label="Log out"
                    title="Log out"
                    className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="min-h-[48px] px-4 py-2 font-bold text-navy-900 hover:bg-slate-100 rounded-xl flex items-center gap-1"
                >
                  <LogIn className="w-4 h-4" />
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="min-h-[48px] px-5 py-2 bg-navy-900 text-white font-bold rounded-xl shadow-md hover:bg-navy-800 flex items-center gap-1"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button & Alerts */}
          <div className="flex items-center gap-1 lg:hidden">
            {isAuthenticated && <AlertBell />}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-h-[48px] min-w-[48px] p-2 rounded-xl text-slate-800 hover:bg-slate-100 focus:ring-2 focus:ring-navy-900"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top">
          <div className="mb-4">
            <LanguagePicker />
          </div>

          <div className="space-y-1">
            {visibleLinks.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`min-h-[52px] flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-bold ${
                    item.highlight
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : active
                      ? 'bg-navy-900 text-white'
                      : 'text-slate-800 hover:bg-slate-100'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-6 h-6" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="px-2">
                  <div className="text-base font-bold text-navy-900">{user?.name}</div>
                  <div className="text-sm text-slate-700">{user?.email}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="min-h-[48px] w-full flex items-center justify-center gap-2 px-4 py-3 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl font-bold"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[48px] flex items-center justify-center py-3 text-navy-900 border-2 border-navy-900 rounded-xl font-bold"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[48px] flex items-center justify-center py-3 bg-navy-900 text-white rounded-xl font-bold"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
