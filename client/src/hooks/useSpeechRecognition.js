import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/endpoints';
import { isMockMode } from '../api/client';

/*
 * Live Call Guard listening engine.
 *
 * Two engines, picked automatically:
 *  - "browser": Chrome/Edge desktop speech recognition. Instant words, no server cost.
 *  - "server":  MediaRecorder chunks sent to POST /api/calls/transcribe.
 *               Used on phones, Brave/Firefox/Safari, or when the browser engine fails.
 *
 * The mic level meter always runs so the user can SEE that sound is reaching the app.
 */

const CHUNK_MS = 6000; // length of each audio chunk sent to the server
const SOUND_LEVEL = 3; // mic level (0-100) that counts as "sound"
const SILENT_CHUNK_LEVEL = 2; // chunks whose peak stays below this are not uploaded
const NO_AUDIO_WARNING_MS = 8000;
const BROWSER_STALL_MS = 15000; // sound heard but no words for this long -> switch to server engine
const FINAL_FLUSH_TIMEOUT_MS = 9000;

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];

function getSupportedMimeType() {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') return '';
  for (const type of MIME_CANDIDATES) {
    try {
      if (window.MediaRecorder.isTypeSupported(type)) return type;
    } catch (_) {}
  }
  return '';
}

function getLocale(lang) {
  if (lang === 'hi' || lang === 'hi-IN') return 'hi-IN';
  if (lang === 'kn' || lang === 'kn-IN') return 'kn-IN';
  return 'en-IN';
}

