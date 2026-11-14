import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' }
];

export function LanguagePicker({ compact = false, onChange }) {
  const { language, updateLanguage } = useAuth();

  const handleSelect = (code) => {
    updateLanguage(code);
    if (onChange) onChange(code);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleSelect(lang.code)}
            aria-label={`Select language ${lang.label}`}
            className={`min-h-[48px] px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
              language === lang.code
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            {lang.native}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
        <Globe className="w-4 h-4 text-navy-900" />
        <span>Choose Language / भाषा चुनें / ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {LANGUAGES.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              aria-label={`Change language to ${lang.label}`}
              aria-pressed={isSelected}
              className={`min-h-[48px] px-3 py-2 rounded-xl text-center border-2 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-navy-900 ${
                isSelected
                  ? 'border-navy-900 bg-navy-900 text-white shadow-md'
                  : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <div className="text-base">{lang.native}</div>
              <div className={`text-xs ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                {lang.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
