import React, { useState } from 'react';
import { getScamTypeLabel, getScamTypeBadgeClass } from '../utils/scamTypeLabels';
import {
  COMPLAINT_UI_TEXT,
  formatScanDateTime,
  buildWhatHappenedLines,
  buildPaymentStatusLine,
  buildCybercrimeComplaint,
  buildFamilyWhatsAppWarning
} from '../utils/complaintBuilder';
import {
  FileText,
  Copy,
  Check,
  ExternalLink,
  PhoneCall,
  MessageCircle,
  AlertOctagon,
  ChevronUp
} from 'lucide-react';

export function ReportItForMePanel({ scan, language = 'en', onClose }) {
  const [lostMoney, setLostMoney] = useState(false);
  const [lostAmount, setLostAmount] = useState('');
  const [copied, setCopied] = useState(false);

  if (!scan) return null;

  const lang = COMPLAINT_UI_TEXT[language] ? language : 'en';
  const t = COMPLAINT_UI_TEXT[lang];
  const dateTimeStr = formatScanDateTime(scan.created_at, lang);
  const scamTypeLabel = getScamTypeLabel(scan.scam_type, lang);
  const whatHappenedLines = buildWhatHappenedLines(scan, lang);
  const paymentStatusLine = buildPaymentStatusLine({ lostMoney, lostAmount, lang });
  const complaintText = buildCybercrimeComplaint({
    scan,
    language: lang,
    lostMoney,
    lostAmount
  });
  const familyWhatsappUrl = buildFamilyWhatsAppWarning({ scan, language: lang });

  const phones = scan.identifiers?.phones || [];
  const upiIds = scan.identifiers?.upi_ids || [];
  const urls = scan.identifiers?.urls || [];
  const redFlags = scan.red_flags || [];

  const handleCopyComplaint = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(complaintText);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = complaintText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div
      id="report-it-for-me-panel"
      className="bg-amber-50/70 border-3 border-red-600 rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg animate-in fade-in duration-200"
    >
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-red-200 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>📝 Report It For Me</span>
          </div>
          <h3 className="text-2xl font-black text-navy-950">
            {t.panelTitle}
          </h3>
          <p className="text-base font-medium text-slate-700">
            {t.panelSubtitle}
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-sm flex items-center gap-1.5 self-start sm:self-center shrink-0"
          >
            <ChevronUp className="w-4 h-4" />
            <span>Hide Panel</span>
          </button>
        )}
      </div>

      {/* Structured Complaint Summary Details */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-5 sm:p-6 space-y-5">
        {/* Date/Time & Scam Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">
              {t.dateLabel}
            </div>
            <div className="text-lg font-bold text-navy-950 mt-1">
              {dateTimeStr}
            </div>
          </div>

          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">
              {t.scamTypeLabel}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-black border ${getScamTypeBadgeClass(scan.scam_type)}`}>
                {scamTypeLabel}
              </span>
              <span className="text-sm font-bold text-red-700">
                ({scan.risk_score}/100)
              </span>
            </div>
          </div>
        </div>

        {/* 2-3 Line Summary of What Happened */}
        <div className="space-y-2 pb-4 border-b border-slate-200">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500">
            {t.whatHappenedLabel}
          </div>
          <div className="space-y-1.5 text-base font-semibold text-slate-900 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
            {whatHappenedLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        {/* Scammer's Phone Numbers / UPI IDs / Links */}
        <div className="space-y-3 pb-4 border-b border-slate-200">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500">
            {t.identifiersLabel}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-500">{t.phonesLabel}</div>
              <div className="font-mono text-sm font-black text-navy-950 mt-1 break-all">
                {phones.length > 0 ? phones.join(', ') : t.noneFound}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-500">{t.upiLabel}</div>
              <div className="font-mono text-sm font-black text-navy-950 mt-1 break-all">
                {upiIds.length > 0 ? upiIds.join(', ') : t.noneFound}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-500">{t.urlsLabel}</div>
              <div className="font-mono text-sm font-black text-navy-950 mt-1 break-all">
                {urls.length > 0 ? urls.join(', ') : t.noneFound}
              </div>
            </div>
          </div>
        </div>

        {/* Red Flags */}
        {redFlags.length > 0 && (
          <div className="space-y-2 pb-4 border-b border-slate-200">
            <div className="text-xs font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4" />
              <span>{t.redFlagsLabel} ({redFlags.length})</span>
            </div>
            <ul className="space-y-2">
              {redFlags.map((rf, idx) => (
                <li
                  key={idx}
                  className="text-sm font-semibold text-slate-800 bg-red-50/70 border border-red-200 rounded-xl p-3"
                >
                  <span className="font-black text-red-900">{rf.flag}:</span>{' '}
                  {rf.evidence && (
                    <span className="font-mono bg-red-100 text-red-950 px-1.5 py-0.5 rounded">
                      "{rf.evidence}"
                    </span>
                  )}{' '}
                  {rf.explanation && <span>— {rf.explanation}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Financial / OTP Status & Checkbox */}
        <div className="space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-500">
            {t.paymentStatusLabel}
          </div>

          <div
            className={`p-4 rounded-xl border-2 font-black text-base ${
              lostMoney
                ? 'bg-red-50 border-red-400 text-red-950'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}
          >
            {paymentStatusLine}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <label className="inline-flex items-center gap-3 cursor-pointer select-none min-h-[48px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 font-bold text-slate-900">
              <input
                type="checkbox"
                checked={lostMoney}
                onChange={(e) => setLostMoney(e.target.checked)}
                className="w-5 h-5 accent-red-600 rounded cursor-pointer"
              />
              <span>{t.checkboxLabel}</span>
            </label>

            {lostMoney && (
              <div className="flex items-center gap-2 flex-1">
                <span className="font-black text-base text-red-800">Rs</span>
                <input
                  type="text"
                  value={lostAmount}
                  onChange={(e) => setLostAmount(e.target.value)}
                  placeholder={t.amountPlaceholder}
                  aria-label="Amount lost in Rupees"
                  className="min-h-[48px] px-4 py-2 rounded-xl border-2 border-red-400 font-mono text-base font-bold text-slate-900 focus:border-navy-900 focus:outline-none w-full sm:w-56"
                />
              </div>
            )}
          </div>
        </div>

        {/* Ready-to-copy Complaint Text Box */}
        <div className="space-y-2 pt-2">
          <label
            htmlFor="cybercrime-complaint-textarea"
            className="block text-xs font-black uppercase tracking-wider text-slate-500"
          >
            {t.complaintPreviewLabel}
          </label>
          <textarea
            id="cybercrime-complaint-textarea"
            readOnly
            rows={10}
            value={complaintText}
            className="w-full p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-sm leading-relaxed border-2 border-slate-700 focus:outline-none"
          />
        </div>
      </div>

      {/* 4 Action Buttons inside the Report It For Me Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Copy complaint */}
        <button
          type="button"
          onClick={handleCopyComplaint}
          className={`min-h-[54px] px-5 py-3 rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-md transition-all ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-navy-900 hover:bg-navy-800 text-white'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-5 h-5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              <span>📋 Copy complaint</span>
            </>
          )}
        </button>

        {/* 2. Open cybercrime.gov.in */}
        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[54px] px-5 py-3 bg-white hover:bg-slate-100 text-navy-950 border-2 border-navy-900 rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <ExternalLink className="w-5 h-5" />
          <span>Open cybercrime.gov.in</span>
        </a>

        {/* 3. Call 1930 */}
        <a
          href="tel:1930"
          className="min-h-[54px] px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <PhoneCall className="w-5 h-5" />
          <span>📞 Call 1930</span>
        </a>

        {/* 4. Send to family on WhatsApp */}
        <a
          href={familyWhatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[54px] px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          <span>💬 Send to family on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
