import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldLogo } from './ShieldLogo';
import { LanguagePicker } from './LanguagePicker';
import { AlertBell } from './AlertBell';
import {
  Menu,
  X,
  Home,
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/dashboard' && (location.pathname === '/dashboard' || location.pathname === '/')) {
      return location.pathname === path;
    }
    return location.pathname === path || (path === '/scan' && location.pathname.startsWith('/scans/'));
  };

  const navLinks = [
    { to: '/dashboard', label: 'Home', icon: Home, authOnly: true },
    { to: '/scan', label: 'Check', icon: ShieldCheck },
    { to: '/call', label: 'Call Guard', icon: PhoneCall, highlight: true, authOnly: true },
    { to: '/check', label: 'Pay Check', icon: CreditCard, authOnly: true },
    { to: '/trends', label: 'Trends', icon: TrendingUp },
    { to: '/history', label: 'History', icon: History, authOnly: true },
    { to: '/family', label: 'Family', icon: Users, authOnly: true }
  ];

  const visibleLinks = navLinks.filter((item) => !item.authOnly || isAuthenticated);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-slate-200/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 h-16 sm:h-20 min-w-0">
          {/* Logo & Brand */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 min-w-0 shrink focus:outline-none focus:ring-2 focus:ring-navy-900 rounded-xl p-1"
            aria-label="ScamShield Home"
          >
            <ShieldLogo className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />
            <div className="min-w-0">
              <div className="text-lg sm:text-2xl font-black text-navy-900 tracking-tight flex items-center gap-1.5 truncate">
                <span className="truncate">ScamShield</span>
                <span className="text-xs bg-navy-900 text-white font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                  India
                </span>
              </div>
              <div className="text-xs text-slate-600 font-semibold hidden xl:block truncate">
                Family Safety Net Against Scams
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links (>= 1024px, all on one line with short labels) */}
          <nav
            className="hidden lg:flex items-center gap-1 whitespace-nowrap shrink-0"
            aria-label="Main Navigation"
          >
            {visibleLinks.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`min-h-[48px] px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    active
                      ? item.highlight
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-navy-900 text-white shadow-sm'
                      : item.highlight
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      : 'text-slate-700 hover:text-navy-900 hover:bg-slate-100/90'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Controls (>= 1024px) */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <LanguagePicker compact />

            {isAuthenticated ? (
              <>
                <AlertBell />
                <div className="h-7 w-px bg-slate-200 mx-0.5" />
                <div className="flex items-center gap-1.5 pl-1">
                  <div className="text-right max-w-[110px]">
                    <div className="text-sm font-bold text-navy-900 leading-tight truncate">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-xs text-emerald-700 font-semibold">Protected</div>
                  </div>
                  <button
                    type="button"
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
                  className="min-h-[48px] px-3.5 py-2 font-bold text-sm text-navy-900 hover:bg-slate-100 rounded-xl flex items-center gap-1 whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log in</span>
                </Link>
                <Link
                  to="/signup"
                  className="min-h-[48px] px-4 py-2 bg-navy-900 text-white font-bold text-sm rounded-xl shadow-sm hover:bg-navy-800 flex items-center gap-1 whitespace-nowrap"
                >
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile & Tablet (< 1024px) Right Controls — never overflows 375px */}
          <div className="flex items-center gap-1.5 lg:hidden shrink-0">
            {isAuthenticated && <AlertBell />}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="min-h-[48px] min-w-[48px] p-2.5 rounded-xl text-navy-950 bg-slate-100/90 hover:bg-slate-200 border border-slate-200 flex items-center justify-center focus:ring-2 focus:ring-navy-900"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Smooth Slide-Down Hamburger Drawer (< 1024px) */}
      <div
        className={`lg:hidden grid transition-all duration-300 ease-out ${
          mobileMenuOpen
            ? 'grid-rows-[1fr] opacity-100 border-t border-slate-200'
            : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden bg-white/95 shadow-xl">
          <div className="px-4 pt-4 pb-6 space-y-4 max-w-7xl mx-auto">
            <div>
              <LanguagePicker />
            </div>

            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-1.5" aria-label="Mobile Navigation">
              {visibleLinks.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`min-h-[50px] flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                      active
                        ? item.highlight
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-navy-900 text-white shadow-sm'
                        : item.highlight
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'text-slate-800 hover:bg-slate-100'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-slate-200">
              {isAuthenticated ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="px-1">
                    <div className="text-base font-bold text-navy-900">{user?.name}</div>
                    <div className="text-sm text-slate-600">{user?.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="min-h-[48px] px-4 py-2.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl font-bold text-base flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[48px] flex items-center justify-center py-2.5 text-navy-900 border-2 border-navy-900 rounded-xl font-bold text-base"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[48px] flex items-center justify-center py-2.5 bg-navy-900 text-white rounded-xl font-bold text-base"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
