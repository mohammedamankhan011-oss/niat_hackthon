import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX, Mic, Activity, AlertCircle } from 'lucide-react';

export function AudioWaveform({
  audioLevel = 0,
  frequencyData = null,
  isListening = false,
  state = 'active',
  statusMessage = '',
  onSwitchToSecondDevice
}) {
  const canvasRef = useRef(null);

  // Render frequency bars on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!isListening) {
      // Draw flat standby line
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }

    const bars = 24;
    const barWidth = (width - (bars - 1) * 3) / bars;

    for (let i = 0; i < bars; i++) {
      let val = 0;
      if (frequencyData && frequencyData.length > 0) {
        // Sample frequency data proportionally
        const idx = Math.floor((i / bars) * Math.min(frequencyData.length, 64));
        val = frequencyData[idx] / 255;
      } else {
        // Fallback to scaled audioLevel
        val = (audioLevel / 100) * (0.4 + 0.6 * Math.sin((i / bars) * Math.PI));
      }

      const barHeight = Math.max(4, val * (height - 8));
      const x = i * (barWidth + 3);
      const y = (height - barHeight) / 2;

      // Color gradient based on volume
      if (audioLevel > 50) {
        ctx.fillStyle = '#DC2626'; // red loud
      } else if (audioLevel > 15) {
        ctx.fillStyle = '#0284C7'; // cyan/blue speech
      } else if (audioLevel > 2) {
        ctx.fillStyle = '#10B981'; // green audio
      } else {
        ctx.fillStyle = '#94A3B8'; // gray silent
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }
  }, [audioLevel, frequencyData, isListening]);

  // Determine volume color
  let volumeColor = 'text-slate-400 bg-slate-100';
  let barColor = 'bg-slate-300';
  if (audioLevel >= 50) {
    volumeColor = 'text-red-700 bg-red-100 border-red-300';
    barColor = 'bg-red-500';
  } else if (audioLevel >= 15) {
    volumeColor = 'text-sky-700 bg-sky-100 border-sky-300';
    barColor = 'bg-sky-500';
  } else if (audioLevel >= 2) {
    volumeColor = 'text-emerald-700 bg-emerald-100 border-emerald-300';
    barColor = 'bg-emerald-500';
  }

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-inner border border-slate-800 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {audioLevel > 2 ? (
            <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
          ) : (
            <VolumeX className="w-5 h-5 text-slate-400 shrink-0" />
          )}
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            Live Microphone Input
          </span>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full border ${volumeColor}`}
          >
            Level: {audioLevel}%
          </span>
        </div>

        {/* State Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300 truncate max-w-[220px]">
            {statusMessage || (isListening ? 'Listening...' : 'Standby')}
          </span>
        </div>
      </div>

      {/* Real Canvas Equalizer Waveform */}
      <div className="bg-slate-950/70 rounded-xl p-2 border border-slate-800 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={360}
          height={48}
          className="w-full h-12"
          aria-label={`Live audio waveform visualizer showing ${audioLevel}% volume`}
        />
      </div>

      {/* Audio Level Progress Bar */}
      <div className="space-y-1">
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ease-out ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(2, audioLevel))}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
          <span>0% (Silence)</span>
          <span>15% (Voice)</span>
          <span>50% (Speaker)</span>
          <span>100%</span>
        </div>
      </div>

      {/* Honest Warning when No Audio Detected during active listening */}
      {isListening && state === 'no_audio' && (
        <div className="bg-amber-950/80 border border-amber-600/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              No audio detected on microphone for 4+ seconds.
            </p>
            <p className="text-amber-300/90 font-medium">
              If a phone call is active on this device, the phone OS mutes the browser microphone. Enable speakerphone and ensure audio is audible, or use <strong>Second-Device Monitoring</strong>.
            </p>
            {onSwitchToSecondDevice && (
              <button
                type="button"
                onClick={onSwitchToSecondDevice}
                className="mt-1 text-xs font-bold underline text-amber-300 hover:text-white"
              >
                Switch to Second-Device Mode →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
