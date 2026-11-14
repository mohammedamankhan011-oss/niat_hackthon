import React from 'react';
import { Volume2, Square, Info } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';

export function ReadAloudButton({ text, language = 'en', className = "" }) {
  const { speak, stop, isSpeaking, fallbackNote } = useSpeech();

  const handleToggle = () => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, language);
    }
  };

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isSpeaking ? "Stop reading explanation aloud" : "Read explanation aloud"}
        className={`min-h-[48px] px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm focus:ring-2 focus:ring-navy-900 ${
          isSpeaking
            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
            : 'bg-navy-900 hover:bg-navy-800 text-white'
        }`}
      >
        {isSpeaking ? (
          <>
            <Square className="w-5 h-5 fill-current" />
            <span>Stop Reading</span>
          </>
        ) : (
          <>
            <Volume2 className="w-5 h-5" />
            <span>🔊 Read Aloud</span>
          </>
        )}
      </button>

      {fallbackNote && (
        <div className="flex items-start gap-1 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2 max-w-sm">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{fallbackNote}</span>
        </div>
      )}
    </div>
  );
}
