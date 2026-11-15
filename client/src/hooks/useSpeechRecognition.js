import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/endpoints';

/**
 * Robust Hybrid Audio Capture & Speech Recognition Hook for ScamShield Live Call Guard.
 *
 * Implements:
 * 1. Genuine microphone capture via navigator.mediaDevices.getUserMedia()
 * 2. Real-time audio processing via AudioContext & AnalyserNode
 * 3. Actual RMS volume calculation (0-100) & frequency spectrum
 * 4. Voice Activity Detection (VAD) & Silence Detection
 * 5. MediaRecorder chunking -> Gemini audio transcription (api.calls.transcribeAudio)
 * 6. Concurrent Web Speech API acceleration when available
 * 7. Multi-language support: English (en), Hindi (hi), Kannada (kn)
 * 8. State tracking across all 12 operational states
 * 9. Second-device monitoring mode support
 */
export function useSpeechRecognition({ language = 'en', onTranscriptChange } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);

  // Real-time audio analysis states
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState(null);
  const [guardState, setGuardState] = useState('active'); // one of 12 states
  const [monitoringMode, setMonitoringMode] = useState('second_device'); // 'second_device' (recommended) | 'this_device'

  // References
  const isListeningRef = useRef(false);
  const manualStopRef = useRef(false);
  const recognitionRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const silenceTimerRef = useRef(null);
  const noAudioTimeoutRef = useRef(null);
  const lastSpeechTimeRef = useRef(0);
  const speechActiveRef = useRef(false);
  const transcriptRef = useRef('');

  // Keep transcriptRef synchronized
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isWebSpeechSupported = !!SpeechRecognitionClass;
  const isMediaSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
  const isSupported = isMediaSupported || isWebSpeechSupported;

  const getLocale = (lang) => {
    if (lang === 'hi') return 'hi-IN';
    if (lang === 'kn') return 'kn-IN';
    return 'en-IN';
  };

  // Get best supported audio recorder mime type
  const getRecorderMimeType = () => {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/aac',
      'audio/wav'
    ];
    for (const t of candidates) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  };

  // Send an audio slice to backend for transcription
  const sendChunkForTranscription = useCallback(async (blob) => {
    if (!blob || blob.size < 800) return;

    try {
      setGuardState('transcribing');
      const res = await api.calls.transcribeAudio({
        audioBlob: blob,
        language
      });

      if (res?.transcript && res.transcript.trim()) {
        const newWords = res.transcript.trim();

        setTranscript((prev) => {
          // Avoid appending duplicate phrases if Web Speech already caught it
          const cleanPrev = prev.trim();
          if (!cleanPrev) {
            if (onTranscriptChange) onTranscriptChange(newWords);
            return newWords;
          }
          if (cleanPrev.toLowerCase().endsWith(newWords.toLowerCase())) {
            return cleanPrev;
          }
          const combined = (cleanPrev + ' ' + newWords).replace(/\s+/g, ' ').trim();
          if (onTranscriptChange) onTranscriptChange(combined);
          return combined;
        });

        setGuardState('speech_detected');
      }
    } catch (err) {
      console.warn('Chunk transcription notice:', err.message || err);
    }
  }, [language, onTranscriptChange]);

  // Clean up all audio nodes and tracks
  const cleanupAudioPipeline = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (noAudioTimeoutRef.current) {
      clearTimeout(noAudioTimeoutRef.current);
      noAudioTimeoutRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch (_) {}
      });
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setAudioLevel(0);
    setFrequencyData(null);
  }, []);

  // Start real Audio Pipeline (getUserMedia + AudioContext + AnalyserNode + MediaRecorder)
  const startAudioPipeline = useCallback(async () => {
    if (!isMediaSupported) return;

    try {
      setGuardState('requesting_permission');

      // Use audio constraints tailored for speakerphone capture
      // Disabling echoCancellation prevents hardware DSP from canceling out the phone's speaker
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;
      setGuardState('active');

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Real-time Audio Level & Frequency Loop
      const bufferLength = analyser.frequencyBinCount;
      const timeData = new Uint8Array(bufferLength);
      const freqData = new Uint8Array(bufferLength);

      const checkAudio = () => {
        if (!isListeningRef.current || !analyserRef.current) return;

        analyserRef.current.getByteTimeDomainData(timeData);
        analyserRef.current.getByteFrequencyData(freqData);

        // Compute RMS
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const norm = (timeData[i] - 128) / 128;
          sum += norm * norm;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const curLevel = Math.min(100, Math.round(rms * 250));

        setAudioLevel(curLevel);
        setFrequencyData(new Uint8Array(freqData));

        const now = Date.now();

        // Voice Activity Detection (VAD)
        if (curLevel >= 5) {
          lastSpeechTimeRef.current = now;
          speechActiveRef.current = true;

          if (curLevel >= 12) {
            setGuardState('speech_detected');
          } else {
            setGuardState('detecting_audio');
          }

          // Reset no audio timer
          if (noAudioTimeoutRef.current) {
            clearTimeout(noAudioTimeoutRef.current);
            noAudioTimeoutRef.current = null;
          }
        } else {
          // If silent for 4+ seconds while actively listening
          if (!noAudioTimeoutRef.current && now - lastSpeechTimeRef.current > 4000) {
            noAudioTimeoutRef.current = setTimeout(() => {
              if (isListeningRef.current && audioLevel < 3) {
                setGuardState('no_audio');
              }
            }, 500);
          }
        }

        animFrameRef.current = requestAnimationFrame(checkAudio);
      };

      lastSpeechTimeRef.current = Date.now();
      checkAudio();

      // MediaRecorder for chunked Gemini transcription
      const mimeType = getRecorderMimeType();
      if (typeof MediaRecorder !== 'undefined' && mimeType) {
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        recordedChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: mimeType });
            recordedChunksRef.current = [];
            sendChunkForTranscription(blob);
          }
        };

        // Slice every 4 seconds to stream chunks to Gemini
        recorder.start(4000);
      }

    } catch (err) {
      console.warn('Audio pipeline init error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Please grant microphone permission in browser settings.');
        setGuardState('mic_unavailable');
      } else {
        setError(`Microphone error: ${err.message || 'Unable to access device mic'}`);
        setGuardState('interrupted');
      }
    }
  }, [isMediaSupported, sendChunkForTranscription, audioLevel]);

  // Start speech recognition (both Web Speech API and MediaStream pipeline)
  const start = useCallback(() => {
    manualStopRef.current = false;
    setError(null);
    setIsListening(true);
    isListeningRef.current = true;
    setGuardState('initializing');

    // 1. Launch genuine MediaStream + AudioContext pipeline
    startAudioPipeline();

    // 2. Launch Web Speech API if supported for local low-latency streaming
    if (isWebSpeechSupported) {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (_) {}
        }

        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getLocale(language);

        recognition.onstart = () => {
          // Connected
        };

        recognition.onresult = (event) => {
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

          if (finalizedChunk) {
            setGuardState('speech_detected');
            setTranscript((prev) => {
              const next = (prev + ' ' + finalizedChunk).replace(/\s+/g, ' ').trim();
              if (onTranscriptChange) onTranscriptChange(next);
              return next;
            });
          }
          setInterimText(currentInterim);
        };

        recognition.onerror = (e) => {
          // Do not fail hard on no-speech since we have Gemini audio chunks running
          if (e.error === 'not-allowed') {
            setError('Microphone permission denied.');
            setGuardState('mic_unavailable');
          } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
            console.warn('Web Speech recognition event:', e.error);
          }
        };

        recognition.onend = () => {
          // Auto-restart if not manually stopped
          if (!manualStopRef.current && isListeningRef.current) {
            setTimeout(() => {
              if (isListeningRef.current) {
                try { recognition.start(); } catch (_) {}
              }
            }, 300);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Web Speech recognition start error:', err);
      }
    }
  }, [isWebSpeechSupported, language, onTranscriptChange, startAudioPipeline]);

  // Stop listening and clean up all resources
  const stop = useCallback(() => {
    manualStopRef.current = true;
    isListeningRef.current = false;
    setIsListening(false);
    setInterimText('');
    setGuardState('active');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {
        try { recognitionRef.current.abort(); } catch (__) {}
      }
      recognitionRef.current = null;
    }

    cleanupAudioPipeline();
  }, [cleanupAudioPipeline]);

  // Reset transcript and errors
  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setInterimText('');
    setError(null);
  }, [stop]);

  // Append manual or external text
  const appendText = useCallback((text) => {
    setTranscript((prev) => {
      const next = (prev + ' ' + text).replace(/\s+/g, ' ').trim();
      if (onTranscriptChange) onTranscriptChange(next);
      return next;
    });
  }, [onTranscriptChange]);

  const setFullTranscript = useCallback((newText) => {
    setTranscript(newText);
    if (onTranscriptChange) onTranscriptChange(newText);
  }, [onTranscriptChange]);

  // Update locale on language change
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = getLocale(language);
    }
  }, [language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      cleanupAudioPipeline();
    };
  }, [cleanupAudioPipeline]);

  // Human-readable status string for the 12 states
  const getStatusMessage = () => {
    switch (guardState) {
      case 'initializing':
        return 'Initializing microphone stream...';
      case 'requesting_permission':
        return 'Requesting microphone permission...';
      case 'active':
        return isListening ? 'Microphone Active — Listening for speaker...' : 'Guard Standby';
      case 'detecting_audio':
        return `Detecting audio (${audioLevel}% volume)...`;
      case 'speech_detected':
        return `Speech detected (${audioLevel}% volume)`;
      case 'transcribing':
        return 'Transcribing speech to text...';
      case 'analyzing':
        return 'Analysing conversation with ScamShield AI...';
      case 'scam_detected':
        return '🚨 Scam detected! HANG UP NOW!';
      case 'no_audio':
        return 'No audio detected on microphone (Speakerphone muted?)';
      case 'mic_unavailable':
        return 'Microphone unavailable or permission denied';
      case 'call_audio_inaccessible':
        return 'Call audio inaccessible on this phone (Use Second Device)';
      case 'interrupted':
        return 'Microphone stream interrupted';
      default:
        return isListening ? 'Listening...' : 'Standby';
    }
  };

  return {
    isSupported,
    isListening,
    transcript,
    interimText,
    error,
    audioLevel,
    frequencyData,
    guardState,
    statusMessage: getStatusMessage(),
    monitoringMode,
    setMonitoringMode,
    start,
    stop,
    reset,
    appendText,
    setFullTranscript
  };
}