function canUseBrowserEngine(SR) {
  if (!SR || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isBrave = Boolean(navigator.brave);
  const isChromium = /Chrome|Edg\//.test(ua);
  return isChromium && !isMobile && !isBrave;
}

export function useSpeechRecognition({ language = 'en', onTranscriptChange } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [micLevel, setMicLevel] = useState(0);
  const [noAudioWarning, setNoAudioWarning] = useState(false);
  const [serviceNotice, setServiceNotice] = useState(null);
  const [error, setError] = useState(null);
  const [engine, setEngine] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isMountedRef = useRef(true);
  const isListeningRef = useRef(false);
  const languageRef = useRef(language);
  const transcriptRef = useRef('');
  const engineRef = useRef(null);
  const onChangeRef = useRef(onTranscriptChange);

  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const levelRafRef = useRef(null);
  const lastSoundTimeRef = useRef(0);
  const chunkStatsRef = useRef({ peak: 0 });

  const recorderRef = useRef(null);
  const chunkTimerRef = useRef(null);
  const appendChainRef = useRef(Promise.resolve());
  const pendingUploadsRef = useRef(0);
  const abortControllersRef = useRef(new Set());

  const recognitionRef = useRef(null);
  const recognitionRestartRef = useRef(null);
  const lastWordsTimeRef = useRef(0);
  const watchdogRef = useRef(null);

  const SpeechRecognitionClass =
    typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(navigator?.mediaDevices?.getUserMedia) &&
    Boolean(SpeechRecognitionClass || typeof window.MediaRecorder !== 'undefined');

  useEffect(() => {
    onChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  // ---------- transcript helpers ----------
  const commitTranscript = useCallback((next) => {
    transcriptRef.current = next;
    if (!isMountedRef.current) return;
    setTranscript(next);
    if (onChangeRef.current) onChangeRef.current(next);
  }, []);

  const appendFinalTranscript = useCallback(
    (chunkText) => {
      const clean = String(chunkText || '').replace(/\s+/g, ' ').trim();
      if (!clean) return;
      lastWordsTimeRef.current = Date.now();
      const next = transcriptRef.current ? `${transcriptRef.current} ${clean}` : clean;
      commitTranscript(next);
    },
    [commitTranscript]
  );

  // ---------- mic level meter ----------
  const startLevelMeter = useCallback((stream) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      lastSoundTimeRef.current = Date.now();

      const data = new Uint8Array(analyser.fftSize);
      let lastUi = 0;
      const tick = (now) => {
        if (!isListeningRef.current || !isMountedRef.current) return;
        levelRafRef.current = requestAnimationFrame(tick);
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const level = Math.min(100, Math.round(Math.sqrt(sum / data.length) * 400));

        // Every frame counts toward the current chunk's peak (no UI throttling here)
        if (level > chunkStatsRef.current.peak) chunkStatsRef.current.peak = level;
        if (level >= SOUND_LEVEL) lastSoundTimeRef.current = Date.now();

        if (now - lastUi < 100) return;
        lastUi = now;
        setMicLevel(level);
        setNoAudioWarning(Date.now() - lastSoundTimeRef.current >= NO_AUDIO_WARNING_MS);
      };
      levelRafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      console.warn('Mic level meter unavailable:', e);
    }
  }, []);

  // ---------- server engine (MediaRecorder chunks) ----------
  const uploadChunk = useCallback(
    (blob) => {
      if (isMockMode) return;
      const controller = new AbortController();
      abortControllersRef.current.add(controller);
      pendingUploadsRef.current += 1;
      if (isMountedRef.current) setIsProcessing(true);

      const request = api.calls
        .transcribe({ audioBlob: blob, language: languageRef.current, signal: controller.signal })
        .then((res) => {
          if (isMountedRef.current) setServiceNotice(null);
          return String(res?.text ?? res?.transcript ?? '').trim();
        })
        .catch((err) => {
          if (err?.name !== 'CanceledError' && err?.name !== 'AbortError' && isMountedRef.current) {
            setServiceNotice('Transcription is slow right now — still listening. You can also type below.');
          }
          return '';
        });

      // Append results strictly in recording order, even if replies come back out of order
      appendChainRef.current = appendChainRef.current
        .then(() => request)
        .then((text) => {
          if (text) appendFinalTranscript(text);
        })
        .finally(() => {
          abortControllersRef.current.delete(controller);
          pendingUploadsRef.current = Math.max(0, pendingUploadsRef.current - 1);
          if (isMountedRef.current && pendingUploadsRef.current === 0) setIsProcessing(false);
        });
    },
    [appendFinalTranscript]
  );

  const startRecorderChunk = useCallback(
    (stream) => {
      if (!isListeningRef.current || !stream.active) return;
      const mimeType = getSupportedMimeType();
      let recorder;
      try {
        recorder = mimeType ? new window.MediaRecorder(stream, { mimeType }) : new window.MediaRecorder(stream);
      } catch (_) {
        try {
          recorder = new window.MediaRecorder(stream);
        } catch (err) {
          console.warn('MediaRecorder unavailable:', err);
          return;
        }
      }

      // Each chunk owns its own stats object, so the next chunk can never reset it
      const stats = { peak: 0 };
      chunkStatsRef.current = stats;
      const parts = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) parts.push(e.data);
      };
      recorder.onstop = () => {
        if (!parts.length) return;
        const blob = new Blob(parts, { type: recorder.mimeType || mimeType || 'audio/webm' });
        if (blob.size < 1000) return;
        if (stats.peak < SILENT_CHUNK_LEVEL) return; // silence: skip, the AI would invent words
        uploadChunk(blob);
      };

      recorderRef.current = recorder;
      try {
        recorder.start();
      } catch (err) {
        console.warn('Recorder start failed:', err);
      }
    },
    [uploadChunk]
  );

  const startServerEngine = useCallback(
    (stream) => {
      if (typeof window.MediaRecorder === 'undefined') {
        setError('This browser cannot record audio. Please open ScamShield in Google Chrome, or type what the caller said below.');
        return;
      }
      engineRef.current = 'server';
      setEngine('server');
      startRecorderChunk(stream);
      chunkTimerRef.current = setInterval(() => {
        if (!isListeningRef.current) return;
        const current = recorderRef.current;
        if (current && current.state === 'recording') {
          try {
            current.stop(); // its onstop uploads that chunk
          } catch (_) {}
        }
        startRecorderChunk(stream);
      }, CHUNK_MS);
    },
    [startRecorderChunk]
  );

  // ---------- browser engine (Web Speech API) ----------
  const stopBrowserEngine = useCallback(() => {
    if (recognitionRestartRef.current) {
      clearTimeout(recognitionRestartRef.current);
      recognitionRestartRef.current = null;
    }
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch (_) {}
    }
    if (isMountedRef.current) setInterimText('');
  }, []);

  const switchToServerEngine = useCallback(() => {
    if (engineRef.current === 'server' || !isListeningRef.current || !streamRef.current) return;
    console.info('[LiveCallGuard] switching to server transcription');
    stopBrowserEngine();
    startServerEngine(streamRef.current);
  }, [stopBrowserEngine, startServerEngine]);

  const startBrowserEngine = useCallback(() => {
    engineRef.current = 'browser';
    setEngine('browser');
    lastWordsTimeRef.current = Date.now();

    const launch = () => {
      if (!isListeningRef.current || engineRef.current !== 'browser') return;
      let rec;
      try {
        rec = new SpeechRecognitionClass();
      } catch (_) {
        switchToServerEngine();
        return;
      }
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = getLocale(languageRef.current);

      rec.onresult = (event) => {
        let interim = '';
        let finals = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          if (r.isFinal) finals += `${r[0].transcript} `;
          else interim += r[0].transcript;
        }
        lastWordsTimeRef.current = Date.now();
        if (finals.trim()) appendFinalTranscript(finals);
        if (isMountedRef.current) setInterimText(interim);
      };

      rec.onerror = (e) => {
        const code = e?.error;
        if (code === 'not-allowed') {
          if (isMountedRef.current) {
            setError('Microphone permission denied. Click the lock icon in the address bar, set Microphone to "Allow", then press Start Listening again.');
          }
          return;
        }
        // Engine problems the browser cannot recover from -> use the server engine instead
        if (['network', 'audio-capture', 'service-not-allowed', 'language-not-supported', 'bad-grammar'].includes(code)) {
          switchToServerEngine();
        }
        // 'no-speech' and 'aborted' are normal; onend restarts recognition
      };

      rec.onend = () => {
        if (!isListeningRef.current || engineRef.current !== 'browser') return;
        recognitionRestartRef.current = setTimeout(launch, 150);
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (_) {
        recognitionRestartRef.current = setTimeout(launch, 400);
      }
    };

    launch();

    // Watchdog: sound is reaching the mic but the browser engine produces no words -> switch
    watchdogRef.current = setInterval(() => {
      if (!isListeningRef.current || engineRef.current !== 'browser') return;
      const now = Date.now();
      const soundRecently = now - lastSoundTimeRef.current < 3000;
      if (soundRecently && now - lastWordsTimeRef.current > BROWSER_STALL_MS) switchToServerEngine();
    }, 3000);
  }, [SpeechRecognitionClass, appendFinalTranscript, switchToServerEngine]);

  // Restart recognition with the new language when it changes mid-call
  useEffect(() => {
    languageRef.current = language;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop(); // onend relaunches with the new language
      } catch (_) {}
    }
  }, [language]);

  // ---------- teardown ----------
  const releaseHardware = useCallback(() => {
    if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current);
    levelRafRef.current = null;
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (_) {}
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch (_) {}
      streamRef.current = null;
    }
  }, []);

  const hardStop = useCallback(() => {
    isListeningRef.current = false;
    stopBrowserEngine();
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
    chunkTimerRef.current = null;
    const rec = recorderRef.current;
    recorderRef.current = null;
    if (rec) {
      rec.ondataavailable = null;
      rec.onstop = null;
      try {
        if (rec.state !== 'inactive') rec.stop();
      } catch (_) {}
    }
    abortControllersRef.current.forEach((c) => {
      try {
        c.abort();
      } catch (_) {}
    });
    abortControllersRef.current.clear();
    releaseHardware();
    engineRef.current = null;
    if (isMountedRef.current) {
      setIsListening(false);
      setInterimText('');
      setMicLevel(0);
      setNoAudioWarning(false);
      setEngine(null);
      setIsProcessing(false);
    }
  }, [stopBrowserEngine, releaseHardware]);

  // ---------- public API ----------
  const start = useCallback(async () => {
    if (isListeningRef.current) return;
    setError(null);
    setServiceNotice(null);
    setNoAudioWarning(false);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setError('Microphone is not available here. Open the site in Google Chrome over https, or type what the caller said below.');
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true, channelCount: 1 }
      });
    } catch (err) {
      const name = err?.name || '';
      let msg = 'Could not start the microphone. Check your device settings, or type what the caller said below.';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError') {
        msg = 'Microphone permission denied. Click the lock icon in the address bar, set Microphone to "Allow", then press Start Listening again.';
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        msg = 'No microphone found on this device. Connect one, or type what the caller said below.';
      } else if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') {
        msg = 'The microphone is busy (a phone call is probably using it). Open ScamShield on a laptop or second phone and put the call on SPEAKER next to it.';
      }
      if (isMountedRef.current) setError(msg);
      return;
    }

    if (!isMountedRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    streamRef.current = stream;
    isListeningRef.current = true;
    appendChainRef.current = Promise.resolve();
    setIsListening(true);

    startLevelMeter(stream);
    if (canUseBrowserEngine(SpeechRecognitionClass)) startBrowserEngine();
    else startServerEngine(stream);
  }, [SpeechRecognitionClass, startLevelMeter, startBrowserEngine, startServerEngine]);

  /**
   * Stops listening. Resolves with the final transcript once the last audio chunk
   * has been transcribed (max ~9 s), so "Stop & View Report" never loses the last words.
   */
  const stop = useCallback(async () => {
    if (!isListeningRef.current) return transcriptRef.current;
    isListeningRef.current = false;
    stopBrowserEngine();
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
    chunkTimerRef.current = null;

    // Flush the chunk in progress (its onstop handler uploads it)
    const rec = recorderRef.current;
    recorderRef.current = null;
    if (rec && rec.state === 'recording') {
      await new Promise((resolve) => {
        const prevOnStop = rec.onstop;
        rec.onstop = (e) => {
          try {
            if (prevOnStop) prevOnStop(e);
          } finally {
            resolve();
          }
        };
        try {
          rec.stop();
        } catch (_) {
          resolve();
        }
        setTimeout(resolve, 1500);
      });
    }
    releaseHardware();
    if (isMountedRef.current) {
      setIsListening(false);
      setInterimText('');
      setMicLevel(0);
      setNoAudioWarning(false);
    }

    await Promise.race([
      appendChainRef.current.catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, FINAL_FLUSH_TIMEOUT_MS))
    ]);
    engineRef.current = null;
    if (isMountedRef.current) setEngine(null);
    return transcriptRef.current;
  }, [stopBrowserEngine, releaseHardware]);

  const reset = useCallback(() => {
    hardStop();
    commitTranscript('');
    if (isMountedRef.current) {
      setError(null);
      setServiceNotice(null);
    }
  }, [hardStop, commitTranscript]);

  const appendText = useCallback((text) => appendFinalTranscript(text), [appendFinalTranscript]);

  const setFullTranscript = useCallback((text) => commitTranscript(String(text || '')), [commitTranscript]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      hardStop();
    };
  }, [hardStop]);

  return {
    isSupported,
    isListening,
    isProcessing,
    engine,
    transcript,
    interimText,
    micLevel,
    noAudioWarning,
    serviceNotice,
    error,
    start,
    stop,
    reset,
    appendText,
    setFullTranscript
  };
}
