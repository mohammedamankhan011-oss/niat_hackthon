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
import { AudioWaveform } from '../components/AudioWaveform';
import { MicDiagnosticModal } from '../components/MicDiagnosticModal';
import { CBI_DIGITAL_ARREST_DEMO } from '../utils/demoCallScript';
import { t } from '../utils/translations';
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
  Sparkles,
  Upload,
  FileAudio,
  Users,
  Smartphone,
  Activity,
  CheckCircle2
} from 'lucide-react';

export function LiveCallGuardPage() {
  const { language } = useAuth();
  const navigate = useNavigate();

  const [selectedLang, setSelectedLang] = useState(language || 'en');
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [manualTypedText, setManualTypedText] = useState('');
  const [savingCall, setSavingCall] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [error, setError] = useState(null);

  const demoIntervalRef = useRef(null);
  const audioInputRef = useRef(null);

  // Reliable Audio Capture & Speech Recognition Hook
  const {
    isSupported,
    isListening,
    transcript,
    interimText,
    audioLevel,
    frequencyData,
    guardState,
    statusMessage,
    monitoringMode,
    setMonitoringMode,
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
        performAnalysis(accumulated);
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
    }, 110); // Spoken word cadence
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

  // Handle Call Audio File Upload Fallback
  const handleAudioUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isListening) stopMic();
    if (isDemoRunning) handleStopDemo();

    setUploadingAudio(true);
    setError(null);

    try {
      const res = await api.calls.analyzeAudio({
        audioFile: file,
        language: selectedLang,
        save: true
      });

      if (res?.scan?.id) {
        navigate(`/scans/${res.scan.id}`);
      } else if (res?.transcript) {
        setFullTranscript(res.transcript);
        if (res.analysis) {
          performAnalysis(res.transcript);
        }
      }
    } catch (err) {
      console.error('Audio upload failed:', err);
      setError(err);
    } finally {
      setUploadingAudio(false);
      if (audioInputRef.current) {
        audioInputRef.current.value = '';
      }
    }
  };

  // Manual Typing Analysis
  const handleAnalyzeManualText = () => {
    if (!manualTypedText.trim()) return;
    setFullTranscript(manualTypedText);
    performAnalysis(manualTypedText);
  };

  // Highlight trigger phrases in transcript & fade in words as they appear
  const renderHighlightedTranscript = () => {
    const fullText = (transcript + (interimText ? ' ' + interimText : '')).trim();
    if (!fullText) {
      return (
        <span className="text-slate-400 italic">
          Spoken words will appear here in real-time as the caller speaks on speaker...
        </span>
      );
    }

    const phrases = (analysis.triggers || [])
      .map(t => t.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(Boolean);

    if (phrases.length === 0) {
      return fullText.split(/(\s+)/).map((token, idx) =>
        /^\s+$/.test(token) ? (
          <span key={idx}>{token}</span>
        ) : (
          <span key={idx} className="word-fade">
            {token}
          </span>
        )
      );
    }

    const regex = new RegExp(`(${phrases.join('|')})`, 'gi');
    const parts = fullText.split(regex);

    return parts.map((part, i) => {
      const isMatch = phrases.some(p => p.toLowerCase() === part.toLowerCase());
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

      {/* Microphone Diagnostic Modal */}
      <MicDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
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

          <div className="flex items-center gap-2">
            {/* 5-second Microphone Diagnostic Test Button */}
            <button
              type="button"
              onClick={() => setIsDiagnosticOpen(true)}
              className="min-h-[48px] px-3.5 py-2 bg-navy-950/70 hover:bg-navy-950 text-white font-bold rounded-xl text-xs sm:text-sm border border-white/20 shadow flex items-center gap-1.5 transition-all focus:ring-2 focus:ring-white"
            >
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>🎙️ Test Mic (5s)</span>
            </button>

            {/* Quick Demo Simulator Button */}
            <button
              type="button"
              onClick={isDemoRunning ? handleStopDemo : handleStartDemo}
              className="min-h-[48px] px-4 py-2 bg-white hover:bg-slate-100 text-red-700 font-black rounded-xl text-sm shadow flex items-center gap-2 transition-all focus:ring-2 focus:ring-white"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isDemoRunning ? '⏹ Stop Demo' : '▶ Demo Mode (Simulate Call)'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Live Call Scam Interceptor
          </h1>
          <p className="text-lg text-slate-100 font-medium max-w-2xl">
            Put the caller on speaker phone. Our AI-powered guard listens in real-time and warns you immediately if they attempt a Digital Arrest, Police extortion, or Bank OTP scam.
          </p>
        </div>

        {/* Honest Architecture & Elder Instructions Banner */}
        <div className="bg-white/10 rounded-2xl p-4 border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-bold">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-amber-300 shrink-0" />
            <span>
              Instructions: Put call on speakerphone, place phone next to this device, and tap Start Listening.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDiagnosticOpen(true)}
            className="text-amber-200 underline text-xs font-black shrink-0 hover:text-white"
          >
            Check Mic Status →
          </button>
        </div>
      </div>

      <ErrorBox error={error} />

      {/* Language Picker & Monitoring Mode Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monitoring Mode (Second Device vs This Device) */}
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Monitoring Mode:
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Honest Fallback Protection
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMonitoringMode('second_device')}
              className={`min-h-[48px] py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                monitoringMode === 'second_device'
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Second Device (Best)</span>
            </button>
            <button
              type="button"
              onClick={() => setMonitoringMode('this_device')}
              className={`min-h-[48px] py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                monitoringMode === 'this_device'
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4 shrink-0 text-sky-400" />
              <span>This Device (Speaker)</span>
            </button>
          </div>
        </div>

        {/* Language Picker */}
        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
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
                className={`flex-1 min-h-[48px] py-1.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
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
      </div>

      {/* Second Device Mode Notice */}
      {monitoringMode === 'second_device' && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-sky-950 font-medium">
          <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-sky-900">
              Why Second-Device Monitoring is Recommended:
            </span>
            <p>
              Mobile phone operating systems (Android & iOS) isolate the microphone during active SIM and WhatsApp calls to protect privacy, and hardware echo-cancellation suppresses the phone's own speaker. Placing a <strong>second device</strong> (family phone, tablet, or laptop) running ScamShield right next to the call speaker ensures 100% genuine voice capture and zero OS blocking.
            </p>
          </div>
        </div>
      )}

      {/* Live Risk Meter & Live Verdict Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-3 text-center md:text-left">
            {/* Real Accurate State Indicator */}
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  isDemoRunning
                    ? 'bg-amber-500 animate-ping'
                    : isListening
                    ? audioLevel > 5
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-400'
                    : 'bg-slate-400'
                }`}
              />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                {isDemoRunning
                  ? 'Demo Simulation Active'
                  : isListening
                  ? statusMessage || 'Microphone Active'
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

        {/* Real Live Audio Waveform & Level Meter */}
        <AudioWaveform
          audioLevel={audioLevel}
          frequencyData={frequencyData}
          isListening={isListening}
          state={guardState}
          statusMessage={statusMessage}
          onSwitchToSecondDevice={() => setMonitoringMode('second_device')}
        />

        {/* Live Controls: Start Listening / Stop & Save */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={handleToggleListening}
            className={`min-h-[56px] py-4 px-6 rounded-2xl text-xl font-black transition-all shadow-md flex items-center justify-center gap-3 ${
              isListening
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
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
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-navy-950">
              Live Call Transcript
            </h3>
            {isAnalyzing && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Analyzing words...</span>
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

      {/* Fallback Section: Upload Call Recording (Post-Call Analysis) */}
      <div className="bg-slate-50 rounded-3xl p-6 sm:p-7 border-2 border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-navy-900 text-white rounded-xl">
              <FileAudio className="w-6 h-6" />
            </span>
            <div>
              <h4 className="text-lg font-black text-slate-900">
                Upload Call Recording / Audio Note
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Already finished a call? Upload a permitted voice recording (.mp3, .m4a, .wav, .webm) for full Gemini scam analysis.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg,.aac"
              onChange={handleAudioUpload}
              className="hidden"
              id="call-audio-upload"
            />
            <label
              htmlFor="call-audio-upload"
              className={`min-h-[44px] px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-sm shadow cursor-pointer flex items-center justify-center gap-2 transition-all ${
                uploadingAudio ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {uploadingAudio ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transcribing & Analysing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Select Audio File</span>
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Fallback Box for Typing Mode */}
      <div className="bg-slate-100 rounded-3xl p-6 border-2 border-slate-300 space-y-4">
        <div className="flex items-start gap-3">
          <Keyboard className="w-6 h-6 text-slate-700 shrink-0 mt-1" />
          <div>
            <h4 className="text-lg font-black text-slate-900">
              Manual Call Notes / Key Phrases
            </h4>
            <p className="text-sm text-slate-600 font-medium">
              If you prefer typing or are in a noisy room, type key phrases spoken by the caller:
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
    </div>
  );
}
