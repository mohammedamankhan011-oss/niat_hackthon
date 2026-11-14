import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for Web Speech API text-to-speech synthesis with Indian locale support.
 * Locales: en -> en-IN, hi -> hi-IN, kn -> kn-IN.
 * Falls back gracefully to available Indian English / English voice if specific voice is missing.
 */
export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [fallbackNote, setFallbackNote] = useState('');
  const [voices, setVoices] = useState([]);
  const activeUtteranceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    }
  }, []);

  const speak = useCallback((text, lang = 'en') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    // Stop previous utterance
    stop();

    if (!text || !text.trim()) return;

    // Map to BCP-47 locale
    const targetLang = lang === 'hi' ? 'hi-IN' : lang === 'kn' ? 'kn-IN' : 'en-IN';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;
    utterance.rate = 0.95; // Slightly slower, clear pacing for senior citizens

    // Find closest voice
    let selectedVoice = null;
    let fallback = '';

    // First try exact match
    selectedVoice = voices.find(v => v.lang.toLowerCase() === targetLang.toLowerCase());

    // Second try language prefix
    if (!selectedVoice) {
      const prefix = targetLang.split('-')[0];
      selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
    }

    // Fall back to en-IN or general en
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.toLowerCase() === 'en-in') ||
                      voices.find(v => v.lang.toLowerCase().startsWith('en'));
      if (lang === 'hi' || lang === 'kn') {
        fallback = `Your device does not have ${lang === 'hi' ? 'Hindi' : 'Kannada'} voice installed; reading in Indian English.`;
      }
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    setFallbackNote(fallback);

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    };

    activeUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voices, stop]);

  return {
    speak,
    stop,
    isSpeaking,
    fallbackNote
  };
}
