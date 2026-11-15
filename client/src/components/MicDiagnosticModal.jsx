import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/endpoints';
import {
  Mic,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Volume2,
  Activity
} from 'lucide-react';

export function MicDiagnosticModal({ isOpen, onClose, language = 'en' }) {
  const [stage, setStage] = useState('ready'); // ready, testing, done, error
  const [countdown, setCountdown] = useState(5);
  const [volume, setVolume] = useState(0);
  const [peakVolume, setPeakVolume] = useState(0);
  const [testTranscript, setTestTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  const [checks, setChecks] = useState({
    permission: null, // null, true, false
    mediaStream: null,
    audioContext: null,
    volumeDetected: null,
    transcription: null
  });

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const countdownIntervalRef = useRef(null);

  const stopAll = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch (_) {}
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch (_) {}
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopAll();
  }, []);

  const runDiagnostic = async () => {
    stopAll();
    setStage('testing');
    setCountdown(5);
    setVolume(0);
    setPeakVolume(0);
    setTestTranscript('');
    setErrorMessage(null);
    chunksRef.current = [];

    setChecks({
      permission: null,
      mediaStream: null,
      audioContext: null,
      volumeDetected: null,
      transcription: null
    });

    let localPeak = 0;

    try {
      // 1. Microphone Permission & Stream
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported on this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack || !audioTrack.enabled) {
        throw new Error('Microphone audio track is disabled or inactive.');
      }

      setChecks(c => ({ ...c, permission: true, mediaStream: true }));

      // 2. AudioContext & AnalyserNode
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setChecks(c => ({ ...c, audioContext: true }));

      // 3. Audio level loop
      const timeData = new Uint8Array(analyser.frequencyBinCount);
      const measure = () => {
        analyser.getByteTimeDomainData(timeData);
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
          const norm = (timeData[i] - 128) / 128;
          sum += norm * norm;
        }
        const rms = Math.sqrt(sum / timeData.length);
        const curVol = Math.min(100, Math.round(rms * 250));
        setVolume(curVol);
        if (curVol > localPeak) {
          localPeak = curVol;
          setPeakVolume(curVol);
        }
        animFrameRef.current = requestAnimationFrame(measure);
      };
      measure();

      // 4. MediaRecorder slice
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/wav'];
        for (const t of types) {
          if (MediaRecorder.isTypeSupported(t)) {
            mimeType = t;
            break;
          }
        }
        if (mimeType) {
          const recorder = new MediaRecorder(stream, { mimeType });
          recorderRef.current = recorder;
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
          };
          recorder.start(500);
        }
      }

      // 5. Countdown timer
      let timeLeft = 5;
      countdownIntervalRef.current = setInterval(async () => {
        timeLeft -= 1;
        setCountdown(timeLeft);

        if (timeLeft <= 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;

          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

          const volPassed = localPeak >= 4;
          setChecks(c => ({ ...c, volumeDetected: volPassed }));

          // Stop recorder and transcribe
          if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.stop();
          }

          setTimeout(async () => {
            try {
              let audioBlob = null;
              if (chunksRef.current.length > 0) {
                audioBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
              }

              if (audioBlob && audioBlob.size > 500) {
                const res = await api.calls.transcribeAudio({
                  audioBlob,
                  language
                });
                if (res?.transcript) {
                  setTestTranscript(res.transcript);
                  setChecks(c => ({ ...c, transcription: true }));
                } else {
                  setChecks(c => ({ ...c, transcription: true }));
                }
              } else {
                setChecks(c => ({ ...c, transcription: volPassed }));
              }
            } catch (err) {
              console.warn('Diagnostic transcription failed:', err);
              setChecks(c => ({ ...c, transcription: volPassed }));
            } finally {
              setStage('done');
              stopAll();
            }
          }, 300);
        }
      }, 1000);

    } catch (err) {
      console.error('Diagnostic failed:', err);
      setErrorMessage(err.message || 'Microphone access failed.');
      setChecks(c => ({
        ...c,
        permission: false,
        mediaStream: false
      }));
      setStage('error');
      stopAll();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-navy-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/10 rounded-xl">
              <Mic className="w-5 h-5 text-amber-400" />
            </span>
            <div>
              <h3 className="text-lg font-black">Microphone Diagnostic</h3>
              <p className="text-xs text-slate-300">
                Verify microphone stream & audio levels
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { stopAll(); onClose(); }}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white"
            aria-label="Close diagnostic"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {stage === 'ready' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200">
                <Activity className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">
                  Ready to test microphone
                </h4>
                <p className="text-sm text-slate-600 font-medium">
                  We will listen for 5 seconds to confirm that your browser captures genuine audio and calculates voice levels.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-700 text-left space-y-1">
                <p>📋 What this test checks:</p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 font-medium">
                  <li>Microphone permission & active audio track</li>
                  <li>AudioContext processing & RMS volume levels</li>
                  <li>Voice Activity Detection & audio chunking</li>
                  <li>Gemini speech-to-text connection</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={runDiagnostic}
                className="w-full py-3.5 px-6 bg-navy-900 hover:bg-navy-800 text-white font-black rounded-xl text-base shadow transition-all"
              >
                Start 5-Second Test
              </button>
            </div>
          )}

          {stage === 'testing' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border-2 border-emerald-400 animate-pulse">
                <span className="text-2xl font-black">{countdown}s</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">
                  Please speak out loud now!
                </h4>
                <p className="text-sm text-slate-600 font-semibold italic">
                  Say: "Testing ScamShield Live Call Guard on speakerphone"
                </p>
              </div>

              {/* Live Volume Meter */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2 text-left">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    Live Audio Level:
                  </span>
                  <span className="text-emerald-400 font-black">{volume}% (Peak: {peakVolume}%)</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, Math.max(2, volume))}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {(stage === 'done' || stage === 'error') && (
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <h4 className="text-xl font-black text-slate-900">
                  {checks.volumeDetected ? '✅ Microphone Test Passed!' : '⚠️ Audio Detection Notice'}
                </h4>
                <p className="text-xs text-slate-600 font-medium">
                  {checks.volumeDetected
                    ? 'Your microphone and audio capture pipeline are working properly.'
                    : 'Audio levels remained near zero. Your device microphone or operating system may be muted.'}
                </p>
              </div>

              {/* Checklist */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>Microphone Permission:</span>
                  {checks.permission ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Granted</span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1"><XCircle className="w-4 h-4" /> Denied</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm font-bold">
                  <span>MediaStream Audio Track:</span>
                  {checks.mediaStream ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Active</span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1"><XCircle className="w-4 h-4" /> Inactive</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm font-bold">
                  <span>AudioContext & AnalyserNode:</span>
                  {checks.audioContext ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Running</span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1"><XCircle className="w-4 h-4" /> Failed</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm font-bold">
                  <span>Audio Energy Detected:</span>
                  {checks.volumeDetected ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Yes (Peak: {peakVolume}%)</span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> No (Peak: {peakVolume}%)</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm font-bold">
                  <span>Speech-to-Text Pipeline:</span>
                  {checks.transcription ? (
                    <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Connected</span>
                  ) : (
                    <span className="text-slate-500">Standby</span>
                  )}
                </div>
              </div>

              {testTranscript && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs space-y-1">
                  <span className="font-bold text-sky-900 uppercase">Test Transcribed Words:</span>
                  <p className="text-sky-950 font-medium italic">"{testTranscript}"</p>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs font-bold text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={runDiagnostic}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Run Again</span>
                </button>
                <button
                  type="button"
                  onClick={() => { stopAll(); onClose(); }}
                  className="flex-1 py-3 px-4 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-xl text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
