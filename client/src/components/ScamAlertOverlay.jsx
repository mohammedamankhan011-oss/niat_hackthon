import React, { useEffect } from 'react';
import { PhoneOff, Volume2, AlertOctagon, ArrowRight } from 'lucide-react';
import { useSpeech } from '../hooks/useSpeech';

export function ScamAlertOverlay({
  isOpen,
  sayThis,
  scamType,
  triggers = [],
  onHangUpAndSave,
  onDismiss,
  language = 'en'
}) {
  const { speak, stop } = useSpeech();

  // Speak say_this automatically on trigger as specified in spec
  useEffect(() => {
    if (isOpen && sayThis) {
      const textToSpeak = `Alert! Scam detected! Hang up now! Say to the caller: ${sayThis}`;
      speak(textToSpeak, language);
    }
    return () => {
      stop();
    };
  }, [isOpen, sayThis, language, speak, stop]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="scam-alert-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-red-950/95 fade-up"
    >
      <div className="animate-alert-entry w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-4 border-red-600 overflow-hidden text-center flex flex-col max-h-[90vh]">
        {/* Urgent Red Banner */}
        <div className="bg-red-600 text-white px-6 py-5 flex items-center justify-center gap-3 animate-emergency">
          <AlertOctagon className="w-10 h-10 shrink-0" />
          <h2
            id="scam-alert-title"
            className="text-3xl sm:text-4xl font-black tracking-wider uppercase"
          >
            HANG UP NOW!
          </h2>
        </div>

        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Warning Message */}
          <div className="space-y-2">
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-wider bg-red-100 text-red-900 border border-red-300">
              🚨 Live Scam Intercepted
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              This caller is attempting an extortion or identity theft scam!
            </p>
          </div>

          {/* Say This Section */}
          {sayThis && (
            <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 text-left space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-red-900 uppercase tracking-wider">
                  🗣️ What to say immediately:
                </span>
                <button
                  type="button"
                  onClick={() => speak(sayThis, language)}
                  className="min-h-[48px] flex items-center gap-1.5 text-sm font-bold text-red-700 hover:text-red-900 bg-white border border-red-300 px-3.5 py-2 rounded-xl"
                  aria-label="Replay instruction aloud"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Replay Voice</span>
                </button>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-red-950 italic">
                "{sayThis}"
              </p>
            </div>
          )}

          {/* Detected Triggers */}
          {triggers && triggers.length > 0 && (
            <div className="text-left space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Trigger phrases detected in call:
              </span>
              <div className="flex flex-wrap gap-2">
                {triggers.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-red-100 text-red-900 text-sm font-bold px-3 py-1 rounded-lg border border-red-300"
                  >
                    ⚠️ {t.phrase}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={onHangUpAndSave}
              className="w-full min-h-[56px] py-4 px-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xl font-black shadow-lg transition-all flex items-center justify-center gap-3 focus:ring-4 focus:ring-red-400"
            >
              <PhoneOff className="w-7 h-7" />
              <span>Disconnect & Save Report</span>
              <ArrowRight className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="min-h-[48px] py-2 px-4 text-slate-600 hover:text-slate-900 font-bold text-base rounded-xl transition-colors"
            >
              Dismiss warning & keep listening
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
