import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/compressImage';
import { LanguagePicker } from '../components/LanguagePicker';
import { ErrorBox } from '../components/ErrorBox';
import { t } from '../utils/translations';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

const SAMPLE_MESSAGES = {
  sbi_kyc: {
    id: 'sbi_kyc',
    title: 'Fake SBI KYC',
    tag: 'Banking Scam',
    text: 'Dear SBI User, your YONO account has been BLOCKED due to pending PAN card update. Please click here immediately to unblock your net banking: https://sbi-kyc-update.example/login. Failure will lead to permanent suspension.'
  },
  part_time_job: {
    id: 'part_time_job',
    title: 'Part-time Job Scam',
    tag: 'Telegram Task',
    text: 'Earn ₹3000 to ₹8000 daily by simply liking YouTube videos and rating Google Maps hotels. Work from home 30 minutes daily. Contact HR Priya on Telegram: @GlobalTaskHR77 for instant ₹500 joining bonus.'
  },
  safe_message: {
    id: 'safe_message',
    title: 'Normal Safe Message',
    tag: 'Legitimate Delivery',
    text: 'Your Swiggy order #9823101 has been picked up by delivery partner Ramesh. Track live delivery on your Swiggy app. OTP for delivery is 4821.'
  }
};

const SCAN_STEPS = [
  'Reading message…',
  'Checking patterns…',
  'Preparing result…'
];

