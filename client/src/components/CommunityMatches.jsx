import React from 'react';
import { Users, AlertCircle, ShieldAlert } from 'lucide-react';

export function CommunityMatches({ matches = [] }) {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-red-900">
        <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
        <h3 className="text-xl font-black tracking-tight">
          ⚠️ Reported by the Community
        </h3>
      </div>

      <p className="text-sm font-semibold text-red-800">
        The identifiers in this message match existing fraud complaints submitted by Indian citizens:
      </p>

      <div className="space-y-2 pt-1">
        {matches.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/90 border border-red-200 rounded-xl p-3.5"
          >
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800">
                {item.identifier_type || 'Entity'}
              </span>
              <span className="font-mono font-bold text-base text-slate-900 break-all">
                {item.identifier_value}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-red-700 sm:text-right">
              <Users className="w-4 h-4 text-red-500 shrink-0" />
              <span>
                Reported {item.report_count} times
                {item.last_7_days_count > 0 && (
                  <span className="text-red-900 ml-1">
                    ({item.last_7_days_count} this week)
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
