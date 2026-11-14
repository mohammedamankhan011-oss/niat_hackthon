import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/endpoints';

export function useLiveCallAnalysis({ transcript, language = 'en', onScamTrigger, enabled = false }) {
  const [analysis, setAnalysis] = useState({
    risk_level: 'safe',
    risk_score: 0,
    scam_type: 'none',
    triggers: [],
    advice: 'Put the call on speaker. Analysis will activate as words are spoken.',
    say_this: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scamAlertActive, setScamAlertActive] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  const lastAnalyzedTranscriptRef = useRef('');
  const isAnalyzingRef = useRef(false);
  const transcriptRef = useRef(transcript);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const performAnalysis = useCallback(async (currentText) => {
    if (!currentText || currentText.trim().length === 0) return;
    if (isAnalyzingRef.current) return;

    // Only re-analyze if new words have been added
    if (currentText.trim() === lastAnalyzedTranscriptRef.current.trim()) {
      return;
    }

    try {
      isAnalyzingRef.current = true;
      setIsAnalyzing(true);

      // Last 4000 characters as per spec
      const slicedTranscript = currentText.slice(-4000);
      const res = await api.calls.analyze({
        transcript: slicedTranscript,
        language
      });

      lastAnalyzedTranscriptRef.current = currentText;
      setLastCheckTime(new Date());

      if (res?.analysis) {
        setAnalysis(res.analysis);

        // If risk level becomes "scam"
        if (res.analysis.risk_level === 'scam') {
          setScamAlertActive(true);

          // Vibrate phone if supported
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate([400, 200, 400, 200, 800]);
            } catch (e) {
              // Ignore vibration failure
            }
          }

          if (onScamTrigger) {
            onScamTrigger(res.analysis);
          }
        }
      }
    } catch (err) {
      console.warn('Live call analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
    }
  }, [language, onScamTrigger]);

  // Periodic 15 second check when listening or demo is active
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const current = transcriptRef.current;
      if (current && current.trim().length > 0) {
        performAnalysis(current);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [enabled, performAnalysis]);

  const dismissAlert = useCallback(() => {
    setScamAlertActive(false);
  }, []);

  const resetAnalysis = useCallback(() => {
    lastAnalyzedTranscriptRef.current = '';
    setScamAlertActive(false);
    setAnalysis({
      risk_level: 'safe',
      risk_score: 0,
      scam_type: 'none',
      triggers: [],
      advice: 'Put the call on speaker. Analysis will activate as words are spoken.',
      say_this: ''
    });
  }, []);

  return {
    analysis,
    isAnalyzing,
    scamAlertActive,
    lastCheckTime,
    performAnalysis,
    dismissAlert,
    resetAnalysis
  };
}
