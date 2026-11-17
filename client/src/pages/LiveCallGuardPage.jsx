import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';
import { analyzeContentHeuristic } from '../api/mocks';
import { useAuth } from '../context/AuthContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useLiveCallAnalysis } from '../hooks/useLiveCallAnalysis';
import { RiskMeter } from '../components/RiskMeter';
import { VerdictBadge } from '../components/VerdictBadge';
import { ScamAlertOverlay } from '../components/ScamAlertOverlay';
import { ErrorBox } from '../components/ErrorBox';
import { CBI_DIGITAL_ARREST_DEMO } from '../utils/demoCallScript';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  AlertTriangle,
  Info,
  Keyboard,
  Sparkles
} from 'lucide-react';

const DEMO_STAGE_UPDATES = [
  {
    risk_level: 'safe',
    risk_score: 24,
    scam_type: 'none',
    triggers: [],
    advice: 'Caller claims to be from Customs / Courier. Stay cautious and do not share Aadhaar or OTP.',
    say_this: ''
  },
  {
    risk_level: 'suspicious',
    risk_score: 62,
    scam_type: 'digital_arrest',
    triggers: [
      {
        phrase: '140 grams of MDMA narcotics',
        why: 'Scammers fabricate illegal drug parcel claims to terrify victims.'
      }
    ],
    advice: 'WARNING: Classic fake parcel accusation! Real customs officers never conduct phone interrogations.',
    say_this: 'Send any official notice by registered post. I will not join video calls.'
  },
  {
    risk_level: 'scam',
    risk_score: 89,
    scam_type: 'digital_arrest',
    triggers: [
      {
        phrase: '140 grams of MDMA narcotics',
        why: 'Scammers fabricate illegal drug parcel claims to terrify victims.'
      },
      {
        phrase: 'digital arrest',
        why: 'Indian law has no provision for Digital Arrest. It is 100% fake.'
      },
      {
        phrase: 'connect on Skype video call',
        why: 'Police and CBI never interrogate citizens on Skype or WhatsApp.'
      }
    ],
    advice: 'DANGER! This is a CBI Digital Arrest extortion scam. Hang up immediately!',
    say_this: 'I am disconnecting now and verifying with my local police station and 1930.'
  },
  {
    risk_level: 'scam',
    risk_score: 98,
    scam_type: 'digital_arrest',
    triggers: [
      {
        phrase: 'digital arrest',
        why: 'Indian law has no provision for Digital Arrest. It is 100% fake.'
      },
      {
        phrase: 'connect on Skype video call',
        why: 'Police and CBI never interrogate citizens on Skype or WhatsApp.'
      },
      {
        phrase: 'RBI Safe Verification Account',
        why: 'The RBI and Supreme Court never ask citizens to transfer savings for verification.'
      }
    ],
    advice: 'CRITICAL SCAM ALERT (98/100)! Hang up now! Do not transfer any money.',
    say_this: 'This is a known cyber fraud. I am hanging up and calling 1930 right now.'
  }
];

