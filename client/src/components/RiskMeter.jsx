import React, { useState, useEffect } from 'react';
import { useCountUp } from '../hooks/useCountUp';

export function RiskMeter({ score = 0, riskLevel = 'safe', size = 220 }) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const animatedNumber = useCountUp(normalizedScore, 900, true);
  const [animatedArcScore, setAnimatedArcScore] = useState(0);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setAnimatedArcScore(normalizedScore);
      return;
    }
    const raf = requestAnimationFrame(() => {
      setAnimatedArcScore(normalizedScore);
    });
    return () => cancelAnimationFrame(raf);
  }, [normalizedScore]);

  let strokeColor = '#16A34A'; // green safe
  let bgColor = '#F0FDF4';
  let statusText = 'LOOKS SAFE';
  let statusTextColor = 'text-emerald-700';

  if (riskLevel === 'scam' || normalizedScore >= 80) {
    strokeColor = '#DC2626'; // red scam
    bgColor = '#FEF2F2';
    statusText = 'SCAM';
    statusTextColor = 'text-red-700';
  } else if (riskLevel === 'suspicious' || normalizedScore >= 50) {
    strokeColor = '#D97706'; // amber suspicious
    bgColor = '#FFFBEB';
    statusText = 'SUSPICIOUS';
    statusTextColor = 'text-amber-700';
  }

  // SVG parameters
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedArcScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4">
      <div
        className="relative flex items-center justify-center rounded-full p-2 transition-colors duration-500 shadow-inner"
        style={{ width: size, height: size, backgroundColor: bgColor }}
        role="progressbar"
        aria-valuenow={normalizedScore}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`Risk meter: ${normalizedScore} out of 100, status ${statusText}`}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Active Meter Stroke (900ms smooth ease-out) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            style={{
              transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1), stroke 400ms ease-out'
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500 mb-0.5">
            Risk Score
          </span>
          <span className="text-5xl font-black text-navy-900 tracking-tight leading-none tabular-nums">
            {animatedNumber}
            <span className="text-2xl text-slate-400 font-bold">/100</span>
          </span>
          <span
            className={`mt-2 text-sm sm:text-base font-black px-3 py-1 rounded-full uppercase tracking-wider ${statusTextColor} bg-white shadow-sm border border-slate-200 verdict-pop`}
          >
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}
