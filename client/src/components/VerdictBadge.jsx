import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

export function VerdictBadge({ riskLevel, score, size = 'default' }) {
  const normalized = (riskLevel || '').toLowerCase();

  let config = {
    label: 'LOOKS SAFE',
    sub: 'No Red Flags Detected',
    icon: ShieldCheck,
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    badge: 'bg-emerald-600 text-white'
  };

  if (normalized === 'scam' || (score !== undefined && score >= 80)) {
    config = {
      label: 'DANGEROUS SCAM',
      sub: 'Extremely High Threat',
      icon: ShieldAlert,
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-950',
      badge: 'bg-red-600 text-white'
    };
  } else if (normalized === 'suspicious' || (score !== undefined && score >= 50)) {
    config = {
      label: 'SUSPICIOUS',
      sub: 'Exercise Extreme Caution',
      icon: AlertTriangle,
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      text: 'text-amber-950',
      badge: 'bg-amber-600 text-white'
    };
  }

  const Icon = config.icon;

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
        {score !== undefined && <span className="opacity-75">({score}%)</span>}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 ${config.bg} ${config.border} ${config.text}`}>
      <div className={`p-2 rounded-xl ${config.badge}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-lg font-black tracking-wide uppercase leading-none">
          {config.label}
        </div>
        <div className="text-xs font-semibold opacity-85 mt-0.5">
          {config.sub} {score !== undefined && `• Risk Score: ${score}/100`}
        </div>
      </div>
    </div>
  );
}
