import React from 'react';

export function RiskMeter({ score = 0, riskLevel = 'safe', size = 220 }) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

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
  // Semi-circle or full circular gauge:
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className="relative flex items-center justify-center rounded-full p-2 transition-all shadow-inner"
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
          {/* Active Meter Stroke */}
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
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500 mb-0.5">
            Risk Score
          </span>
          <span className="text-5xl font-black text-navy-900 tracking-tight leading-none">
            {normalizedScore}
            <span className="text-2xl text-slate-400 font-bold">/100</span>
          </span>
          <span
            className={`mt-2 text-base font-black px-3 py-1 rounded-full uppercase tracking-wider ${statusTextColor} bg-white shadow-sm border border-slate-200`}
          >
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}
