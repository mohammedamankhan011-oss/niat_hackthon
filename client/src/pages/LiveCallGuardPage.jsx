import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useLiveCallAnalysis } from '../hooks/useLiveCallAnalysis';
import { RiskMeter } from '../components/RiskMeter';
import { VerdictBadge } from '../components/VerdictBadge';
import { LanguagePicker } from '../components/LanguagePicker';
import { ScamAlertOverlay } from '../components/ScamAlertOverlay';
import { ErrorBox } from '../components/ErrorBox';
import { CBI_DIGITAL_ARREST_DEMO } from '../utils/demoCallScript';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Play,
  Volume2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Info,
  Keyboard,
  Sparkles
} from 'lucide-react';

export function LiveCallGuardPage() {
  const { language } = useAuth();
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState(language || 'en');
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [manualTypedText, setManualTypedText] = useState('');
  const [savingCall, setSavingCall] = useState(false);
  const [error, setError] = useState(null);

  const demoIntervalRef = useRef(null);

  // Web Speech Recognition Hook
  const {
    isSupported,
    isListening,
    transcript,
    interimText,
    start: startMic,
    stop: stopMic,
    reset: resetTranscript,
    appendText,
    setFullTranscript
  } = useSpeechRecognition({
    language: selectedLang
  });

  // Live Call Analysis Hook
  const {
    analysis,
    isAnalyzing,
    scamAlertActive,
    lastCheckTime,
    performAnalysis,
    dismissAlert,
    resetAnalysis
  } = useLiveCallAnalysis({
    transcript,
    language: selectedLang,
    enabled: isListening || isDemoRunning
  });

  // Cleanup demo timer on unmount
  useEffect(() => {
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, []);

  // Handle Demo Mode Simulation
  const handleStartDemo = () => {
    if (isListening) stopMic();
    resetTranscript();
    resetAnalysis();
    setIsDemoRunning(true);
    setError(null);

    // Flatten demo phrases into words
    const allWords = [];
    CBI_DIGITAL_ARREST_DEMO.forEach(segment => {
      const words = segment.text.split(' ');
      words.forEach(w => allWords.push(w));
      allWords.push('__PAUSE__');
    });

    let wordIndex = 0;
    let accumulated = '';

    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);

    demoIntervalRef.current = setInterval(() => {
      if (wordIndex >= allWords.length) {
        clearInterval(demoIntervalRef.current);
        setIsDemoRunning(false);
        return;
      }

      const word = allWords[wordIndex];
      wordIndex++;

      if (word === '__PAUSE__') {
        accumulated += '\n\n';
      } else {
        accumulated += (accumulated.endsWith('\n\n') || !accumulated ? '' : ' ') + word;
      }

      setFullTranscript(accumulated);

      // Trigger incremental analysis as critical keywords appear
      const lower = accumulated.toLowerCase();
      if (
        word.toLowerCase().includes('narcotics') ||
        word.toLowerCase().includes('arrest') ||
        word.toLowerCase().includes('skype') ||
        word.toLowerCase().includes('escrow') ||
        wordIndex % 8 === 0
      ) {
        performAnalysis(accumulated);
      }
    }, 120); // Spoken word cadence
  };

  const handleStopDemo = () => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
    }
    setIsDemoRunning(false);
  };

  // Toggle Microphone
  const handleToggleListening = () => {
    if (isDemoRunning) handleStopDemo();

    if (isListening) {
      stopMic();
    } else {
      setError(null);
      startMic();
    }
  };

  // Stop button -> POST /api/calls with the full transcript -> go to /scans/:id
  const handleStopAndSave = async () => {
    if (isListening) stopMic();
    if (isDemoRunning) handleStopDemo();

    const textToSave = transcript.trim() || manualTypedText.trim();
    if (!textToSave) {
      setError('No conversation was recorded to analyze.');
      return;
    }

    setSavingCall(true);
    try {
      const res = await api.calls.save({
        transcript: textToSave,
        language: selectedLang
      });

      if (res?.scan?.id) {
        navigate(`/scans/${res.scan.id}`);
      } else {
        throw new Error('Failed to create scan report from call.');
      }
    } catch (err) {
      console.error('Save call failed:', err);
      setError(err);
      setSavingCall(false);
    }
  };

  // Manual Typing Analysis
  const handleAnalyzeManualText = () => {
    if (!manualTypedText.trim()) return;
    setFullTranscript(manualTypedText);
    performAnalysis(manualTypedText);
  };

  // Highlight trigger phrases in transcript
  const renderHighlightedTranscript = () => {
    const fullText = (transcript + (interimText ? ' ' + interimText : '')).trim();
    if (!fullText) {
      return (
        <span className="text-slate-400 italic">
          Spoken words will appear here in real-time as the caller speaks on speaker...
        </span>
      );
    }

    if (!analysis.triggers || analysis.triggers.length === 0) {
      return <span>{fullText}</span>;
    }

    // Build regex to highlight phrases
    const phrases = analysis.triggers
      .map(t => t.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(Boolean);

    if (phrases.length === 0) return <span>{fullText}</span>;

    const regex = new RegExp(`(${phrases.join('|')})`, 'gi');
    const parts = fullText.split(regex);

    return parts.map((part, i) => {
      const isMatch = phrases.some(p => p.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <mark
            key={i}
            className="bg-red-200 text-red-950 font-black px-1.5 py-0.5 rounded border border-red-400 animate-pulse"
          >
            {part}
          </mark>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Full-screen Red Alert Overlay on Scam */}
      <ScamAlertOverlay
        isOpen={scamAlertActive}
        sayThis={analysis.say_this}
        scamType={analysis.scam_type}
        triggers={analysis.triggers}
        onHangUpAndSave={handleStopAndSave}
        onDismiss={dismissAlert}
        language={selectedLang}
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-navy-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-white/20 rounded-xl">
              <PhoneCall className="w-6 h-6 text-white animate-pulse" />
            </span>
            <span className="text-sm font-black uppercase tracking-widest text-red-200">
              ScamShield AI Live Call Guard
            </span>
          </div>

          {/* Quick Demo Simulator Button */}
          <button
            type="button"
            onClick={isDemoRunning ? handleStopDemo : handleStartDemo}
            className="min-h-[44px] px-4 py-2 bg-white hover:bg-slate-100 text-red-700 font-black rounded-xl text-sm shadow flex items-center gap-2 transition-all focus:ring-2 focus:ring-white"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isDemoRunning ? '⏹ Stop Demo' : '▶ Demo Mode (Simulate Call)'}</span>
          </button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Live Call Scam Interceptor
          </h1>
          <p className="text-lg text-slate-100 font-medium max-w-2xl">
            Put the caller on speaker phone. Our on-device AI listens in real-time and warns you immediately if they attempt a Digital Arrest, Police extortion, or Bank OTP scam.
          </p>
        </div>

        {/* Step-by-Step Elder Friendly Instructions */}
        <div className="bg-white/10 rounded-2xl p-4 border border-white/20 flex items-center gap-3 text-base font-bold">
          <Info className="w-6 h-6 text-amber-300 shrink-0" />
          <span>
            Instructions: Put the call on speaker, then tap Start Listening below.
          </span>
        </div>
      </div>

      <ErrorBox error={error} />

      {/* Language Picker */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-700">
          Listening Language:
        </span>
        <div className="flex items-center gap-2">
          {[
            { code: 'hi', label: 'हिंदी (Hindi)' },
            { code: 'en', label: 'English (India)' },
            { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' }
          ].map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLang(lang.code)}
              className={`min-h-[44px] px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                selectedLang === lang.code
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Risk Meter & Live Verdict Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isListening || isDemoRunning
                    ? 'bg-red-500 animate-ping'
                    : 'bg-slate-400'
                }`}
              />
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                {isDemoRunning
                  ? 'Demo Simulation Active'
                  : isListening
                  ? 'Microphone Listening to Speaker'
                  : 'Guard Standby'}
              </span>
            </div>

            <VerdictBadge
              riskLevel={analysis.risk_level}
              score={analysis.risk_score}
            />

            <div className="bg-slate-50 border-l-4 border-navy-900 p-4 rounded-r-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Live AI Advice
              </div>
              <p className="text-base font-bold text-slate-900">
                {analysis.advice}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <RiskMeter
              score={analysis.risk_score}
              riskLevel={analysis.risk_level}
              size={200}
            />
          </div>
        </div>

        {/* Live Controls: Start Listening / Stop & Save */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleToggleListening}
            className={`min-h-[56px] py-4 px-6 rounded-2xl text-xl font-black transition-all shadow-md flex items-center justify-center gap-3 ${
              isListening
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-6 h-6" />
                <span>Pause Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-6 h-6" />
                <span>Start Listening</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleStopAndSave}
            disabled={savingCall || (!transcript.trim() && !manualTypedText.trim())}
            className="min-h-[56px] py-4 px-6 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-300 text-white rounded-2xl text-xl font-black transition-all shadow-md flex items-center justify-center gap-3"
          >
            <PhoneOff className="w-6 h-6" />
            <span>{savingCall ? 'Generating Report...' : 'Stop & View Report'}</span>
          </button>
        </div>
      </div>

      {/* Live Transcript Display Box */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-navy-950">
              Live Call Transcript
            </h3>
            {isAnalyzing && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Analyzing words...
              </span>
            )}
          </div>

          {(transcript || manualTypedText) && (
            <button
              type="button"
              onClick={() => {
                resetTranscript();
                resetAnalysis();
                setManualTypedText('');
              }}
              className="text-xs font-bold text-red-600 hover:underline"
            >
              Clear Transcript
            </button>
          )}
        </div>

        {/* Highlighted text container */}
        <div className="min-h-[160px] max-h-[320px] overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-lg leading-relaxed font-medium">
          {renderHighlightedTranscript()}
        </div>

        {/* Triggers Breakdown */}
        {analysis.triggers && analysis.triggers.length > 0 && (
          <div className="pt-2 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-red-800">
              Trigger Phrases Detected:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {analysis.triggers.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm font-bold text-red-950"
                >
                  <div className="flex items-center gap-1.5 text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>"{item.phrase}"</span>
                  </div>
                  <div className="text-xs font-normal text-slate-700 mt-1">
                    {item.why}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fallback Box for Non-Chrome / Typing Mode */}
      {(!isSupported || !isListening) && (
        <div className="bg-slate-100 rounded-3xl p-6 border-2 border-slate-300 space-y-4">
          <div className="flex items-start gap-3">
            <Keyboard className="w-6 h-6 text-slate-700 shrink-0 mt-1" />
            <div>
              <h4 className="text-lg font-black text-slate-900">
                Manual Call Note / Non-Chrome Fallback
              </h4>
              <p className="text-sm text-slate-600 font-medium">
                If microphone speech recognition is not supported on your browser, or if you prefer typing, type key phrases spoken by the caller:
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <textarea
              rows={3}
              value={manualTypedText}
              onChange={(e) => setManualTypedText(e.target.value)}
              placeholder="e.g. Police officer saying MDMA parcel in Mumbai airport and asking to connect on Skype..."
              className="w-full p-4 rounded-2xl border-2 border-slate-300 text-base font-medium focus:border-navy-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAnalyzeManualText}
              disabled={!manualTypedText.trim()}
              className="min-h-[48px] px-6 py-2.5 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-400 text-white font-bold rounded-xl text-base transition-colors"
            >
              Analyze Typed Words
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
