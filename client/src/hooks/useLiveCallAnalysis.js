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
  const [analysisNotice, setAnalysisNotice] = useState(null);

  const isMountedRef = useRef(true);
  const lastAnalyzedLengthRef = useRef(0);
  const isAnalyzingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const transcriptRef = useRef(transcript);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const hasWords = Boolean(transcript && transcript.trim().length > 0);

  const performAnalysis = useCallback(
    async (currentText, { force = false } = {}) => {
      const cleaned = (currentText || '').trim();
      if (!cleaned) return;

      // Never send two analyze requests at once
      if (isAnalyzingRef.current) return;

      // Only analyze if transcript grew (unless forced by manual button or demo end)
      if (!force && cleaned.length <= lastAnalyzedLengthRef.current) {
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        isAnalyzingRef.current = true;
        if (isMountedRef.current) {
          setIsAnalyzing(true);
        }

        const slicedTranscript = cleaned.slice(-4000);
        const res = await api.calls.analyze({
          transcript: slicedTranscript,
          language,
          signal: controller.signal
        });

        if (!isMountedRef.current || controller.signal.aborted) return;

        lastAnalyzedLengthRef.current = cleaned.length;
        setLastCheckTime(new Date());
        setAnalysisNotice(null);

        if (res?.analysis) {
          setAnalysis({
            ...res.analysis,
            source: res.analysis.source || res.source
          });

          if (res.analysis.risk_level === 'scam') {
            setScamAlertActive(true);

            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate([400, 200, 400, 200, 800]);
              } catch (_) {}
            }

            if (onScamTrigger) {
              onScamTrigger(res.analysis);
            }
          }
        }
      } catch (err) {
        if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
          if (isMountedRef.current && err?.response?.status === 503) {
            setAnalysisNotice(
              'AI analysis service is temporarily busy (503) — keeping Live Call Guard active and retrying automatically.'
            );
          }
          console.warn('Live call analysis failed:', err);
        }
      } finally {
        isAnalyzingRef.current = false;
        if (isMountedRef.current) {
          setIsAnalyzing(false);
        }
      }
    },
    [language, onScamTrigger]
  );

  // First call to /api/calls/analyze after 10s of transcript, then every 15s, only if transcript grew
  useEffect(() => {
    if (!enabled || !hasWords) return;

    let recurringInterval = null;

    const firstTimeout = setTimeout(() => {
      const current = transcriptRef.current;
      if (current && current.trim().length > 0) {
        performAnalysis(current);
      }

      recurringInterval = setInterval(() => {
        const nextText = transcriptRef.current;
        if (nextText && nextText.trim().length > 0) {
          performAnalysis(nextText);
        }
      }, 15000);
    }, 10000);

    return () => {
      clearTimeout(firstTimeout);
      if (recurringInterval) {
        clearInterval(recurringInterval);
      }
    };
  }, [enabled, hasWords, performAnalysis]);

  const dismissAlert = useCallback(() => {
    if (isMountedRef.current) {
      setScamAlertActive(false);
    }
  }, []);

  const updateAnalysisState = useCallback((partial) => {
    if (!isMountedRef.current) return;
    setAnalysis((prev) => {
      const next = { ...prev, ...partial };
      if (next.risk_level === 'scam') {
        setScamAlertActive(true);
      }
      return next;
    });
  }, []);

  const resetAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (_) {}
    }
    isAnalyzingRef.current = false;
    lastAnalyzedLengthRef.current = 0;
    if (isMountedRef.current) {
      setIsAnalyzing(false);
      setScamAlertActive(false);
      setAnalysis({
        risk_level: 'safe',
        risk_score: 0,
        scam_type: 'none',
        triggers: [],
        advice: 'Put the call on speaker. Analysis will activate as words are spoken.',
        say_this: ''
      });
    }
  }, []);

  return {
    analysis,
    isAnalyzing,
    scamAlertActive,
    lastCheckTime,
    analysisNotice,
    performAnalysis,
    updateAnalysisState,
    dismissAlert,
    resetAnalysis
  };
}
