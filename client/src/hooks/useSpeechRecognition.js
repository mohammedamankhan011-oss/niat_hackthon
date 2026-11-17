import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/endpoints';
import { isMockMode } from '../api/client';

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg'
];

function getSupportedMimeType() {
  if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
    return '';
  }
  for (const type of MIME_CANDIDATES) {
    try {
      if (window.MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    } catch (_) {}
  }
  return '';
}

function getLocale(lang) {
  if (lang === 'hi') return 'hi-IN';
  if (lang === 'kn') return 'kn-IN';
  return 'en-IN';
}

export function useSpeechRecognition({ language = 'en', onTranscriptChange } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [micLevel, setMicLevel] = useState(0);
  const [noAudioWarning, setNoAudioWarning] = useState(false);
  const [serviceNotice, setServiceNotice] = useState(null);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const isListeningRef = useRef(false);
  const manualStopRef = useRef(false);
  const languageRef = useRef(language);
  const serverHasTranscribedRef = useRef(false);

  // Hardware & engine refs
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const levelRafRef = useRef(null);
  const lastSoundTimeRef = useRef(0);
  const chunkPeakLevelRef = useRef(0);

  const mediaRecorderRef = useRef(null);
  const chunkIntervalRef = useRef(null);
  const transcribeAbortRef = useRef(null);

  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);

  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(
      SpeechRecognitionClass ||
        (navigator?.mediaDevices?.getUserMedia && typeof window.MediaRecorder !== 'undefined')
    );

  useEffect(() => {
    languageRef.current = language;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = getLocale(language);
      } catch (_) {}
    }
  }, [language]);

  const appendFinalTranscript = useCallback(
    (chunkText) => {
      if (!chunkText || !chunkText.trim() || !isMountedRef.current) return;
      setTranscript((prev) => {
        const next = (prev + ' ' + chunkText.trim()).replace(/\s+/g, ' ').trim();
        if (onTranscriptChange) onTranscriptChange(next);
        return next;
      });
    },
    [onTranscriptChange]
  );

  // Clean up all media, audio context, recorder, speech recognition, and timers
  const cleanupAll = useCallback(() => {
    manualStopRef.current = true;
    isListeningRef.current = false;

    if (levelRafRef.current) {
      cancelAnimationFrame(levelRafRef.current);
      levelRafRef.current = null;
    }

    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (transcribeAbortRef.current) {
      try {
        transcribeAbortRef.current.abort();
      } catch (_) {}
      transcribeAbortRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.ondataavailable = null;
        mediaRecorderRef.current.onstop = null;
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (_) {}
      mediaRecorderRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (_) {}
      audioCtxRef.current = null;
      analyserRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (_) {}
      streamRef.current = null;
    }

    if (isMountedRef.current) {
      setIsListening(false);
      setInterimText('');
      setMicLevel(0);
      setNoAudioWarning(false);
    }
  }, []);

  // Start Web Audio AnalyserNode level meter + 8s silence detector
  const startAudioLevelMeter = useCallback((stream) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      lastSoundTimeRef.current = Date.now();

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastUiUpdate = 0;

      const sampleLevel = (now) => {
        if (!isListeningRef.current || !analyserRef.current || !isMountedRef.current) return;
        levelRafRef.current = requestAnimationFrame(sampleLevel);

        if (now - lastUiUpdate < 90) return; // update ~11 times/sec for smooth zero-lag UI
        lastUiUpdate = now;

        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        const scaledLevel = Math.min(100, Math.round(rms * 320));

        // Track peak mic level during the current 8s recording chunk
        if (scaledLevel > chunkPeakLevelRef.current) {
          chunkPeakLevelRef.current = scaledLevel;
        }

        setMicLevel(scaledLevel);

        if (scaledLevel >= 4) {
          lastSoundTimeRef.current = Date.now();
          setNoAudioWarning(false);
        } else if (Date.now() - lastSoundTimeRef.current >= 8000) {
          setNoAudioWarning(true);
        }
      };

      levelRafRef.current = requestAnimationFrame(sampleLevel);
    } catch (e) {
      console.warn('Web Audio Analyser initialization warning:', e);
    }
  }, []);

  // Start MediaRecorder 8-second standalone chunk loop -> POST /api/calls/transcribe
  const startMediaRecorderLoop = useCallback(
    (stream) => {
      if (typeof window === 'undefined' || typeof window.MediaRecorder === 'undefined') {
        return;
      }

      const mimeType = getSupportedMimeType();

      const startSingleChunkRecorder = () => {
        if (!isListeningRef.current || !stream.active) return;

        // Reset peak level tracker for this new 8s chunk
        chunkPeakLevelRef.current = 0;

        let chunks = [];
        let recorder;
        try {
          recorder = mimeType
            ? new window.MediaRecorder(stream, { mimeType })
            : new window.MediaRecorder(stream);
        } catch (err) {
          try {
            recorder = new window.MediaRecorder(stream);
          } catch (_) {
            return;
          }
        }

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const peakForThisChunk = chunkPeakLevelRef.current;
          chunkPeakLevelRef.current = 0;

          if (!chunks.length || !isMountedRef.current) return;
          const blob = new Blob(chunks, { type: mimeType || 'audio/webm' });
          chunks = [];
          if (blob.size < 400) return;

          // If the chunk was silent (level stayed below threshold the whole time), do NOT upload it
          if (analyserRef.current && peakForThisChunk < 4) {
            return;
          }

          if (isMockMode) return;

          try {
            const controller = new AbortController();
            transcribeAbortRef.current = controller;
            const res = await api.calls.transcribe({
              audioBlob: blob,
              language: languageRef.current,
              signal: controller.signal
            });
            if (!isMountedRef.current) return;
            setServiceNotice(null);
            // Read reply from "text" (fall back to "transcript")
            const textChunk = String(res?.text ?? res?.transcript ?? '').trim();
            if (textChunk) {
              serverHasTranscribedRef.current = true;
              appendFinalTranscript(textChunk);
            }
          } catch (err) {
            if (!isMountedRef.current) return;
            if (err?.response?.status === 503) {
              setServiceNotice(
                'Transcription service is temporarily busy (503) — keeping Live Call Guard active.'
              );
            }
            console.warn('Chunk transcription skipped:', err?.message || err);
          }
        };

        mediaRecorderRef.current = recorder;
        try {
          recorder.start();
        } catch (_) {}
      };

      startSingleChunkRecorder();

      // Every 8 seconds stop + restart recorder to produce a complete standalone file chunk
      chunkIntervalRef.current = setInterval(() => {
        if (!isListeningRef.current) return;
        const currentRec = mediaRecorderRef.current;
        if (currentRec && currentRec.state === 'recording') {
          try {
            currentRec.stop();
          } catch (_) {}
        }
        startSingleChunkRecorder();
      }, 8000);
    },
    [appendFinalTranscript]
  );

  // Start browser webkitSpeechRecognition for instant live preview words
  const startBrowserSpeechRecognition = useCallback(() => {
    if (!SpeechRecognitionClass) return;

    const launchRecognition = () => {
      if (!isListeningRef.current || manualStopRef.current || !isMountedRef.current) return;

      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getLocale(languageRef.current);

        recognition.onresult = (event) => {
          if (!isMountedRef.current) return;
          let currentInterim = '';
          let finalizedChunk = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item.isFinal) {
              finalizedChunk += item[0].transcript + ' ';
            } else {
              currentInterim += item[0].transcript;
            }
          }

          if (finalizedChunk.trim()) {
            // If server hasn't taken over or in mock mode, append speech recognition final text so transcript always grows
            if (isMockMode || !serverHasTranscribedRef.current) {
              appendFinalTranscript(finalizedChunk);
            }
            setInterimText('');
          } else {
            setInterimText(currentInterim);
          }
        };

        recognition.onerror = (e) => {
          if (!isMountedRef.current) return;
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            return;
          }
          // Auto-restart on 'no-speech' or 'network' errors while listening
          if (
            (e.error === 'no-speech' || e.error === 'network' || e.error === 'aborted') &&
            isListeningRef.current &&
            !manualStopRef.current
          ) {
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (isListeningRef.current && !manualStopRef.current) {
                try {
                  recognition.start();
                } catch (_) {
                  launchRecognition();
                }
              }
            }, 350);
          }
        };

        recognition.onend = () => {
          if (!manualStopRef.current && isListeningRef.current && isMountedRef.current) {
            if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
            restartTimerRef.current = setTimeout(() => {
              if (isListeningRef.current && !manualStopRef.current) {
                try {
                  recognition.start();
                } catch (_) {
                  launchRecognition();
                }
              }
            }, 250);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('SpeechRecognition preview warning:', err);
      }
    };

    launchRecognition();
  }, [SpeechRecognitionClass, appendFinalTranscript]);

  // Request mic permissions first, then start level meter + MediaRecorder + SpeechRecognition
  const start = useCallback(async () => {
    if (!isMountedRef.current) return;
    setError(null);
    setNoAudioWarning(false);
    manualStopRef.current = false;
    serverHasTranscribedRef.current = false;

    if (!navigator?.mediaDevices?.getUserMedia) {
      setError(
        'Microphone access is not available in this browser. Please use Google Chrome or type what the caller said below.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true
        }
      });

      if (!isMountedRef.current || manualStopRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      isListeningRef.current = true;
      setIsListening(true);

      startAudioLevelMeter(stream);
      startMediaRecorderLoop(stream);
      startBrowserSpeechRecognition();
    } catch (err) {
      console.warn('Microphone access error:', err);
      const errName = err?.name || '';
      let friendlyMsg =
        'Could not access the microphone. Please check your device settings or use the manual text box below.';

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        friendlyMsg =
          'Microphone permission denied. How to allow: tap the lock / site settings icon on the left of your browser address bar, set Microphone to "Allow", and tap Start Listening again.';
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        friendlyMsg =
          'No microphone was found on this device. Please connect a microphone or use the "Type what the caller said" box below.';
      } else if (
        errName === 'NotReadableError' ||
        errName === 'TrackStartError' ||
        errName === 'AbortError'
      ) {
        friendlyMsg =
          'Your phone call is using this mic. Open ScamShield on a laptop or second phone and put the call on SPEAKER near it.';
      }

      if (isMountedRef.current) {
        setError(friendlyMsg);
        setIsListening(false);
      }
      isListeningRef.current = false;
    }
  }, [startAudioLevelMeter, startMediaRecorderLoop, startBrowserSpeechRecognition]);

  const stop = useCallback(() => {
    cleanupAll();
  }, [cleanupAll]);

  const reset = useCallback(() => {
    cleanupAll();
    if (isMountedRef.current) {
      setTranscript('');
      setInterimText('');
      setError(null);
      setNoAudioWarning(false);
      setMicLevel(0);
    }
  }, [cleanupAll]);

  const appendText = useCallback(
    (text) => {
      if (!isMountedRef.current) return;
      appendFinalTranscript(text);
    },
    [appendFinalTranscript]
  );

  const setFullTranscript = useCallback(
    (newText) => {
      if (!isMountedRef.current) return;
      setTranscript(newText);
      if (onTranscriptChange) onTranscriptChange(newText);
    },
    [onTranscriptChange]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupAll();
    };
  }, [cleanupAll]);

  return {
    isSupported,
    isListening,
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
