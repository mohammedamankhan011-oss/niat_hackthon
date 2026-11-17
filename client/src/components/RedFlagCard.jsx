import React, { memo } from 'react';
import { AlertTriangle, Quote } from 'lucide-react';

export const RedFlagCard = memo(function RedFlagCard({ flag, evidence, explanation, index = 0 }) {
  const delayMs = Math.min(index * 80, 480);

  return (
    <div
      style={{ animationDelay: `${delayMs}ms` }}
      className="fade-up card-lift bg-white/95 border-2 border-red-200 rounded-2xl p-5 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 font-bold text-sm">
          #{index + 1}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <h4 className="text-lg font-black text-slate-900 leading-snug">
              {flag}
            </h4>
          </div>

          {evidence && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                <Quote className="w-3.5 h-3.5 shrink-0" />
                <span>Quoted Evidence from Message</span>
              </div>
              <p className="text-base font-semibold text-amber-950 italic break-words">
                "{evidence}"
              </p>
            </div>
          )}

          <p className="text-base text-slate-700 leading-relaxed pt-1">
            {explanation}
          </p>
        </div>
      </div>
    </div>
  );
});