export function ScanPage() {
  const { language } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'image'
  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [compressionInfo, setCompressionInfo] = useState('');
  const [selectedLang, setSelectedLang] = useState(language || 'en');
  const [loading, setLoading] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    setSelectedLang(language || 'en');
  }, [language]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Step progress indicator while scanning
  useEffect(() => {
    if (!loading) {
      setScanStepIndex(0);
      return;
    }
    const t1 = setTimeout(() => {
      if (isMountedRef.current) setScanStepIndex(1);
    }, 350);
    const t2 = setTimeout(() => {
      if (isMountedRef.current) setScanStepIndex(2);
    }, 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [loading]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, or WEBP).');
      return;
    }

    try {
      setError(null);
      const originalSize = (file.size / 1024).toFixed(0);

      // Compress to max 1600px JPEG 0.8
      const compressed = await compressImage(file, 1600, 1600, 0.8);
      const compressedSize = (compressed.size / 1024).toFixed(0);

      if (!isMountedRef.current) return;
      setSelectedFile(compressed);
      setCompressionInfo(`Compressed from ${originalSize} KB to ${compressedSize} KB (max 1600px JPEG)`);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (isMountedRef.current) {
          setImagePreview(event.target.result);
        }
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
      if (isMountedRef.current) {
        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setCompressionInfo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLoadSample = (sampleKey) => {
    const sample = SAMPLE_MESSAGES[sampleKey];
    if (sample) {
      setActiveTab('text');
      setMessageText(sample.text);
      setError(null);
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (activeTab === 'text' && !messageText.trim()) {
      setError('Please paste the suspicious message or pick a sample.');
      return;
    }
    if (activeTab === 'image' && !selectedFile) {
      setError('Please upload a screenshot or select a file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.scans.create({
        imageFile: activeTab === 'image' ? selectedFile : null,
        text: activeTab === 'text' ? messageText : '',
        language: selectedLang
      });

      if (!isMountedRef.current) return;

      if (res?.scan?.id) {
        // Navigate to /scans/:id passing the full result in router state for instant render
        navigate(`/scans/${res.scan.id}`, { state: { scan: res.scan } });
      } else {
        throw new Error('Could not process the scan. Please try again.');
      }
    } catch (err) {
      console.error('Scan failed:', err);
      if (isMountedRef.current) {
        setError(err);
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Title */}
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950">
          {t('checkMessage', language)}
        </h1>
        <p className="text-lg text-slate-700 font-medium">
          {t('checkMessageDesc', language)}
        </p>
      </div>

      <ErrorBox error={error} />

      {/* Language Picker */}
      <div className="bg-white/95 p-5 rounded-2xl border border-slate-200 shadow-sm">
        <LanguagePicker onChange={(l) => setSelectedLang(l)} />
      </div>

      {/* Try a Sample Buttons */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{t('trySample', language)}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleLoadSample('sbi_kyc')}
            className="min-h-[48px] p-3 text-left rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors focus:ring-2 focus:ring-red-500"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-red-700">
              {SAMPLE_MESSAGES.sbi_kyc.tag}
            </div>
            <div className="text-sm font-black text-red-950">
              {t('sampleSbi', language)}
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleLoadSample('part_time_job')}
            className="min-h-[48px] p-3 text-left rounded-xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors focus:ring-2 focus:ring-purple-500"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-purple-700">
              {SAMPLE_MESSAGES.part_time_job.tag}
            </div>
            <div className="text-sm font-black text-purple-950">
              {t('sampleJob', language)}
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleLoadSample('safe_message')}
            className="min-h-[48px] p-3 text-left rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors focus:ring-2 focus:ring-emerald-500"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              {SAMPLE_MESSAGES.safe_message.tag}
            </div>
            <div className="text-sm font-black text-emerald-950">
              {t('sampleSafe', language)}
            </div>
          </button>
        </div>
      </div>

      {/* Input Tabs: Paste Text / Upload Screenshot */}
      <div className="bg-white/95 rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 border-b border-slate-200">
          <button
            type="button"
            disabled={loading}
            onClick={() => setActiveTab('text')}
            className={`min-h-[56px] py-3.5 px-4 font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'text'
                ? 'bg-navy-900 text-white'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Paste Message</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => setActiveTab('image')}
            className={`min-h-[56px] py-3.5 px-4 font-black text-base sm:text-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'image'
                ? 'bg-navy-900 text-white'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            <span>Upload Screenshot</span>
          </button>
        </div>

        <form onSubmit={handleScanSubmit} className="p-6 sm:p-8 space-y-6">
          {activeTab === 'text' ? (
            <div className="space-y-3">
              <label
                htmlFor="message-text-input"
                className="block text-base font-bold text-slate-900"
              >
                Message Text or Links
              </label>
              <textarea
                id="message-text-input"
                rows={6}
                disabled={loading}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Paste the suspicious SMS, WhatsApp message, or email here..."
                className="w-full p-4 rounded-2xl border-2 border-slate-300 text-base sm:text-lg font-medium leading-relaxed focus:border-navy-900 focus:outline-none disabled:bg-slate-100"
              />
              <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                <span>Supports English, Hindi, Hinglish, Kannada & all Indian languages</span>
                {messageText && !loading && (
                  <button
                    type="button"
                    onClick={() => setMessageText('')}
                    className="min-h-[48px] px-2 text-red-600 hover:underline"
                  >
                    Clear text
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="screenshot-file-upload"
              />

              {!imagePreview ? (
                <label
                  htmlFor="screenshot-file-upload"
                  className="min-h-[220px] border-3 border-dashed border-slate-300 hover:border-navy-900 bg-slate-50 hover:bg-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-3"
                >
                  <div className="w-16 h-16 rounded-2xl bg-navy-100 text-navy-900 flex items-center justify-center">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-lg font-black text-navy-950 block">
                      Tap to upload screenshot
                    </span>
                    <span className="text-sm text-slate-700 font-medium">
                      PNG, JPG, or WEBP (auto-compressed to max 1600px)
                    </span>
                  </div>
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 max-h-96 flex items-center justify-center bg-slate-900">
                    <img
                      src={imagePreview}
                      alt="Uploaded screenshot preview"
                      className="max-h-96 w-auto object-contain"
                    />
                    {!loading && (
                      <button
                        type="button"
                        onClick={handleClearImage}
                        aria-label="Remove image"
                        className="absolute top-3 right-3 min-w-[48px] min-h-[48px] bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                  {compressionInfo && (
                    <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{compressionInfo}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step Progress Indicator While Scanning */}
          {loading && (
            <div
              role="status"
              aria-live="polite"
              className="bg-slate-50 border-2 border-navy-200 rounded-2xl p-5 space-y-3 fade-up"
            >
              <div className="flex items-center justify-between text-sm font-black text-navy-950">
                <span>{SCAN_STEPS[scanStepIndex]}</span>
                <span className="text-xs font-bold text-slate-500">
                  Step {scanStepIndex + 1} of {SCAN_STEPS.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SCAN_STEPS.map((label, idx) => (
                  <div key={label} className="space-y-1">
                    <div
                      className={`h-2 rounded-full transition-colors duration-300 ${
                        idx <= scanStepIndex ? 'bg-navy-900' : 'bg-slate-200'
                      }`}
                    />
                    <div
                      className={`text-xs font-bold ${
                        idx <= scanStepIndex ? 'text-navy-900' : 'text-slate-400'
                      }`}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action (disabled while loading to prevent double submit) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[56px] py-4 px-8 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-400 text-white rounded-2xl text-xl font-black shadow-lg transition-all flex items-center justify-center gap-3 focus:ring-4 focus:ring-navy-300"
          >
            <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
            <span>{loading ? SCAN_STEPS[scanStepIndex] : 'Check Now'}</span>
            {!loading && <ArrowRight className="w-6 h-6 shrink-0" />}
          </button>
        </form>
      </div>
    </div>
  );
}
