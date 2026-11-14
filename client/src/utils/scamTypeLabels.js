export const SCAM_TYPES = {
  digital_arrest: {
    id: 'digital_arrest',
    name: 'Digital Arrest / Fake Police',
    name_hi: 'डिजिटल अरेस्ट / फर्जी पुलिस',
    name_kn: 'ಡಿಜಿಟಲ್ ಅರೆಸ್ಟ್ / ನಕಲಿ ಪೊಲೀಸ್',
    severity: 'critical',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  electricity_bill: {
    id: 'electricity_bill',
    name: 'Electricity Bill KYC Scam',
    name_hi: 'बिजली बिल केवाईसी धोखा',
    name_kn: 'ವಿದ್ಯುತ್ ಬಿಲ್ ಕೆವೈಸಿ ವಂಚನೆ',
    severity: 'high',
    color: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  part_time_job: {
    id: 'part_time_job',
    name: 'Part-Time Job / Telegram Scam',
    name_hi: 'पार्ट-टाइम जॉब / टेलीग्राम धोखा',
    name_kn: 'ಪಾರ್ಟ್-ಟೈಮ್ ಉದ್ಯೋಗ ವಂಚನೆ',
    severity: 'high',
    color: 'bg-purple-100 text-purple-900 border-purple-300'
  },
  customs_courier: {
    id: 'customs_courier',
    name: 'FedEx / Customs Narcotics Parcel',
    name_hi: 'कस्टम्स / कूरियर नशीली दवा पार्सल',
    name_kn: 'ಕಸ್ಟಮ್ಸ್ / ಕೊರಿಯರ್ ಡ್ರಗ್ಸ್ ಪಾರ್ಸೆಲ್',
    severity: 'critical',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  bank_kyc: {
    id: 'bank_kyc',
    name: 'SBI / Bank KYC Pan Card Block',
    name_hi: 'एसबीआई / बैंक खाता ब्लॉक लिंक',
    name_kn: 'ಎಸ್‍ಬಿಐ / ಬ್ಯಾಂಕ್ ಖಾತೆ ಬ್ಲಾಕ್ ಲಿಂಕ್',
    severity: 'critical',
    color: 'bg-red-100 text-red-800 border-red-300'
  },
  sextortion: {
    id: 'sextortion',
    name: 'Video Call Blackmail / Sextortion',
    name_hi: 'वीडियो कॉल ब्लैकमेल',
    name_kn: 'ವಿಡಿಯೋ ಕಾಲ್ ಬ್ಲ್ಯಾಕ್‌ಮೇಲ್',
    severity: 'critical',
    color: 'bg-rose-100 text-rose-900 border-rose-300'
  },
  lottery_kbc: {
    id: 'lottery_kbc',
    name: 'Fake KBC Lottery / Prize',
    name_hi: 'केबीसी लॉटरी / फर्जी इनाम',
    name_kn: 'ಕೆಬಿಸಿ ಲಾಟರಿ / ನಕಲಿ ಬಹುಮಾನ',
    severity: 'high',
    color: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  loan_app: {
    id: 'loan_app',
    name: 'Predatory Instant Loan App',
    name_hi: 'फर्जी लोन ऐप उत्पीड़न',
    name_kn: 'ನಕಲಿ ಸಾಲದ ಆ್ಯಪ್',
    severity: 'high',
    color: 'bg-orange-100 text-orange-900 border-orange-300'
  },
  safe_message: {
    id: 'safe_message',
    name: 'Legitimate / Looks Safe',
    name_hi: 'सुरक्षित संदेश / सामान्य',
    name_kn: 'ಸುರಕ್ಷಿತ ಸಂದೇಶ / ಸಾಮಾನ್ಯ',
    severity: 'safe',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  }
};

export function getScamTypeLabel(scamType, lang = 'en') {
  if (!scamType) return 'Unclassified';
  const match = SCAM_TYPES[scamType] || Object.values(SCAM_TYPES).find(t => t.name.toLowerCase() === String(scamType).toLowerCase());
  if (!match) {
    // Format camelCase or snake_case nicely
    return String(scamType).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  if (lang === 'hi' && match.name_hi) return match.name_hi;
  if (lang === 'kn' && match.name_kn) return match.name_kn;
  return match.name;
}

export function getScamTypeBadgeClass(scamType) {
  const match = SCAM_TYPES[scamType];
  return match?.color || 'bg-slate-100 text-slate-800 border-slate-300';
}
