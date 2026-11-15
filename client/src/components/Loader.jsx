import React, { useState, useEffect } from 'react';
import { Shield, Clock } from 'lucide-react';

export function Loader({ message = 'Scanning for safety...', size = 'default' }) {
  const [showSlowNote, setShowSlowNote] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowNote(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full max-w-2xl mx-auto p-6 sm:p-8 space-y-6 text-center fade-up"
    >
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-navy-50 border border-navy-200 text-navy-900 font-bold text-sm">
        <Shield className="w-4 h-4 text-navy-900 shrink-0" />
        <span>{message}</span>
      </div>

      {/* Skeleton Shimmer Blocks */}
      <div className="space-y-4 text-left" aria-hidden="true">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl skeleton-shimmer shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="h-5 w-3/4 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-1/2 rounded-lg skeleton-shimmer" />
          </div>
        </div>
        <div className="h-24 w-full rounded-2xl skeleton-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-14 rounded-xl skeleton-shimmer" />
          <div className="h-14 rounded-xl skeleton-shimmer" />
        </div>
      </div>

      <p className="text-sm font-medium text-slate-600 max-w-md mx-auto">
        Verifying against national cybercrime databases and known fraud signatures…
      </p>

      {showSlowNote && (
        <div className="bg-amber-50 border border-amber-300 text-amber-950 rounded-2xl p-4 text-sm font-bold flex items-center justify-center gap-2.5 fade-up">
          <Clock className="w-5 h-5 text-amber-700 shrink-0" />
          <span>
            Waking up our secure server… this can take up to 30 seconds the first time.
          </span>
        </div>
      )}
    </div>
  );
}
