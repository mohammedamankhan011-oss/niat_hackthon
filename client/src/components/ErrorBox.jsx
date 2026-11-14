import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { extractErrorMessage } from '../api/client';

export function ErrorBox({ error, onRetry, className = "" }) {
  if (!error) return null;
  const message = extractErrorMessage(error);

  return (
    <div
      role="alert"
      className={`bg-red-50 border-2 border-red-300 text-red-950 p-4 sm:p-5 rounded-2xl flex items-start gap-4 ${className}`}
    >
      <div className="p-2 bg-red-100 rounded-xl text-red-700 shrink-0 mt-0.5">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-bold text-red-900 mb-1">Attention Required</h3>
        <p className="text-base text-red-800 leading-relaxed font-medium">{message}</p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 min-h-[44px] px-4 py-2 bg-red-800 hover:bg-red-900 text-white font-bold rounded-xl text-sm transition-colors focus:ring-2 focus:ring-red-600"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