export function LiveCallGuardPage() {
  const { language } = useAuth();
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState(language || 'en');
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoMicLevel, setDemoMicLevel] = useState(0);
  const [manualTypedText, setManualTypedText] = useState('');
  const [savingCall, setSavingCall] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const demoTimersRef = useRef([]);

  // Web Speech + MediaRecorder + Web Audio Analyser Hook
  const {
    isListening,
    transcript,
    interimText,
    micLevel,
    noAudioWarning,
    serviceNotice,
    error: micError,
    start: startMic,
    stop: stopMic,
    reset: resetTranscript,
    setFullTranscript
  } = useSpeechRecognition({
    language: selectedLang
  });

  // Live Call Analysis Hook (10s initial, 15s recurring when transcript grows)
  const {
    analysis,
    isAnalyzing,
    scamAlertActive,
    analysisNotice,
    performAnalysis,
    updateAnalysisState,
    dismissAlert,
    resetAnalysis
  } = useLiveCallAnalysis({
    transcript,
    language: selectedLang,
    enabled: isListening
  });

  const clearDemoTimers = () => {
    demoTimersRef.current.forEach((id) => clearTimeout(id));
    demoTimersRef.current = [];
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearDemoTimers();
    };
  }, []);

  // Offline-style Demo Mode: scripted transcript appears line by line, risk climbs, alert overlay fires
  const handleStartDemo = () => {
    if (isListening) stopMic();
    clearDemoTimers();
    resetTranscript();
    resetAnalysis();
    setError(null);
    setIsDemoRunning(true);
    setDemoMicLevel(45);

    let accumulatedLines = '';

    CBI_DIGITAL_ARREST_DEMO.forEach((segment, idx) => {
      const lineDelay = idx * 2400 + 300;

      const tId = setTimeout(() => {
        if (!isMountedRef.current) return;
        accumulatedLines = accumulatedLines
          ? `${accumulatedLines}\n\n${segment.text}`
          : segment.text;
        setFullTranscript(accumulatedLines);
        setDemoMicLevel(55 + ((idx * 17) % 35));

        const stage = DEMO_STAGE_UPDATES[Math.min(idx, DEMO_STAGE_UPDATES.length - 1)];
        updateAnalysisState(stage);

        if (idx === CBI_DIGITAL_ARREST_DEMO.length - 1) {
          setIsDemoRunning(false);
          setDemoMicLevel(0);
        }
      }, lineDelay);

      demoTimersRef.current.push(tId);
    });
  };

  const handleStopDemo = () => {
    clearDemoTimers();
    setIsDemoRunning(false);
    setDemoMicLevel(0);
  };

  // Toggle Microphone Listening
  const handleToggleListening = async () => {
    if (isDemoRunning) handleStopDemo();

    if (isListening) {
      stopMic();
    } else {
      setError(null);
      await startMic();
    }
  };

  // Stop button -> POST /api/calls with the full transcript -> go to /scans/:id with router state
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

      if (!isMountedRef.current) return;

      if (res?.scan?.id) {
        navigate(`/scans/${res.scan.id}`, { state: { scan: res.scan } });
      } else {
        throw new Error('Failed to create scan report from call.');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      // Offline fallback so demo/call report always opens
      const fallbackAnalysis = analyzeContentHeuristic(textToSave, selectedLang);
      const fallbackScan = {
        id: 'scan_call_' + Date.now(),
        input_type: 'call',
        message_text: textToSave,
        ...fallbackAnalysis,
        created_at: new Date().toISOString()
      };
      navigate(`/scans/${fallbackScan.id}`, { state: { scan: fallbackScan } });
    }
  };

  // Backup Manual Textbox Analyze button
  const handleAnalyzeManualText = () => {
    const cleaned = manualTypedText.trim();
    if (!cleaned) return;
    const combined = transcript.trim()
      ? `${transcript.trim()}\n${cleaned}`
      : cleaned;
    setFullTranscript(combined);
    performAnalysis(combined, { force: true });
  };

  // Highlight trigger phrases in transcript & show interim preview in grey
  const renderHighlightedTranscript = () => {
    const confirmedText = transcript.trim();
    if (!confirmedText && !interimText) {
      return (
        <span className="text-slate-400 italic">
          Spoken words will appear here in real-time as the caller speaks on speaker...
        </span>
      );
    }

    const phrases = (analysis.triggers || [])
      .map((t) => t.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(Boolean);

    let confirmedNodes;
    if (!confirmedText) {
      confirmedNodes = null;
    } else if (phrases.length === 0) {
      confirmedNodes = confirmedText.split(/(\s+)/).map((token, idx) =>
        /^\s+$/.test(token) ? (
          <span key={idx}>{token}</span>
        ) : (
          <span key={idx} className="word-fade">
            {token}
          </span>
        )
      );
    } else {
      const regex = new RegExp(`(${phrases.join('|')})`, 'gi');
      const parts = confirmedText.split(regex);
      confirmedNodes = parts.map((part, i) => {
        const isMatch = phrases.some((p) => p.toLowerCase() === part.toLowerCase());
        if (isMatch) {
          return (
            <mark
              key={i}
              className="word-fade bg-red-200 text-red-950 font-black px-1.5 py-0.5 rounded border border-red-400"
            >
              {part}
            </mark>
          );
        }
        return part.split(/(\s+)/).map((token, j) =>
          /^\s+$/.test(token) ? (
            <span key={`${i}-${j}`}>{token}</span>
          ) : (
            <span key={`${i}-${j}`} className="word-fade">
              {token}
            </span>
          )
        );
      });
    }

    return (
      <>
        {confirmedNodes}
        {interimText && (
          <span className="text-slate-400 italic ml-1.5">
            {interimText}
          </span>
        )}
      </>
    );
  };

  const activeLevel = isDemoRunning ? demoMicLevel : micLevel;

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
              <PhoneCall className="w-6 h-6 text-white" />
            </span>
            <span className="text-sm font-black uppercase tracking-widest text-red-200">
              ScamShield AI Live Call Guard
            </span>
          </div>

          {/* Secondary Button: Try Demo Call */}
          <button
            type="button"
            onClick={isDemoRunning ? handleStopDemo : handleStartDemo}
            className="min-h-[48px] px-4 py-2 bg-white hover:bg-slate-100 text-red-700 font-black rounded-xl text-sm shadow flex items-center gap-2 transition-all focus:ring-2 focus:ring-white"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isDemoRunning ? '⏹ Stop Demo' : '▶ Try Demo Call'}</span>
          </button>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Live Call Scam Interceptor
          </h1>
          <p className="text-lg text-slate-100 font-medium max-w-2xl">
            Put the caller on speaker phone. Our AI-powered guard listens in real-time and warns you immediately if they attempt a Digital Arrest, Police extortion, or Bank OTP scam.
          </p>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="bg-white/10 rounded-2xl p-4 border border-white/20 flex items-center gap-3 text-base font-bold">
          <Info className="w-6 h-6 text-amber-300 shrink-0" />
          <span>
            Instructions: Put the call on speaker, then tap Start Listening below.
          </span>
        </div>
      </div>

      {/* Friendly Microphone / Page Error Box */}
      <ErrorBox error={micError || error} />

      {/* Friendly 503 Service Notice (keeps listening without crashing) */}
      {(serviceNotice || analysisNotice) && (
        <div
          role="status"
          aria-live="polite"
          className="bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-2xl p-4 text-sm font-bold flex items-center gap-2.5"
        >
          <Info className="w-5 h-5 text-amber-700 shrink-0" />
          <span>{serviceNotice || analysisNotice}</span>
        </div>
      )}

      {/* Language Picker */}
      <div className="bg-white/95 p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-700">
          Listening Language:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { code: 'hi', label: 'हिंदी (Hindi)' },
            { code: 'en', label: 'English (India)' },
            { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' }
          ].map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLang(lang.code)}
              className={`min-h-[48px] px-4 py-2 rounded-xl text-sm font-bold transition-all ${
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
      <div className="bg-white/95 rounded-3xl border-2 border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 w-full space-y-4 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  isListening || isDemoRunning ? 'bg-red-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                {isDemoRunning
                  ? 'Demo Call Simulation Active'
                  : isListening
                  ? 'Microphone Listening to Speaker'
                  : 'Guard Standby'}
              </span>

              {isAnalyzing && (
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Analyzing…</span>
                </span>
              )}

              {analysis.source === 'rules' && (
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                  Quick check (AI busy)
                </span>
              )}
            </div>

            {/* Live Microphone Level Bar (Web Audio AnalyserNode) */}
            {(isListening || isDemoRunning) && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Live Mic Input Level</span>
                  </span>
                  <span className="tabular-nums">{activeLevel}%</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${
                      activeLevel > 75
                        ? 'bg-red-500'
                        : activeLevel > 15
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.max(4, activeLevel)}%` }}
                  />
                </div>

                {noAudioWarning && !isDemoRunning && (
                  <div className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>No audio detected — Put the call on speaker and move closer.</span>
                  </div>
                )}
              </div>
            )}

            <VerdictBadge
              riskLevel={analysis.risk_level}
              score={analysis.risk_score}
            />

            <div className="bg-slate-50 border-l-4 border-navy-900 p-4 rounded-r-xl text-left">
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

        {/* Primary Controls: Start Listening / Try Demo Call / Stop & View Report */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handleToggleListening}
            className={`min-h-[56px] py-3.5 px-5 rounded-2xl text-lg font-black transition-all shadow-md flex items-center justify-center gap-2.5 ${
              isListening
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-6 h-6 shrink-0" />
                <span>Pause Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-6 h-6 shrink-0" />
                <span>Start Listening</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={isDemoRunning ? handleStopDemo : handleStartDemo}
            className="min-h-[56px] py-3.5 px-5 bg-white hover:bg-slate-50 text-navy-950 border-2 border-navy-900 rounded-2xl text-lg font-black transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <span>{isDemoRunning ? 'Stop Demo' : 'Try Demo Call'}</span>
          </button>

          <button
            type="button"
            onClick={handleStopAndSave}
            disabled={savingCall || (!transcript.trim() && !manualTypedText.trim())}
            className="min-h-[56px] py-3.5 px-5 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-300 text-white rounded-2xl text-lg font-black transition-all shadow-md flex items-center justify-center gap-2.5"
          >
            <PhoneOff className="w-5 h-5 shrink-0" />
            <span>{savingCall ? 'Saving Report…' : 'Stop & View Report'}</span>
          </button>
        </div>
      </div>

      {/* Live Transcript Display Box */}
      <div className="bg-white/95 rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-black text-navy-950">
              Live Call Transcript
            </h3>
            {isAnalyzing && (
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 border border-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Analyzing…</span>
              </span>
            )}
          </div>

          {(transcript || manualTypedText) && (
            <button
              type="button"
              onClick={() => {
                if (isDemoRunning) handleStopDemo();
                resetTranscript();
                resetAnalysis();
                setManualTypedText('');
              }}
              className="min-h-[48px] px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl"
            >
              Clear Transcript
            </button>
          )}
        </div>

        {/* Highlighted text container */}
        <div className="min-h-[160px] max-h-[320px] overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-lg leading-relaxed font-medium whitespace-pre-line">
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

      {/* Backup Textbox: "Type what the caller said" */}
      <div className="bg-white/95 rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <Keyboard className="w-6 h-6 text-navy-900 shrink-0 mt-1" />
          <div>
            <label
              htmlFor="caller-typed-input"
              className="block text-lg font-black text-navy-950"
            >
              Type what the caller said (Backup Input)
            </label>
            <p className="text-sm text-slate-600 font-medium">
              If you are in a noisy room or on the same phone as the call, type what the caller is asking for below and tap Analyze:
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            id="caller-typed-input"
            rows={3}
            value={manualTypedText}
            onChange={(e) => setManualTypedText(e.target.value)}
            placeholder="e.g. Caller says he is CBI officer, found drugs in parcel under my Aadhaar, and says I am under digital arrest..."
            className="w-full p-4 rounded-2xl border-2 border-slate-300 text-base font-medium focus:border-navy-900 focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAnalyzeManualText}
              disabled={!manualTypedText.trim() || isAnalyzing}
              className="min-h-[48px] px-6 py-2.5 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-400 text-white font-bold rounded-xl text-base transition-colors"
            >
              {isAnalyzing ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
