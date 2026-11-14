import React from 'react';
import { Shield } from 'lucide-react';

export function Loader({ message = "Scanning for safety...", size = "default" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center p-8 text-center space-y-4"
    >
      <div className="relative flex items-center justify-center">
        {/* Animated radar rings */}
        <div className="absolute w-16 h-16 rounded-full border-4 border-navy-900/20 animate-ping" />
        <div className="w-14 h-14 rounded-full border-4 border-navy-900 border-t-transparent animate-spin flex items-center justify-center" />
        <div className="absolute">
          <Shield className="w-6 h-6 text-navy-900 animate-pulse" />
        </div>
      </div>
      <p className="text-xl font-bold text-navy-900">{message}</p>
      <p className="text-sm text-slate-700 max-w-sm">
        Verifying against national cybercrime databases and known fraud signatures...
      </p>
    </div>
  );
}
