import React from 'react';

export function ShieldLogo({ className = "w-8 h-8", color = "#0F1E36" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer Protective Shield */}
      <path
        d="M16 1.5L3 6.8V17.5C3 25.8 8.6 33.3 16 35.5C23.4 33.3 29 25.8 29 17.5V6.8L16 1.5Z"
        fill={color}
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      {/* Inner Guard Emblem */}
      <path
        d="M16 4.5L5.5 8.8V17.2C5.5 24 9.9 30.1 16 32.2C22.1 30.1 26.5 24 26.5 17.2V8.8L16 4.5Z"
        fill="#1E293B"
        opacity="0.2"
      />
      {/* Indian Tricolor Subtle Security Accent Accent Bars */}
      <path d="M12 11H20" stroke="#FF9933" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 15H21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 19H19" stroke="#138808" strokeWidth="2" strokeLinecap="round" />
      {/* Center Checkmark / Lock icon */}
      <circle cx="16" cy="24" r="2.5" fill="#22C55E" />
    </svg>
  );
}
