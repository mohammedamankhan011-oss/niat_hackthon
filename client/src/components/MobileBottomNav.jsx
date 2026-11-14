import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, ShieldCheck, PhoneCall, CreditCard, Users } from 'lucide-react';

export function MobileBottomNav() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const homePath = isAuthenticated ? '/dashboard' : '/';

  const items = [
    {
      key: 'home',
      to: homePath,
      label: 'Home',
      icon: Home,
      isActive: location.pathname === '/dashboard' || location.pathname === '/'
    },
    {
      key: 'check',
      to: '/scan',
      label: 'Check',
      icon: ShieldCheck,
      isActive: location.pathname === '/scan' || location.pathname.startsWith('/scans/')
    },
    {
      key: 'call',
      to: '/call',
      label: 'Call',
      icon: PhoneCall,
      highlight: true,
      isActive: location.pathname === '/call'
    },
    {
      key: 'pay',
      to: '/check',
      label: 'Pay',
      icon: CreditCard,
      isActive: location.pathname === '/check'
    },
    {
      key: 'family',
      to: '/family',
      label: 'Family',
      icon: Users,
      isActive: location.pathname === '/family' || location.pathname === '/alerts'
    }
  ];

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_-4px_rgba(15,30,54,0.1)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 items-stretch px-1 py-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              to={item.to}
              aria-current={item.isActive ? 'page' : undefined}
              className={`min-h-[54px] flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 font-bold text-sm transition-colors ${
                item.isActive
                  ? item.highlight
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-navy-900 text-white shadow-sm'
                  : item.highlight
                  ? 'text-red-700 hover:bg-red-50'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="leading-tight truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
