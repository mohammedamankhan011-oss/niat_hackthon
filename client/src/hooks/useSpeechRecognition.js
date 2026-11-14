import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechRecognition({ language = 'en', onTranscriptChange } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState(null);

  const isListeningRef = useRef(false);
  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);

  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognitionClass;

  const getLocale = (lang) => {
    if (lang === 'hi') return 'hi-IN';
    if (lang === 'kn') return 'kn-IN';
    return 'en-IN';
  };

  // Keep ref in sync
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = getLocale(language);
    }
  }, [language]);

  const start = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Google Chrome or type below.');
      return;
    }

    try {
      manualStopRef.current = false;
      setError(null);

      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getLocale(language);

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
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
          setTranscript((prev) => {
            const next = (prev + ' ' + finalizedChunk).replace(/\s+/g, ' ').trim();
            if (onTranscriptChange) onTranscriptChange(next);
            return next;
          });
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition event error:', e.error);
        if (e.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone permissions in browser settings.');
          setIsListening(false);
          isListeningRef.current = false;
          manualStopRef.current = true;
        } else if (e.error !== 'no-speech') {
          // don't hard fail on harmless transient pauses
          setError(`Recognition notice: ${e.error}`);
        }
      };

      recognition.onend = () => {
        // Auto-restart if not manually stopped
        if (!manualStopRef.current && isListeningRef.current) {
          try {
            recognition.start();
          } catch (err) {
            // Wait slightly and restart
            setTimeout(() => {
              if (isListeningRef.current) {
                try { recognition.start(); } catch (_) {}
              }
            }, 300);
          }
        } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('Could not initialize microphone. Please check permissions.');
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [isSupported, language, onTranscriptChange]);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    isListeningRef.current = false;
    setIsListening(false);
    setInterimText('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        recognitionRef.current.abort();
      }
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setInterimText('');
    setError(null);
  }, [stop]);

  // Append manual text (for typed input or demo mode)
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

  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimText,
    error,
    start,
    stop,
    reset,
    appendText,
    setFullTranscript
  };
}
